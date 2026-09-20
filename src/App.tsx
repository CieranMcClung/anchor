import { useCallback, useEffect, useMemo, useState } from 'react';
import { FirstRun } from './components/FirstRun';
import { FocusDone } from './components/FocusDone';
import { FocusView } from './components/FocusView';
import { MedWindow } from './components/MedWindow';
import { Nav } from './components/Nav';
import { ParkingLot } from './components/ParkingLot';
import { Settings } from './components/Settings';
import { SoftClose } from './components/SoftClose';
import { StartDoor } from './components/StartDoor';
import { TimeCheck } from './components/TimeCheck';
import { TodaysRails } from './components/TodaysRails';
import { AgentBanner } from './components/agents/AgentBanner';
import {
  BrainDumpDrawer,
  BrainDumpFab,
} from './components/agents/BrainDumpDrawer';
import { SomaticResetView } from './components/agents/SomaticResetView';
import ui from './components/ui.module.css';
import { useClock } from './hooks/useClock';
import { usePersistedState } from './hooks/usePersistedState';
import {
  comedownWarnCopy,
  getOrchestratorSnapshot,
} from './agents/pharmacokinetic';
import { shouldShowPrompt, markPromptShown } from './agents/coalesce';
import {
  completeCurrentStep,
  createDeconstruction,
} from './agents/unstick';
import { parsedToParking, type ParsedDumpTask } from './agents/brainDump';
import { detectExecutiveBlock } from './agents/somatic';
import type {
  AnchorBlock,
  FocusSession,
  JournalEntry,
  View,
} from './types';
import { bufferedMinutes } from './types';
import {
  buildRailsFromSettings,
  defaultRailBlocks,
} from './utils/defaults';
import { formatWallClock, minutesToHHMM, minutesSinceMidnight, todayKey } from './utils/time';

function initialView(focus: FocusSession | null): View {
  if (!focus) return 'home';
  if (Date.now() >= focus.endsAt && !focus.deconstruction) return 'focus-done';
  return 'focus';
}

function loadFocusQuick(): FocusSession | null {
  try {
    const raw = localStorage.getItem('anchor-app-v1');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { focus: FocusSession | null };
    return parsed.focus ?? null;
  } catch {
    return null;
  }
}

