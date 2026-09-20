import { describe, expect, it } from 'vitest';
import { buryOpenWork, canRestBury } from './restBury';
import type { Anchor, FocusSession } from '../types';

describe('Item 7 Rest bury', () => {
  it('allows bury on comedown, offline, or QA override — no minutes wait', () => {
    expect(
      canRestBury({ zone: 'comedown', offline: false, qaOverride: false })
    ).toBe(true);
    expect(
      canRestBury({ zone: 'onset', offline: true, qaOverride: false })
    ).toBe(true);
    expect(
      canRestBury({ zone: 'peak', offline: false, qaOverride: true })
    ).toBe(true);
    expect(
      canRestBury({ zone: 'peak', offline: false, qaOverride: false })
    ).toBe(false);
    expect(
      canRestBury({ zone: 'unknown', offline: false, qaOverride: false })
    ).toBe(false);
  });

  it('parks open work and keeps done items on Today', () => {
    const anchors: Anchor[] = [
      {
        id: 'a1',
        title: 'Open thing',
        dod: '',
        rawMinutes: 8,
        bufferedMinutes: 10,
        load: 'medium',
        status: 'open',
      },
      {
        id: 'a2',
        title: 'Finished',
        dod: '',
        rawMinutes: 5,
        bufferedMinutes: 5,
        load: 'low',
        status: 'done',
      },
    ];
    const focus: FocusSession = {
      title: 'Deep block',
      dod: '',
      load: 'high',
      rawMinutes: 9,
      bufferedMinutes: 15,
      anchorId: null,
      parkId: null,
      runState: 'running',
      accumulatedMs: 1000,
      runningSince: 1,
    };
    const next = buryOpenWork({
      anchors,
      park: [],
      focus,
      now: 42,
    });
    expect(next.focus).toBeNull();
    expect(next.anchors).toHaveLength(1);
    expect(next.anchors[0]?.title).toBe('Finished');
    expect(next.park.map((p) => p.text)).toEqual(['Deep block', 'Open thing']);
  });
});
