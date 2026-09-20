import { t } from '../copy/t';
import { DEFAULT_PK_WINDOWS, PEAK_PLATEAU_START_HOURS, type Settings } from '../types';
import { peakStartHours } from '../utils/pk';
import ui from './ui.module.css';

interface Props {
  settings: Settings;
  onChange: (partial: Partial<Settings>) => void;
  onBack: () => void;
}

export function SettingsView({ settings, onChange, onBack }: Props) {
  const peakFrom = peakStartHours(settings);

  return (
    <section className={ui.stack}>
      <div>
        <h1 className={ui.screenTitle}>Settings</h1>
        <p className={ui.cue}>
          Timing windows are focus-energy scaffolding for Methylphenidate XL 18 mg —
          not a plasma prediction. Visible labels: Onset, Peak, Comedown.
        </p>
      </div>

      <label className={ui.label}>
        Onset ends (hours after dose)
        <input
          className={ui.input}
          type="number"
          min={0.5}
          max={8}
          step={0.5}
          value={settings.onsetEndHours}
          onChange={(e) => {
            const n = Number.parseFloat(e.target.value);
            if (Number.isFinite(n)) onChange({ onsetEndHours: n });
          }}
        />
      </label>
      <p className={ui.meta}>
        Default {DEFAULT_PK_WINDOWS.onsetEndHours}h. Onset is ~0–
        {DEFAULT_PK_WINDOWS.onsetEndHours}h after a dose log. Climbing toward Peak
        may still read as Onset.
      </p>

      <label className={ui.label}>
        Peak ends (hours after dose)
        <input
          className={ui.input}
          type="number"
          min={3}
          max={16}
          step={0.5}
          value={settings.peakEndHours}
          onChange={(e) => {
            const n = Number.parseFloat(e.target.value);
            if (Number.isFinite(n)) onChange({ peakEndHours: n });
          }}
        />
      </label>
      <p className={ui.meta}>
        Default {DEFAULT_PK_WINDOWS.peakEndHours}h. Peak chip applies from ~
        {PEAK_PLATEAU_START_HOURS}h through this value (currently {peakFrom}–
        {settings.peakEndHours}h).
      </p>

      <label className={ui.label}>
        Comedown (soft, hours after dose)
        <input
          className={ui.input}
          type="number"
          min={settings.peakEndHours}
          max={20}
          step={0.5}
          value={settings.comedownEndHours}
          onChange={(e) => {
            const n = Number.parseFloat(e.target.value);
            if (Number.isFinite(n)) onChange({ comedownEndHours: n });
          }}
        />
      </label>
      <p className={ui.meta}>
        Soft cue after Peak (default {DEFAULT_PK_WINDOWS.comedownEndHours}h). Not a
        hard cutoff and not an alarm.
      </p>

      <p className={ui.disclaimer}>{t('disclaimer.pkZones')}</p>

      <button type="button" className={`${ui.btn} ${ui.btnLg} ${ui.btnGhost}`} onClick={onBack}>
        Back to Meds
      </button>
    </section>
  );
}
