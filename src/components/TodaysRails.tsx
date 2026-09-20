import type { AnchorBlock, MedPhase, Settings } from '../types';
import { PHASE_COPY } from '../types';
import { getMedPhase } from '../utils/medPhase';
import { hhmmToMinutes, minutesSinceMidnight } from '../utils/time';
import styles from './TodaysRails.module.css';
import ui from './ui.module.css';

interface Props {
  blocks: AnchorBlock[];
  settings: Settings;
  now: Date;
  onStatus: (id: string, status: AnchorBlock['status']) => void;
  onStartBlock: (block: AnchorBlock) => void;
}

function inferStatuses(blocks: AnchorBlock[], now: Date): AnchorBlock[] {
  const nowMins = minutesSinceMidnight(now);
  return blocks.map((b) => {
    if (b.status === 'done' || b.status === 'skipped') return b;
    const start = hhmmToMinutes(b.plannedStart);
    const end = start + (b.durationMinutes ?? 30);
    if (nowMins >= start && nowMins < end) return { ...b, status: 'now' as const };
    return { ...b, status: 'upcoming' as const };
  });
}

export function suggestNext(
  blocks: AnchorBlock[],
  settings: Settings,
  now: Date
): AnchorBlock | null {
  const phase = getMedPhase(settings.doseTime, settings.usefulWindowHours, now);
  const live = inferStatuses(blocks, now);
  const nowBlock = live.find((b) => b.status === 'now');
  if (nowBlock) return nowBlock;

  const upcoming = live
    .filter((b) => b.status === 'upcoming')
    .sort((a, b) => hhmmToMinutes(a.plannedStart) - hhmmToMinutes(b.plannedStart));

  const phaseMatch = upcoming.find((b) => b.preferredMedPhase === phase);
  return phaseMatch ?? upcoming[0] ?? null;
}

export function TodaysRails({ blocks, settings, now, onStatus, onStartBlock }: Props) {
  const live = inferStatuses(blocks, now);
  const sorted = [...live].sort(
    (a, b) => hhmmToMinutes(a.plannedStart) - hhmmToMinutes(b.plannedStart)
  );
  const next = suggestNext(blocks, settings, now);
  const phase = getMedPhase(settings.doseTime, settings.usefulWindowHours, now);

  return (
    <div className={`${ui.card} ${ui.stack}`}>
      <div className={ui.row} style={{ justifyContent: 'space-between' }}>
        <h2 className={ui.title} style={{ fontSize: '1.05rem' }}>
          Today’s rails
        </h2>
        <span className={ui.pill}>{PHASE_COPY[phase].label}</span>
      </div>

      {next && next.status !== 'done' && (
        <div className={`${ui.cardQuiet} ${styles.suggest}`}>
          <p className={ui.hint} style={{ margin: 0 }}>
            Suggested next
          </p>
          <p style={{ margin: '0.2rem 0 0.55rem', fontWeight: 650 }}>
            {next.name} · {next.plannedStart}
          </p>
          <button
            type="button"
            className={`${ui.btn} ${ui.btnPrimary}`}
            style={{ minHeight: 44 }}
            onClick={() => onStartBlock(next)}
          >
            Open Start Door
          </button>
        </div>
      )}

      <ul className={styles.list}>
        {sorted.map((b) => {
          const cls = [
            styles.item,
            b.status === 'now' ? styles.itemNow : '',
            b.status === 'done' ? styles.itemDone : '',
            b.status === 'skipped' ? styles.itemSkipped : '',
          ]
            .filter(Boolean)
            .join(' ');
          return (
            <li key={b.id} className={cls}>
              <span className={styles.time}>{b.plannedStart}</span>
              <div>
                <p className={styles.name}>{b.name}</p>
                <p className={styles.meta}>
                  {b.durationMinutes ? `${b.durationMinutes} min` : 'open'}
                  {b.preferredMedPhase
                    ? ` · prefers ${PHASE_COPY[b.preferredMedPhase as MedPhase].label}`
                    : ''}
                  {' · '}
                  {b.status}
                </p>
              </div>
              <div className={styles.actions}>
                {b.status !== 'done' && b.status !== 'skipped' && (
                  <>
                    <button
                      type="button"
                      className={`${ui.btn} ${ui.btnGhost}`}
                      title="Mark done"
                      onClick={() => onStatus(b.id, 'done')}
                    >
                      ✓
                    </button>
                    <button
                      type="button"
                      className={`${ui.btn} ${ui.btnGhost}`}
                      title="Skip (guilt-free)"
                      onClick={() => onStatus(b.id, 'skipped')}
                    >
                      Skip
                    </button>
                  </>
                )}
                {(b.status === 'done' || b.status === 'skipped') && (
                  <button
                    type="button"
                    className={`${ui.btn} ${ui.btnGhost}`}
                    onClick={() => onStatus(b.id, 'upcoming')}
                  >
                    Reset
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <p className={ui.hint}>Missed blocks stay open — nothing auto-fails.</p>
    </div>
  );
}
