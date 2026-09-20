import type { Anchor, Load } from '../types';
import { bufferedMinutes } from './duration';
import { newId } from './time';

interface Seed {
  title: string;
  dod: string;
  rawMinutes: number;
  load: Load;
}

const SEEDS: Record<Load, Seed[]> = {
  low: [
    {
      title: 'Meds + water',
      dod: 'Dose taken, glass of water done.',
      rawMinutes: 5,
      load: 'low',
    },
  ],
  medium: [
    {
      title: 'Meds + water',
      dod: 'Dose taken, glass of water done.',
      rawMinutes: 5,
      load: 'low',
    },
    {
      title: 'One useful block',
      dod: 'The next useful thing is far enough to put down.',
      rawMinutes: 25,
      load: 'medium',
    },
  ],
  high: [
    {
      title: 'Meds + water',
      dod: 'Dose taken, glass of water done.',
      rawMinutes: 5,
      load: 'low',
    },
    {
      title: 'One useful block',
      dod: 'The next useful thing is far enough to put down.',
      rawMinutes: 25,
      load: 'medium',
    },
    {
      title: 'Deep focus block',
      dod: 'The main piece is far enough to put down.',
      rawMinutes: 45,
      load: 'high',
    },
  ],
};

export function seedAnchors(load: Load): Anchor[] {
  return SEEDS[load].map((s) => ({
    id: newId(),
    title: s.title,
    dod: s.dod,
    rawMinutes: s.rawMinutes,
    bufferedMinutes: bufferedMinutes(s.rawMinutes),
    load: s.load,
    status: 'open',
  }));
}

export function loadCue(load: Load): string {
  switch (load) {
    case 'low':
      return 'One thing. Pick it when you’re ready.';
    case 'medium':
      return 'A couple of things. Pick one.';
    case 'high':
      return 'Three things. Pick one.';
  }
}
