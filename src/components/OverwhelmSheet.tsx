import { t } from '../copy/t';
import ui from './ui.module.css';

interface Props {
  open: boolean;
  canSwap: boolean;
  onSwap: () => void;
  onRest: () => void;
  onDismiss: () => void;
}

export function OverwhelmSheet({
  open,
  canSwap,
  onSwap,
  onRest,
  onDismiss,
}: Props) {
  if (!open) return null;
  return (
    <>
      <button
        type="button"
        className={ui.sheetBackdrop}
        aria-label={t('overwhelm.dismiss')}
        onClick={onDismiss}
      />
      <div className={ui.sheet} role="dialog" aria-labelledby="overwhelm-title">
        <div className={ui.sheetHandle} />
        <p id="overwhelm-title" className={ui.label}>
          {t('overwhelm.title')}
        </p>
        <p className={ui.cue} style={{ marginBottom: 0 }}>
          {t('overwhelm.body')}
        </p>
        <div className={ui.block} style={{ marginTop: 16 }}>
          <button
            type="button"
            className={`${ui.btn} ${ui.btnLg} ${ui.btnPrimary}`}
            onClick={onSwap}
            disabled={!canSwap}
          >
            {t('overwhelm.swap')}
          </button>
          <button
            type="button"
            className={`${ui.btn} ${ui.btnLg} ${ui.btnGhost}`}
            onClick={onRest}
          >
            {t('overwhelm.rest')}
          </button>
          <button
            type="button"
            className={`${ui.btn} ${ui.btnMuted}`}
            onClick={onDismiss}
          >
            {t('overwhelm.dismiss')}
          </button>
        </div>
      </div>
    </>
  );
}
