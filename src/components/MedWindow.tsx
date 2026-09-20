import type { DoseLog, MedPhase, Settings } from '../types';
import { PHASE_COPY } from '../types';
import { getDoseContext, phaseProgress } from '../utils/medPhase';
import { formatWallClock } from '../utils/time';
import styles from './MedWindow.module.css';
import ui from './ui.module.css';

const PHASES: MedPhase[] = ['before', 'onset', 'peak', 'comedown', 'offline'];

const FILL: Record<MedPhase, string> = {
  before: styles.fillBefore,
  onset: styles.fillRising,
  peak: styles.fillPeak,
  comedown: styles.fillWaning,
  offline: styles.fillOffline,
};

const COLOUR: Record<MedPhase, string> = {
  before: styles.before,
  onset: styles.rising,
  peak: styles.peak,
  comedown: styles.waning,
  offline: styles.offline,
};

interface Props {
  settings: Settings;
  doseLog: DoseLog;
  now: Date;
  onTookDose: () => void;
  onEditDoseTime?: () => void;
}

export function MedWindow({
  settings,
  doseLog,
  now,
  onTookDose,
  onEditDoseTime,
}: Props) {
  const ctx = getDoseContext(settings, doseLog, now);
  const progress = phaseProgress(settings, doseLog, now);
  const copy = PHASE_COPY[ctx.phase];
  const hoursLabel =
    ctx.elapsedHours < 0
      ? `dose ~${ctx.doseHHMM}`
      : `${ctx.elapsedHours.toFixed(1)}h since dose`;

  return (
    <div className={`${ui.card} ${styles.wrap}`}>
      <div className={styles.phaseRow}>
        <div>
          <p className={`${styles.phaseLabel} ${COLOUR[ctx.phase]}`}>
            {copy.label}
          </p>
          <p className={styles.hint}>{copy.hint}</p>
        </div>
        <span className={ui.pill}>{settings.doseLabel}</span>
      </div>

      <div className={styles.track} aria-hidden>
        <div
          className={`${styles.fill} ${FILL[ctx.phase]}`}
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>
      <div className={styles.phases} aria-hidden>
        {PHASES.map((p) => (
          <span
            key={p}
            className={p === ctx.phase ? styles.phaseActive : undefined}
          >
            {PHASE_COPY[p].label.split(' ')[0]}
          </span>
        ))}
      </div>

      <p className={ui.hint} style={{ margin: 0 }}>
        {ctx.isEstimate ? (
          <>
            Using usual dose time ({ctx.doseHHMM}) as an estimate — not logged yet
            today.
          </>
        ) : (
          <>
            Dose logged at {ctx.doseHHMM} · {hoursLabel}
            {onEditDoseTime ? (
              <>
                {' · '}
                <button
                  type="button"
                  className={`${ui.btn} ${ui.btnGhost}`}
                  style={{ minHeight: 32, padding: '0.2rem 0.4rem', display: 'inline' }}
                  onClick={onEditDoseTime}
                >
                  Edit in Settings
                </button>
              </>
            ) : null}
          </>
        )}
      </p>

      {ctx.isEstimate ? (
        <button
          type="button"
          className={`${ui.btn} ${ui.btnPrimary}`}
          onClick={onTookDose}
        >
          Took my dose · {formatWallClock(now)}
        </button>
      ) : (
        <button
          type="button"
          className={`${ui.btn} ${ui.btnSecondary}`}
          onClick={onTookDose}
          title="Update today’s dose time to now"
        >
          Update dose to now
        </button>
      )}

      <p className={ui.disclaimer}>
        Planning windows only — not medical advice. Soft guidance, never a scorecard.
      </p>
    </div>
  );
}
