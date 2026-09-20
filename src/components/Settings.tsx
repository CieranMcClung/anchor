import type {
  AgentsState,
  AnchorBlock,
  CognitiveLoad,
  DoseLog,
  MedPhase,
  RoutineSlot,
  Settings as SettingsType,
} from '../types';
import { LOAD_COPY, ORCHESTRATOR_COPY, PHASE_COPY } from '../types';
import { buildRailsFromSettings } from '../utils/defaults';
import { todayKey } from '../utils/time';
import ui from './ui.module.css';

interface Props {
  settings: SettingsType;
  doseLog: DoseLog;
  blocks: AnchorBlock[];
  agents: AgentsState;
  onChange: (next: SettingsType) => void;
  onDoseLogChange: (next: DoseLog) => void;
  onBlocksChange: (blocks: AnchorBlock[]) => void;
  onAgentsChange: (next: AgentsState) => void;
  onBack: () => void;
}

const PHASE_OPTIONS: (MedPhase | '')[] = [
  '',
  'before',
  'onset',
  'peak',
  'comedown',
  'offline',
];

const LOAD_OPTIONS: CognitiveLoad[] = ['low', 'medium', 'high'];
const ROUTINE_OPTIONS: RoutineSlot[] = ['morning', 'evening', 'anytime'];

