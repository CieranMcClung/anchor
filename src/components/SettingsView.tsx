import { useState } from 'react';
import { t } from '../copy/t';
import { DEFAULT_PK_WINDOWS, type Settings } from '../types';
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

  const commit = (field: WindowKey, n: number) => {
    onChange({ [field]: n });
  };

  return (
    <section className={ui.stack}>
      <div>
        <h1 className={ui.screenTitle}>Settings</h1>
        <p className={ui.cue}>
          Placeholder windows for organising the day, from your dose log.{' '}
          {t('efficacy.zone.onset')}, {t('efficacy.zone.peak')}, and{' '}
          {t('efficacy.zone.comedown')} only — not a plasma curve, not a
          diagnosis, and not an optimisation of medication.
        </p>
      </div>

      <HoursField
        label={`${t('efficacy.zone.onset')} ends (hours after dose)`}
        field="onsetEndHours"
        value={settings.onsetEndHours}
        min={0.5}
        max={8}
        draft={draft}
        setDraft={setDraft}
        onCommit={commit}
      />
      <p className={ui.meta}>
        Default {DEFAULT_PK_WINDOWS.onsetEndHours}h. {t('efficacy.zone.onset')}{' '}
        placeholder ~0–{DEFAULT_PK_WINDOWS.onsetEndHours}h after your dose log.
      </p>

      <HoursField
        label={`${t('efficacy.zone.peak')} ends (hours after dose)`}
        field="peakEndHours"
        value={settings.peakEndHours}
        min={2}
        max={16}
        draft={draft}
        setDraft={setDraft}
        onCommit={commit}
      />
      <p className={ui.meta}>
        Default {DEFAULT_PK_WINDOWS.peakEndHours}h. {t('efficacy.zone.peak')}{' '}
        placeholder ~{DEFAULT_PK_WINDOWS.onsetEndHours}–
        {DEFAULT_PK_WINDOWS.peakEndHours}h. A product map from your log, not a lab
        value.
      </p>

      <HoursField
        label={`${t('efficacy.zone.comedown')} ends (soft, hours after dose)`}
        field="comedownEndHours"
        value={settings.comedownEndHours}
        min={settings.peakEndHours}
        max={20}
        draft={draft}
        setDraft={setDraft}
        onCommit={commit}
      />
      <p className={ui.meta}>
        Default {DEFAULT_PK_WINDOWS.comedownEndHours}h. {t('efficacy.zone.comedown')}{' '}
        placeholder from ~{DEFAULT_PK_WINDOWS.peakEndHours}h. After that the chip
        stays {t('efficacy.zone.comedown')} — Rest Mode is separate, if you want
        it. A quiet dose-log cue may appear; not an alarm.
      </p>

      <p className={ui.disclaimer}>{t('disclaimer.pkZones')}</p>

      <button type="button" className={`${ui.btn} ${ui.btnLg} ${ui.btnGhost}`} onClick={onBack}>
        Back to Meds
      </button>
    </section>
  );
}
