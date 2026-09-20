/** A6 — global hotkeys. Capture (c / /) is unchanged. */

export const HOTKEYS = {
  capture: ['c', 'C', '/'],
  startPause: [' '],
  done: ['d', 'D'],
  unstick: ['u', 'U'],
  tooHard: ['h', 'H'],
  overwhelmed: ['o', 'O'],
  swap: ['s', 'S'],
  rest: ['r', 'R'],
} as const;

export function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName?.toLowerCase();
  return tag === 'input' || tag === 'textarea' || tag === 'select' || el.isContentEditable;
}

export function isCaptureKey(key: string): boolean {
  return key === 'c' || key === 'C' || key === '/';
}
