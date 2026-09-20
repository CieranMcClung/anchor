import { useState } from 'react';
import { t } from '../copy/t';
import {
  DEFAULT_PK_WINDOWS,
  PEAK_PLATEAU_START_HOURS,
  type Settings,
} from '../types';
import { peakStartHours } from '../utils/pk';
import ui from './ui.module.css';

interface Props {
  settings: Settings;
  onChange: (partial: Partial<Settings>) => void;
  onBack: () => void;
}

type WindowKey = keyof Settings;

function HoursField({
  label,
  field,
  value,
  min,
  max,
  draft,
  setDraft,
  onCommit,
}: {
  label: string;
  field: WindowKey;
  value: number;
  min: number;
  max: number;
  draft: Partial<Record<WindowKey, string>>;
  setDraft: (next: Partial<Record<WindowKey, string>>) => void;
  onCommit: (field: WindowKey, n: number) => void;
}) {
  const shown = draft[field] ?? String(value);
  return (
    <label className={ui.label}>
      {label}
      <input
        className={ui.input}
        type="number"
        min={min}
        max={max}
        step={0.5}
        value={shown}
        onChange={(e) => setDraft({ ...draft, [field]: e.target.value })}
        onBlur={() => {
          const n = Number.parseFloat(draft[field] ?? shown);
          if (Number.isFinite(n)) onCommit(field, n);
          setDraft({ ...draft, [field]: undefined });
        }}
      />
    </label>
  );
}

export function SettingsView({ settings, onChange, onBack }: Props) {
  const [draft, setDraft] = useState<Partial<Record<WindowKey, string>>>({});
  const peakFrom = peakStartHours(settings);

  const commit = (field: WindowKey, n: number) => {
    onChange({ [field]: n });
  };

  return (
    <section className={ui.stack}>
      <div>
        <h1 className={ui.screenTitle}>Settings</h1>
        <p className={ui.cue}>
          Timing windows are focus-energy scaffolding for Methylphenidate XL 18 mg —
          not a plasma prediction. Visible labels: Onset, Peak, Comedown.
        </p>
      </div>

      <HoursField
        label="Onset ends (hours after dose)"
        field="onsetEndHours"
        value={settings.onsetEndHours}
        min={0.5}
        max={8}
        draft={draft}
        setDraft={setDraft}
        onCommit={commit}
      />
      <p className={ui.meta}>
        Default {DEFAULT_PK_WINDOWS.onsetEndHours}h. Onset is ~0–
        {DEFAULT_PK_WINDOWS.onsetEndHours}h after a dose log. Climbing toward Peak
        may still read as Onset.
      </p>

      <HoursField
        label="Peak ends (hours after dose)"
        field="peakEndHours"
        value={settings.peakEndHours}
        min={3}
        max={16}
        draft={draft}
        setDraft={setDraft}
        onCommit={commit}
      />
      <p className={ui.meta}>
        Default {DEFAULT_PK_WINDOWS.peakEndHours}h. Peak chip applies from ~
        {PEAK_PLATEAU_START_HOURS}h through this value (currently {peakFrom}–
        {settings.peakEndHours}h).
      </p>

      <HoursField
        label="Comedown (soft, hours after dose)"
        field="comedownEndHours"
        value={settings.comedownEndHours}
        min={settings.peakEndHours}
        max={20}
        draft={draft}
        setDraft={setDraft}
        onCommit={commit}
      />
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
