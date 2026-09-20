/**
 * B1 local heuristic engine — always works offline (GitHub Pages, no network).
 * Optional LLM enhance lives in llmEnhance.ts and must fall back here silently.
 */

import type { Load } from '../types';
import { ATOMIC_ESTIMATE_MAX } from '../types';
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
  source: 'local' | 'llm';
}

const MAX_ATOMICS = 12;

const FILLER_LINE =
  /^(?:um+|uh+|er+|ah+|hmm+|hm+|anyway|anyways|idk|whatever|lol|lmao|haha|yeah|yep|yup|ok|okay|so|like|right|well|basically|literally|tbh|ngl|i mean|you know|wait|sorry)[!.?]*$/i;

const FILLER_TOKEN =
  /\b(?:um+|uh+|er+|ah+|hmm+|anyway|anyways|idk|whatever|lol|lmao|haha|tbh|ngl)\b/gi;

const TASK_VERB =
  /\b(email|write|call|text|reply|message|tidy|clean|send|book|pay|sort|fix|buy|wash|dump|review|draft|open|schedule|pack|file|print|submit|check|update|finish|start|make|do|get|put|take|read|plan|organise|organize|cancel|confirm|order|post|upload|download|install|charge|water|meds|brush|snack|bin|dishes|laundry|shoes)\b/i;

const HIGH_LOAD =
  /\b(deep|report|deadline|complex|hard|essay|project|coding|code|thesis|tax|paperwork|confront|meeting|refactor|design|analyse|analyze)\b/i;

const LOW_LOAD =
  /\b(tidy|water|brush|snack|text|reply|meds|dishes|bin|shoes|glass|post|quick|tiny|sip)\b/i;

export function isOffline(): boolean {
  if (typeof navigator === 'undefined') return false;
  return navigator.onLine === false;
}

export function inferLoad(text: string): Load {
  if (HIGH_LOAD.test(text)) return 'high';
  if (LOW_LOAD.test(text)) return 'low';
  return 'medium';
}

export function clampAtomicMinutes(n: unknown): number {
  const value = typeof n === 'number' && Number.isFinite(n) ? Math.round(n) : 6;
  return Math.max(1, Math.min(ATOMIC_ESTIMATE_MAX, value));
}

function stripBullet(line: string): string {
  return line
    .replace(/^\s*[-*>•]+(?:\s+|$)/, '')
    .replace(/^\s*\d+[.)]\s+/, '')
    .replace(/^\s*[a-z][.)]\s+/i, '')
    .replace(/^\s*\[(?:x| )?\]\s+/i, '')
    .trim();
}

function tidyFragment(text: string): string {
  return text
    .replace(FILLER_TOKEN, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^[,;.]+/, '')
    .replace(/[,;]+$/, '')
    .trim();
}

function isFluff(text: string): boolean {
  const trimmed = tidyFragment(text);
  if (trimmed.length < 2) return true;
  const normalised = trimmed.replace(/[^\p{L}\p{N}\s]/gu, '').trim();
  if (!normalised) return true;
  if (FILLER_LINE.test(normalised)) return true;
  const words = normalised.split(/\s+/);
  if (words.length <= 2 && FILLER_LINE.test(normalised) && !TASK_VERB.test(normalised)) {
    return true;
  }
  return false;
}

function looksLikeTask(text: string): boolean {
  if (isFluff(text)) return false;
  const words = text.split(/\s+/).filter(Boolean);
  return words.length >= 2 || TASK_VERB.test(text);
}

function splitDelimiters(line: string): { text: string; chained: boolean }[] {
  const parts = line.split(
    /(?:\s*;\s*)|(?:\s+\band then\b\s+)|(?:\s+\bthen\b\s+)|(?:\s+\balso\b\s+)/i
  );
  const chained = /(?:\band then\b)|(?:\bthen\b)/i.test(line) && parts.length > 1;
  return parts
    .map((part) => tidyFragment(part))
    .filter(Boolean)
    .map((text, i) => ({ text, chained: chained && i > 0 }));
}

function splitCompound(text: string): string[] {
  if (text.split(/\s+/).length <= 12) return [text];
  const andParts = text.split(/\s+and\s+(?!then\b)/i);
  if (andParts.length > 1 && andParts.every((part) => looksLikeTask(tidyFragment(part)))) {
    return andParts.map((part) => tidyFragment(part)).filter(Boolean);
  }
  const commaParts = text.split(/\s*,\s+/);
  if (
    commaParts.length > 1 &&
    commaParts.every((part) => looksLikeTask(tidyFragment(part)))
  ) {
    return commaParts.map((part) => tidyFragment(part)).filter(Boolean);
  }
  return [text];
}

