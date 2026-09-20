import { useEffect, useState } from 'react';
import type { Load } from '../types';
import { t } from '../copy/t';
import { deconstructLocal, isOffline, type AtomicTask } from '../utils/aiBrainDump';
import { enhanceBrainDump } from '../utils/llmEnhance';
import { loadChipLabel } from '../utils/routingHints';
import { BrainDumpReview, type ReviewRow } from './BrainDumpReview';
import ui from './ui.module.css';

interface Props {
  open: boolean;
  aiBrainDump: boolean;
  bufferPercent: number;
  onClose: () => void;
  onSave: (text: string, load?: Load, rawMinutes?: number) => void;
  onCommitToday: (tasks: AtomicTask[], raw: string) => void;
}

function toRows(tasks: AtomicTask[]): ReviewRow[] {
  return tasks.map((task) => ({
    ...task,
    selected: !task.noise,
  }));
}

export function ThoughtCapture({
  open,
  aiBrainDump,
  bufferPercent,
  onClose,
  onSave,
  onCommitToday,
}: Props) {
  const [text, setText] = useState('');
  const [load, setLoad] = useState<Load | undefined>(undefined);
  const [rows, setRows] = useState<ReviewRow[] | null>(null);
  const [rawDump, setRawDump] = useState('');
  const [sorting, setSorting] = useState(false);

  const reset = () => {
    setText('');
    setLoad(undefined);
    setRows(null);
    setRawDump('');
    setSorting(false);
  };

  const close = () => {
    reset();
    onClose();
  };

  const saveRaw = (value = text) => {
    const trimmed = value.trim();
    if (!trimmed) {
      reset();
      onClose();
      return;
    }
    onSave(trimmed, load);
    reset();
    onClose();
  };

  const rejectReview = () => {
    saveRaw(rawDump || text);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (!rows) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      const trimmed = (rawDump || text).trim();
      if (trimmed) onSave(trimmed, load);
      reset();
      onClose();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open, rows, rawDump, text, load, onSave, onClose]);

  if (!open) return null;

  const commitReview = () => {
    if (!rows) {
      rejectReview();
      return;
    }
    const keep = rows.filter((row) => row.selected && row.text.trim());
    if (keep.length === 0) {
      rejectReview();
      return;
    }
    onCommitToday(keep, rawDump || text);
    close();
  };

  const deconstruct = async () => {
    const trimmed = text.trim();
    if (!trimmed) {
      close();
      return;
    }
    const local = deconstructLocal(trimmed, bufferPercent);
    if (local.mode === 'raw-park' || local.tasks.length === 0) {
      saveRaw(trimmed);
      return;
    }
    setSorting(true);
    setRawDump(trimmed);
    try {
      const enhanced = await enhanceBrainDump(trimmed, bufferPercent);
      const tasks = enhanced.tasks.length > 0 ? enhanced.tasks : local.tasks;
      if (tasks.length === 0) {
        saveRaw(trimmed);
        return;
      }
      setRows(toRows(tasks));
    } catch {
      setRows(toRows(local.tasks));
    } finally {
      setSorting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className={ui.sheetBackdrop}
        aria-label="Close capture"
        onClick={rows ? rejectReview : close}
      />
      <div
        className={`${ui.sheet} ${ui.sheetTall} ${ui.sheetScroll}`}
        role="dialog"
        aria-labelledby="capture-title"
        aria-busy={sorting}
      >
        <div className={ui.sheetHandle} />
        <p id="capture-title" className={ui.label}>
          {rows ? t('aiBrainDump.reviewTitle') : 'Park it'}
        </p>

        {rows ? (
          <BrainDumpReview
            rows={rows}
            bufferPercent={bufferPercent}
            onChange={setRows}
            onCommit={commitReview}
            onReject={rejectReview}
          />
        ) : (
          <>
            <textarea
              className={ui.textarea}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t('aiBrainDump.placeholder')}
              autoFocus
              disabled={sorting}
            />
            {aiBrainDump && isOffline() && text.trim() ? (
              <p className={ui.meta}>{t('aiBrainDump.offline')}</p>
            ) : null}
            {sorting ? <p className={ui.meta}>{t('aiBrainDump.sorting')}</p> : null}
            <div className={ui.chipRow}>
              {(['low', 'medium', 'high'] as Load[]).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  className={`${ui.chip} ${load === opt ? ui.chipActive : ''}`}
                  onClick={() => setLoad(opt)}
                  disabled={sorting}
                >
                  {loadChipLabel(opt)}
                </button>
              ))}
            </div>
            {aiBrainDump ? (
              <>
                <button
                  type="button"
                  className={`${ui.btn} ${ui.btnLg} ${ui.btnPrimary}`}
                  onClick={() => void deconstruct()}
                  disabled={sorting}
                >
                  {t('aiBrainDump.deconstruct')}
                </button>
                <button
                  type="button"
                  className={`${ui.btn} ${ui.btnMuted}`}
                  onClick={() => saveRaw()}
                  disabled={sorting}
                >
                  {t('aiBrainDump.parkRaw')}
                </button>
              </>
            ) : (
              <button
                type="button"
                className={`${ui.btn} ${ui.btnLg} ${ui.btnPrimary}`}
                onClick={() => saveRaw()}
              >
                Save
              </button>
            )}
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
