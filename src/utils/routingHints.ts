/**
 * A1 — PK routing hints by zone + load.
 * Chips / optional highlight only. Never force a start. No plasma language.
 */

import type { Load, PkZone } from '../types';

export function suggestedLoadsForZone(zone: PkZone): Load[] {
  switch (zone) {
    case 'peak':
      return ['high', 'medium'];
    case 'onset':
      return ['low', 'medium'];
    case 'comedown':
      return ['low'];
    case 'unknown':
      return ['low', 'medium', 'high'];
  }
}

export function loadFitsZone(load: Load, zone: PkZone): boolean {
  if (zone === 'unknown') return true;
  return suggestedLoadsForZone(zone).includes(load);
}

export function loadChipLabel(load: Load): string {
  switch (load) {
    case 'low':
      return 'Low';
    case 'medium':
      return 'Med';
    case 'high':
      return 'High';
  }
}
