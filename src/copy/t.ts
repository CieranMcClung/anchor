import stringsP0 from './strings.p0.json';
import stringsP1 from './strings.p1.json';

const strings = { ...stringsP0, ...stringsP1 };

export type StringKey = Exclude<keyof typeof strings, '_meta'>;

export function t(key: StringKey): string {
  return strings[key];
}

export function tf(
  key: StringKey,
  vars: Record<string, string | number>
): string {
  return t(key).replace(/\{(\w+)\}/g, (_, name: string) =>
    name in vars ? String(vars[name]) : `{${name}}`
  );
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
