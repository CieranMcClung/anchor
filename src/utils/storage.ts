import type {
  AgentsState,
  AnchorBlock,
  AppState,
  CognitiveLoad,
  DoseLog,
  FocusSession,
  MedPhase,
  MicroDeconstruction,
  OrchestratorMode,
  RoutineSlot,
  Settings,
} from '../types';
import { DEFAULT_AGENTS, DEFAULT_AGENT_SESSION, DEFAULT_SETTINGS } from '../types';
import { defaultRailBlocks } from './defaults';
import { todayKey } from './time';

const KEY = 'anchor-app-v1';
const LEGACY_KEYS = ['anchor-state-v1', 'anchor-v1', 'anchor-app-state'];

const PHASE_MAP: Record<string, MedPhase> = {
  before: 'before',
  rising: 'onset',
  onset: 'onset',
  peak: 'peak',
  waning: 'comedown',
  comedown: 'comedown',
  offline: 'offline',
};

const ORCH_MODES: OrchestratorMode[] = [
  'before',
  'onset',
  'peak',
  'comedown-warn',
  'comedown',
  'rest-protection',
];

function emptyDoseLog(date = todayKey()): DoseLog {
  return { date, timeHHMM: null, loggedAt: null };
}

export function createInitialState(): AppState {
  return {
    settings: { ...DEFAULT_SETTINGS },
    rails: { date: todayKey(), blocks: defaultRailBlocks() },
    parking: [],
    journal: [],
    focus: null,
    lastTimeCheckAt: null,
    softCloseDoneFor: null,
    startedToday: [],
    doseLog: emptyDoseLog(),
    agents: {
      ...DEFAULT_AGENTS,
      session: { ...DEFAULT_AGENT_SESSION },
    },
  };
}

