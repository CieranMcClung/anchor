const TEMPLATES: ((task: string) => string)[] = [
  (t) => `Open whatever you need for “${t}” and sit with it for 2 minutes`,
  (t) => `Write the first messy sentence / bullet about “${t}”`,
  (t) => `Clear just the surface you need for “${t}”`,
  (t) => `Name the very next physical action for “${t}” out loud, then do only that`,
  (t) => `Set a 2-min timer and only gather materials for “${t}”`,
  (t) => `Open the file / app / room for “${t}” — nothing else`,
  (t) => `Do the smallest possible version of “${t}” (ugly is fine)`,
  (t) => `Text or note one line: “Starting ${t} now”`,
  (t) => `Stand up, walk to where “${t}” happens, stay for 2 minutes`,
  (t) => `Delete / archive one blocker related to “${t}”`,
];

export function suggestMicroStart(task: string, seed?: number): string {
  const trimmed = task.trim() || 'this';
  const idx =
    seed !== undefined
      ? Math.abs(seed) % TEMPLATES.length
      : Math.floor(Math.random() * TEMPLATES.length);
  return TEMPLATES[idx](trimmed);
}

export function regenerateMicroStart(task: string, current: string): string {
  let next = suggestMicroStart(task);
  let attempts = 0;
  while (next === current && attempts < 8) {
    next = suggestMicroStart(task, Date.now() + attempts);
    attempts += 1;
  }
  return next;
}
