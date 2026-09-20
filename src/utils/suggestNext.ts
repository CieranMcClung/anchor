import type {
  AnchorBlock,
  CognitiveLoad,
  DoseLog,
  MedPhase,
  ParkingItem,
  Settings,
} from '../types';
import { getDoseContext, preferredLoads } from './medPhase';
import { hhmmToMinutes, minutesSinceMidnight } from './time';

export type Suggestable =
  | { kind: 'anchor'; block: AnchorBlock }
  | { kind: 'parking'; item: ParkingItem };

function openBlocks(blocks: AnchorBlock[], now: Date): AnchorBlock[] {
  const nowMins = minutesSinceMidnight(now);
  return blocks
    .filter((b) => b.status !== 'done' && b.status !== 'skipped')
    .map((b) => {
      const start = hhmmToMinutes(b.plannedStart);
      const end = start + (b.durationMinutes ?? 30);
      if (nowMins >= start && nowMins < end) {
        return { ...b, status: 'now' as const };
      }
      return { ...b, status: 'upcoming' as const };
    });
}

function loadRank(load: CognitiveLoad, preferred: CognitiveLoad[]): number {
  const idx = preferred.indexOf(load);
  return idx === -1 ? preferred.length + 1 : idx;
}

export function suggestNextAction(
  blocks: AnchorBlock[],
  parking: ParkingItem[],
  settings: Settings,
  doseLog: DoseLog,
  now = new Date()
): Suggestable | null {
  const { phase } = getDoseContext(settings, doseLog, now);
  const preferred = preferredLoads(phase);
  const live = openBlocks(blocks, now);

  const nowBlock = live.find((b) => b.status === 'now');
  if (nowBlock && !harshMismatch(phase, nowBlock.cognitiveLoad)) {
    return { kind: 'anchor', block: nowBlock };
  }

  const candidates: Suggestable[] = [
    ...live.map((b) => ({ kind: 'anchor' as const, block: b })),
    ...parking.map((item) => ({ kind: 'parking' as const, item })),
  ];
  if (candidates.length === 0) return null;

  candidates.sort((a, b) => {
    const loadA =
      a.kind === 'anchor' ? a.block.cognitiveLoad : a.item.cognitiveLoad ?? 'medium';
    const loadB =
      b.kind === 'anchor' ? b.block.cognitiveLoad : b.item.cognitiveLoad ?? 'medium';
    const rank = loadRank(loadA, preferred) - loadRank(loadB, preferred);
    if (rank !== 0) return rank;
    if (a.kind === 'anchor' && b.kind === 'anchor') {
      return hhmmToMinutes(a.block.plannedStart) - hhmmToMinutes(b.block.plannedStart);
    }
    if (a.kind === 'parking' && b.kind === 'parking') {
      return b.item.createdAt - a.item.createdAt;
    }
    return a.kind === 'anchor' ? -1 : 1;
  });

  return candidates[0] ?? null;
}

function harshMismatch(phase: MedPhase, load: CognitiveLoad): boolean {
  if (load !== 'high') return false;
  return (
    phase === 'comedown' ||
    phase === 'offline' ||
    phase === 'onset' ||
    phase === 'before'
  );
}


export function phaseTip(phase: MedPhase): string {
  const tips: Record<MedPhase, string> = {
    before: 'Keep it gentle until you’ve logged today’s dose.',
    onset: 'Warming up — low-friction basics first.',
    peak: 'Good window for medium or high-load work if you want it.',
    comedown: 'Steer toward low-demand recovery; heavy starts can wait.',
    offline: 'Rest framing — park leftovers and soft-close when ready.',
  };
  return tips[phase];
}
