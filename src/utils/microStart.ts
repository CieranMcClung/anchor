const TEMPLATES: ((task: string, dod?: string) => string)[] = [
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
  (t, dod) =>
    dod
      ? `Check one piece of “done” for “${t}”: ${dod.slice(0, 80)}`
      : `Name what “done enough” looks like for “${t}” in one line`,
];

export function suggestMicroStart(
  task: string,
  seed?: number,
  definitionOfDone?: string
): string {
  const trimmed = task.trim() || 'this';
  const idx =
    seed !== undefined
      ? Math.abs(seed) % TEMPLATES.length
      : Math.floor(Math.random() * TEMPLATES.length);
  return TEMPLATES[idx](trimmed, definitionOfDone?.trim());
}

export function regenerateMicroStart(
  task: string,
  current: string,
  definitionOfDone?: string
): string {
  let next = suggestMicroStart(task, undefined, definitionOfDone);
  let attempts = 0;
  while (next === current && attempts < 8) {
    next = suggestMicroStart(task, Date.now() + attempts, definitionOfDone);
    attempts += 1;
  }
  return next;
}

/** Micro-step tailored for Paralyzed / Stuck — always actionable in ~2 min. */
export function paralyzedMicroStep(task: string, definitionOfDone: string): string {
  const dod = definitionOfDone.trim();
  const t = task.trim() || 'this';
  const options = [
    `Just open the thing for “${t}” — don’t finish it`,
    dod
      ? `Write one word toward: ${dod.slice(0, 60)}`
      : `Write one word about what “${t}” needs`,
    `Put your hands on the materials for “${t}” for 2 minutes`,
    `Set a 2-min timer and only read the first line related to “${t}”`,
    `Stand up, breathe once, then touch the starting point for “${t}”`,
  ];
  return options[Math.floor(Math.random() * options.length)];
}
