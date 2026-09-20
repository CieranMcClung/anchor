import type { CognitiveLoad, ParkingItem } from '../types';
import { bufferedMinutes } from '../types';
import { minutesToHHMM, minutesSinceMidnight } from '../utils/time';

export interface ParsedDumpTask {
  text: string;
  cognitiveLoad: CognitiveLoad;
  estimateMinutes: number;
  bufferedMinutes: number;
  /** Where the orchestrator should place it. */
  destination: 'parking' | 'rails' | 'tomorrow';
  plannedStart?: string;
  routine?: 'morning' | 'evening' | 'anytime';
}

export interface BrainDumpResult {
  tasks: ParsedDumpTask[];
  raw: string;
}

const HIGH_RE =
  /\b(deep|focus|write|coding|code|report|deadline|complex|hard|tax|form|essay|study|revise|presentation|meeting prep|project)\b/i;
const LOW_RE =
  /\b(tidy|brush|water|email one|quick|call mum|call dad|dishwasher|laundry|stretch|meds|snack|reply|text|put away|bin)\b/i;

const DURATION_RE =
  /\b(\d+)\s*(m|min|mins|minute|minutes|h|hr|hrs|hour|hours)\b/i;

function inferLoad(text: string): CognitiveLoad {
  if (HIGH_RE.test(text)) return 'high';
  if (LOW_RE.test(text)) return 'low';
  if (/\b(admin|emails?|messages?|errands?|shop|book|schedule)\b/i.test(text)) {
    return 'medium';
  }
  // Longer lines tend to be heavier
  if (text.split(/\s+/).length >= 8) return 'medium';
  return 'medium';
}

function inferDuration(text: string, load: CognitiveLoad): number {
  const m = text.match(DURATION_RE);
  if (m) {
    const n = Number(m[1]);
    const unit = m[2].toLowerCase();
    if (unit.startsWith('h')) return Math.max(5, Math.round(n * 60));
    return Math.max(2, n);
  }
  if (load === 'low') return 10;
  if (load === 'high') return 45;
  return 25;
}

function cleanLine(line: string): string {
  return line
    .replace(/^[-*•\d.)\]]+\s*/, '')
    .replace(DURATION_RE, '')
    .replace(/\b(tomorrow|today|tonight|this afternoon|this morning)\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function splitIntoLines(raw: string): string[] {
  const normalised = raw
    .replace(/\r\n/g, '\n')
    .replace(/[;]+/g, '\n')
    .replace(/\band then\b/gi, '\n')
    .replace(/\bthen\b/gi, '\n');

  const byNewline = normalised
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (byNewline.length > 1) return byNewline;

  // Single blob: split on commas if they look like a list
  const one = byNewline[0] ?? '';
  if (/,/.test(one) && one.split(',').length >= 2 && one.length < 220) {
    return one
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 1);
  }
  return one ? [one] : [];
}

function destinationFor(
  text: string,
  original: string
): ParsedDumpTask['destination'] {
  if (/\btomorrow\b/i.test(original) || /\btomorrow\b/i.test(text)) {
    return 'tomorrow';
  }
  if (/\b(tonight|this evening|later)\b/i.test(original)) {
    return 'parking';
  }
  // Short actionable → rails-ish (we still park unless it looks like a named block)
  if (text.length < 40 && LOW_RE.test(text)) return 'rails';
  return 'parking';
}

function plannedStartHint(original: string, now = new Date()): string | undefined {
  const mins = minutesSinceMidnight(now);
  if (/\bthis morning\b/i.test(original)) return minutesToHHMM(Math.max(mins, 9 * 60));
  if (/\bthis afternoon\b/i.test(original)) return minutesToHHMM(Math.max(mins, 14 * 60));
  if (/\btonight|this evening\b/i.test(original)) return minutesToHHMM(Math.max(mins, 20 * 60));
  if (/\btomorrow\b/i.test(original)) return '09:30';
  return undefined;
}

/**
 * Heuristic NL brain-dump parser — no external API.
 * Splits lists, tags load, estimates duration with +40% buffer.
 */
export function parseBrainDump(raw: string, now = new Date()): BrainDumpResult {
  const lines = splitIntoLines(raw);
  const tasks: ParsedDumpTask[] = lines.map((line) => {
    const text = cleanLine(line) || line.trim();
    const cognitiveLoad = inferLoad(line);
    const estimateMinutes = inferDuration(line, cognitiveLoad);
    const buffered = bufferedMinutes(estimateMinutes);
    const destination = destinationFor(text, line);
    return {
      text,
      cognitiveLoad,
      estimateMinutes,
      bufferedMinutes: buffered,
      destination,
      plannedStart: plannedStartHint(line, now),
      routine:
        destination === 'rails'
          ? 'anytime'
          : /\btonight|evening\b/i.test(line)
            ? 'evening'
            : 'anytime',
    };
  });

  return { tasks, raw };
}

export function parsedToParking(task: ParsedDumpTask): ParkingItem {
  return {
    id: crypto.randomUUID(),
    text: task.text,
    createdAt: Date.now(),
    cognitiveLoad: task.cognitiveLoad,
    estimateMinutes: task.estimateMinutes,
    bufferedMinutes: task.bufferedMinutes,
  };
}

export function speechRecognitionAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(
    (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown })
      .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition
  );
}