export function Settings({
  settings,
  doseLog,
  blocks,
  agents,
  onChange,
  onDoseLogChange,
  onBlocksChange,
  onAgentsChange,
  onBack,
}: Props) {
  const patch = (partial: Partial<SettingsType>) =>
    onChange({ ...settings, ...partial });

  const updateBlock = (id: string, partial: Partial<AnchorBlock>) => {
    onBlocksChange(blocks.map((b) => (b.id === id ? { ...b, ...partial } : b)));
  };

  const addBlock = () => {
    onBlocksChange([
      ...blocks,
      {
        id: crypto.randomUUID(),
        name: 'New anchor',
        plannedStart: '10:00',
        durationMinutes: 30,
        cognitiveLoad: 'medium',
        routine: 'anytime',
        status: 'upcoming',
      },
    ]);
  };

  const removeBlock = (id: string) => {
    if (blocks.length <= 3) return;
    onBlocksChange(blocks.filter((b) => b.id !== id));
  };

  const reseedTemplates = (useMorning: boolean, useEvening: boolean) => {
    const next = buildRailsFromSettings({
      useMorning,
      useEvening,
      existing: blocks,
    });
    onBlocksChange(next);
  };

  const today = todayKey();
  const todaysDose =
    doseLog.date === today && doseLog.timeHHMM ? doseLog.timeHHMM : '';

  return (
    <div className={ui.screen}>
      <header className={ui.header}>
        <div>
          <h1 className={ui.title}>Settings</h1>
          <p className={ui.subtitle}>Local only — nothing leaves this device.</p>
        </div>
        <button type="button" className={`${ui.btn} ${ui.btnGhost}`} onClick={onBack}>
          Back
        </button>
      </header>

      <div className={ui.stack}>
        <div className={`${ui.card} ${ui.stack}`}>
          <h2 style={{ margin: 0, fontSize: '1rem' }}>Methylphenidate XL</h2>
          <p className={ui.disclaimer}>
            Not medical advice. These are your personal estimates of when focus
            tends to rise and ease — for organising tasks only. Started 18 mg on
            10 September 2026 is your context; Anchor does not interpret clinical
            response.
          </p>
          <div className={ui.field}>
            <label htmlFor="dose-label">Dose label</label>
            <input
              id="dose-label"
              className={ui.input}
              value={settings.doseLabel}
              onChange={(e) => patch({ doseLabel: e.target.value || '18 mg XL' })}
              placeholder="18 mg XL"
            />
          </div>
          <div className={ui.field}>
            <label htmlFor="dose-time">Usual dose time</label>
            <input
              id="dose-time"
              className={ui.input}
              type="time"
              value={settings.doseTime}
              onChange={(e) => patch({ doseTime: e.target.value || '08:00' })}
            />
            <p className={ui.hint}>
              Used as an estimate when today’s dose isn’t logged yet.
            </p>
          </div>
          <div className={ui.field}>
            <label htmlFor="todays-dose">Today’s logged dose time</label>
            <input
              id="todays-dose"
              className={ui.input}
              type="time"
              value={todaysDose}
              onChange={(e) => {
                const v = e.target.value;
                onDoseLogChange({
                  date: today,
                  timeHHMM: v || null,
                  loggedAt: v ? Date.now() : null,
                });
              }}
            />
            <p className={ui.hint}>Clear the field to treat today as not logged.</p>
          </div>
          <div className={ui.row}>
            <div className={ui.field} style={{ flex: 1 }}>
              <label htmlFor="onset-h">Onset ends (h)</label>
              <input
                id="onset-h"
                className={ui.input}
                type="number"
                min={0.25}
                max={4}
                step={0.25}
                value={settings.onsetEndHours}
                onChange={(e) =>
                  patch({
                    onsetEndHours: Math.min(
                      4,
                      Math.max(0.25, Number(e.target.value) || 1)
                    ),
                  })
                }
              />
            </div>
            <div className={ui.field} style={{ flex: 1 }}>
              <label htmlFor="peak-h">Peak ends (h)</label>
              <input
                id="peak-h"
                className={ui.input}
                type="number"
                min={1}
                max={12}
                step={0.25}
                value={settings.peakEndHours}
                onChange={(e) =>
                  patch({
                    peakEndHours: Math.min(
                      12,
                      Math.max(1, Number(e.target.value) || 5)
                    ),
                  })
                }
              />
            </div>
            <div className={ui.field} style={{ flex: 1 }}>
              <label htmlFor="come-h">Comedown ends (h)</label>
              <input
                id="come-h"
                className={ui.input}
                type="number"
                min={2}
                max={16}
                step={0.25}
                value={settings.comedownEndHours}
                onChange={(e) =>
                  patch({
                    comedownEndHours: Math.min(
                      16,
                      Math.max(2, Number(e.target.value) || 8)
                    ),
                  })
                }
              />
            </div>
          </div>
          <p className={ui.hint}>
            Defaults: onset 0–1h · peak 1–5h · comedown 5–8h · then offline / rest.
          </p>
        </div>

        <div className={`${ui.card} ${ui.stack}`}>
          <h2 style={{ margin: 0, fontSize: '1rem' }}>Daily templates</h2>
          <label className={ui.row} style={{ cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={settings.useMorningTemplate}
              onChange={(e) => {
                const useMorning = e.target.checked;
                patch({ useMorningTemplate: useMorning });
                reseedTemplates(useMorning, settings.useEveningTemplate);
              }}
            />
            Morning basics (meds, breakfast, teeth, dressed, plan)
          </label>
          <label className={ui.row} style={{ cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={settings.useEveningTemplate}
              onChange={(e) => {
                const useEvening = e.target.checked;
                patch({ useEveningTemplate: useEvening });
                reseedTemplates(settings.useMorningTemplate, useEvening);
              }}
            />
            Evening soft close (screens, tidy one, teeth, unwind)
          </label>
          <p className={ui.hint}>
            Toggling reseeds morning/evening anchors; your “anytime” items are kept.
          </p>
        </div>

        <div className={`${ui.card} ${ui.stack}`}>
          <h2 style={{ margin: 0, fontSize: '1rem' }}>Agents</h2>
          <p className={ui.hint} style={{ margin: 0 }}>
            Always-on helpers. Soft prompts only — never guilt or red alarms.
          </p>
          <p className={ui.hint} style={{ margin: 0 }}>
            Current orchestrator mode:{' '}
            <strong>{ORCHESTRATOR_COPY[agents.orchestratorMode].label}</strong>
          </p>
          <label className={ui.row} style={{ cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={settings.restProtectionEnabled}
              onChange={(e) =>
                patch({ restProtectionEnabled: e.target.checked })
              }
            />
            Rest protection — bury high-load tasks in comedown / offline
          </label>
          <label className={ui.row} style={{ cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={agents.showBuriedTasks}
              onChange={(e) =>
                onAgentsChange({
                  ...agents,
                  showBuriedTasks: e.target.checked,
                })
              }
            />
            Show all buried high-load tasks
          </label>
          <p className={ui.hint}>
            Brain dump: FAB or keyboard <kbd>c</kbd> / <kbd>/</kbd>. Un-stick
            lives in Single Focus. Somatic reset appears if a focus sits idle
            past its buffer.
          </p>
        </div>

        <div className={`${ui.card} ${ui.stack}`}>
          <h2 style={{ margin: 0, fontSize: '1rem' }}>Display</h2>
          <label className={ui.row} style={{ cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={settings.theme === 'light'}
              onChange={(e) => patch({ theme: e.target.checked ? 'light' : 'dark' })}
            />
            Light theme
          </label>
          <label className={ui.row} style={{ cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={settings.lowStimulation}
              onChange={(e) => patch({ lowStimulation: e.target.checked })}
            />
            Low-stimulation (flatter colour, larger text)
          </label>
          <label className={ui.row} style={{ cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={settings.reduceMotion}
              onChange={(e) => patch({ reduceMotion: e.target.checked })}
            />
            Reduce motion
          </label>
          <label className={ui.row} style={{ cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={settings.ambientSound}
              onChange={(e) => patch({ ambientSound: e.target.checked })}
            />
            Soft ambient sound during body-double (off by default)
          </label>
        </div>

        <div className={`${ui.card} ${ui.stack}`}>
          <div className={ui.row} style={{ justifyContent: 'space-between' }}>
            <h2 style={{ margin: 0, fontSize: '1rem' }}>Anchors</h2>
            <button
              type="button"
              className={`${ui.btn} ${ui.btnGhost}`}
              onClick={addBlock}
            >
              Add
            </button>
          </div>
          {blocks.map((b) => (
            <div key={b.id} className={`${ui.cardQuiet} ${ui.stack}`}>
              <div className={ui.field}>
                <label>Name</label>
                <input
                  className={ui.input}
                  value={b.name}
                  onChange={(e) => updateBlock(b.id, { name: e.target.value })}
                />
              </div>
              <div className={ui.row}>
                <div className={ui.field} style={{ flex: 1 }}>
                  <label>Start</label>
                  <input
                    className={ui.input}
                    type="time"
                    value={b.plannedStart}
                    onChange={(e) =>
                      updateBlock(b.id, {
                        plannedStart: e.target.value || '09:00',
                      })
                    }
                  />
                </div>
                <div className={ui.field} style={{ flex: 1 }}>
                  <label>Duration (min)</label>
                  <input
                    className={ui.input}
                    type="number"
                    min={5}
                    max={240}
                    value={b.durationMinutes ?? ''}
                    onChange={(e) =>
                      updateBlock(b.id, {
                        durationMinutes: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      })
                    }
                  />
                </div>
              </div>
              <div className={ui.row}>
                <div className={ui.field} style={{ flex: 1 }}>
                  <label>Cognitive load</label>
                  <select
                    className={ui.select}
                    value={b.cognitiveLoad}
                    onChange={(e) =>
                      updateBlock(b.id, {
                        cognitiveLoad: e.target.value as CognitiveLoad,
                      })
                    }
                  >
                    {LOAD_OPTIONS.map((l) => (
                      <option key={l} value={l}>
                        {LOAD_COPY[l]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={ui.field} style={{ flex: 1 }}>
                  <label>Routine</label>
                  <select
                    className={ui.select}
                    value={b.routine}
                    onChange={(e) =>
                      updateBlock(b.id, {
                        routine: e.target.value as RoutineSlot,
                      })
                    }
                  >
                    {ROUTINE_OPTIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className={ui.field}>
                <label>Preferred med phase</label>
                <select
                  className={ui.select}
                  value={b.preferredMedPhase ?? ''}
                  onChange={(e) =>
                    updateBlock(b.id, {
                      preferredMedPhase: (e.target.value || undefined) as
                        | MedPhase
                        | undefined,
                    })
                  }
                >
                  {PHASE_OPTIONS.map((p) => (
                    <option key={p || 'none'} value={p}>
                      {p ? PHASE_COPY[p].label : 'Any'}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                className={`${ui.btn} ${ui.btnGhost}`}
                onClick={() => removeBlock(b.id)}
                disabled={blocks.length <= 3}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
