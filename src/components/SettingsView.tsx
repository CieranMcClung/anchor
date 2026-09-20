import { useState } from 'react';
import { t } from '../copy/t';
import {
  BUFFER_PERCENT_MAX,
  BUFFER_PERCENT_MIN,
  DEFAULT_BUFFER_PERCENT,
  DEFAULT_HYPERFOCUS_MINUTES,
  DEFAULT_PK_WINDOWS,
  HYPERFOCUS_MAX_MINUTES,
  HYPERFOCUS_MIN_MINUTES,
  type PkWindows,
  type Settings,
} from '../types';
import { bufferedMinutes } from '../utils/duration';
import ui from './ui.module.css';

interface Props {
  settings: Settings;
  onChange: (partial: Partial<Settings>) => void;
  onBack: () => void;
}

type WindowKey = keyof PkWindows;

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
          Focus-energy windows from your dose log.{' '}
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
        Default {DEFAULT_PK_WINDOWS.onsetEndHours}h. {t('efficacy.zone.onset')} is
        a focus-energy rising window ~0–{DEFAULT_PK_WINDOWS.onsetEndHours}h
        (effects often from ~1h). Climbing ~2–6h still reads as{' '}
        {t('efficacy.zone.onset')} — not Peak.
      </p>

      <HoursField
        label={`${t('efficacy.zone.peak')} ends (hours after dose)`}
        field="peakEndHours"
        value={settings.peakEndHours}
        min={4}
        max={16}
        draft={draft}
        setDraft={setDraft}
        onCommit={commit}
      />
      <p className={ui.meta}>
        Default {DEFAULT_PK_WINDOWS.peakEndHours}h. {t('efficacy.zone.peak')} is
        the focus-energy plateau ~6–{DEFAULT_PK_WINDOWS.peakEndHours}h — a
        user-anchored map from your log, not 2–6h Peak.
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
        from ~{DEFAULT_PK_WINDOWS.peakEndHours}h. Soft and highly individual. Rest
        Mode is a separate surface, not a fourth zone. A quiet dose-log cue may
        appear; not an alarm.
      </p>

      <p className={ui.disclaimer}>
        {t('brand.appName')} ({t('brand.formerlySubtitle')}), {t('brand.orgName')}.{' '}
        {t('disclaimer.pkZones')}
      </p>

      <h2 className={ui.screenTitle} style={{ fontSize: '1.1rem' }}>
        {t('buffer.label')}
      </h2>
      <label className={ui.label}>
        {settings.bufferPercent}%
        <input
          className={ui.input}
          type="range"
          min={BUFFER_PERCENT_MIN}
          max={BUFFER_PERCENT_MAX}
          step={5}
          value={settings.bufferPercent}
          onChange={(e) => onChange({ bufferPercent: Number(e.target.value) })}
        />
      </label>
      <p className={ui.meta}>
        {t('buffer.hint')} 25 min estimate →{' '}
        {bufferedMinutes(25, settings.bufferPercent)} min displayed. Default{' '}
        {DEFAULT_BUFFER_PERCENT}%.
      </p>

      <h2 className={ui.screenTitle} style={{ fontSize: '1.1rem' }}>
        {t('hyperfocus.setting')}
      </h2>
      <label className={ui.label}>
        {settings.hyperfocusMinutes} min
        <input
          className={ui.input}
          type="range"
          min={HYPERFOCUS_MIN_MINUTES}
          max={HYPERFOCUS_MAX_MINUTES}
          step={5}
          value={settings.hyperfocusMinutes}
          onChange={(e) =>
            onChange({ hyperfocusMinutes: Number(e.target.value) })
          }
        />
      </label>
      <p className={ui.meta}>
        {t('hyperfocus.setting.hint')} Default {DEFAULT_HYPERFOCUS_MINUTES} min.
      </p>

      <h2 className={ui.screenTitle} style={{ fontSize: '1.1rem' }}>
        {t('hotkeys.title')}
      </h2>
      <p className={ui.cue}>{t('hotkeys.body')}</p>

      <label className={ui.label} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          type="checkbox"
          checked={settings.aiBrainDump}
          onChange={(e) => onChange({ aiBrainDump: e.target.checked })}
        />
        {t('aiBrainDump.label')}
      </label>
      <p className={ui.meta}>{t('aiBrainDump.hint')}</p>

      <button type="button" className={`${ui.btn} ${ui.btnLg} ${ui.btnGhost}`} onClick={onBack}>
        Back to Meds
      </button>
    </section>
  );
}
