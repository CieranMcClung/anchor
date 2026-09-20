import { describe, expect, it } from 'vitest';
import { loadFitsZone, suggestedLoadsForZone } from './routingHints';
import { shouldShowHyperfocus } from './duration';
import { stubAiBrainDump } from './aiBrainDump';
import { isCaptureKey, isTypingTarget } from './hotkeys';

describe('A1 routing hints', () => {
  it('suggests loads by zone without forcing a pick', () => {
    expect(suggestedLoadsForZone('peak')).toEqual(['high', 'medium']);
    expect(suggestedLoadsForZone('onset')).toEqual(['low', 'medium']);
    expect(suggestedLoadsForZone('comedown')).toEqual(['low']);
    expect(suggestedLoadsForZone('unknown')).toEqual(['low', 'medium', 'high']);
    expect(loadFitsZone('high', 'comedown')).toBe(false);
    expect(loadFitsZone('low', 'comedown')).toBe(true);
    expect(loadFitsZone('high', 'unknown')).toBe(true);
  });
});

describe('A4 hyperfocus chip', () => {
  it('appears after the tunable threshold and respects dismiss', () => {
    expect(shouldShowHyperfocus(44 * 60 * 1000, 45, false)).toBe(false);
    expect(shouldShowHyperfocus(45 * 60 * 1000, 45, false)).toBe(true);
    expect(shouldShowHyperfocus(90 * 60 * 1000, 60, true)).toBe(false);
  });
});

describe('B1 AI brain-dump stub', () => {
  it('parks raw when offline', () => {
    const result = stubAiBrainDump('email boss then tidy desk', 40, false);
    expect(result.mode).toBe('raw-park');
    expect(result.tasks).toHaveLength(1);
    expect(result.tasks[0]?.text).toBe('email boss then tidy desk');
  });

  it('splits to sub-10m atomics for review when online', () => {
    const result = stubAiBrainDump('email boss then tidy desk', 40, true);
    expect(result.mode).toBe('review');
    expect(result.tasks.length).toBeGreaterThan(1);
    for (const task of result.tasks) {
      expect(task.estimateMinutes).toBeLessThan(10);
    }
  });
});

describe('A6 capture shortcut', () => {
  it('keeps c and / as capture keys', () => {
    expect(isCaptureKey('c')).toBe(true);
    expect(isCaptureKey('C')).toBe(true);
    expect(isCaptureKey('/')).toBe(true);
    expect(isCaptureKey('d')).toBe(false);
  });

  it('ignores typing targets', () => {
    const input = { tagName: 'INPUT', isContentEditable: false };
    expect(isTypingTarget(input)).toBe(true);
  });
});
