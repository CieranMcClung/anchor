import type { AnchorBlock } from '../types';

export function morningTemplate(): AnchorBlock[] {
  return [
    {
      id: crypto.randomUUID(),
      name: 'Meds + water',
      plannedStart: '08:00',
      durationMinutes: 5,
      cognitiveLoad: 'low',
      routine: 'morning',
      preferredMedPhase: 'before',
      status: 'upcoming',
    },
    {
      id: crypto.randomUUID(),
      name: 'Breakfast',
      plannedStart: '08:15',
      durationMinutes: 20,
      cognitiveLoad: 'low',
      routine: 'morning',
      preferredMedPhase: 'onset',
      status: 'upcoming',
    },
    {
      id: crypto.randomUUID(),
      name: 'Brush teeth',
      plannedStart: '08:40',
      durationMinutes: 5,
      cognitiveLoad: 'low',
      routine: 'morning',
      preferredMedPhase: 'onset',
      status: 'upcoming',
    },
    {
      id: crypto.randomUUID(),
      name: 'Get dressed',
      plannedStart: '08:50',
      durationMinutes: 10,
      cognitiveLoad: 'low',
      routine: 'morning',
      preferredMedPhase: 'onset',
      status: 'upcoming',
    },
    {
      id: crypto.randomUUID(),
      name: 'Open Anchor / plan day',
      plannedStart: '09:00',
      durationMinutes: 10,
      cognitiveLoad: 'medium',
      routine: 'morning',
      preferredMedPhase: 'onset',
      status: 'upcoming',
    },
  ];
}

export function eveningTemplate(): AnchorBlock[] {
  return [
    {
      id: crypto.randomUUID(),
      name: 'Log off screens',
      plannedStart: '21:00',
      durationMinutes: 10,
      cognitiveLoad: 'low',
      routine: 'evening',
      preferredMedPhase: 'offline',
      status: 'upcoming',
    },
    {
      id: crypto.randomUUID(),
      name: 'Tidy one surface',
      plannedStart: '21:15',
      durationMinutes: 10,
      cognitiveLoad: 'low',
      routine: 'evening',
      preferredMedPhase: 'offline',
      status: 'upcoming',
    },
    {
      id: crypto.randomUUID(),
      name: 'Brush teeth',
      plannedStart: '21:30',
      durationMinutes: 5,
      cognitiveLoad: 'low',
      routine: 'evening',
      preferredMedPhase: 'offline',
      status: 'upcoming',
    },
    {
      id: crypto.randomUUID(),
      name: 'Unwind',
      plannedStart: '21:40',
      durationMinutes: 20,
      cognitiveLoad: 'low',
      routine: 'evening',
      preferredMedPhase: 'offline',
      status: 'upcoming',
    },
    {
      id: crypto.randomUUID(),
      name: 'Soft close',
      plannedStart: '22:00',
      durationMinutes: 10,
      cognitiveLoad: 'low',
      routine: 'evening',
      preferredMedPhase: 'offline',
      status: 'upcoming',
    },
  ];
}

export function defaultRailBlocks(): AnchorBlock[] {
  return [
    ...morningTemplate(),
    {
      id: crypto.randomUUID(),
      name: 'One meaningful task',
      plannedStart: '10:30',
      durationMinutes: 45,
      cognitiveLoad: 'high',
      routine: 'anytime',
      preferredMedPhase: 'peak',
      status: 'upcoming',
    },
    {
      id: crypto.randomUUID(),
      name: 'Admin / messages',
      plannedStart: '14:00',
      durationMinutes: 25,
      cognitiveLoad: 'medium',
      routine: 'anytime',
      preferredMedPhase: 'peak',
      status: 'upcoming',
    },
    ...eveningTemplate(),
  ];
}

export function buildRailsFromSettings(opts: {
  useMorning: boolean;
  useEvening: boolean;
  existing?: AnchorBlock[];
}): AnchorBlock[] {
  const custom =
    opts.existing?.filter((b) => b.routine === 'anytime') ??
    [
      {
        id: crypto.randomUUID(),
        name: 'One meaningful task',
        plannedStart: '10:30',
        durationMinutes: 45,
        cognitiveLoad: 'high' as const,
        routine: 'anytime' as const,
        preferredMedPhase: 'peak' as const,
        status: 'upcoming' as const,
      },
    ];

  return [
    ...(opts.useMorning ? morningTemplate() : []),
    ...custom.map((b) => ({ ...b, status: 'upcoming' as const })),
    ...(opts.useEvening ? eveningTemplate() : []),
  ];
}
