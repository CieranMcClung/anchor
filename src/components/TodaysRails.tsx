import type {
  AnchorBlock,
  CognitiveLoad,
  DoseLog,
  ParkingItem,
  Settings,
} from '../types';
import { LOAD_COPY, PHASE_COPY } from '../types';
import { getDoseContext, isLoadDeemphasised } from '../utils/medPhase';
import { phaseTip, suggestNextAction } from '../utils/suggestNext';
import { hhmmToMinutes, minutesSinceMidnight } from '../utils/time';
import styles from './TodaysRails.module.css';
import ui from './ui.module.css';

interface Props {
  blocks: AnchorBlock[];
  parking: ParkingItem[];
  settings: Settings;
  doseLog: DoseLog;
  now: Date;
  onStatus: (id: string, status: AnchorBlock['status']) => void;
  onStartBlock: (block: AnchorBlock) => void;
  onStartParking: (text: string) => void;
}

const LOAD_ORDER: CognitiveLoad[] = ['low', 'medium', 'high'];

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

export function TodaysRails({
  blocks,
  parking,
  settings,
  doseLog,
  now,
  onStatus,
  onStartBlock,
  onStartParking,
}: Props) {
  const live = inferStatuses(blocks, now);
  const ctx = getDoseContext(settings, doseLog, now);
  const next = suggestNextAction(blocks, parking, settings, doseLog, now);
  const tip = phaseTip(ctx.phase);

  const byLoad = (load: CognitiveLoad) =>
    live
      .filter((b) => b.cognitiveLoad === load)
      .sort(
        (a, b) => hhmmToMinutes(a.plannedStart) - hhmmToMinutes(b.plannedStart)
      );

  const morning = live
    .filter((b) => b.routine === 'morning')
    .sort(
      (a, b) => hhmmToMinutes(a.plannedStart) - hhmmToMinutes(b.plannedStart)
    );
  const evening = live
    .filter((b) => b.routine === 'evening')
    .sort(
      (a, b) => hhmmToMinutes(a.plannedStart) - hhmmToMinutes(b.plannedStart)
    );

  const renderItem = (b: AnchorBlock) => {
    const deemph = isLoadDeemphasised(ctx.phase, b.cognitiveLoad);
    const cls = [
      styles.item,
      b.status === 'now' ? styles.itemNow : '',
      b.status === 'done' ? styles.itemDone : '',
      b.status === 'skipped' ? styles.itemSkipped : '',
      deemph ? styles.itemDeemph : '',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <li key={b.id} className={cls}>
        <span className={styles.time}>{b.plannedStart}</span>
        <div>
          <p className={styles.name}>{b.name}</p>
          <p className={styles.meta}>
            {LOAD_COPY[b.cognitiveLoad]}
            {b.durationMinutes ? ` · ${b.durationMinutes} min` : ''}
            {deemph ? ' · softer suggestion right now' : ''}
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
                title="Start"
                onClick={() => onStartBlock(b)}
              >
                Start
              </button>
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
                title="Skip — that’s fine"
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
  };

  return (
    <div className={`${ui.card} ${ui.stack}`}>
      <div className={ui.row} style={{ justifyContent: 'space-between' }}>
        <h2 className={ui.title} style={{ fontSize: '1.05rem' }}>
          Daily anchors
        </h2>
        <span className={ui.pill}>{PHASE_COPY[ctx.phase].label}</span>
      </div>

      <p className={ui.hint} style={{ margin: 0 }}>
        {tip}
      </p>

      {next && (
        <div className={`${ui.cardQuiet} ${styles.suggest}`}>
          <p className={ui.hint} style={{ margin: 0 }}>
            Suggested next · matches {PHASE_COPY[ctx.phase].label.toLowerCase()}
          </p>
          {next.kind === 'anchor' ? (
            <>
              <p style={{ margin: '0.2rem 0 0.55rem', fontWeight: 650 }}>
                {next.block.name} · {LOAD_COPY[next.block.cognitiveLoad]}
              </p>
              <button
                type="button"
                className={`${ui.btn} ${ui.btnPrimary}`}
                style={{ minHeight: 44 }}
                onClick={() => onStartBlock(next.block)}
              >
                Focus on this
              </button>
            </>
          ) : (
            <>
              <p style={{ margin: '0.2rem 0 0.55rem', fontWeight: 650 }}>
                Parked: {next.item.text}
              </p>
              <button
                type="button"
                className={`${ui.btn} ${ui.btnPrimary}`}
                style={{ minHeight: 44 }}
                onClick={() => onStartParking(next.item.text)}
              >
                Focus on this
              </button>
            </>
          )}
        </div>
      )}

      {settings.useMorningTemplate && morning.length > 0 && (
        <section>
          <h3 className={styles.groupTitle}>Morning basics</h3>
          <ul className={styles.list}>{morning.map(renderItem)}</ul>
        </section>
      )}

      <section>
        <h3 className={styles.groupTitle}>By cognitive load</h3>
        {LOAD_ORDER.map((load) => {
          const items = byLoad(load).filter((b) => b.routine === 'anytime');
          // Also show morning/evening in load groups if templates off
          const extra =
            !settings.useMorningTemplate || !settings.useEveningTemplate
              ? byLoad(load).filter((b) => {
                  if (b.routine === 'anytime') return false;
                  if (b.routine === 'morning' && settings.useMorningTemplate)
                    return false;
                  if (b.routine === 'evening' && settings.useEveningTemplate)
                    return false;
                  return true;
                })
              : [];
          const all = [...items, ...extra];
          if (all.length === 0) return null;
          const deemph = isLoadDeemphasised(ctx.phase, load);
          return (
            <div key={load} className={deemph ? styles.loadDeemph : undefined}>
              <p className={styles.loadLabel}>
                {LOAD_COPY[load]}
                {deemph ? ' · available, not prioritised' : ''}
              </p>
              <ul className={styles.list}>{all.map(renderItem)}</ul>
            </div>
          );
        })}
      </section>

      {settings.useEveningTemplate && evening.length > 0 && (
        <section>
          <h3 className={styles.groupTitle}>Evening soft close</h3>
          <ul className={styles.list}>{evening.map(renderItem)}</ul>
        </section>
      )}

      <p className={ui.hint}>
        Skipped is fine — nothing auto-fails, no streaks.
      </p>
    </div>
  );
}
