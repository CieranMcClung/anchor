import type { AnchorBlock, MedPhase, Settings as SettingsType } from '../types';
import { PHASE_COPY } from '../types';
import ui from './ui.module.css';

interface Props {
  settings: SettingsType;
  blocks: AnchorBlock[];
  onChange: (next: SettingsType) => void;
  onBlocksChange: (blocks: AnchorBlock[]) => void;
  onBack: () => void;
}

const PHASE_OPTIONS: (MedPhase | '')[] = [
  '',
  'before',
  'rising',
  'peak',
  'waning',
  'offline',
];

export function Settings({
  settings,
  blocks,
  onChange,
  onBlocksChange,
  onBack,
}: Props) {
  const patch = (partial: Partial<SettingsType>) =>
    onChange({ ...settings, ...partial });

  const updateBlock = (id: string, partial: Partial<AnchorBlock>) => {
    onBlocksChange(blocks.map((b) => (b.id === id ? { ...b, ...partial } : b)));
  };

  const addBlock = () => {
    if (blocks.length >= 7) return;
    onBlocksChange([
      ...blocks,
      {
        id: crypto.randomUUID(),
        name: 'New anchor',
        plannedStart: '10:00',
        durationMinutes: 30,
        status: 'upcoming',
      },
    ]);
  };

  const removeBlock = (id: string) => {
    if (blocks.length <= 3) return;
    onBlocksChange(blocks.filter((b) => b.id !== id));
  };

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
          <h2 style={{ margin: 0, fontSize: '1rem' }}>Med window</h2>
          <p className={ui.disclaimer}>
            Not medical advice. These are your personal estimates of when medication
            tends to help versus fade — for organising tasks only.
          </p>
          <div className={ui.field}>
            <label htmlFor="dose-time">Usual dose time</label>
            <input
              id="dose-time"
              className={ui.input}
              type="time"
              value={settings.doseTime}
              onChange={(e) => patch({ doseTime: e.target.value || '08:00' })}
            />
          </div>
          <div className={ui.field}>
            <label htmlFor="window-hours">Useful window (hours)</label>
            <input
              id="window-hours"
              className={ui.input}
              type="number"
              min={1}
              max={16}
              step={0.5}
              value={settings.usefulWindowHours}
              onChange={(e) =>
                patch({
                  usefulWindowHours: Math.min(16, Math.max(1, Number(e.target.value) || 9)),
                })
              }
            />
          </div>
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
            <h2 style={{ margin: 0, fontSize: '1rem' }}>Daily rails (3–7)</h2>
            <button
              type="button"
              className={`${ui.btn} ${ui.btnGhost}`}
              onClick={addBlock}
              disabled={blocks.length >= 7}
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
                      updateBlock(b.id, { plannedStart: e.target.value || '09:00' })
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
