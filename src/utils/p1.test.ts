import { describe, expect, it } from 'vitest';
import { loadFitsZone, suggestedLoadsForZone } from './routingHints';
import { shouldShowHyperfocus } from './duration';
import { stubAiBrainDump } from './aiBrainDump';
import { isCaptureKey, isTypingTarget } from './hotkeys';
import { normalizeSettings } from './storage';

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
    expect(shouldShowHyperfocus(0, 45, false, true)).toBe(true);
    expect(shouldShowHyperfocus(0, 45, true, true)).toBe(false);
  });
});

describe('B1 AI brain-dump local engine', () => {
  it('reviews atomics even when offline', () => {
    const result = stubAiBrainDump('email boss then tidy desk', 40, false);
    expect(result.mode).toBe('review');
    expect(result.tasks.length).toBeGreaterThan(1);
    for (const task of result.tasks) {
      expect(task.estimateMinutes).toBeLessThan(10);
    }
  });

  it('splits to sub-10m atomics for review', () => {
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

describe('B1 settings migrate', () => {
  it('turns brain-dump on when upgrading from the P1 stub', () => {
    const upgraded = normalizeSettings({
      onsetEndHours: 2,
      peakEndHours: 10,
      comedownEndHours: 12,
      bufferPercent: 40,
      hyperfocusMinutes: 60,
      aiBrainDump: false,
    });
    expect(upgraded.aiBrainDump).toBe(true);
    expect(upgraded.previewHyperfocus).toBe(false);
    expect(upgraded.qaRestBuryOverride).toBe(false);
  });

  it('respects an explicit off after B1 settings exist', () => {
    const kept = normalizeSettings({
      onsetEndHours: 2,
      peakEndHours: 10,
      comedownEndHours: 12,
      aiBrainDump: false,
      previewHyperfocus: false,
      qaRestBuryOverride: false,
    });
    expect(kept.aiBrainDump).toBe(false);
  });
});
