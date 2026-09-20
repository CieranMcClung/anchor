import type { MedPhase, Settings } from '../types';
import { PHASE_COPY } from '../types';
import { getMedPhase, phaseProgress } from '../utils/medPhase';
import styles from './MedWindow.module.css';
import ui from './ui.module.css';

const PHASES: MedPhase[] = ['before', 'rising', 'peak', 'waning', 'offline'];

const FILL: Record<MedPhase, string> = {
  before: styles.fillBefore,
  rising: styles.fillRising,
  peak: styles.fillPeak,
  waning: styles.fillWaning,
  offline: styles.fillOffline,
};

const COLOUR: Record<MedPhase, string> = {
  before: styles.before,
  rising: styles.rising,
  peak: styles.peak,
  waning: styles.waning,
  offline: styles.offline,
};

interface Props {
  settings: Settings;
  now: Date;
}

export function MedWindow({ settings, now }: Props) {
  const phase = getMedPhase(settings.doseTime, settings.usefulWindowHours, now);
  const progress = phaseProgress(settings.doseTime, settings.usefulWindowHours, now);
  const copy = PHASE_COPY[phase];

  return (
    <div className={`${ui.card} ${styles.wrap}`}>
      <div className={styles.phaseRow}>
        <div>
          <p className={`${styles.phaseLabel} ${COLOUR[phase]}`}>{copy.label}</p>
          <p className={styles.hint}>{copy.hint}</p>
        </div>
        <span className={ui.pill}>Med window</span>
      </div>
      <div className={styles.track} aria-hidden>
        <div
          className={`${styles.fill} ${FILL[phase]}`}
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>
      <div className={styles.phases} aria-hidden>
        {PHASES.map((p) => (
          <span key={p} className={p === phase ? styles.phaseActive : undefined}>
            {PHASE_COPY[p].label.split(' ')[0]}
          </span>
        ))}
      </div>
    </div>
  );
}
