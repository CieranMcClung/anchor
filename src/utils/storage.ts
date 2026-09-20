import {
  DEFAULT_DOSE,
  DEFAULT_SETTINGS,
  type Anchor,
  type AppState,
  type Load,
  type ParkItem,
  type Settings,
} from '../types';
import { todayKey } from './time';
import { bufferedMinutes } from './duration';
import { isSupersededPkPlaceholder, normalizePkWindows } from './pk';

const KEY = 'anchor-p0-v1';
const LEGACY_KEYS = ['anchor-app-v1', 'anchor-state-v1', 'anchor-v1', 'anchor-app-state'];

export function createInitialState(date = todayKey()): AppState {
  return {
    date,
    load: null,
    dose: DEFAULT_DOSE(date),
    anchors: [],
    focus: null,
    park: [],
    restMode: false,
    restSuggestDismissedDate: null,
    comedownNudgeDismissedKey: null,
    carryCandidates: [],
    undo: null,
    settings: { ...DEFAULT_SETTINGS },
  };
}

export function loadState(): AppState {
  try {
    let raw = localStorage.getItem(KEY);
    if (!raw) {
      for (const k of LEGACY_KEYS) {
        raw = localStorage.getItem(k);
        if (raw) break;
      }
    }
    if (!raw) return createInitialState();
    return rollover(migrate(JSON.parse(raw) as Record<string, unknown>));
  } catch {
    return createInitialState();
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* quota / private mode */
  }
}

function isLoad(v: unknown): v is Load {
  return v === 'low' || v === 'medium' || v === 'high';
}

function migrateSettings(raw: unknown): Settings {
  const nested =
    raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const candidate = normalizePkWindows({
    onsetEndHours:
      typeof nested.onsetEndHours === 'number' ? nested.onsetEndHours : undefined,
    peakEndHours:
      typeof nested.peakEndHours === 'number' ? nested.peakEndHours : undefined,
    comedownEndHours:
      typeof nested.comedownEndHours === 'number'
        ? nested.comedownEndHours
        : undefined,
  });
  if (
    isSupersededPkPlaceholder({
      onsetEndHours:
        typeof nested.onsetEndHours === 'number' ? nested.onsetEndHours : 1,
      peakEndHours:
        typeof nested.peakEndHours === 'number' ? nested.peakEndHours : 5,
      comedownEndHours:
        typeof nested.comedownEndHours === 'number' ? nested.comedownEndHours : 8,
    })
  ) {
    return { ...DEFAULT_SETTINGS };
  }
  if (
    typeof nested.onsetEndHours !== 'number' &&
    typeof nested.peakEndHours !== 'number' &&
    typeof nested.comedownEndHours !== 'number'
  ) {
    return { ...DEFAULT_SETTINGS };
  }
  return candidate;
}

function migrateAnchor(raw: unknown): Anchor | null {
  if (!raw || typeof raw !== 'object') return null;
  const a = raw as Record<string, unknown>;
  const title =
    typeof a.title === 'string'
      ? a.title
      : typeof a.name === 'string'
        ? a.name
        : null;
  if (!title) return null;
  const rawMinutes =
    typeof a.rawMinutes === 'number'
      ? a.rawMinutes
      : typeof a.durationMinutes === 'number'
        ? Math.round(a.durationMinutes / 1.4)
        : 15;
  const status: Anchor['status'] =
    a.status === 'done' || a.status === 'skipped' ? 'done' : 'open';
  return {
    id: typeof a.id === 'string' ? a.id : crypto.randomUUID(),
    title,
    dod: typeof a.dod === 'string' ? a.dod : typeof a.definitionOfDone === 'string' ? a.definitionOfDone : '',
    rawMinutes,
    bufferedMinutes:
      typeof a.bufferedMinutes === 'number'
        ? a.bufferedMinutes
        : bufferedMinutes(rawMinutes),
    load: isLoad(a.load) ? a.load : isLoad(a.cognitiveLoad) ? a.cognitiveLoad : 'medium',
    status,
  };
}

function migratePark(raw: unknown): ParkItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const p = raw as Record<string, unknown>;
  const text = typeof p.text === 'string' ? p.text : null;
  if (!text) return null;
  return {
    id: typeof p.id === 'string' ? p.id : crypto.randomUUID(),
    text,
    createdAt: typeof p.createdAt === 'number' ? p.createdAt : Date.now(),
    load: isLoad(p.load) ? p.load : isLoad(p.cognitiveLoad) ? p.cognitiveLoad : undefined,
    rawMinutes:
      typeof p.rawMinutes === 'number'
        ? p.rawMinutes
        : typeof p.estimateMinutes === 'number'
          ? p.estimateMinutes
          : undefined,
  };
}

function migrate(raw: Record<string, unknown>): AppState {
  const date = typeof raw.date === 'string' ? raw.date : todayKey();
  const doseRaw = (raw.dose ?? raw.doseLog) as Record<string, unknown> | undefined;
  const rails = raw.rails as { blocks?: unknown[] } | undefined;

  const fromRails = (rails?.blocks ?? []).map(migrateAnchor).filter((a): a is Anchor => a !== null);
  const direct = Array.isArray(raw.anchors)
    ? raw.anchors.map(migrateAnchor).filter((a): a is Anchor => a !== null)
    : [];

  const parkSource = Array.isArray(raw.park)
    ? raw.park
    : Array.isArray(raw.parking)
      ? raw.parking
      : [];

  return {
    date,
    load: isLoad(raw.load) ? raw.load : null,
    dose: {
      date: typeof doseRaw?.date === 'string' ? doseRaw.date : date,
      timeHHMM: typeof doseRaw?.timeHHMM === 'string' ? doseRaw.timeHHMM : null,
      loggedAt: typeof doseRaw?.loggedAt === 'number' ? doseRaw.loggedAt : null,
      skipped: Boolean(doseRaw?.skipped),
    },
    anchors: direct.length ? direct : fromRails.slice(0, 3),
    focus: null,
    park: parkSource.map(migratePark).filter((p): p is ParkItem => p !== null),
    restMode: Boolean(raw.restMode),
    restSuggestDismissedDate:
      typeof raw.restSuggestDismissedDate === 'string'
        ? raw.restSuggestDismissedDate
        : null,
    comedownNudgeDismissedKey:
      typeof raw.comedownNudgeDismissedKey === 'string'
        ? raw.comedownNudgeDismissedKey
        : null,
    carryCandidates: Array.isArray(raw.carryCandidates)
      ? (raw.carryCandidates as AppState['carryCandidates'])
      : [],
    undo: null,
    settings: migrateSettings(raw.settings),
  };
}

export function rollover(state: AppState, now = new Date()): AppState {
  const today = todayKey(now);
  if (state.date === today) {
    if (state.dose.date !== today) {
      return { ...state, dose: DEFAULT_DOSE(today) };
    }
    return state;
  }

  const leftovers = state.anchors
    .filter((a) => a.status === 'open')
    .map((a) => ({
      id: a.id,
      title: a.title,
      dod: a.dod,
      rawMinutes: a.rawMinutes,
      load: a.load,
    }));

  return {
    ...createInitialState(today),
    park: state.park,
    carryCandidates: leftovers,
    settings: state.settings,
  };
}
