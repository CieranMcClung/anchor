import type {
  AgentsState,
  AnchorBlock,
  CognitiveLoad,
  DoseLog,
  OrchestratorMode,
  ParkingItem,
  Settings,
} from '../types';
import { LOAD_COPY, ORCHESTRATOR_COPY, PHASE_COPY } from '../types';
import {
  isBuriedByRestProtection,
  reorderByBiologicalWindow,
} from '../agents/pharmacokinetic';
import { getDoseContext, isLoadDeemphasised } from '../utils/medPhase';
import { phaseTip, suggestNextAction } from '../utils/suggestNext';
import { hhmmToMinutes, minutesSinceMidnight } from '../utils/time';
import styles from './TodaysRails.module.css';
import bannerStyles from './agents/AgentBanner.module.css';
import ui from './ui.module.css';

interface Props {
  blocks: AnchorBlock[];
  parking: ParkingItem[];
  settings: Settings;
  doseLog: DoseLog;
  agents: AgentsState;
  orchestratorMode: OrchestratorMode;
  now: Date;
  onStatus: (id: string, status: AnchorBlock['status']) => void;
  onStartBlock: (block: AnchorBlock) => void;
  onStartParking: (text: string) => void;
  onToggleShowBuried: () => void;
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

export function TodaysRails({
  blocks,
  parking,
  settings,
  doseLog,
  agents,
  orchestratorMode,
  now,
  onStatus,
  onStartBlock,
  onStartParking,
  onToggleShowBuried,
}: Props) {
  const ctx = getDoseContext(settings, doseLog, now);
  const next = suggestNextAction(blocks, parking, settings, doseLog, now);
  const tip = phaseTip(ctx.phase);
  const orch = ORCHESTRATOR_COPY[orchestratorMode];

  const reordered = reorderByBiologicalWindow(blocks, orchestratorMode);
  const live = inferStatuses(reordered, now);

  const buried = live.filter((b) =>
    isBuriedByRestProtection(
      b,
      orchestratorMode,
      settings.restProtectionEnabled,
      agents.showBuriedTasks
    )
  );
  const visible = live.filter(
    (b) =>
      !isBuriedByRestProtection(
        b,
        orchestratorMode,
        settings.restProtectionEnabled,
        agents.showBuriedTasks
      )
  );

  const byLoad = (load: CognitiveLoad) =>
    visible
      .filter((b) => b.cognitiveLoad === load)
      .sort(
        (a, b) => hhmmToMinutes(a.plannedStart) - hhmmToMinutes(b.plannedStart)
      );

  // Peak: show high→med→low; otherwise low→med→high (orchestrator already sorted list)
  const loadOrder: CognitiveLoad[] =
    orchestratorMode === 'peak'
      ? ['high', 'medium', 'low']
      : ['low', 'medium', 'high'];

  const morning = visible
    .filter((b) => b.routine === 'morning')
    .sort(
      (a, b) => hhmmToMinutes(a.plannedStart) - hhmmToMinutes(b.plannedStart)
    );
  const evening = visible
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
        <span className={ui.pill}>{orch.label}</span>
      </div>

      <p className={ui.hint} style={{ margin: 0 }}>
        {orch.hint} · {tip}
      </p>
      <p className={ui.hint} style={{ margin: 0 }}>
        Med phase: {PHASE_COPY[ctx.phase].label}
        {ctx.isEstimate ? ' (estimate)' : ''}
      </p>

      {next && (
        <div className={`${ui.cardQuiet} ${styles.suggest}`}>
          <p className={ui.hint} style={{ margin: 0 }}>
            Suggested next · {orch.label.toLowerCase()}
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
        <h3 className={styles.groupTitle}>
          By cognitive load
          {orchestratorMode === 'peak' ? ' · deep first' : ''}
        </h3>
        {loadOrder.map((load) => {
          const items = byLoad(load).filter((b) => b.routine === 'anytime');
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

      {buried.length > 0 && !agents.showBuriedTasks && (
        <p className={bannerStyles.buriedNote}>
          {buried.length} high-load{' '}
          {buried.length === 1 ? 'task' : 'tasks'} tucked away for rest
          protection.{' '}
          <button
            type="button"
            className={`${ui.btn} ${ui.btnGhost}`}
            style={{ display: 'inline', minHeight: 32, padding: '0.2rem 0.5rem' }}
            onClick={onToggleShowBuried}
          >
            Show all
          </button>
        </p>
      )}

      {agents.showBuriedTasks && settings.restProtectionEnabled && (
        <p className={bannerStyles.buriedNote}>
          Showing buried high-load tasks.{' '}
          <button
            type="button"
            className={`${ui.btn} ${ui.btnGhost}`}
            style={{ display: 'inline', minHeight: 32, padding: '0.2rem 0.5rem' }}
            onClick={onToggleShowBuried}
          >
            Hide again
          </button>
        </p>
      )}

      <p className={ui.hint}>
        Skipped is fine — nothing auto-fails, no streaks.
      </p>
    </div>
  );
}