export default function App() {
  const { state, update } = usePersistedState();
  const now = useClock(1000);
  const [view, setView] = useState<View>(() => initialView(loadFocusQuick()));
  const [startDoorSeed, setStartDoorSeed] = useState('');
  const [parkingReturn, setParkingReturn] = useState<View>('home');
  const [brainDumpOpen, setBrainDumpOpen] = useState(false);
  const [showComedownBanner, setShowComedownBanner] = useState(false);

  // —— theme ——
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = state.settings.theme;
    root.dataset.lowStim = String(state.settings.lowStimulation);
    root.dataset.reduceMotion = String(state.settings.reduceMotion);
  }, [
    state.settings.theme,
    state.settings.lowStimulation,
    state.settings.reduceMotion,
  ]);

  // —— day rollover ——
  useEffect(() => {
    const today = todayKey(now);
    if (state.rails.date !== today) {
      update((prev) => ({
        ...prev,
        rails: {
          date: today,
          blocks: prev.rails.blocks.map((b) => ({
            ...b,
            status: 'upcoming' as const,
          })),
        },
        startedToday: [],
        focus: null,
        doseLog: { date: today, timeHHMM: null, loggedAt: null },
        agents: {
          ...prev.agents,
          showBuriedTasks: false,
          session: {
            comedownWarnDismissedKey: null,
            somaticDismissedForFocusStart: null,
            lastPromptKind: null,
            lastPromptAt: null,
          },
        },
      }));
      setView('home');
    } else if (state.doseLog.date !== today) {
      update((prev) => ({
        ...prev,
        doseLog: { date: today, timeHHMM: null, loggedAt: null },
      }));
    }
  }, [now, state.rails.date, state.doseLog.date, update]);

  // —— Pharmacokinetic Orchestrator (always-on tick) ——
  const orchSnap = useMemo(
    () => getOrchestratorSnapshot(state.settings, state.doseLog, now),
    [state.settings, state.doseLog, now]
  );

  useEffect(() => {
    if (state.agents.orchestratorMode !== orchSnap.mode) {
      update((prev) => ({
        ...prev,
        agents: {
          ...prev.agents,
          orchestratorMode: orchSnap.mode,
          // Auto-hide buried again when leaving rest/comedown
          showBuriedTasks:
            orchSnap.mode === 'rest-protection' || orchSnap.mode === 'comedown'
              ? prev.agents.showBuriedTasks
              : false,
        },
      }));
    }
  }, [orchSnap.mode, state.agents.orchestratorMode, update]);

  // Comedown warning prompt (coalesced, dismissible for this dose)
  useEffect(() => {
    if (!orchSnap.isComedownWarning) {
      setShowComedownBanner(false);
      return;
    }
    const dismissed =
      state.agents.session.comedownWarnDismissedKey === orchSnap.doseKey;
    if (dismissed) {
      setShowComedownBanner(false);
      return;
    }
    const canShow = shouldShowPrompt(
      'comedown-warn',
      state.agents.session.lastPromptKind,
      state.agents.session.lastPromptAt,
      now.getTime()
    );
    if (canShow || state.agents.comedownWarnShownFor !== orchSnap.doseKey) {
      setShowComedownBanner(true);
      if (state.agents.comedownWarnShownFor !== orchSnap.doseKey) {
        const marked = markPromptShown('comedown-warn', now.getTime());
        update((prev) => ({
          ...prev,
          agents: {
            ...prev.agents,
            comedownWarnShownFor: orchSnap.doseKey,
            session: { ...prev.agents.session, ...marked },
          },
        }));
      }
    }
  }, [
    orchSnap.isComedownWarning,
    orchSnap.doseKey,
    state.agents.session.comedownWarnDismissedKey,
    state.agents.session.lastPromptKind,
    state.agents.session.lastPromptAt,
    state.agents.comedownWarnShownFor,
    now,
    update,
  ]);

  // —— Somatic Reset detection ——
  const somaticSignal = useMemo(
    () =>
      detectExecutiveBlock(
        state.focus,
        now.getTime(),
        state.agents.session.somaticDismissedForFocusStart
      ),
    [state.focus, now, state.agents.session.somaticDismissedForFocusStart]
  );

  const showSomaticPrompt =
    view === 'focus' &&
    somaticSignal.shouldPrompt &&
    shouldShowPrompt(
      'somatic',
      state.agents.session.lastPromptKind,
      state.agents.session.lastPromptAt,
      now.getTime(),
      8 * 60 * 1000
    );

  // —— Brain-dump keyboard shortcut ——
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || target?.isContentEditable) {
        return;
      }
      if (e.key === 'c' || e.key === 'C' || e.key === '/') {
        e.preventDefault();
        setBrainDumpOpen(true);
      }
      if (e.key === 'Escape') setBrainDumpOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Visibility resume: nudge clock-driven agents when tab returns
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'visible') {
        // touch orchestrator by relying on next clock tick; no-op placeholder
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  const hideNav =
    view === 'focus' ||
    view === 'focus-done' ||
    view === 'first-run' ||
    view === 'somatic-reset' ||
    !state.settings.firstRunComplete;

  const goHome = () => {
    setView('home');
    setStartDoorSeed('');
  };

  const beginFocus = useCallback(
    (
      task: string,
      microStep: string,
      definitionOfDone: string,
      estimateMinutes: number,
      bodyDouble: boolean,
      isMicro = false,
      deconstruction?: FocusSession['deconstruction']
    ) => {
      const startedAt = Date.now();
      const duration = deconstruction
        ? 2
        : isMicro
          ? 2
          : bufferedMinutes(estimateMinutes);
      const session: FocusSession = {
        task,
        microStep: deconstruction
          ? deconstruction.steps[deconstruction.currentIndex]
          : microStep,
        definitionOfDone,
        estimateMinutes: deconstruction || isMicro ? 2 : estimateMinutes,
        durationMinutes: duration,
        startedAt,
        endsAt: startedAt + duration * 60000,
        bodyDouble,
        elapsedBeforePause: 0,
        isMicro: Boolean(deconstruction) || isMicro,
        lastInteractionAt: startedAt,
        deconstruction,
      };
      update((prev) => ({
        ...prev,
        focus: session,
        startedToday: prev.startedToday.includes(task)
          ? prev.startedToday
          : [...prev.startedToday, task],
        agents: {
          ...prev.agents,
          session: {
            ...prev.agents.session,
            somaticDismissedForFocusStart: null,
          },
        },
      }));
      setView('focus');
    },
    [update]
  );

  const clearFocus = () => update((prev) => ({ ...prev, focus: null }));

  const parkTask = (text: string) => {
    update((prev) => ({
      ...prev,
      parking: [
        { id: crypto.randomUUID(), text, createdAt: Date.now() },
        ...prev.parking,
      ],
      focus: null,
    }));
  };

  const onTookDose = () => {
    const today = todayKey();
    update((prev) => ({
      ...prev,
      doseLog: {
        date: today,
        timeHHMM: formatWallClock(new Date()),
        loggedAt: Date.now(),
      },
      agents: {
        ...prev.agents,
        comedownWarnShownFor: null,
        session: {
          ...prev.agents.session,
          comedownWarnDismissedKey: null,
        },
      },
    }));
  };

  const touchFocus = () => {
    update((prev) =>
      prev.focus
        ? {
            ...prev,
            focus: { ...prev.focus, lastInteractionAt: Date.now() },
          }
        : prev
    );
  };

  const startUnstick = () => {
    const active = state.focus;
    if (!active) return;
    const decon = createDeconstruction(active.task, active.definitionOfDone);
    const startedAt = Date.now();
    update((prev) => ({
      ...prev,
      focus: {
        ...active,
        microStep: decon.steps[0],
        estimateMinutes: 2,
        durationMinutes: 2,
        startedAt,
        endsAt: startedAt + 2 * 60000,
        isMicro: true,
        lastInteractionAt: startedAt,
        deconstruction: decon,
      },
      agents: {
        ...prev.agents,
        session: {
          ...prev.agents.session,
          somaticDismissedForFocusStart: startedAt,
        },
      },
    }));
  };

  const completeMicroStep = () => {
    let finishedAll = false;
    update((prev) => {
      const f = prev.focus;
      if (!f?.deconstruction) return prev;
      const next = completeCurrentStep(f.deconstruction);
      if (!next) {
        finishedAll = true;
        return { ...prev, focus: null };
      }
      if (next.completed[2] && next.currentIndex === 2) {
        finishedAll = true;
        return { ...prev, focus: null };
      }
      const startedAt = Date.now();
      return {
        ...prev,
        focus: {
          ...f,
          microStep: next.steps[next.currentIndex],
          deconstruction: next,
          startedAt,
          endsAt: startedAt + 2 * 60000,
          durationMinutes: 2,
          estimateMinutes: 2,
          lastInteractionAt: startedAt,
          isMicro: true,
        },
      };
    });
    if (finishedAll) setView('home');
  };

  const commitBrainDump = (tasks: ParsedDumpTask[]) => {
    update((prev) => {
      let parking = [...prev.parking];
      let blocks = [...prev.rails.blocks];
      const nowMins = minutesSinceMidnight();

      for (const t of tasks) {
        if (t.destination === 'rails') {
          const start =
            t.plannedStart ?? minutesToHHMM(nowMins + 15);
          blocks.push({
            id: crypto.randomUUID(),
            name: t.text,
            plannedStart: start,
            durationMinutes: t.bufferedMinutes,
            cognitiveLoad: t.cognitiveLoad,
            routine: t.routine ?? 'anytime',
            status: 'upcoming',
          });
        } else {
          // parking + tomorrow both go to parking lot (tomorrow tagged in text)
          const item = parsedToParking(t);
          if (t.destination === 'tomorrow' && !/tomorrow/i.test(item.text)) {
            item.text = `${item.text} (tomorrow)`;
          }
          parking = [item, ...parking];
        }
      }

      return {
        ...prev,
        parking,
        rails: { ...prev.rails, blocks },
      };
    });
  };

  const fabHidden = hideNav || brainDumpOpen;

  if (!state.settings.firstRunComplete) {
    return (
      <FirstRun
        settings={state.settings}
        onComplete={(settings) => {
          update((prev) => ({
            ...prev,
            settings,
            rails: {
              date: todayKey(),
              blocks: buildRailsFromSettings({
                useMorning: settings.useMorningTemplate,
                useEvening: settings.useEveningTemplate,
                existing:
                  prev.rails.blocks.length >= 3
                    ? prev.rails.blocks
                    : defaultRailBlocks(),
              }),
            },
          }));
          setView('home');
        }}
      />
    );
  }

  const activeFocus = state.focus;

  if (view === 'somatic-reset') {
    return (
      <SomaticResetView
        onDone={() => {
          touchFocus();
          setView(activeFocus ? 'focus' : 'home');
        }}
        onSkip={() => setView(activeFocus ? 'focus' : 'home')}
      />
    );
  }

  if (view === 'focus' && activeFocus) {
    return (
      <>
        <FocusView
          session={activeFocus}
          ambientEnabled={state.settings.ambientSound}
          showSomaticPrompt={showSomaticPrompt}
          onPark={() => {
            parkTask(activeFocus.task);
            setView('home');
          }}
          onDone={() => {
            clearFocus();
            setView('home');
          }}
          onFinished={() => {
            if (activeFocus.deconstruction) return;
            setView('focus-done');
          }}
          onOpenParking={() => {
            setParkingReturn('focus');
            setView('parking');
          }}
          onParalyzed={startUnstick}
          onCompleteMicroStep={completeMicroStep}
          onInteract={touchFocus}
          onSomaticStart={() => {
            const marked = markPromptShown('somatic', Date.now());
            update((prev) => ({
              ...prev,
              agents: {
                ...prev.agents,
                session: { ...prev.agents.session, ...marked },
              },
            }));
            setView('somatic-reset');
          }}
          onSomaticDismiss={() => {
            update((prev) => ({
              ...prev,
              agents: {
                ...prev.agents,
                session: {
                  ...prev.agents.session,
                  somaticDismissedForFocusStart:
                    prev.focus?.startedAt ?? Date.now(),
                  ...markPromptShown('somatic', Date.now()),
                },
              },
            }));
          }}
          onSomaticMicro={() => {
            update((prev) => ({
              ...prev,
              agents: {
                ...prev.agents,
                session: {
                  ...prev.agents.session,
                  somaticDismissedForFocusStart:
                    prev.focus?.startedAt ?? Date.now(),
                },
              },
            }));
            startUnstick();
          }}
          onToggleBodyDouble={() =>
            update((prev) =>
              prev.focus
                ? {
                    ...prev,
                    focus: {
                      ...prev.focus,
                      bodyDouble: !prev.focus.bodyDouble,
                      lastInteractionAt: Date.now(),
                    },
                  }
                : prev
            )
          }
        />
        <BrainDumpDrawer
          open={brainDumpOpen}
          onClose={() => setBrainDumpOpen(false)}
          onCommit={commitBrainDump}
        />
      </>
    );
  }

  if (view === 'focus-done' && activeFocus) {
    return (
      <FocusDone
        task={activeFocus.task}
        microStep={activeFocus.microStep}
        definitionOfDone={activeFocus.definitionOfDone}
        onContinue={(estimateMinutes) => {
          beginFocus(
            activeFocus.task,
            activeFocus.microStep,
            activeFocus.definitionOfDone,
            estimateMinutes,
            activeFocus.bodyDouble
          );
        }}
        onPark={() => {
          parkTask(activeFocus.task);
          setView('home');
        }}
        onDone={() => {
          clearFocus();
          setView('home');
        }}
      />
    );
  }

  if (view === 'start-door') {
    return (
      <>
        <StartDoor
          initialTask={startDoorSeed}
          onStart={beginFocus}
          onBack={goHome}
        />
        <Nav view={view} onNavigate={setView} hidden={hideNav} />
        <BrainDumpFab hidden={fabHidden} onClick={() => setBrainDumpOpen(true)} />
        <BrainDumpDrawer
          open={brainDumpOpen}
          onClose={() => setBrainDumpOpen(false)}
          onCommit={commitBrainDump}
        />
      </>
    );
  }

  if (view === 'parking') {
    return (
      <>
        <ParkingLot
          items={state.parking}
          onAdd={(text) =>
            update((prev) => ({
              ...prev,
              parking: [
                { id: crypto.randomUUID(), text, createdAt: Date.now() },
                ...prev.parking,
              ],
            }))
          }
          onRemove={(id) =>
            update((prev) => ({
              ...prev,
              parking: prev.parking.filter((p) => p.id !== id),
            }))
          }
          onToStartDoor={(text) => {
            update((prev) => ({
              ...prev,
              parking: prev.parking.filter((p) => p.text !== text),
            }));
            setStartDoorSeed(text);
            setView('start-door');
          }}
          onBack={() => {
            if (parkingReturn === 'focus' && state.focus) {
              setView(
                Date.now() >= state.focus.endsAt && !state.focus.deconstruction
                  ? 'focus-done'
                  : 'focus'
              );
            } else {
              goHome();
            }
            setParkingReturn('home');
          }}
        />
        <Nav
          view={view}
          onNavigate={(v) => {
            setParkingReturn('home');
            setView(v);
          }}
          hidden={hideNav}
        />
        <BrainDumpFab hidden={fabHidden} onClick={() => setBrainDumpOpen(true)} />
        <BrainDumpDrawer
          open={brainDumpOpen}
          onClose={() => setBrainDumpOpen(false)}
          onCommit={commitBrainDump}
        />
      </>
    );
  }

  if (view === 'soft-close') {
    return (
      <>
        <SoftClose
          startedToday={state.startedToday}
          parking={state.parking}
          journal={state.journal}
          onSave={(entry) => {
            update((prev) => {
              const rest = prev.journal.filter((j) => j.date !== entry.date);
              const full: JournalEntry = {
                ...entry,
                id: crypto.randomUUID(),
                createdAt: Date.now(),
              };
              return {
                ...prev,
                journal: [full, ...rest].slice(0, 60),
                softCloseDoneFor: entry.date,
              };
            });
          }}
          onParkForTomorrow={(texts) => {
            update((prev) => ({
              ...prev,
              parking: [
                ...texts.map((text) => ({
                  id: crypto.randomUUID(),
                  text,
                  createdAt: Date.now(),
                })),
                ...prev.parking,
              ],
            }));
          }}
          onBack={goHome}
        />
        <Nav view={view} onNavigate={setView} hidden={hideNav} />
        <BrainDumpFab hidden={fabHidden} onClick={() => setBrainDumpOpen(true)} />
        <BrainDumpDrawer
          open={brainDumpOpen}
          onClose={() => setBrainDumpOpen(false)}
          onCommit={commitBrainDump}
        />
      </>
    );
  }

  if (view === 'settings') {
    return (
      <>
        <Settings
          settings={state.settings}
          doseLog={state.doseLog}
          blocks={state.rails.blocks}
          agents={state.agents}
          onChange={(settings) => update((prev) => ({ ...prev, settings }))}
          onDoseLogChange={(doseLog) =>
            update((prev) => ({ ...prev, doseLog }))
          }
          onBlocksChange={(blocks) =>
            update((prev) => ({
              ...prev,
              rails: { ...prev.rails, blocks },
            }))
          }
          onAgentsChange={(agents) =>
            update((prev) => ({ ...prev, agents }))
          }
          onBack={goHome}
        />
        <Nav view={view} onNavigate={setView} hidden={hideNav} />
        <BrainDumpFab hidden={fabHidden} onClick={() => setBrainDumpOpen(true)} />
        <BrainDumpDrawer
          open={brainDumpOpen}
          onClose={() => setBrainDumpOpen(false)}
          onCommit={commitBrainDump}
        />
      </>
    );
  }

  if (view === 'time-check') {
    return (
      <>
        <TimeCheck
          lastCheckAt={state.lastTimeCheckAt}
          blocks={state.rails.blocks}
          parking={state.parking}
          settings={state.settings}
          doseLog={state.doseLog}
          now={now}
          onCheck={() =>
            update((prev) => ({ ...prev, lastTimeCheckAt: Date.now() }))
          }
          onBack={goHome}
        />
        <Nav view={view} onNavigate={setView} hidden={hideNav} />
        <BrainDumpFab hidden={fabHidden} onClick={() => setBrainDumpOpen(true)} />
        <BrainDumpDrawer
          open={brainDumpOpen}
          onClose={() => setBrainDumpOpen(false)}
          onCommit={commitBrainDump}
        />
      </>
    );
  }

  const showSoftClosePrompt = now.getHours() >= 20;
  const warnCopy = comedownWarnCopy(orchSnap.hoursUntilComedown);

  return (
    <>
      <div className={ui.screen}>
        <header className={ui.header}>
          <div>
            <h1 className={ui.title}>Anchor</h1>
            <p className={ui.subtitle}>
              Start small. See time. Hold the day lightly.
            </p>
          </div>
        </header>

        <div className={ui.stack}>
          <MedWindow
            settings={state.settings}
            doseLog={state.doseLog}
            now={now}
            onTookDose={onTookDose}
            onEditDoseTime={() => setView('settings')}
          />

          {showComedownBanner && (
            <AgentBanner
              title={warnCopy.title}
              body={warnCopy.body}
              tone="warn"
              actions={[
                {
                  label: 'Shift to low-demand',
                  primary: true,
                  onClick: () => {
                    update((prev) => ({
                      ...prev,
                      agents: {
                        ...prev.agents,
                        session: {
                          ...prev.agents.session,
                          comedownWarnDismissedKey: orchSnap.doseKey,
                        },
                      },
                    }));
                    setShowComedownBanner(false);
                  },
                },
                {
                  label: 'Got it',
                  ghost: true,
                  onClick: () => {
                    update((prev) => ({
                      ...prev,
                      agents: {
                        ...prev.agents,
                        session: {
                          ...prev.agents.session,
                          comedownWarnDismissedKey: orchSnap.doseKey,
                        },
                      },
                    }));
                    setShowComedownBanner(false);
                  },
                },
              ]}
            />
          )}

          {activeFocus && (
            <button
              type="button"
              className={`${ui.btn} ${ui.btnSecondary}`}
              onClick={() =>
                setView(
                  Date.now() >= activeFocus.endsAt && !activeFocus.deconstruction
                    ? 'focus-done'
                    : 'focus'
                )
              }
            >
              Resume focus — {activeFocus.task}
            </button>
          )}

          <button
            type="button"
            className={`${ui.btn} ${ui.btnPrimary}`}
            onClick={() => {
              setStartDoorSeed('');
              setView('start-door');
            }}
          >
            Single focus
          </button>

          <TodaysRails
            blocks={state.rails.blocks}
            parking={state.parking}
            settings={state.settings}
            doseLog={state.doseLog}
            agents={state.agents}
            orchestratorMode={orchSnap.mode}
            now={now}
            onStatus={(id, status) =>
              update((prev) => ({
                ...prev,
                rails: {
                  ...prev.rails,
                  blocks: prev.rails.blocks.map((b: AnchorBlock) =>
                    b.id === id ? { ...b, status } : b
                  ),
                },
              }))
            }
            onStartBlock={(block) => {
              setStartDoorSeed(block.name);
              setView('start-door');
            }}
            onStartParking={(text) => {
              setStartDoorSeed(text);
              setView('start-door');
            }}
            onToggleShowBuried={() =>
              update((prev) => ({
                ...prev,
                agents: {
                  ...prev.agents,
                  showBuriedTasks: !prev.agents.showBuriedTasks,
                },
              }))
            }
          />

          {state.parking.length > 0 && (
            <div className={ui.cardQuiet}>
              <div
                className={ui.row}
                style={{ justifyContent: 'space-between' }}
              >
                <strong>Parking lot</strong>
                <button
                  type="button"
                  className={`${ui.btn} ${ui.btnGhost}`}
                  onClick={() => setView('parking')}
                >
                  {state.parking.length} parked
                </button>
              </div>
            </div>
          )}

          {showSoftClosePrompt ? (
            <button
              type="button"
              className={`${ui.btn} ${ui.btnSecondary}`}
              onClick={() => setView('soft-close')}
            >
              Soft close evening
            </button>
          ) : (
            <button
              type="button"
              className={`${ui.btn} ${ui.btnGhost}`}
              onClick={() => setView('soft-close')}
            >
              Soft close
            </button>
          )}
        </div>
      </div>
      <Nav view={view} onNavigate={setView} hidden={hideNav} />
      <BrainDumpFab hidden={fabHidden} onClick={() => setBrainDumpOpen(true)} />
      <BrainDumpDrawer
        open={brainDumpOpen}
        onClose={() => setBrainDumpOpen(false)}
        onCommit={commitBrainDump}
      />
    </>
  );
}
