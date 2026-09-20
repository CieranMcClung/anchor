/**
 * B1 product lock — research FAIL / PASS.
 * Shared by product copy tests and the optional LLM enhance prompt.
 * PK Onset / Peak / Comedown are a user-modelled map, not drug levels.
 */

/** Hard-reject frames. Do not use as product claims or LLM output. */
export const RESEARCH_FAIL = [
  'diagnose AuDHD',
  'med dose/timing/optimisation',
  'wait for Peak/coverage',
  'plasma/efficacy claims',
  'dopamine tank/refill',
  'shame/guilt',
  'hard interrupt as clinical hygiene',
] as const;

/** Allowed B1 shape: dump → clusters → atomic next steps only. */
export const RESEARCH_PASS =
  'dump → clusters → atomic next steps only. Scaffolding, not clinical advice.';

/**
 * Optional LLM system prompt. Scaffolding only.
 * Mentions the FAIL list so the model will not emit those frames.
 */
export const LLM_SYSTEM_PROMPT = `You are a scaffolding helper for a local planner. You are not a clinician and you do not give medical advice.

Turn a chaotic dump into clusters of atomic next steps only.
Each step is something a person can do in under 10 minutes (estimateMinutes integer 1-9, before any time buffer).
load is exactly low, medium, or high.
Drop filler. If unsure, omit the line.
Optional dependsOn is a 0-based index of another task in this list.

Onset, Peak, and Comedown — if the dump mentions them — are a user-modelled map from a dose log, not plasma levels, not coverage, and not drug efficacy.

You MUST NOT:
- diagnose AuDHD or ADHD
- advise on medication dose, timing, or optimisation
- tell anyone to wait for Peak or wait for coverage
- make plasma or efficacy claims
- use dopamine-tank or refill language
- use shame or guilt
- treat a hard interrupt as clinical hygiene

Return JSON only: {"tasks":[{"text":"string","estimateMinutes":5,"load":"medium","dependsOn":0}]}`;

/**
 * Detect FAIL frames in generated text (LLM output or product copy claims).
 * Negation disclaimers ("not a plasma prediction") are allowed when allowNegation is true.
 */
const FAIL_CLAIM = [
  /\bdiagnos(?:e|is|ing)\b.{0,40}\b(?:adhd|audhd)\b/i,
  /\b(?:adhd|audhd)\s+diagnos/i,
  /\byou (?:have|are)\s+(?:an?\s+)?(?:adhd|audhd)\b/i,
  /\b(?:increase|decrease|adjust|optimis(?:e|ation)|optimiz(?:e|ation)|titrate)\b.{0,40}\b(?:dose|medication|meds|methylphenidate)\b/i,
  /\b(?:dose|medication|meds)\b.{0,40}\b(?:optimis(?:e|ation)|optimiz(?:e|ation)|timing advice)\b/i,
  /\bwait (?:for|until)\s+(?:peak|coverage)\b/i,
  /\buntil (?:you(?:'re| are) (?:at|in) )?peak\b/i,
  /\bplasma\s+(?:level|curve|prediction|concentration)\b/i,
  /\befficacy\s+(?:claim|curve|prediction)\b/i,
  /\bdopamine(?:\s+tank|\s+refill)?\b/i,
  /\brefill\b.{0,20}\bdopamine\b/i,
  /\bclinical hygiene\b/i,
  /\bhard interrupt\b.{0,40}\b(?:hygiene|clinical)\b/i,
  /\b(?:you should feel )?shame\b/i,
  /\bguilt(?:y)?\b/i,
] as const;

const NEGATION_PREFIX = /\bnot (?:a |an |your )?/i;

export function containsResearchFail(
  text: string,
  opts: { allowNegation?: boolean } = {}
): boolean {
  const { allowNegation = false } = opts;
  for (const pattern of FAIL_CLAIM) {
    const match = pattern.exec(text);
    if (!match || match.index === undefined) continue;
    if (allowNegation) {
      const before = text.slice(Math.max(0, match.index - 24), match.index);
      if (NEGATION_PREFIX.test(before) || /\bnot\b/i.test(before)) continue;
    }
    return true;
  }
  return false;
}

export function llmOutputIsBanned(text: string): boolean {
  return containsResearchFail(text, { allowNegation: false });
}
