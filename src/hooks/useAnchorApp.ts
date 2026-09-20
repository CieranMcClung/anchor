import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_DOSE,
  GRACE_MINUTES,
  LOAD_CAPS,
  type Anchor,
  type AppState,
  type CarryCandidate,
  type FocusSession,
  type Load,
  type ParkItem,
  type Route,
  type Settings,
  type UnstickDepth,
} from '../types';
import { completeAck, t } from '../copy/t';
import { useClock } from './useClock';
import { usePersistedState } from './usePersistedState';
import { seedAnchors } from '../utils/defaults';
import { bufferedMinutes } from '../utils/duration';
import { getPkSnapshot, windowsFromSettings } from '../utils/pk';
import { normalizeSettings, rollover } from '../utils/storage';
import { formatWallClock, newId, todayKey } from '../utils/time';

export interface ToastState {
  title: string;
  body?: string;
  undoLabel?: string;
  onUndo?: () => void;
}

function pauseFocus(focus: FocusSession, at: number): FocusSession {
  if (focus.runState !== 'running' || focus.runningSince === null) {
    return { ...focus, runState: 'paused', runningSince: null };
  }
  return {
    ...focus,
    runState: 'paused',
    accumulatedMs: focus.accumulatedMs + (at - focus.runningSince),
    runningSince: null,
  };
}

function applyBuffer(state: AppState, percent: number): AppState {
  return {
    ...state,
    anchors: state.anchors.map((a) => ({
      ...a,
      bufferedMinutes: bufferedMinutes(a.rawMinutes, percent),
    })),
    focus: state.focus
      ? {
          ...state.focus,
          bufferedMinutes: bufferedMinutes(state.focus.rawMinutes, percent),
        }
      : null,
  };
}

function sessionFromAnchor(anchor: Anchor, bufferPercent: number): FocusSession {
  return {
    title: anchor.title,
    dod: anchor.dod,
    load: anchor.load,
    rawMinutes: anchor.rawMinutes,
    bufferedMinutes: bufferedMinutes(anchor.rawMinutes, bufferPercent),
    anchorId: anchor.id,
    parkId: null,
    runState: 'ready',
    accumulatedMs: 0,
    runningSince: null,
    hyperfocusDismissed: false,
  };
}

function nextSwapTarget(state: AppState, current: FocusSession): Anchor | null {
  const open = state.anchors.filter(
    (a) => a.status === 'open' && a.id !== current.anchorId
  );
  const same = open.find((a) => a.load === current.load);
  return same ?? open[0] ?? null;
}

function nextLighterTarget(
  state: AppState,
  fromLoad: Load,
  excludeId: string | null
): Anchor | null {
  const open = state.anchors.filter(
    (a) => a.status === 'open' && a.id !== excludeId
  );
  const order: Load[] =
    fromLoad === 'high'
      ? ['low', 'medium', 'high']
      : fromLoad === 'medium'
        ? ['low', 'medium', 'high']
        : ['low', 'medium', 'high'];
  for (const load of order) {
    const hit = open.find((a) => a.load === load);
    if (hit) return hit;
  }
  return open[0] ?? null;
}

function openCount(anchors: Anchor[]): number {
  return anchors.filter((a) => a.status === 'open').length;
}