export function loadState(): AppState {
  try {
    let raw = localStorage.getItem(KEY);
    if (!raw) {
      for (const k of LEGACY_KEYS) {
        raw = localStorage.getItem(k);
        if (raw) break;
      }
    }
    if (!raw) return createInitialState();
    return migrateDay(migrateSchema(JSON.parse(raw) as Record<string, unknown>));
  } catch {
    return createInitialState();
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

function migrateSettings(raw: unknown): Settings {
  const s = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const useful =
    typeof s.usefulWindowHours === 'number' ? s.usefulWindowHours : undefined;

  return {
    ...DEFAULT_SETTINGS,
    doseTime: typeof s.doseTime === 'string' ? s.doseTime : DEFAULT_SETTINGS.doseTime,
    doseLabel:
      typeof s.doseLabel === 'string' ? s.doseLabel : DEFAULT_SETTINGS.doseLabel,
    onsetEndHours:
      typeof s.onsetEndHours === 'number'
        ? s.onsetEndHours
        : DEFAULT_SETTINGS.onsetEndHours,
    peakEndHours:
      typeof s.peakEndHours === 'number'
        ? s.peakEndHours
        : useful
          ? Math.max(2, useful * 0.55)
          : DEFAULT_SETTINGS.peakEndHours,
    comedownEndHours:
      typeof s.comedownEndHours === 'number'
        ? s.comedownEndHours
        : useful ?? DEFAULT_SETTINGS.comedownEndHours,
    theme: s.theme === 'light' ? 'light' : 'dark',
    lowStimulation: Boolean(s.lowStimulation),
    reduceMotion: Boolean(s.reduceMotion),
    ambientSound: Boolean(s.ambientSound),
    firstRunComplete: Boolean(s.firstRunComplete),
    useMorningTemplate:
      typeof s.useMorningTemplate === 'boolean'
        ? s.useMorningTemplate
        : DEFAULT_SETTINGS.useMorningTemplate,
    useEveningTemplate:
      typeof s.useEveningTemplate === 'boolean'
        ? s.useEveningTemplate
        : DEFAULT_SETTINGS.useEveningTemplate,
    restProtectionEnabled:
      typeof s.restProtectionEnabled === 'boolean'
        ? s.restProtectionEnabled
        : DEFAULT_SETTINGS.restProtectionEnabled,
  };
}

function migrateBlock(raw: unknown): AnchorBlock | null {
  if (!raw || typeof raw !== 'object') return null;
  const b = raw as Record<string, unknown>;
  if (typeof b.id !== 'string' || typeof b.name !== 'string') return null;

  const prefRaw =
    typeof b.preferredMedPhase === 'string' ? b.preferredMedPhase : undefined;
  const pref = prefRaw ? PHASE_MAP[prefRaw] : undefined;

  const load = (['low', 'medium', 'high'] as CognitiveLoad[]).includes(
    b.cognitiveLoad as CognitiveLoad
  )
    ? (b.cognitiveLoad as CognitiveLoad)
    : inferLoad(b.name, pref);

  const routine = (['morning', 'evening', 'anytime'] as RoutineSlot[]).includes(
    b.routine as RoutineSlot
  )
    ? (b.routine as RoutineSlot)
    : 'anytime';

  const status = (['upcoming', 'now', 'done', 'skipped'] as const).includes(
    b.status as AnchorBlock['status']
  )
    ? (b.status as AnchorBlock['status'])
    : 'upcoming';

  return {
    id: b.id,
    name: b.name,
    plannedStart: typeof b.plannedStart === 'string' ? b.plannedStart : '09:00',
    durationMinutes:
      typeof b.durationMinutes === 'number' ? b.durationMinutes : undefined,
    preferredMedPhase: pref,
    cognitiveLoad: load,
    routine,
    status,
  };
}

function inferLoad(name: string, phase?: MedPhase): CognitiveLoad {
  const n = name.toLowerCase();
  if (
    /brush|meds|water|dress|tidy|breakfast|unwind|log off|soft close|settle|wind/.test(
      n
    )
  ) {
    return 'low';
  }
  if (phase === 'peak' || /deep|meaningful|focus/.test(n)) return 'high';
  return 'medium';
}

function migrateDeconstruction(raw: unknown): MicroDeconstruction | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const d = raw as Record<string, unknown>;
  if (!Array.isArray(d.steps) || d.steps.length !== 3) return undefined;
  const steps = d.steps.map(String) as [string, string, string];
  const completed = Array.isArray(d.completed)
    ? ([
        Boolean(d.completed[0]),
        Boolean(d.completed[1]),
        Boolean(d.completed[2]),
      ] as [boolean, boolean, boolean])
    : ([false, false, false] as [boolean, boolean, boolean]);
  const currentIndex =
    typeof d.currentIndex === 'number'
      ? Math.min(2, Math.max(0, Math.floor(d.currentIndex)))
      : 0;
  return { steps, completed, currentIndex };
}

function migrateFocus(raw: unknown): FocusSession | null {
  if (!raw || typeof raw !== 'object') return null;
  const f = raw as Record<string, unknown>;
  if (typeof f.task !== 'string' || typeof f.startedAt !== 'number') return null;
  const estimate =
    typeof f.estimateMinutes === 'number'
      ? f.estimateMinutes
      : typeof f.durationMinutes === 'number'
        ? f.durationMinutes
        : 2;
  const duration =
    typeof f.durationMinutes === 'number' ? f.durationMinutes : estimate;
  return {
    task: f.task,
    microStep: typeof f.microStep === 'string' ? f.microStep : '',
    definitionOfDone:
      typeof f.definitionOfDone === 'string' ? f.definitionOfDone : '',
    estimateMinutes: estimate,
    durationMinutes: duration,
    startedAt: f.startedAt,
    endsAt:
      typeof f.endsAt === 'number' ? f.endsAt : f.startedAt + duration * 60000,
    bodyDouble: Boolean(f.bodyDouble),
    elapsedBeforePause:
      typeof f.elapsedBeforePause === 'number' ? f.elapsedBeforePause : 0,
    isMicro: Boolean(f.isMicro),
    lastInteractionAt:
      typeof f.lastInteractionAt === 'number' ? f.lastInteractionAt : f.startedAt,
    deconstruction: migrateDeconstruction(f.deconstruction),
  };
}

function migrateAgents(raw: unknown): AgentsState {
  const a = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const sessionRaw =
    a.session && typeof a.session === 'object'
      ? (a.session as Record<string, unknown>)
      : {};

  const mode = ORCH_MODES.includes(a.orchestratorMode as OrchestratorMode)
    ? (a.orchestratorMode as OrchestratorMode)
    : DEFAULT_AGENTS.orchestratorMode;

  return {
    orchestratorMode: mode,
    showBuriedTasks: Boolean(a.showBuriedTasks),
    comedownWarnShownFor:
      typeof a.comedownWarnShownFor === 'string' ? a.comedownWarnShownFor : null,
    session: {
      comedownWarnDismissedKey:
        typeof sessionRaw.comedownWarnDismissedKey === 'string'
          ? sessionRaw.comedownWarnDismissedKey
          : null,
      somaticDismissedForFocusStart:
        typeof sessionRaw.somaticDismissedForFocusStart === 'number'
          ? sessionRaw.somaticDismissedForFocusStart
          : null,
      lastPromptKind:
        typeof sessionRaw.lastPromptKind === 'string'
          ? sessionRaw.lastPromptKind
          : null,
      lastPromptAt:
        typeof sessionRaw.lastPromptAt === 'number'
          ? sessionRaw.lastPromptAt
          : null,
    },
  };
}

function migrateSchema(raw: Record<string, unknown>): AppState {
  const settings = migrateSettings(raw.settings);
  const railsRaw = raw.rails as { date?: string; blocks?: unknown[] } | undefined;
  const blocks = (railsRaw?.blocks ?? [])
    .map(migrateBlock)
    .filter((b): b is AnchorBlock => b !== null);

  const doseRaw = raw.doseLog as Partial<DoseLog> | undefined;
  const doseLog: DoseLog = {
    date: typeof doseRaw?.date === 'string' ? doseRaw.date : todayKey(),
    timeHHMM: typeof doseRaw?.timeHHMM === 'string' ? doseRaw.timeHHMM : null,
    loggedAt: typeof doseRaw?.loggedAt === 'number' ? doseRaw.loggedAt : null,
  };

  const parking = Array.isArray(raw.parking)
    ? (raw.parking as AppState['parking']).map((p) => ({
        ...p,
        cognitiveLoad: p.cognitiveLoad,
        estimateMinutes: p.estimateMinutes,
        bufferedMinutes: p.bufferedMinutes,
      }))
    : [];

  return {
    settings,
    rails: {
      date: typeof railsRaw?.date === 'string' ? railsRaw.date : todayKey(),
      blocks: blocks.length >= 3 ? blocks : defaultRailBlocks(),
    },
    parking,
    journal: Array.isArray(raw.journal) ? (raw.journal as AppState['journal']) : [],
    focus: migrateFocus(raw.focus),
    lastTimeCheckAt:
      typeof raw.lastTimeCheckAt === 'number' ? raw.lastTimeCheckAt : null,
    softCloseDoneFor:
      typeof raw.softCloseDoneFor === 'string' ? raw.softCloseDoneFor : null,
    startedToday: Array.isArray(raw.startedToday)
      ? (raw.startedToday as string[])
      : [],
    doseLog,
    agents: migrateAgents(raw.agents),
  };
}

function migrateDay(state: AppState): AppState {
  const today = todayKey();
  let next = state;

  if (state.rails.date !== today) {
    const resetBlocks = state.rails.blocks.map((b) => ({
      ...b,
      status: 'upcoming' as const,
    }));
    next = {
      ...next,
      rails: {
        date: today,
        blocks: resetBlocks.length ? resetBlocks : defaultRailBlocks(),
      },
      startedToday: [],
      focus: null,
      agents: {
        ...next.agents,
        showBuriedTasks: false,
        session: { ...DEFAULT_AGENT_SESSION },
      },
    };
  }

  if (next.doseLog.date !== today) {
    next = { ...next, doseLog: emptyDoseLog(today) };
  }

  return next;
}
