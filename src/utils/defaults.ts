import type { AnchorBlock } from '../types';

export function defaultRailBlocks(): AnchorBlock[] {
  return [
    {
      id: crypto.randomUUID(),
      name: 'Morning settle',
      plannedStart: '08:15',
      durationMinutes: 20,
      preferredMedPhase: 'rising',
      status: 'upcoming',
    },
    {
      id: crypto.randomUUID(),
      name: 'Deep work block',
      plannedStart: '09:30',
      durationMinutes: 90,
      preferredMedPhase: 'peak',
      status: 'upcoming',
    },
    {
      id: crypto.randomUUID(),
      name: 'Admin / messages',
      plannedStart: '12:00',
      durationMinutes: 30,
      preferredMedPhase: 'peak',
      status: 'upcoming',
    },
    {
      id: crypto.randomUUID(),
      name: 'Afternoon focus',
      plannedStart: '14:00',
      durationMinutes: 60,
      preferredMedPhase: 'waning',
      status: 'upcoming',
    },
    {
      id: crypto.randomUUID(),
      name: 'Wind-down',
      plannedStart: '18:00',
      durationMinutes: 30,
      preferredMedPhase: 'offline',
      status: 'upcoming',
    },
  ];
}
