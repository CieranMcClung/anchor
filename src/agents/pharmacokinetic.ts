import type {
  AnchorBlock,
  CognitiveLoad,
  DoseLog,
  OrchestratorMode,
  Settings,
} from '../types';
import { getDoseContext, preferredLoads } from '../utils/medPhase';

/** Minutes before peak→comedown boundary to raise comedown warning. */
export const COMEDOWN_WARN_LEAD_MINUTES = 45;

export interface OrchestratorSnapshot {
  mode: OrchestratorMode;
  elapsedHours: number;
  hoursUntilComedown: number | null;
  isComedownWarning: boolean;
  doseKey: string;
}

export function doseKey(doseLog: DoseLog, settings: Settings): string {
  const time =
    doseLog.timeHHMM ?? settings.doseTime ?? 'unknown';
  return `${doseLog.date}|${time}`;
}

/**
 * Map elapsed dose time → orchestrator mode.
 * Comedown warning fires ~45m before peakEndHours (default 5h → warn at 4h15m).
 */
export function getOrchestratorSnapshot(
  settings: Settings,
  doseLog: DoseLog,
  now = new Date()
): OrchestratorSnapshot {
  const ctx = getDoseContext(settings, doseLog, now);
  const { elapsedHours, phase } = ctx;
  const key = doseKey(doseLog, settings);

  const warnAt = settings.peakEndHours - COMEDOWN_WARN_LEAD_MINUTES / 60;
  const hoursUntilComedown =
    elapsedHours < settings.peakEndHours
      ? settings.peakEndHours - elapsedHours
      : null;

  const inWarnWindow =
    elapsedHours >= warnAt &&
    elapsedHours < settings.peakEndHours &&
    phase === 'peak';

  let mode: OrchestratorMode;
  if (phase === 'before') mode = 'before';
  else if (phase === 'onset') mode = 'onset';
  else if (inWarnWindow) mode = 'comedown-warn';
  else if (phase === 'peak') mode = 'peak';
  else if (phase === 'comedown') mode = 'comedown';
  else mode = 'rest-protection';

  return {
    mode,
    elapsedHours,
    hoursUntilComedown,
    isComedownWarning: inWarnWindow,
    doseKey: key,
  };
}

function loadWeight(load: CognitiveLoad, preferred: CognitiveLoad[]): number {
  const idx = preferred.indexOf(load);
  return idx === -1 ? preferred.length + 2 : idx;
}

/**
 * Reorder open blocks for the biological window.
 * Peak → high first; comedown/rest → low first; onset/before → low first.
 * Does not mutate status — sort only.
 */
export function reorderByBiologicalWindow(
  blocks: AnchorBlock[],
  mode: OrchestratorMode
): AnchorBlock[] {
  const preferred: CognitiveLoad[] =
    mode === 'peak'
      ? ['high', 'medium', 'low']
      : mode === 'comedown' ||
          mode === 'comedown-warn' ||
          mode === 'rest-protection'
        ? ['low', 'medium', 'high']
        : preferredLoads(
            mode === 'before'
              ? 'before'
              : mode === 'onset'
                ? 'onset'
                : 'peak'
          );

  const open = blocks.filter((b) => b.status !== 'done' && b.status !== 'skipped');
  const closed = blocks.filter((b) => b.status === 'done' || b.status === 'skipped');

  const sorted = [...open].sort((a, b) => {
    const w = loadWeight(a.cognitiveLoad, preferred) - loadWeight(b.cognitiveLoad, preferred);
    if (w !== 0) return w;
    return a.plannedStart.localeCompare(b.plannedStart);
  });

  return [...sorted, ...closed];
}

/** Whether Rest Protection should bury this block from the main list. */
export function isBuriedByRestProtection(
  block: AnchorBlock,
  mode: OrchestratorMode,
  enabled: boolean,
  showAll: boolean
): boolean {
  if (!enabled || showAll) return false;
  if (mode !== 'rest-protection' && mode !== 'comedown') return false;
  if (block.status === 'done' || block.status === 'skipped') return false;
  return block.cognitiveLoad === 'high';
}

export function comedownWarnCopy(hoursUntil: number | null): {
  title: string;
  body: string;
} {
  const mins =
    hoursUntil != null ? Math.max(1, Math.round(hoursUntil * 60)) : COMEDOWN_WARN_LEAD_MINUTES;
  return {
    title: 'Comedown approaching',
    body: `About ${mins} minutes until the softer window. Skip complex new loops — shift upcoming to low-demand anchors.`,
  };
}
