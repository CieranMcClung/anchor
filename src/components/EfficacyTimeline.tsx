import { t } from '../copy/t';
import type { PkSnapshot } from '../utils/pk';
import { timelineSegments, zoneLabel } from '../utils/pk';
import styles from './EfficacyTimeline.module.css';
import ui from './ui.module.css';

interface Props {
  pk: PkSnapshot;
}

const SEG_CLASS = {
  onset: styles.segOnset,
  climb: styles.segClimb,
  peak: styles.segPeak,
  comedown: styles.segComedown,
};

export function EfficacyTimeline({ pk }: Props) {
  const segs = timelineSegments(pk.windows);
  const span = Math.max(
    pk.windows.comedownEndHours,
    pk.windows.peakEndHours,
    0.5
  );

  return (
    <div className={styles.zoneCard}>
      <p className={ui.label}>{zoneLabel(pk.zone)}</p>
      <div
        className={`${styles.bar} ${pk.isUnknown ? styles.unknown : ''}`}
        role="img"
        aria-label={
          pk.isUnknown
            ? t('med.notLogged.title')
            : `${zoneLabel(pk.zone)}. Focus-energy map from your dose log, not a plasma prediction.`
        }
      >
        {segs.map((seg) => {
          const width = ((seg.to - seg.from) / span) * 100;
          return (
            <div
              key={seg.token}
              className={SEG_CLASS[seg.token]}
              style={{ width: `${Math.max(0, width)}%` }}
            />
          );
        })}
        {!pk.isUnknown ? (
          <div
            className={styles.playhead}
            style={{ left: `${pk.playhead * 100}%` }}
          />
        ) : null}
      </div>
      <div className={styles.ticks}>
        <span className={ui.meta}>{t('efficacy.zone.onset')}</span>
        <span className={ui.meta}>{t('efficacy.zone.peak')}</span>
        <span className={ui.meta}>{t('efficacy.zone.comedown')}</span>
      </div>
      {pk.isUnknown ? (
        <p className={ui.meta}>{t('med.notLogged.title')}</p>
      ) : null}
    </div>
  );
}
