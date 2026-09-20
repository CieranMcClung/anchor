import { describe, expect, it } from 'vitest';
import { ATOMIC_ESTIMATE_MAX, DEFAULT_BUFFER_PERCENT } from '../types';
import {
  deconstructLocal,
  inferLoad,
  stubAiBrainDump,
  toAtomicTask,
} from './aiBrainDump';
import { parseLlmTasks } from './llmEnhance';

const BUF = DEFAULT_BUFFER_PERCENT;

function texts(raw: string) {
  return deconstructLocal(raw, BUF).tasks.map((t) => t.text.toLowerCase());
}

describe('B1 local deconstructor', () => {
  it('always reviews offline — never requires a network', () => {
    const result = deconstructLocal(
      'email boss then tidy desk\n- write the report',
      BUF
    );
    expect(result.source).toBe('local');
    expect(result.mode).toBe('review');
    expect(result.tasks.length).toBeGreaterThan(1);
    for (const task of result.tasks) {
      expect(task.estimateMinutes).toBeLessThan(10);
      expect(task.estimateMinutes).toBeLessThanOrEqual(ATOMIC_ESTIMATE_MAX);
    }
  });

  it('splits bullets, numbered lists, and then-chains', () => {
    const result = deconstructLocal(
      [
        '- email the boss',
        '* tidy the desk',
        '1. reply to Sam',
        '2) book dentist then buy stamps',
      ].join('\n'),
      BUF
    );
    const body = result.tasks.map((t) => t.text.toLowerCase()).join(' | ');
    expect(body).toContain('email the boss');
    expect(body).toContain('tidy the desk');
    expect(body).toContain('reply to sam');
    expect(body).toContain('book dentist');
    expect(body).toContain('buy stamps');
  });

  it('parses a chaotic wall and drops filler', () => {
    const result = deconstructLocal(
      'anyway um I need to email boss then tidy desk lol also write the report whatever',
      BUF
    );
    expect(result.mode).toBe('review');
    const kept = result.tasks.filter((t) => !t.noise).map((t) => t.text.toLowerCase());
    expect(kept.some((t) => t.includes('email'))).toBe(true);
    expect(kept.some((t) => t.includes('tidy'))).toBe(true);
    expect(kept.some((t) => t.includes('report'))).toBe(true);
    expect(kept.some((t) => t === 'anyway' || t === 'lol' || t === 'whatever')).toBe(
      false
    );
  });

  it('tags rough load L/M/H', () => {
    expect(inferLoad('tidy desk and drink water')).toBe('low');
    expect(inferLoad('write the report before the deadline')).toBe('high');
    expect(inferLoad('sort the inbox a bit')).toBe('medium');
  });

  it('adds optional deps on a then-chain, not on independent bullets', () => {
    const chained = deconstructLocal('email boss then tidy desk', BUF);
    expect(chained.tasks.length).toBeGreaterThanOrEqual(2);
    expect(chained.tasks[0]?.dependsOn).toBeUndefined();
    expect(chained.tasks[1]?.dependsOn).toBe(0);

    const bullets = deconstructLocal('- email boss\n- tidy desk', BUF);
    expect(bullets.tasks.every((t) => t.dependsOn == null)).toBe(true);
  });

  it('splits a long wall into sub-10m atomics', () => {
    const wall =
      'Need to go through the whole inbox and answer every thread and update the tracker and file the receipts and then draft the weekly report for the team';
    const result = deconstructLocal(wall, BUF);
    expect(result.mode).toBe('review');
    expect(result.tasks.length).toBeGreaterThan(1);
    for (const task of result.tasks) {
      expect(task.estimateMinutes).toBeLessThan(10);
    }
  });

  it('parks raw when there is nothing to split', () => {
    expect(deconstructLocal('   ', BUF).mode).toBe('raw-park');
    expect(deconstructLocal('um', BUF).mode).toBe('raw-park');
  });

  it('keeps stubAiBrainDump working without an online flag', () => {
    const offline = stubAiBrainDump('email boss then tidy desk', BUF, false);
    const online = stubAiBrainDump('email boss then tidy desk', BUF, true);
    expect(offline.mode).toBe('review');
    expect(online.mode).toBe('review');
    expect(offline.tasks.map((t) => t.text)).toEqual(online.tasks.map((t) => t.text));
  });

  it('clamps estimates under 10 even if a caller asks for more', () => {
    const task = toAtomicTask('deep project report', BUF, { estimateMinutes: 45 });
    expect(task.estimateMinutes).toBeLessThan(10);
  });
});

describe('optional LLM parser', () => {
  it('accepts JSON and clamps minutes', () => {
    const tasks = parseLlmTasks(
      '{"tasks":[{"text":"Email boss","estimateMinutes":20,"load":"medium"}]}',
      BUF
    );
    expect(tasks).not.toBeNull();
    expect(tasks![0]?.text).toBe('Email boss');
    expect(tasks![0]?.estimateMinutes).toBeLessThan(10);
  });

  it('reads fenced JSON and ignores banned copy', () => {
    const ok = parseLlmTasks(
      '```json\n{"tasks":[{"text":"Tidy desk","estimateMinutes":4,"load":"low"}]}\n```',
      BUF
    );
    expect(ok?.[0]?.text).toBe('Tidy desk');
    expect(
      parseLlmTasks(
        '{"tasks":[{"text":"Wait for Peak then tidy","estimateMinutes":5,"load":"low"}]}',
        BUF
      )
    ).toBeNull();
  });

  it('returns null on garbage so callers keep local results', () => {
    expect(parseLlmTasks('not json', BUF)).toBeNull();
    expect(parseLlmTasks('{"tasks":[]}', BUF)).toBeNull();
  });
});

describe('LLM enhance fallback', () => {
  it('keeps local tasks when fetch fails', async () => {
    const { enhanceBrainDump } = await import('./llmEnhance');
    const failing = async () => {
      throw new Error('network');
    };
    const result = await enhanceBrainDump(
      'email boss then tidy desk',
      BUF,
      failing as unknown as typeof fetch
    );
    expect(result.source).toBe('local');
    expect(result.tasks.length).toBeGreaterThan(1);
  });
});

describe('smoke texts helper', () => {
  it('keeps a short bullet list readable', () => {
    expect(texts('- meds\n- drink water').join(' ')).toMatch(/meds|water/);
  });
});
