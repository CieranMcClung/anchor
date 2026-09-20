import { t } from '../copy/t';
import type { DoseLog } from '../types';
import type { PkSnapshot } from '../utils/pk';
import { EfficacyTimeline } from './EfficacyTimeline';
import ui from './ui.module.css';

interface Props {
  dose: DoseLog;
  pk: PkSnapshot;
  restMode: boolean;
  onLog: () => void;
  onSkip: () => void;
  showComedownNudge: boolean;
  onDismissComedown: () => void;
  onOpenSettings: () => void;
}

export function MedsView({
  dose,
  pk,
  restMode,
  onLog,
  onSkip,
  showComedownNudge,
  onDismissComedown,
  onOpenSettings,
}: Props) {
  const logged = Boolean(dose.timeHHMM) && !dose.skipped;

  return (
    <section className={ui.stack}>
      <div>
        <h1 className={ui.screenTitle}>Meds</h1>
        <p className={ui.cue}>
          Methylphenidate XL 18 mg · one dose-time today. Onset, Peak, and
          Comedown are focus-energy zones from your log — a user-anchored map,
          not a plasma prediction.
        </p>
      </div>

      <EfficacyTimeline pk={pk} />

      {logged ? (
        <div className={ui.card}>
          <p className={ui.label}>{t('med.logged.title')}</p>
          <p className={ui.cue}>
            {t('med.logged.body')} {dose.timeHHMM}
          </p>
          {!restMode ? (
            <button
              type="button"
              className={`${ui.btn} ${ui.btnGhost}`}
              onClick={onLog}
            >
              {t('med.adjustedCta')}
            </button>
          ) : null}
        </div>
      ) : (
        <div className={ui.card}>
          <p className={ui.label}>{t('med.notLogged.title')}</p>
          <p className={ui.cue}>{t('med.notLogged.body')}</p>
          {!restMode ? (
            <div className={ui.block}>
              <button
                type="button"
                className={`${ui.btn} ${ui.btnLg} ${ui.btnPrimary}`}
                onClick={onLog}
              >
                {t('med.logCta')}
              </button>
              <button
                type="button"
                className={`${ui.btn} ${ui.btnMuted}`}
                onClick={onSkip}
              >
                {t('med.skipCta')}
              </button>
            </div>
          ) : null}
        </div>
      )}

      {showComedownNudge ? (
        <div className={ui.card}>
          <p className={ui.label}>{t('efficacy.comedownNudge.title')}</p>
          <p className={ui.cue}>{t('efficacy.comedownNudge.body')}</p>
          <button
            type="button"
            className={`${ui.btn} ${ui.btnGhost}`}
            onClick={onDismissComedown}
          >
            {t('efficacy.comedownNudge.dismiss')}
          </button>
        </div>
      ) : null}

      <button
        type="button"
        className={`${ui.btn} ${ui.btnGhost}`}
        onClick={onOpenSettings}
      >
        Timing windows
      </button>

      <p className={ui.disclaimer}>
        {t('brand.appName')}, {t('brand.orgName')}. {t('disclaimer.pkZones')}
      </p>
    </section>
  );
}
