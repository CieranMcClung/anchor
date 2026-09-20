import type { MicroDeconstruction } from '../types';

/**
 * Fragment a stuck task into exactly three absurdly small ~2-minute micro-steps.
 * Step 1 is always the lightest physical initiation.
 */
export function buildThreeMicroSteps(
  task: string,
  definitionOfDone = ''
): [string, string, string] {
  const t = task.trim() || 'this';
  const dod = definitionOfDone.trim();

  const step1Options = [
    `Touch or open the thing for “${t}” — nothing else`,
    `Put the materials for “${t}” within reach`,
    `Sit where “${t}” happens and stay for two minutes`,
  ];
  const step2Options = [
    `Write one messy word or bullet about “${t}”`,
    `Read only the first line related to “${t}”`,
    dod
      ? `Note one tiny piece of “done”: ${dod.slice(0, 50)}`
      : `Name the smallest next physical action for “${t}”`,
  ];
  const step3Options = [
    `Do the ugliest 2-minute version of “${t}”`,
    `Clear one tiny blocker for “${t}” (or park it)`,
    `Make one mark of progress on “${t}” — then stop`,
  ];

  const pick = <T,>(arr: T[], seed: number): T =>
    arr[Math.abs(seed) % arr.length];

  const seed = hashSeed(t + '|' + dod);
  return [
    pick(step1Options, seed),
    pick(step2Options, seed + 7),
    pick(step3Options, seed + 13),
  ];
}

function hashSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function createDeconstruction(
  task: string,
  definitionOfDone = ''
): MicroDeconstruction {
  return {
    steps: buildThreeMicroSteps(task, definitionOfDone),
    currentIndex: 0,
    completed: [false, false, false],
  };
}

/** Advance to next step after completing current. Returns null if all done. */
export function completeCurrentStep(
  d: MicroDeconstruction
): MicroDeconstruction | null {
  const completed = [...d.completed] as [boolean, boolean, boolean];
  completed[d.currentIndex] = true;
  if (d.currentIndex >= 2) {
    return { ...d, completed, currentIndex: 2 };
  }
  return {
    ...d,
    completed,
    currentIndex: d.currentIndex + 1,
  };
}

export function isDeconstructionFinished(d: MicroDeconstruction): boolean {
  return d.completed.every(Boolean) || (d.currentIndex === 2 && d.completed[2]);
}
