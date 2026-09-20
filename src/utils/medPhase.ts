import type { CognitiveLoad, DoseLog, MedPhase, Settings } from '../types';
import { hhmmToMinutes, minutesSinceMidnight, todayKey } from './time';

export interface DoseContext {
  doseHHMM: string;
  isEstimate: boolean;
  elapsedHours: number;
  phase: MedPhase;
}

export function getDoseContext(
  settings: Settings,
  doseLog: DoseLog,
  now = new Date()
): DoseContext {
  const today = todayKey(now);
  const logged =
    doseLog.date === today && doseLog.timeHHMM ? doseLog.timeHHMM : null;
  const isEstimate = !logged;
  const doseHHMM = logged ?? settings.doseTime;
  const elapsedHours =
    (minutesSinceMidnight(now) - hhmmToMinutes(doseHHMM)) / 60;
  return {
    doseHHMM,
    isEstimate,
    elapsedHours,
    phase: phaseFromElapsed(elapsedHours, settings),
  };
}

export function phaseFromElapsed(
  elapsedHours: number,
  settings: Pick<Settings, 'onsetEndHours' | 'peakEndHours' | 'comedownEndHours'>
): MedPhase {
  if (elapsedHours < 0) return 'before';
  if (elapsedHours < settings.onsetEndHours) return 'onset';
  if (elapsedHours < settings.peakEndHours) return 'peak';
  if (elapsedHours < settings.comedownEndHours) return 'comedown';
  return 'offline';
}

export function preferredLoads(phase: MedPhase): CognitiveLoad[] {
  switch (phase) {
    case 'before':
    case 'onset':
      return ['low'];
    case 'peak':
      return ['high', 'medium', 'low'];
    case 'comedown':
      return ['low', 'medium'];
    case 'offline':
      return ['low'];
  }
}

export function isLoadDeemphasised(
  phase: MedPhase,
  load: CognitiveLoad
): boolean {
  if (load !== 'high') return false;
  return (
    phase === 'comedown' ||
    phase === 'offline' ||
    phase === 'before' ||
    phase === 'onset'
  );
}

export function phaseProgress(
  settings: Settings,
  doseLog: DoseLog,
  now = new Date()
): number {
  const ctx = getDoseContext(settings, doseLog, now);
  if (ctx.elapsedHours < 0) {
    const doseMins = hhmmToMinutes(ctx.doseHHMM);
    return Math.min(1, minutesSinceMidnight(now) / Math.max(1, doseMins));
  }
  return Math.min(1, ctx.elapsedHours / Math.max(0.5, settings.comedownEndHours));
}
