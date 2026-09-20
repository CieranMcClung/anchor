export type MedPhase = 'before' | 'onset' | 'peak' | 'comedown' | 'offline';
export type CognitiveLoad = 'low' | 'medium' | 'high';
export type RoutineSlot = 'morning' | 'evening' | 'anytime';
export type Theme = 'dark' | 'light';
export type BlockStatus = 'upcoming' | 'now' | 'done' | 'skipped';

/** Pharmacokinetic orchestrator surface mode (persisted). */
export type OrchestratorMode =
  | 'before'
  | 'onset'
  | 'peak'
  | 'comedown-warn'
  | 'comedown'
  | 'rest-protection';

export type View =
  | 'home'
  | 'start-door'
  | 'focus'
  | 'focus-done'
  | 'parking'
  | 'soft-close'
  | 'settings'
  | 'first-run'
  | 'time-check'
  | 'somatic-reset';

export interface Settings {
  doseTime: string;
  doseLabel: string;
  onsetEndHours: number;
  peakEndHours: number;
  comedownEndHours: number;
  theme: Theme;
  lowStimulation: boolean;
  reduceMotion: boolean;
  ambientSound: boolean;
  firstRunComplete: boolean;
  useMorningTemplate: boolean;
  useEveningTemplate: boolean;
  /** Rest Protection: bury high-load tasks in offline/evening (recoverable). */
  restProtectionEnabled: boolean;
}

export interface DoseLog {
  date: string;
  timeHHMM: string | null;
  loggedAt: number | null;
}

export interface AnchorBlock {
  id: string;
  name: string;
  plannedStart: string;
  durationMinutes?: number;
  preferredMedPhase?: MedPhase;
  cognitiveLoad: CognitiveLoad;
  routine: RoutineSlot;
  status: BlockStatus;
}

export interface DayRails {
  date: string;
  blocks: AnchorBlock[];
}

export interface ParkingItem {
  id: string;
  text: string;
  createdAt: number;
  cognitiveLoad?: CognitiveLoad;
  estimateMinutes?: number;
  bufferedMinutes?: number;
}

export interface JournalEntry {
  id: string;
  date: string;
  started: string[];
  parkedForTomorrow: string[];
  medNotes: string;
  createdAt: number;
}

/** Exactly three absurdly small steps from the Un-Stick agent. */
export interface MicroDeconstruction {
  steps: [string, string, string];
  /** 0–2: which step is currently shown. */
  currentIndex: number;
  /** Per-step completion flags. */
  completed: [boolean, boolean, boolean];
}

export interface FocusSession {
  task: string;
  microStep: string;
  definitionOfDone: string;
  estimateMinutes: number;
  durationMinutes: number;
  startedAt: number;
  endsAt: number;
  bodyDouble: boolean;
  elapsedBeforePause: number;
  isMicro?: boolean;
  /** Last user interaction (tap / progress) — for somatic idle detection. */
  lastInteractionAt?: number;
  /** Active 3-step un-stick deconstruction. */
  deconstruction?: MicroDeconstruction;
}

/** Session-scoped agent prompt memory (not always persisted long-term). */
export interface AgentSession {
  comedownWarnDismissedKey: string | null;
  somaticDismissedForFocusStart: number | null;
  lastPromptKind: string | null;
  lastPromptAt: number | null;
}

export interface AgentsState {
  /** Last orchestrator mode written by the PK agent. */
  orchestratorMode: OrchestratorMode;
  /** Escape hatch: show buried high-load tasks during Rest Protection. */
  showBuriedTasks: boolean;
  /** Dose key (date|time) the comedown warning was shown for. */
  comedownWarnShownFor: string | null;
  session: AgentSession;
}

export interface AppState {
  settings: Settings;
  rails: DayRails;
  parking: ParkingItem[];
  journal: JournalEntry[];
  focus: FocusSession | null;
  lastTimeCheckAt: number | null;
  softCloseDoneFor: string | null;
  startedToday: string[];
  doseLog: DoseLog;
  agents: AgentsState;
}

export const BUFFER_FACTOR = 1.4;

export const DEFAULT_AGENT_SESSION: AgentSession = {
  comedownWarnDismissedKey: null,
  somaticDismissedForFocusStart: null,
  lastPromptKind: null,
  lastPromptAt: null,
};

export const DEFAULT_AGENTS: AgentsState = {
  orchestratorMode: 'before',
  showBuriedTasks: false,
  comedownWarnShownFor: null,
  session: { ...DEFAULT_AGENT_SESSION },
};

export const DEFAULT_SETTINGS: Settings = {
  doseTime: '08:00',
  doseLabel: '18 mg XL',
  onsetEndHours: 1,
  peakEndHours: 5,
  comedownEndHours: 8,
  theme: 'dark',
  lowStimulation: false,
  reduceMotion: false,
  ambientSound: false,
  firstRunComplete: false,
  useMorningTemplate: true,
  useEveningTemplate: true,
  restProtectionEnabled: true,
};

export const PHASE_COPY: Record<
  MedPhase,
  { label: string; hint: string; tip: string }
> = {
  before: {
    label: 'Before dose',
    hint: 'Easy anchors only — or wait for onset',
    tip: 'Keep it gentle until you’ve logged today’s dose.',
  },
  onset: {
    label: 'Onset',
    hint: 'Routine ramp-up — low-load anchors',
    tip: 'Warming up: stick to low-friction basics for now.',
  },
  peak: {
    label: 'Peak focus',
    hint: 'Good window for medium/high or deep work',
    tip: 'Energy’s up — a medium or high-load item can fit here.',
  },
  comedown: {
    label: 'Comedown',
    hint: 'Avoid starting heavy projects — low-demand recovery',
    tip: 'Winding down: prefer low-load wrap-ups over new deep work.',
  },
  offline: {
    label: 'Offline / rest',
    hint: 'Rest, park, or soft close',
    tip: 'Rest framing — park leftovers and be kind to the evening.',
  },
};

export const ORCHESTRATOR_COPY: Record<
  OrchestratorMode,
  { label: string; hint: string }
> = {
  before: {
    label: 'Before dose',
    hint: 'Low-friction anchors only.',
  },
  onset: {
    label: 'Onset ramp',
    hint: 'Warming up — keep load gentle.',
  },
  peak: {
    label: 'Peak window',
    hint: 'High-load / deep tasks surfaced first.',
  },
  'comedown-warn': {
    label: 'Comedown approaching',
    hint: 'Skip complex new loops — shift to low-demand anchors.',
  },
  comedown: {
    label: 'Comedown',
    hint: 'Low-demand recovery preferred.',
  },
  'rest-protection': {
    label: 'Rest protection',
    hint: 'Heavy tasks tucked away — still recoverable.',
  },
};

export const LOAD_COPY: Record<CognitiveLoad, string> = {
  low: 'Low load',
  medium: 'Medium load',
  high: 'High load',
};

export function bufferedMinutes(estimate: number): number {
  return Math.max(1, Math.round(estimate * BUFFER_FACTOR));
}