export function useAnchorApp() {
  const { state, update } = usePersistedState();
  const now = useClock(1000);
  const [route, setRoute] = useState<Route>('today');
  const [toast, setToast] = useState<ToastState | null>(null);
  const [captureOpen, setCaptureOpen] = useState(false);
  const [unstickOpen, setUnstickOpen] = useState(false);
  const [unstickDepth, setUnstickDepth] = useState<UnstickDepth>('standard');
  const [overwhelmOpen, setOverwhelmOpen] = useState(false);
  const [overwhelmLoad, setOverwhelmLoad] = useState<Load>('medium');
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    const today = todayKey(now);
    if (state.date !== today || state.dose.date !== today) {
      update((prev) => rollover(prev, now));
      setRoute('today');
      setUnstickOpen(false);
      setOverwhelmOpen(false);
    }
  }, [now, state.date, state.dose.date, update]);

  const pk = useMemo(
    () => getPkSnapshot(state.dose, windowsFromSettings(state.settings), now),
    [state.dose, state.settings, now]
  );

  const showToast = useCallback((next: ToastState, ms = 6000) => {
    setToast(next);
    window.setTimeout(() => {
      setToast((cur) => (cur === next ? null : cur));
    }, ms);
  }, []);

  const chooseLoad = useCallback(
    (load: Load, seed: boolean) => {
      update((prev) => ({
        ...prev,
        load,
        anchors:
          seed && prev.anchors.length === 0
            ? seedAnchors(load, prev.settings.bufferPercent)
            : prev.anchors,
      }));
    },
    [update]
  );

  const skipLoad = useCallback(() => {
    chooseLoad('low', true);
  }, [chooseLoad]);

  const logDose = useCallback(() => {
    const previous = state.dose;
    const today = todayKey();
    const next = {
      date: today,
      timeHHMM: formatWallClock(new Date()),
      loggedAt: Date.now(),
      skipped: false,
    };
    update((prev) => ({
      ...prev,
      dose: next,
      undo: {
        kind: 'dose',
        focus: prev.focus,
        dose: previous,
        expiresAt: Date.now() + 8000,
      },
      comedownNudgeDismissedKey: null,
    }));
    showToast({
      title: t('med.logged.title'),
      body: t('med.logged.body'),
      undoLabel: 'Undo',
      onUndo: () => {
        update((prev) => ({ ...prev, dose: previous, undo: null }));
        setToast(null);
      },
    });
  }, [showToast, state.dose, update]);

  const skipDose = useCallback(() => {
    const today = todayKey();
    update((prev) => ({
      ...prev,
      dose: { date: today, timeHHMM: null, loggedAt: Date.now(), skipped: true },
    }));
  }, [update]);

  const startAnchor = useCallback(
    (anchor: Anchor) => {
      if (state.restMode) return;
      update((prev) => ({
        ...prev,
        focus: sessionFromAnchor(anchor, prev.settings.bufferPercent),
      }));
      setRoute('today');
    },
    [state.restMode, update]
  );

  const beginFocus = useCallback(() => {
    const at = Date.now();
    update((prev) => {
      if (!prev.focus) return prev;
      if (prev.focus.runState === 'running') return prev;
      return {
        ...prev,
        focus: {
          ...prev.focus,
          runState: 'running',
          runningSince: at,
        },
      };
    });
  }, [update]);

  const pauseFocusAction = useCallback(() => {
    const at = Date.now();
    update((prev) =>
      prev.focus ? { ...prev, focus: pauseFocus(prev.focus, at) } : prev
    );
  }, [update]);

  const toggleStartPause = useCallback(() => {
    if (!state.focus) return;
    if (state.focus.runState === 'running') pauseFocusAction();
    else beginFocus();
  }, [beginFocus, pauseFocusAction, state.focus]);

  const notThis = useCallback(() => {
    update((prev) => ({ ...prev, focus: null }));
    setUnstickOpen(false);
    setOverwhelmOpen(false);
  }, [update]);

  const swapFocus = useCallback(() => {
    update((prev) => {
      if (!prev.focus) return prev;
      const next = nextSwapTarget(prev, prev.focus);
      if (!next) return prev;
      const snapshot = prev.focus;
      return {
        ...prev,
        focus: sessionFromAnchor(next, prev.settings.bufferPercent),
        undo: {
          kind: 'swap',
          focus: snapshot,
          dose: prev.dose,
          expiresAt: Date.now() + 8000,
        },
      };
    });
    setUnstickOpen(false);
    showToast({
      title: t('swap.done'),
      undoLabel: 'Undo',
      onUndo: () => {
        update((prev) => {
          if (prev.undo?.kind === 'swap' && prev.undo.focus) {
            return { ...prev, focus: prev.undo.focus, undo: null };
          }
          return prev;
        });
        setToast(null);
      },
    });
  }, [showToast, update]);

  const completeFocus = useCallback(() => {
    const ack = completeAck();
    let completedHigh = false;
    update((prev) => {
      if (!prev.focus) return prev;
      completedHigh = prev.focus.load === 'high';
      const { anchorId, parkId, title } = prev.focus;
      return {
        ...prev,
        focus: null,
        completedToday: [...prev.completedToday, title],
        anchors: prev.anchors.map((a) =>
          a.id === anchorId ? { ...a, status: 'done' as const } : a
        ),
        park: parkId ? prev.park.filter((p) => p.id !== parkId) : prev.park,
      };
    });
    setUnstickOpen(false);
    setOverwhelmOpen(false);
    showToast({ title: ack.title, body: ack.body });
    return completedHigh;
  }, [showToast, update]);

  const addAnchor = useCallback(
    (input: { title: string; dod: string; rawMinutes: number; load: Load }) => {
      const load = state.load ?? 'low';
      const cap = LOAD_CAPS[load];
      update((prev) => {
        if (openCount(prev.anchors) >= cap) return prev;
        const anchor: Anchor = {
          id: newId(),
          title: input.title.trim(),
          dod: input.dod.trim(),
          rawMinutes: input.rawMinutes,
          bufferedMinutes: bufferedMinutes(
            input.rawMinutes,
            prev.settings.bufferPercent
          ),
          load: input.load,
          status: 'open',
        };
        return { ...prev, anchors: [...prev.anchors, anchor] };
      });
    },
    [state.load, update]
  );

  const parkThought = useCallback(
    (text: string, load?: Load, rawMinutes?: number) => {
      const item: ParkItem = {
        id: newId(),
        text: text.trim(),
        createdAt: Date.now(),
        load,
        rawMinutes,
      };
      update((prev) => ({ ...prev, park: [item, ...prev.park] }));
    },
    [update]
  );

  const startParkItem = useCallback(
    (item: ParkItem) => {
      if (state.restMode) return;
      update((prev) => {
        const raw = item.rawMinutes ?? 15;
        const load = item.load ?? 'medium';
        const session: FocusSession = {
          title: item.text,
          dod: 'It’s done when you say it is.',
          load,
          rawMinutes: raw,
          bufferedMinutes: bufferedMinutes(raw, prev.settings.bufferPercent),
          anchorId: null,
          parkId: item.id,
          runState: 'ready',
          accumulatedMs: 0,
          runningSince: null,
          hyperfocusDismissed: false,
        };
        return { ...prev, focus: session };
      });
      setRoute('today');
    },
    [state.restMode, update]
  );

  const removePark = useCallback(
    (id: string) => {
      update((prev) => ({
        ...prev,
        park: prev.park.filter((p) => p.id !== id),
      }));
    },
    [update]
  );

  const enterRest = useCallback(() => {
    const at = Date.now();
    update((prev) => ({
      ...prev,
      restMode: true,
      focus: prev.focus ? pauseFocus(prev.focus, at) : prev.focus,
    }));
    setRoute('rest');
    setUnstickOpen(false);
    setOverwhelmOpen(false);
    setCaptureOpen(false);
    setAddOpen(false);
    showToast({ title: t('restMode.enter.confirm') });
  }, [showToast, update]);

  const exitRest = useCallback(() => {
    update((prev) => ({ ...prev, restMode: false }));
    setRoute('today');
  }, [update]);

  const dismissRestSuggest = useCallback(() => {
    update((prev) => ({
      ...prev,
      restSuggestDismissedDate: todayKey(),
    }));
  }, [update]);

  const dismissComedown = useCallback(() => {
    update((prev) => ({
      ...prev,
      comedownNudgeDismissedKey: pk.doseKey,
    }));
  }, [pk.doseKey, update]);

  const bringForward = useCallback(
    (candidate: CarryCandidate | null) => {
      update((prev) => {
        const parkedFromCarry = prev.carryCandidates
          .filter((c) => !candidate || c.id !== candidate.id)
          .map((c) => ({
            id: newId(),
            text: c.title,
            createdAt: Date.now(),
            load: c.load,
            rawMinutes: c.rawMinutes,
          }));
        const brought: Anchor | null = candidate
          ? {
              id: newId(),
              title: candidate.title,
              dod: candidate.dod,
              rawMinutes: candidate.rawMinutes,
              bufferedMinutes: bufferedMinutes(
                candidate.rawMinutes,
                prev.settings.bufferPercent
              ),
              load: candidate.load,
              status: 'open',
            }
          : null;
        return {
          ...prev,
          carryCandidates: [],
          park: [...parkedFromCarry, ...prev.park],
          anchors: brought ? [brought, ...prev.anchors] : prev.anchors,
        };
      });
    },
    [update]
  );

  const updateSettings = useCallback(
    (partial: Partial<Settings>) => {
      update((prev) => {
        const settings = normalizeSettings({ ...prev.settings, ...partial });
        const next = { ...prev, settings };
        if (settings.bufferPercent !== prev.settings.bufferPercent) {
          return applyBuffer(next, settings.bufferPercent);
        }
        return next;
      });
    },
    [update]
  );

  const openUnstick = useCallback((depth: UnstickDepth = 'standard') => {
    setUnstickDepth(depth);
    setUnstickOpen(true);
  }, []);

  const tooHard = useCallback(() => {
    openUnstick('deeper');
  }, [openUnstick]);

  const overwhelmFocus = useCallback(() => {
    const current = state.focus;
    if (!current) return;
    setOverwhelmLoad(current.load);
    const item: ParkItem = {
      id: newId(),
      text: current.title,
      createdAt: Date.now(),
      load: current.load,
      rawMinutes: current.rawMinutes,
    };
    update((prev) => ({
      ...prev,
      focus: null,
      park: [item, ...prev.park],
    }));
    setUnstickOpen(false);
    setOverwhelmOpen(true);
  }, [state.focus, update]);

  const swapFromOverwhelm = useCallback(() => {
    update((prev) => {
      const next = nextLighterTarget(prev, overwhelmLoad, null);
      if (!next) return prev;
      return {
        ...prev,
        focus: sessionFromAnchor(next, prev.settings.bufferPercent),
      };
    });
    setOverwhelmOpen(false);
    showToast({ title: t('swap.done') });
  }, [overwhelmLoad, showToast, update]);

  const dismissOverwhelm = useCallback(() => {
    setOverwhelmOpen(false);
  }, []);

  const dismissHyperfocus = useCallback(() => {
    update((prev) =>
      prev.focus
        ? { ...prev, focus: { ...prev.focus, hyperfocusDismissed: true } }
        : prev
    );
  }, [update]);

  const elapsedMs = useMemo(() => {
    const f = state.focus;
    if (!f) return 0;
    if (f.runState === 'running' && f.runningSince) {
      return f.accumulatedMs + (now.getTime() - f.runningSince);
    }
    return f.accumulatedMs;
  }, [state.focus, now]);

  const canAdd =
    state.load !== null && openCount(state.anchors) < LOAD_CAPS[state.load];

  const showComedownNudge =
    pk.approachingComedown &&
    pk.doseKey !== null &&
    state.comedownNudgeDismissedKey !== pk.doseKey &&
    !state.restMode;

  const showRestSuggest =
    !state.restMode &&
    state.restSuggestDismissedDate !== state.date &&
    pk.zone === 'comedown';

  const canSwap = state.anchors.some(
    (a) => a.status === 'open' && a.id !== state.focus?.anchorId
  );

  const parkedToday = state.park.filter(
    (p) => todayKey(new Date(p.createdAt)) === state.date
  ).length;

  return {
    state,
    now,
    pk,
    route,
    setRoute,
    toast,
    setToast,
    captureOpen,
    setCaptureOpen,
    unstickOpen,
    setUnstickOpen,
    unstickDepth,
    overwhelmOpen,
    addOpen,
    setAddOpen,
    elapsedMs,
    graceMs: GRACE_MINUTES * 60 * 1000,
    canAdd,
    canSwap,
    showComedownNudge,
    showRestSuggest,
    parkedToday,
    chooseLoad,
    skipLoad,
    logDose,
    skipDose,
    startAnchor,
    beginFocus,
    pauseFocusAction,
    toggleStartPause,
    notThis,
    swapFocus,
    completeFocus,
    addAnchor,
    parkThought,
    startParkItem,
    removePark,
    enterRest,
    exitRest,
    dismissRestSuggest,
    dismissComedown,
    bringForward,
    updateSettings,
    openUnstick,
    tooHard,
    overwhelmFocus,
    swapFromOverwhelm,
    dismissOverwhelm,
    dismissHyperfocus,
    showToast,
    emptyDose: () =>
      update((prev) => ({ ...prev, dose: DEFAULT_DOSE(todayKey()) })),
  };
}

export type AnchorApp = ReturnType<typeof useAnchorApp>;
