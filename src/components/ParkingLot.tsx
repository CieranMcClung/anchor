import { useState } from 'react';
import type { ParkingItem } from '../types';
import ui from './ui.module.css';

interface Props {
  items: ParkingItem[];
  onAdd: (text: string) => void;
  onRemove: (id: string) => void;
  onToStartDoor: (text: string) => void;
  onBack?: () => void;
  compact?: boolean;
}

export function ParkingLot({
  items,
  onAdd,
  onRemove,
  onToStartDoor,
  onBack,
  compact,
}: Props) {
  const [text, setText] = useState('');

  const submit = () => {
    const t = text.trim();
    if (!t) return;
    onAdd(t);
    setText('');
  };

  return (
    <div className={compact ? undefined : ui.screen}>
      {!compact && (
        <header className={ui.header}>
          <div>
            <h1 className={ui.title}>Parking lot</h1>
            <p className={ui.subtitle}>
              Capture intrusive tasks without leaving what you’re doing.
            </p>
          </div>
          {onBack && (
            <button type="button" className={`${ui.btn} ${ui.btnGhost}`} onClick={onBack}>
              Back
            </button>
          )}
        </header>
      )}

      <div className={`${ui.card} ${ui.stack}`}>
        {compact && (
          <h2 className={ui.title} style={{ fontSize: '1.05rem', margin: 0 }}>
            Quick park
          </h2>
        )}
        <div className={ui.field}>
          <label htmlFor="park-input">Park a thought</label>
          <input
            id="park-input"
            className={ui.input}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit();
            }}
            placeholder="It can wait…"
          />
        </div>
        <button
          type="button"
          className={`${ui.btn} ${ui.btnPrimary}`}
          onClick={submit}
          disabled={!text.trim()}
        >
          Park it
        </button>

        {items.length === 0 ? (
          <p className={ui.hint}>Empty — that’s fine.</p>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }} className={ui.stack}>
            {items.map((item) => (
              <li
                key={item.id}
                className={ui.cardQuiet}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.55rem',
                }}
              >
                <span>{item.text}</span>
                <div className={ui.row}>
                  <button
                    type="button"
                    className={`${ui.btn} ${ui.btnSecondary}`}
                    onClick={() => onToStartDoor(item.text)}
                  >
                    Turn into Start Door
                  </button>
                  <button
                    type="button"
                    className={`${ui.btn} ${ui.btnGhost}`}
                    onClick={() => onRemove(item.id)}
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
