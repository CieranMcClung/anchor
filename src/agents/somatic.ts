import type { FocusSession } from '../types';

export const SOMATIC_RESET_MINUTES = 2;

export interface SomaticSignal {
  shouldPrompt: boolean;
  reason: 'overrun' | 'idle' | null;
}

/**
 * Soft executive-block detection:
 * - Past buffered duration with no finish, or
 * - No interaction past the buffer window (idle).
 * Never alarm — caller shows zero-shame copy.
 */
export function detectExecutiveBlock(
  session: FocusSession | null,
  nowMs = Date.now(),
  dismissedForStart: number | null = null
): SomaticSignal {
  if (!session) return { shouldPrompt: false, reason: null };
  if (session.isMicro) return { shouldPrompt: false, reason: null };
  if (session.deconstruction) return { shouldPrompt: false, reason: null };
  if (dismissedForStart === session.startedAt) {
    return { shouldPrompt: false, reason: null };
  }

  const bufferMs = session.durationMinutes * 60000;
  const elapsed = nowMs - session.startedAt;
  const lastTouch = session.lastInteractionAt ?? session.startedAt;
  const idleMs = nowMs - lastTouch;

  // Overrun: past buffered end by a little (grace ~30s)
  if (nowMs > session.endsAt + 30_000) {
    return { shouldPrompt: true, reason: 'overrun' };
  }

  // Idle: no interaction for the full buffered duration while still "in" focus
  if (idleMs >= bufferMs && elapsed >= bufferMs * 0.85) {
    return { shouldPrompt: true, reason: 'idle' };
  }

  return { shouldPrompt: false, reason: null };
}

export const SOMATIC_COPY = {
  title: 'Executive block detected',
  body: 'Let’s do a 2-minute somatic reset or tactile grounding before attempting this.',
  start: 'Start 2-min reset',
  dismiss: 'Not now',
  micro: 'Try a micro-step',
};

export const RESET_STEPS = [
  'Feel both feet on the floor — press gently for three breaths.',
  'Name three things you can touch nearby (no rush).',
  'Unclench jaw and drop shoulders once. That’s enough.',
];
