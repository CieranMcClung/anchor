export type MedPhase = 'before' | 'rising' | 'peak' | 'waning' | 'offline';

export type Theme = 'dark' | 'light';

export type BlockStatus = 'upcoming' | 'now' | 'done' | 'skipped';

export type View =
  | 'home'
  | 'start-door'
  | 'focus'
  | 'focus-done'
  | 'parking'
  | 'soft-close'
  | 'settings'
  | 'first-run'
  | 'time-check';

export interface Settings {
  doseTime: string; // HH:MM
  usefulWindowHours: number;
  theme: Theme;
  lowStimulation: boolean;
  reduceMotion: boolean;
  ambientSound: boolean;
  firstRunComplete: boolean;
}

export interface AnchorBlock {
  id: string;
  name: string;
  plannedStart: string; // HH:MM
  durationMinutes?: number;
  preferredMedPhase?: MedPhase;
  status: BlockStatus;
}

export interface DayRails {
  date: string; // YYYY-MM-DD
  blocks: AnchorBlock[];
}

export interface ParkingItem {
  id: string;
  text: string;
  createdAt: number;
}

export interface JournalEntry {
  id: string;
  date: string;
  started: string[];
  parkedForTomorrow: string[];
  medNotes: string;
  createdAt: number;
}

export interface FocusSession {
  task: string;
  microStep: string;
  durationMinutes: number;
  startedAt: number;
  endsAt: number;
  bodyDouble: boolean;
  elapsedBeforePause: number;
}

export interface TimeCheckState {
  lastCheckAt: number | null;
  nextBlockLabel: string | null;
  nextBlockAt: number | null;
}

export interface AppState {
  settings: Settings;
  rails: DayRails;
  parking: ParkingItem[];
  journal: JournalEntry[];
  focus: FocusSession | null;
  lastTimeCheckAt: number | null;
  softCloseDoneFor: string | null; // date
  startedToday: string[]; // tasks started today
}

export const DEFAULT_SETTINGS: Settings = {
  doseTime: '08:00',
  usefulWindowHours: 9,
  theme: 'dark',
  lowStimulation: false,
  reduceMotion: false,
  ambientSound: false,
  firstRunComplete: false,
};

export const PHASE_COPY: Record<MedPhase, { label: string; hint: string }> = {
  before: { label: 'Before dose', hint: 'Gentle tasks, or wait for rising' },
  rising: { label: 'Rising', hint: 'Warming up — light starts work well' },
  peak: { label: 'Peak', hint: 'Good for hard starts' },
  waning: { label: 'Waning', hint: 'Smaller tasks, wrap-ups' },
  offline: { label: 'Offline', hint: 'Rest, park, or soft close' },
};
