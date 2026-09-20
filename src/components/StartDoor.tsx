import { useEffect, useState } from 'react';
import { bufferedMinutes } from '../types';
import { regenerateMicroStart, suggestMicroStart } from '../utils/microStart';
import { endTimeFromNow } from '../utils/time';
import styles from './StartDoor.module.css';
import ui from './ui.module.css';

interface Props {
  initialTask?: string;
  initialEstimate?: number;
  onStart: (
    task: string,
    microStep: string,
    definitionOfDone: string,
    estimateMinutes: number,
    bodyDouble: boolean
  ) => void;
  onBack: () => void;
}

const PRESETS = [5, 10, 15, 25, 45];

export function StartDoor({
  initialTask = '',
  initialEstimate = 10,
  onStart,
  onBack,
}: Props) {
  const [task, setTask] = useState(initialTask);
  const [dod, setDod] = useState('');
  const [micro, setMicro] = useState(() =>
    initialTask ? suggestMicroStart(initialTask) : ''
  );
  const [minutes, setMinutes] = useState(initialEstimate);
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
      setMicro(suggestMicroStart(task, undefined, dod));
    }
  };

  const estimate =
    custom !== '' && Number(custom) > 0
      ? Math.min(120, Number(custom))
      : minutes;
  const buffered = bufferedMinutes(estimate);

  return (
    <div className={ui.screen}>
      <header className={ui.header}>
        <div>
          <h1 className={ui.title}>Single focus</h1>
          <p className={ui.subtitle}>
            One task, a clear “done”, and a buffered timer.
          </p>
        </div>
        <button type="button" className={`${ui.btn} ${ui.btnGhost}`} onClick={onBack}>
          Back
        </button>
      </header>

      <div className={ui.stack}>
        <div className={`${ui.card} ${ui.stack}`}>
          <div className={ui.field}>
            <label htmlFor="stuck-task">What are you focusing on?</label>
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

          <div className={ui.field}>
            <label htmlFor="dod">Definition of done</label>
            <input
              id="dod"
              className={ui.input}
              value={dod}
              onChange={(e) => setDod(e.target.value)}
              placeholder="e.g. draft sent, surface clear, first page read"
            />
            <p className={ui.hint}>Short is fine — just enough to know when to stop.</p>
          </div>

          <div className={styles.microBox}>
            <p className={styles.microLabel}>First visible step</p>
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
                onClick={() =>
                  setMicro(regenerateMicroStart(task || 'this', micro, dod))
                }
                disabled={!task.trim()}
              >
                Regenerate
              </button>
              <button
                type="button"
                className={`${ui.btn} ${ui.btnGhost}`}
                onClick={() => setMicro(suggestMicroStart(task || 'this', undefined, dod))}
                disabled={!task.trim()}
              >
                Suggest
              </button>
            </div>
          </div>

          <div>
            <p className={styles.microLabel}>Estimated minutes</p>
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
              <label htmlFor="custom-mins">Custom estimate</label>
              <input
                id="custom-mins"
                className={ui.input}
                type="number"
                min={1}
                max={120}
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                placeholder="e.g. 20"
              />
            </div>
            <p className={ui.hint}>
              Timer will run {buffered} min (estimate {estimate} + 40% buffer) ·
              ends ~{endTimeFromNow(buffered)}
            </p>
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
                Timer stays visible; optional soft sound is off unless enabled in
                Settings.
              </span>
            </span>
          </label>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={`${ui.btn} ${ui.btnPrimary}`}
            disabled={!task.trim() || !micro.trim() || !dod.trim()}
            onClick={() =>
              onStart(task.trim(), micro.trim(), dod.trim(), estimate, bodyDouble)
            }
          >
            Just start ({buffered} min buffered)
          </button>
          {!dod.trim() && (
            <p className={ui.hint} style={{ textAlign: 'center' }}>
              Add a short definition of done to begin.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
