import { useState } from 'react';
import type { Load } from '../types';
import ui from './ui.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (text: string, load?: Load) => void;
}

export function ThoughtCapture({ open, onClose, onSave }: Props) {
  const [text, setText] = useState('');
  const [load, setLoad] = useState<Load | undefined>(undefined);

  if (!open) return null;

  const discard = () => {
    setText('');
    setLoad(undefined);
    onClose();
  };

  const save = () => {
    const trimmed = text.trim();
    if (!trimmed) {
      discard();
      return;
    }
    onSave(trimmed, load);
    discard();
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
        <textarea
          className={ui.textarea}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="A thought, a task, anything"
          autoFocus
        />
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
          onClick={save}
        >
          Save
        </button>
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
