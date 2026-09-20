import { useState } from 'react';
import type { Load } from '../types';
import { t } from '../copy/t';
import ui from './ui.module.css';

interface Props {
  open: boolean;
  defaultLoad: Load;
  onClose: () => void;
  onSave: (input: {
    title: string;
    dod: string;
    rawMinutes: number;
    load: Load;
  }) => void;
}

export function AddAnchorSheet({ open, defaultLoad, onClose, onSave }: Props) {
  const [title, setTitle] = useState('');
  const [dod, setDod] = useState('');
  const [raw, setRaw] = useState('15');
  const [load, setLoad] = useState<Load>(defaultLoad);

  if (!open) return null;

  const close = () => {
    setTitle('');
    setDod('');
    setRaw('15');
    setLoad(defaultLoad);
    onClose();
  };

  const save = () => {
    const trimmed = title.trim();
    if (!trimmed) {
      close();
      return;
    }
    const rawMinutes = Math.max(1, Number.parseInt(raw, 10) || 15);
    onSave({
      title: trimmed,
      dod: dod.trim() || 'It’s done when you say it is.',
      rawMinutes,
      load,
    });
    close();
  };

  return (
    <>
      <button
        type="button"
        className={ui.sheetBackdrop}
        aria-label="Close"
        onClick={close}
      />
      <div className={`${ui.sheet} ${ui.sheetTall}`} role="dialog">
        <div className={ui.sheetHandle} />
        <p className={ui.label}>{t('empty.noAnchors.cta')}</p>
        <input
          className={ui.input}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What’s the thing?"
          autoFocus
        />
        <input
          className={ui.input}
          value={dod}
          onChange={(e) => setDod(e.target.value)}
          placeholder="Done looks like…"
        />
        <label className={ui.label}>
          Minutes (we’ll add a little room)
          <input
            className={ui.input}
            type="number"
            min={1}
            inputMode="numeric"
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
          />
        </label>
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
