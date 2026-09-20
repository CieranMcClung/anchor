export type Load = 'low' | 'medium' | 'high';
/** Product modelling zones. UI chrome is Onset | Peak | Comedown only; post-comedown is not a fourth chip. */
export type PkZone = 'onset' | 'peak' | 'comedown' | 'trough' | 'unknown';
export type Route = 'today' | 'meds' | 'rest' | 'settings';
export type AnchorStatus = 'open' | 'done';
export type FocusRunState = 'ready' | 'running' | 'paused';

export const LOAD_CAPS: Record<Load, number> = {
  low: 1,
  medium: 2,
  high: 3,
};

export const GRACE_MINUTES = 3;

/** Soft dose-log cue near the end of Comedown. Never an alarm or prediction. */
export const TROUGH_NUDGE_LEAD_HOURS = 0.75;

/**
 * Concerta/OROS-class P0 placeholders (product modelling, not a plasma curve).
 * Visible labels: Onset | Peak | Comedown only. Rest Mode is a separate surface.
 */
export const DEFAULT_PK_WINDOWS = {
  onsetEndHours: 2,
  peakEndHours: 6,
  comedownEndHours: 10,
} as const;

export interface PkWindows {
  onsetEndHours: number;
  peakEndHours: number;
  comedownEndHours: number;
}

export interface Settings {
  onsetEndHours: number;
  peakEndHours: number;
  comedownEndHours: number;
}

export const DEFAULT_SETTINGS: Settings = { ...DEFAULT_PK_WINDOWS };

export interface Anchor {
  id: string;
  title: string;
  dod: string;
  rawMinutes: number;
  bufferedMinutes: number;
  load: Load;
  status: AnchorStatus;
}

export interface ParkItem {
  id: string;
  text: string;
  createdAt: number;
  load?: Load;
  rawMinutes?: number;
}

export interface FocusSession {
  title: string;
  dod: string;
  load: Load;
  rawMinutes: number;
  bufferedMinutes: number;
  anchorId: string | null;
  parkId: string | null;
  runState: FocusRunState;
  accumulatedMs: number;
  runningSince: number | null;
}

export interface DoseLog {
  date: string;
  timeHHMM: string | null;
  loggedAt: number | null;
  skipped: boolean;
}

export interface UndoSnapshot {
  kind: 'swap' | 'dose';
  focus: FocusSession | null;
  dose: DoseLog;
  expiresAt: number;
}

export interface CarryCandidate {
  id: string;
  title: string;
  dod: string;
  rawMinutes: number;
  load: Load;
}

export interface AppState {
  date: string;
  load: Load | null;
  dose: DoseLog;
  anchors: Anchor[];
  focus: FocusSession | null;
  park: ParkItem[];
  restMode: boolean;
  restSuggestDismissedDate: string | null;
  comedownNudgeDismissedKey: string | null;
  carryCandidates: CarryCandidate[];
  undo: UndoSnapshot | null;
  settings: Settings;
}

export const DEFAULT_DOSE = (date: string): DoseLog => ({
  date,
  timeHHMM: null,
  loggedAt: null,
  skipped: false,
});
