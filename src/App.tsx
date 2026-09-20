import { useCallback, useEffect, useState } from 'react';
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
import { useClock } from './hooks/useClock';
import { usePersistedState } from './hooks/usePersistedState';
import type { AnchorBlock, FocusSession, JournalEntry, View } from './types';
import { defaultRailBlocks } from './utils/defaults';
import { todayKey } from './utils/time';
import ui from './components/ui.module.css';

function initialView(focus: FocusSession | null): View {
  if (!focus) return 'home';
  if (Date.now() >= focus.endsAt) return 'focus-done';
  return 'focus';
}

export default function App() {
  const { state, update } = usePersistedState();
  const now = useClock(1000);
  const [view, setView] = useState<View>(() => initialView(loadFocusQuick()));
  const [startDoorSeed, setStartDoorSeed] = useState('');
  const [parkingReturn, setParkingReturn] = useState<View>('home');

  // Apply theme / accessibility attributes
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

  // Day rollover while app is open
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
      }));
      setView('home');
    }
  }, [now, state.rails.date, update]);

  const hideNav =
    view === 'focus' ||
    view === 'focus-done' ||
    view === 'first-run' ||
    !state.settings.firstRunComplete;

  const goHome = () => {
    setView('home');
    setStartDoorSeed('');
  };

  const beginFocus = useCallback(
    (task: string, microStep: string, minutes: number, bodyDouble: boolean) => {
      const startedAt = Date.now();
      const session: FocusSession = {
        task,
        microStep,
        durationMinutes: minutes,
        startedAt,
        endsAt: startedAt + minutes * 60000,
        bodyDouble,
        elapsedBeforePause: 0,
      };
      update((prev) => ({
        ...prev,
        focus: session,
        startedToday: prev.startedToday.includes(task)
          ? prev.startedToday
          : [...prev.startedToday, task],
      }));
      setView('focus');
    },
    [update]
  );

  const clearFocus = () => {
    update((prev) => ({ ...prev, focus: null }));
  };

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
              blocks:
                prev.rails.blocks.length >= 3
                  ? prev.rails.blocks
                  : defaultRailBlocks(),
            },
          }));
          setView('home');
        }}
      />
    );
  }

  const activeFocus = state.focus;

  if (view === 'focus' && activeFocus) {
    return (
      <FocusView
        session={activeFocus}
        ambientEnabled={state.settings.ambientSound}
        onPark={() => {
          parkTask(activeFocus.task);
          setView('home');
        }}
        onDone={() => {
          clearFocus();
          setView('home');
        }}
        onFinished={() => setView('focus-done')}
        onOpenParking={() => {
          setParkingReturn('focus');
          setView('parking');
        }}
      />
    );
  }

  if (view === 'focus-done' && activeFocus) {
    return (
      <FocusDone
        task={activeFocus.task}
        microStep={activeFocus.microStep}
        onContinue={(minutes) => {
          beginFocus(
            activeFocus.task,
            activeFocus.microStep,
            minutes,
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
                Date.now() >= state.focus.endsAt ? 'focus-done' : 'focus'
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
      </>
    );
  }

  if (view === 'settings') {
    return (
      <>
        <Settings
          settings={state.settings}
          blocks={state.rails.blocks}
          onChange={(settings) => update((prev) => ({ ...prev, settings }))}
          onBlocksChange={(blocks) =>
            update((prev) => ({
              ...prev,
              rails: { ...prev.rails, blocks },
            }))
          }
          onBack={goHome}
        />
        <Nav view={view} onNavigate={setView} hidden={hideNav} />
      </>
    );
  }

  if (view === 'time-check') {
    return (
      <>
        <TimeCheck
          lastCheckAt={state.lastTimeCheckAt}
          blocks={state.rails.blocks}
          settings={state.settings}
          now={now}
          onCheck={() =>
            update((prev) => ({ ...prev, lastTimeCheckAt: Date.now() }))
          }
          onBack={goHome}
        />
        <Nav view={view} onNavigate={setView} hidden={hideNav} />
      </>
    );
  }

  const hour = now.getHours();
  const showSoftClosePrompt = hour >= 20;

  return (
    <>
      <div className={ui.screen}>
        <header className={ui.header}>
          <div>
            <h1 className={ui.title}>Anchor</h1>
            <p className={ui.subtitle}>Start small. See time. Hold the day lightly.</p>
          </div>
        </header>

        <div className={ui.stack}>
          <MedWindow settings={state.settings} now={now} />

          {activeFocus && (
            <button
              type="button"
              className={`${ui.btn} ${ui.btnSecondary}`}
              onClick={() =>
                setView(
                  Date.now() >= activeFocus.endsAt ? 'focus-done' : 'focus'
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
            Open Start Door
          </button>

          <TodaysRails
            blocks={state.rails.blocks}
            settings={state.settings}
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
          />

          {state.parking.length > 0 && (
            <div className={ui.cardQuiet}>
              <div className={ui.row} style={{ justifyContent: 'space-between' }}>
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
    </>
  );
}

/** Sync read for first paint resume — mirrors storage key. */
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
