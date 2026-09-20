import { useMemo, useState } from 'react';
import type { Load } from '../types';
import { t } from '../copy/t';
import {
  isOffline,
  stubAiBrainDump,
  type AtomicTask,
} from '../utils/aiBrainDump';
import ui from './ui.module.css';

interface Props {
  open: boolean;
  aiBrainDump: boolean;
  bufferPercent: number;
  onClose: () => void;
  onSave: (text: string, load?: Load, rawMinutes?: number) => void;
}

export function ThoughtCapture({
  open,
  aiBrainDump,
  bufferPercent,
  onClose,
  onSave,
}: Props) {
  const [text, setText] = useState('');
  const [load, setLoad] = useState<Load | undefined>(undefined);
  const [review, setReview] = useState<AtomicTask[] | null>(null);

  const parsed = useMemo(
    () =>
      aiBrainDump && text.trim()
        ? stubAiBrainDump(text, bufferPercent, !isOffline())
        : null,
    [aiBrainDump, bufferPercent, text]
  );

  if (!open) return null;

  const discard = () => {
    setText('');
    setLoad(undefined);
    setReview(null);
    onClose();
  };

  const saveRaw = () => {
    const trimmed = text.trim();
    if (!trimmed) {
      discard();
      return;
    }
    onSave(trimmed, load);
    discard();
  };

  const commitReview = (tasks: AtomicTask[]) => {
    const keep = tasks.filter((task) => !task.noise);
    if (keep.length === 0) {
      saveRaw();
      return;
    }
    for (const task of keep) {
      onSave(task.text, task.load, task.estimateMinutes);
    }
    discard();
  };

  const tryAi = () => {
    if (!parsed) {
      saveRaw();
      return;
    }
    if (parsed.mode === 'raw-park') {
      saveRaw();
      return;
    }
    setReview(parsed.tasks);
  };

  return (
    <>
      <button
        type="button"
        className={ui.sheetBackdrop}
        aria-label="Close capture"
        onClick={discard}
      />
      <div
        className={`${ui.sheet} ${ui.sheetTall}`}
        role="dialog"
        aria-labelledby="capture-title"
      >
        <div className={ui.sheetHandle} />
        <p id="capture-title" className={ui.label}>
          Park it
        </p>

        {review ? (
          <>
            <p className={ui.cue}>{t('aiBrainDump.review')}</p>
            <div className={ui.block}>
              {review.map((task, i) => (
                <div key={`${task.text}-${i}`} className={ui.card}>
                  <strong>{task.text}</strong>
                  <p className={ui.meta}>
                    {task.load} · {task.estimateMinutes} min → {task.bufferedMinutes}{' '}
                    min
                    {task.noise ? ` · ${t('aiBrainDump.noise')}` : ''}
                    {task.dependsOn != null ? ` · after ${task.dependsOn + 1}` : ''}
                  </p>
                </div>
              ))}
            </div>
            <button
              type="button"
              className={`${ui.btn} ${ui.btnLg} ${ui.btnPrimary}`}
              onClick={() => commitReview(review)}
            >
              Save
            </button>
            <button
              type="button"
              className={`${ui.btn} ${ui.btnMuted}`}
              onClick={saveRaw}
            >
              Park as written
            </button>
          </>
        ) : (
          <>
            <textarea
              className={ui.textarea}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="A thought, a task, anything"
              autoFocus
            />
            {aiBrainDump && parsed?.mode === 'raw-park' && text.trim() ? (
              <p className={ui.meta}>{t('aiBrainDump.offline')}</p>
            ) : null}
            <div className={ui.chipRow}>
              {(['low', 'medium', 'high'] as Load[]).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  className={`${ui.chip} ${load === opt ? ui.chipActive : ''}`}
                  onClick={() => setLoad(opt)}
                >
                  {opt === 'medium' ? 'Med' : opt[0]!.toUpperCase() + opt.slice(1)}
                </button>
              ))}
            </div>
            <button
              type="button"
              className={`${ui.btn} ${ui.btnLg} ${ui.btnPrimary}`}
              onClick={aiBrainDump ? tryAi : saveRaw}
            >
              Save
            </button>
          </>
        )}
      </div>
    </>
  );
}

export function ThoughtCaptureFab({
  hidden,
  onClick,
}: {
  hidden?: boolean;
  onClick: () => void;
}) {
  if (hidden) return null;
  return (
    <button
      type="button"
      className={ui.fab}
      aria-label="Capture a thought"
      onClick={onClick}
    >
      <svg viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 5v14M5 12h14"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}
