/**
 * Item 7 — Rest bury. Park leftover Today work when resting.
 * Comedown, offline, or QA override. No validation-minutes wait.
 */

import type { Anchor, FocusSession, Load, ParkItem, PkZone } from '../types';

export function canRestBury(opts: {
  zone: PkZone;
  offline: boolean;
  qaOverride: boolean;
}): boolean {
  return opts.qaOverride || opts.offline || opts.zone === 'comedown';
}

export function parkFromAnchor(
  anchor: Anchor,
  now = Date.now()
): ParkItem {
  return {
    id: crypto.randomUUID(),
    text: anchor.title,
    createdAt: now,
    load: anchor.load,
    rawMinutes: anchor.rawMinutes,
  };
}

export function parkFromFocus(
  focus: FocusSession,
  now = Date.now()
): ParkItem {
  return {
    id: crypto.randomUUID(),
    text: focus.title,
    createdAt: now,
    load: focus.load,
    rawMinutes: focus.rawMinutes,
  };
}

export function buryOpenWork(input: {
  anchors: Anchor[];
  park: ParkItem[];
  focus: FocusSession | null;
  now?: number;
}): {
  anchors: Anchor[];
  park: ParkItem[];
  focus: null;
} {
  const now = input.now ?? Date.now();
  const buried: ParkItem[] = [];
  if (input.focus) {
    buried.push(parkFromFocus(input.focus, now));
  }
  for (const anchor of input.anchors) {
    if (anchor.status !== 'open') continue;
    if (input.focus?.anchorId === anchor.id) continue;
    buried.push(parkFromAnchor(anchor, now));
  }
  return {
    anchors: input.anchors.filter((a) => a.status === 'done'),
    park: [...buried, ...input.park],
    focus: null,
  };
}

export function maxLoad(loads: Load[]): Load {
  if (loads.includes('high')) return 'high';
  if (loads.includes('medium')) return 'medium';
  return 'low';
}
