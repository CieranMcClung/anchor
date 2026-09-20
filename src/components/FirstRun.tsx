import { useState } from 'react';
import type { Settings } from '../types';
import { defaultRailBlocks } from '../utils/defaults';
import ui from './ui.module.css';

interface Props {
  settings: Settings;
  onComplete: (settings: Settings) => void;
}

export function FirstRun({ settings, onComplete }: Props) {
  const [doseTime, setDoseTime] = useState(settings.doseTime);
  const [hours, setHours] = useState(settings.usefulWindowHours);

  return (
    <div className={ui.screen}>
      <header className={ui.header}>
        <div>
          <h1 className={ui.title}>Welcome to Anchor</h1>
          <p className={ui.subtitle}>
            Built for initiation, visible time, and routines around your med window.
          </p>
        </div>
      </header>

      <div className={`${ui.card} ${ui.stack}`}>
        <p style={{ margin: 0 }}>
          Two quick settings — you can change them anytime. We’ll seed a sensible
          daily rail you can edit.
        </p>

        <div className={ui.field}>
          <label htmlFor="fr-dose">Usual dose time</label>
          <input
            id="fr-dose"
            className={ui.input}
            type="time"
            value={doseTime}
            onChange={(e) => setDoseTime(e.target.value || '08:00')}
          />
        </div>

        <div className={ui.field}>
          <label htmlFor="fr-hours">Useful window (hours)</label>
          <input
            id="fr-hours"
            className={ui.input}
            type="number"
            min={1}
            max={16}
            step={0.5}
            value={hours}
            onChange={(e) => setHours(Math.min(16, Math.max(1, Number(e.target.value) || 9)))}
          />
          <p className={ui.hint}>Default 9 hours — adjust to how your day usually feels.</p>
        </div>

        <p className={ui.disclaimer}>
          Not medical advice. Med phases are personal estimates for organising tasks
          only.
        </p>

        <button
          type="button"
          className={`${ui.btn} ${ui.btnPrimary}`}
          onClick={() =>
            onComplete({
              ...settings,
              doseTime,
              usefulWindowHours: hours,
              firstRunComplete: true,
            })
          }
        >
          Set up Anchor
        </button>
        <p className={ui.hint}>
          Default rail includes {defaultRailBlocks().length} anchors (morning settle →
          wind-down).
        </p>
      </div>
    </div>
  );
}
