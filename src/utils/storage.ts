import type { AppState } from '../types';
import { DEFAULT_SETTINGS } from '../types';
import { defaultRailBlocks } from './defaults';
import { todayKey } from './time';

const KEY = 'anchor-app-v1';

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
  };
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return createInitialState();
    const parsed = JSON.parse(raw) as AppState;
    return migrateDay(parsed);
  } catch {
    return createInitialState();
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // quota / private mode — ignore
  }
}

/** Roll rails and startedToday to a new day without losing parking/journal. */
function migrateDay(state: AppState): AppState {
  const today = todayKey();
  if (state.rails.date === today) return state;

  const resetBlocks = state.rails.blocks.map((b) => ({
    ...b,
    status: 'upcoming' as const,
  }));

  return {
    ...state,
    rails: { date: today, blocks: resetBlocks.length ? resetBlocks : defaultRailBlocks() },
    startedToday: [],
    focus: null,
  };
}