function chunkWall(text: string): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= 16) return [text];
  const size = 8;
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += size) {
    const slice = words.slice(i, i + size).join(' ');
    if (slice) chunks.push(slice);
  }
  return chunks;
}

function guessEstimate(text: string, load: Load): number {
  const words = text.split(/\s+/).filter(Boolean).length;
  let mins = load === 'low' ? 4 : load === 'high' ? 8 : 6;
  if (words <= 3) mins = Math.min(mins, 5);
  if (words >= 10) mins = Math.min(ATOMIC_ESTIMATE_MAX, mins + 1);
  return clampAtomicMinutes(mins);
}

interface Fragment {
  text: string;
  chained: boolean;
  noise: boolean;
}

function fragmentsFromRaw(raw: string): Fragment[] {
  const lines = raw.replace(/\r\n/g, '\n').split('\n');
  const out: Fragment[] = [];

  for (const line of lines) {
    const stripped = stripBullet(line);
    if (!stripped) continue;
    const delimited = splitDelimiters(stripped);
    for (const piece of delimited) {
      const compounds = splitCompound(piece.text);
      compounds.forEach((text, i) => {
        const chunks = chunkWall(text);
        chunks.forEach((chunk, j) => {
          const noise = isFluff(chunk) || !looksLikeTask(chunk);
          out.push({
            text: chunk,
            chained: (piece.chained && i === 0 && j === 0) || i > 0 || j > 0,
            noise,
          });
        });
      });
    }
  }

  if (out.length === 0 && raw.trim()) {
    const fallback = tidyFragment(raw);
    if (fallback) {
      out.push({ text: fallback, chained: false, noise: isFluff(fallback) });
    }
  }

  return out;
}

export function toAtomicTask(
  text: string,
  bufferPercent: number,
  extras: Partial<Pick<AtomicTask, 'load' | 'estimateMinutes' | 'dependsOn' | 'noise'>> = {}
): AtomicTask {
  const cleaned = tidyFragment(text) || text.trim();
  const load = extras.load ?? inferLoad(cleaned);
  const estimateMinutes = clampAtomicMinutes(
    extras.estimateMinutes ?? guessEstimate(cleaned, load)
  );
  return {
    text: cleaned,
    estimateMinutes,
    bufferedMinutes: bufferedMinutes(estimateMinutes, bufferPercent),
    load,
    dependsOn: extras.dependsOn,
    noise: extras.noise ?? false,
  };
}

/**
 * Local heuristic: walls/bullets → atomics each <10 min (pre-buffer),
 * fluff dropped or flagged, rough L/M/H, optional sequential deps.
 * Never requires a network.
 */
export function deconstructLocal(
  raw: string,
  bufferPercent: number
): AiBrainDumpResult {
  const trimmed = raw.trim();
  if (!trimmed) return { mode: 'raw-park', tasks: [], raw, source: 'local' };

  const fragments = fragmentsFromRaw(trimmed);
  const useful = fragments.filter((f) => !f.noise);

  if (useful.length === 0) {
    return { mode: 'raw-park', tasks: [], raw: trimmed, source: 'local' };
  }

  const noise = fragments.filter((f) => f.noise && f.text.length > 1);
  const tasks: AtomicTask[] = [];

  useful.slice(0, MAX_ATOMICS).forEach((frag, i) => {
    const prev = i > 0 ? i - 1 : undefined;
    tasks.push(
      toAtomicTask(frag.text, bufferPercent, {
        noise: frag.noise,
        dependsOn: frag.chained && prev !== undefined ? prev : undefined,
      })
    );
  });

  if (noise.length && useful.length > 0) {
    for (const frag of noise.slice(0, 3)) {
      if (tasks.length >= MAX_ATOMICS) break;
      if (tasks.some((t) => t.text.toLowerCase() === frag.text.toLowerCase())) continue;
      tasks.push(toAtomicTask(frag.text, bufferPercent, { noise: true }));
    }
  }

  if (tasks.length === 0) {
    return { mode: 'raw-park', tasks: [], raw: trimmed, source: 'local' };
  }

  return { mode: 'review', tasks, raw: trimmed, source: 'local' };
}

/** @deprecated Use deconstructLocal. Kept so older tests/callers still compile. */
export function stubAiBrainDump(
  raw: string,
  bufferPercent: number,
  _online = true
): AiBrainDumpResult {
  return deconstructLocal(raw, bufferPercent);
}

export function selectedAtomics(tasks: AtomicTask[], selected: boolean[]): AtomicTask[] {
  return tasks.filter((task, i) => selected[i] && task.text.trim());
}
