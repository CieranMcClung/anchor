import { t, type StringKey } from '../copy/t';
import ui from './ui.module.css';
import styles from './RestProtection.module.css';

const GROUNDING: StringKey[] = [
  'restMode.grounding.1',
  'restMode.grounding.2',
  'restMode.grounding.3',
];

interface OverlayProps {
  onStay: () => void;
  onLeave: () => void;
}

export function RestProtectionOverlay({ onStay, onLeave }: OverlayProps) {
  return (
    <div className={styles.overlay} role="dialog" aria-labelledby="rest-title">
      <div className={styles.panel}>
        <h1 id="rest-title" className={ui.screenTitle}>
          {t('empty.restMode.title')}
        </h1>
        <p className={styles.prompt}>{t('empty.restMode.body')}</p>
        {GROUNDING.map((key) => (
          <p key={key} className={styles.prompt}>
            {t(key)}
          </p>
        ))}
        <button
          type="button"
          className={`${ui.btn} ${ui.btnLg} ${ui.btnPrimary}`}
          onClick={onStay}
        >
          Stay resting
        </button>
        <button
          type="button"
          className={`${ui.btn} ${ui.btnMuted}`}
          onClick={onLeave}
        >
          Leave softly
        </button>
      </div>
    </div>
  );
}

interface GateProps {
  onEnter: () => void;
  suggest?: boolean;
  onDismissSuggest?: () => void;
}

export function RestGate({ onEnter, suggest, onDismissSuggest }: GateProps) {
  return (
    <section className={ui.stack}>
      <div>
        <h1 className={ui.screenTitle}>{t('restMode.enter.title')}</h1>
        <p className={ui.cue}>{t('restMode.enter.body')}</p>
      </div>
      {suggest ? (
        <div className={ui.card}>
          <p className={ui.cue}>{t('restMode.enter.body')}</p>
          {onDismissSuggest ? (
            <button
              type="button"
              className={`${ui.btn} ${ui.btnGhost}`}
              onClick={onDismissSuggest}
            >
              {t('efficacy.comedownNudge.dismiss')}
            </button>
          ) : null}
        </div>
      ) : null}
      <button
        type="button"
        className={`${ui.btn} ${ui.btnLg} ${ui.btnPrimary}`}
        onClick={onEnter}
      >
        {t('restMode.enter.cta')}
      </button>
    </section>
  );
}
