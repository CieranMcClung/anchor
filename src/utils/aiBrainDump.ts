/**
 * B1 stub — local-only “AI” brain-dump.
 * Gated by settings.aiBrainDump (default false). No network.
 * When offline, callers must park the raw dump.
 */

import type { Load } from '../types';
import { bufferedMinutes } from './duration';

export interface AtomicTask {
  text: string;
  estimateMinutes: number;
  bufferedMinutes: number;
  load: Load;
  dependsOn?: number;
  noise: boolean;
}

export interface AiBrainDumpResult {
  mode: 'review' | 'raw-park';
  tasks: AtomicTask[];
  raw: string;
}

const NOISE_RE =
  /\b(um+|uh+|anyway|idk|whatever|lol|hmm+)\b/i;

export function isOffline(): boolean {
  if (typeof navigator === 'undefined') return false;
  return navigator.onLine === false;
}

function inferLoad(text: string): Load {
  if (/\b(deep|report|deadline|complex|hard|essay|project|coding)\b/i.test(text)) {
    return 'high';
  }
  if (/\b(tidy|water|brush|snack|text|reply|meds)\b/i.test(text)) {
    return 'low';
  }
  return 'medium';
}

function splitAtomics(raw: string): string[] {
  return raw
    .replace(/\r\n/g, '\n')
    .split(/[\n;]+|(?:\band then\b)|(?:\bthen\b)/i)
    .map((s) => s.replace(/^[-*•\d.)\]]+\s*/, '').trim())
    .filter((s) => s.length > 1);
}

/**
 * Local heuristic stand-in for an API: short atomics, noise flagged, deps by order.
 * Caps each piece under 10 minutes. Does not call a network.
 */
export function stubAiBrainDump(
  raw: string,
  bufferPercent: number,
  online = !isOffline()
): AiBrainDumpResult {
  const trimmed = raw.trim();
  if (!trimmed) return { mode: 'raw-park', tasks: [], raw };

  if (!online) {
    return {
      mode: 'raw-park',
      tasks: [
        {
          text: trimmed,
          estimateMinutes: 10,
          bufferedMinutes: bufferedMinutes(10, bufferPercent),
          load: inferLoad(trimmed),
          noise: false,
        },
      ],
      raw: trimmed,
    };
  }

  const lines = splitAtomics(trimmed);
  const tasks: AtomicTask[] = lines.map((text, i) => {
    const noise = NOISE_RE.test(text) && text.split(/\s+/).length <= 3;
    const load = inferLoad(text);
    const estimateMinutes = Math.min(9, load === 'low' ? 5 : 8);
    return {
      text,
      estimateMinutes,
      bufferedMinutes: bufferedMinutes(estimateMinutes, bufferPercent),
      load,
      dependsOn: i > 0 ? i - 1 : undefined,
      noise,
    };
  });

  return { mode: 'review', tasks, raw: trimmed };
}
