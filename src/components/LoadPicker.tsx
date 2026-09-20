import { t } from '../copy/t';
import type { Load } from '../types';
import ui from './ui.module.css';

interface Props {
  onChoose: (load: Load) => void;
  onSkip: () => void;
}

const OPTIONS: { load: Load; label: string; hint: string }[] = [
  { load: 'low', label: 'Low', hint: 'One focus block' },
  { load: 'medium', label: 'Medium', hint: 'Up to two' },
  { load: 'high', label: 'High', hint: 'Up to three' },
];

export function LoadPicker({ onChoose, onSkip }: Props) {
  return (
    <section className={ui.stack}>
      <div>
        <h1 className={ui.screenTitle}>{t('habit.reset.title')}</h1>
        <p className={ui.cue}>{t('habit.reset.body')}</p>
      </div>
      <div className={ui.block}>
        {OPTIONS.map((opt) => (
          <button
            key={opt.load}
            type="button"
            className={`${ui.btn} ${ui.btnLg} ${ui.btnGhost}`}
            onClick={() => onChoose(opt.load)}
          >
            {opt.label}
            <span className={ui.srOnly}> — {opt.hint}</span>
          </button>
        ))}
      </div>
      <button type="button" className={`${ui.btn} ${ui.btnMuted}`} onClick={onSkip}>
        {t('habit.skippedDay.cta')}
      </button>
      <p className={ui.meta}>{t('habit.skippedDay.body')}</p>
      <p className={ui.meta}>
        {t('brand.orgName')} · {t('brand.formerlySubtitle')}
      </p>
    </section>
  );
}
