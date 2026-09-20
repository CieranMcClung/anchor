import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PK_WINDOWS,
  DEFAULT_SETTINGS,
  PEAK_PLATEAU_START_HOURS,
} from '../types';
import {
  SUPERSEDED_PK_PLACEHOLDERS,
  isSupersededPkPlaceholder,
  normalizePkWindows,
  peakStartHours,
  scaffoldBin,
  zoneFromElapsed,
  zoneLabel,
} from './pk';
import { bufferedMinutes } from './duration';

describe('focus-energy PK placeholders', () => {
  it('ships Onset 0–2, Peak 6–10, Comedown 10–12 — not Peak-as-2–6 Tmax', () => {
    expect(DEFAULT_PK_WINDOWS.onsetEndHours).toBe(2);
    expect(DEFAULT_PK_WINDOWS.peakEndHours).toBe(10);
    expect(DEFAULT_PK_WINDOWS.comedownEndHours).toBe(12);
    expect(PEAK_PLATEAU_START_HOURS).toBe(6);
    expect(DEFAULT_SETTINGS).toEqual(DEFAULT_PK_WINDOWS);
    expect(isSupersededPkPlaceholder(DEFAULT_PK_WINDOWS)).toBe(false);
    expect(
      isSupersededPkPlaceholder({
        onsetEndHours: 2,
        peakEndHours: 6,
        comedownEndHours: 10,
      })
    ).toBe(true);
    for (const old of SUPERSEDED_PK_PLACEHOLDERS) {
      expect(isSupersededPkPlaceholder(old)).toBe(true);
    }
  });

  it('keeps climbing 2–6h under Onset; Peak chip from 6h', () => {
    const w = DEFAULT_PK_WINDOWS;
    expect(peakStartHours(w)).toBe(6);
    expect(scaffoldBin(0.5, w)).toBe('rising');
    expect(scaffoldBin(1.9, w)).toBe('rising');
    expect(scaffoldBin(2.5, w)).toBe('climb');
    expect(scaffoldBin(5.9, w)).toBe('climb');
    expect(scaffoldBin(6, w)).toBe('peak');
    expect(scaffoldBin(9.9, w)).toBe('peak');
    expect(scaffoldBin(10, w)).toBe('taper');
    expect(scaffoldBin(14, w)).toBe('taper');

    expect(zoneFromElapsed(0.5, w)).toBe('onset');
    expect(zoneFromElapsed(5.9, w)).toBe('onset');
    expect(zoneFromElapsed(6, w)).toBe('peak');
    expect(zoneFromElapsed(8, w)).toBe('peak');
    expect(zoneFromElapsed(10, w)).toBe('comedown');
    expect(zoneFromElapsed(14, w)).toBe('comedown');

    expect(zoneLabel('onset')).toBe('Onset');
    expect(zoneLabel('peak')).toBe('Peak');
    expect(zoneLabel('comedown')).toBe('Comedown');
  });

  it('clamps comedown after peak and does not use an 8h hard cutoff', () => {
    const custom = normalizePkWindows({
      onsetEndHours: 2,
      peakEndHours: 10,
      comedownEndHours: 8,
    });
    expect(custom.comedownEndHours).toBeGreaterThanOrEqual(custom.peakEndHours);
  });
});

describe('duration buffer', () => {
  it('multiplies by 1.4 and rounds to nearest 5 minutes', () => {
    expect(bufferedMinutes(10)).toBe(15);
    expect(bufferedMinutes(25)).toBe(35);
    expect(bufferedMinutes(45)).toBe(65);
  });
});
