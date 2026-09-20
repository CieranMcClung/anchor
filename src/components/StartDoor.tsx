import { useEffect, useState } from 'react';
import { regenerateMicroStart, suggestMicroStart } from '../utils/microStart';
import styles from './StartDoor.module.css';
import ui from './ui.module.css';

interface Props {
  initialTask?: string;
  onStart: (task: string, microStep: string, minutes: number, bodyDouble: boolean) => void;
  onBack: () => void;
}

const PRESETS = [2, 5, 10, 25];

export function StartDoor({ initialTask = '', onStart, onBack }: Props) {
  const [task, setTask] = useState(initialTask);
  const [micro, setMicro] = useState(() =>
    initialTask ? suggestMicroStart(initialTask) : ''
  );
  const [minutes, setMinutes] = useState(2);
  const [custom, setCustom] = useState('');
  const [bodyDouble, setBodyDouble] = useState(false);

  useEffect(() => {
    if (initialTask) {
      setTask(initialTask);
      setMicro(suggestMicroStart(initialTask));
    }
  }, [initialTask]);

  const onTaskBlur = () => {
    if (task.trim() && !micro.trim()) {
      setMicro(suggestMicroStart(task));
    }
  };

  const effectiveMinutes =
    custom !== '' && Number(custom) > 0 ? Math.min(120, Number(custom)) : minutes;

  return (
    <div className={ui.screen}>
      <header className={ui.header}>
        <div>
          <h1 className={ui.title}>Start Door</h1>
          <p className={ui.subtitle}>Shrink “I should” into something you can begin.</p>
        </div>
        <button type="button" className={`${ui.btn} ${ui.btnGhost}`} onClick={onBack}>
          Back
        </button>
      </header>

      <div className={ui.stack}>
        <div className={`${ui.card} ${ui.stack}`}>
          <div className={ui.field}>
            <label htmlFor="stuck-task">What’s stuck?</label>
            <input
              id="stuck-task"
              className={ui.input}
              value={task}
              onChange={(e) => setTask(e.target.value)}
              onBlur={onTaskBlur}
              placeholder="e.g. reply to that email, tidy desk, open spreadsheet"
              autoFocus
            />
          </div>

          <div className={styles.microBox}>
            <p className={styles.microLabel}>2-minute micro-start</p>
            <textarea
              className={ui.textarea}
              value={micro}
              onChange={(e) => setMicro(e.target.value)}
              placeholder="A tiny first step…"
              rows={3}
            />
            <div className={ui.row}>
              <button
                type="button"
                className={`${ui.btn} ${ui.btnGhost}`}
                onClick={() => setMicro(regenerateMicroStart(task || 'this', micro))}
                disabled={!task.trim()}
              >
                Regenerate
              </button>
              <button
                type="button"
                className={`${ui.btn} ${ui.btnGhost}`}
                onClick={() => setMicro(suggestMicroStart(task || 'this'))}
                disabled={!task.trim()}
              >
                Suggest
              </button>
            </div>
          </div>

          <div>
            <p className={styles.microLabel}>Timer</p>
            <div className={ui.chipRow}>
              {PRESETS.map((m) => (
                <button
                  key={m}
                  type="button"
                  className={`${ui.chip} ${
                    minutes === m && custom === '' ? ui.chipActive : ''
                  }`}
                  onClick={() => {
                    setMinutes(m);
                    setCustom('');
                  }}
                >
                  {m} min
                </button>
              ))}
            </div>
            <div className={ui.field} style={{ marginTop: '0.65rem' }}>
              <label htmlFor="custom-mins">Custom minutes</label>
              <input
                id="custom-mins"
                className={ui.input}
                type="number"
                min={1}
                max={120}
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                placeholder="e.g. 15"
              />
            </div>
          </div>

          <label className={ui.row} style={{ cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={bodyDouble}
              onChange={(e) => setBodyDouble(e.target.checked)}
            />
            <span>
              Quiet body-double presence
              <span className={ui.hint} style={{ display: 'block', margin: 0 }}>
                Timer stays visible; optional soft sound is off unless enabled in Settings.
              </span>
            </span>
          </label>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={`${ui.btn} ${ui.btnPrimary}`}
            disabled={!task.trim() || !micro.trim()}
            onClick={() => onStart(task.trim(), micro.trim(), effectiveMinutes, bodyDouble)}
          >
            Just start ({effectiveMinutes} min)
          </button>
        </div>
      </div>
    </div>
  );
}
