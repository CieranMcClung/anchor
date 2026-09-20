import { useState } from 'react';
import type { Settings } from '../types';
import ui from './ui.module.css';

interface Props {
  settings: Settings;
  onComplete: (settings: Settings) => void;
}

export function FirstRun({ settings, onComplete }: Props) {
  const [doseTime, setDoseTime] = useState(settings.doseTime);
  const [doseLabel, setDoseLabel] = useState(settings.doseLabel);
  const [useMorning, setUseMorning] = useState(true);
  const [useEvening, setUseEvening] = useState(true);

  return (
    <div className={ui.screen}>
      <header className={ui.header}>
        <div>
          <h1 className={ui.title}>Welcome to Anchor</h1>
          <p className={ui.subtitle}>
            Built for initiation, visible time, and routines around your med
            window — without guilt.
          </p>
        </div>
      </header>

      <div className={`${ui.card} ${ui.stack}`}>
        <p style={{ margin: 0 }}>
          A few calm defaults. You can change everything later. Morning and
          evening basics are pre-loaded so the day has soft rails.
        </p>

        <div className={ui.field}>
          <label htmlFor="fr-label">Dose label</label>
          <input
            id="fr-label"
            className={ui.input}
            value={doseLabel}
            onChange={(e) => setDoseLabel(e.target.value || '18 mg XL')}
            placeholder="18 mg XL"
          />
        </div>

        <div className={ui.field}>
          <label htmlFor="fr-dose">Usual dose time</label>
          <input
            id="fr-dose"
            className={ui.input}
            type="time"
            value={doseTime}
            onChange={(e) => setDoseTime(e.target.value || '08:00')}
          />
          <p className={ui.hint}>
            Defaults assume Methylphenidate XL planning windows (onset → peak →
            comedown → rest). Override anytime.
          </p>
        </div>

        <label className={ui.row} style={{ cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={useMorning}
            onChange={(e) => setUseMorning(e.target.checked)}
          />
          Include morning basics template
        </label>
        <label className={ui.row} style={{ cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={useEvening}
            onChange={(e) => setUseEvening(e.target.checked)}
          />
          Include evening soft-close template
        </label>

        <p className={ui.disclaimer}>
          Not medical advice. Med phases are personal planning estimates only.
        </p>

        <button
          type="button"
          className={`${ui.btn} ${ui.btnPrimary}`}
          onClick={() =>
            onComplete({
              ...settings,
              doseTime,
              doseLabel,
              useMorningTemplate: useMorning,
              useEveningTemplate: useEvening,
              firstRunComplete: true,
            })
          }
        >
          Set up Anchor
        </button>
      </div>
    </div>
  );
}
