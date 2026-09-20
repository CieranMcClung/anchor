import strings from './strings.p0.json';

export type StringKey = Exclude<keyof typeof strings, '_meta'>;

export function t(key: StringKey): string {
  return strings[key];
}

const COMPLETE_BODIES: StringKey[] = [
  'task.complete.body',
  'task.complete.alt1',
  'task.complete.alt2',
  'task.complete.alt3',
];

export function completeAck(): { title: string; body: string } {
  const index = Math.floor(Math.random() * COMPLETE_BODIES.length);
  return {
    title: t('task.complete.title'),
    body: t(COMPLETE_BODIES[index]!),
  };
}
