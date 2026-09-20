import { describe, expect, it } from 'vitest';
import stringsP0 from '../copy/strings.p0.json';
import stringsP1 from '../copy/strings.p1.json';
import { parseLlmTasks } from './llmEnhance';
import {
  LLM_SYSTEM_PROMPT,
  RESEARCH_FAIL,
  RESEARCH_PASS,
  containsResearchFail,
  llmOutputIsBanned,
} from './researchGuardrails';

const BUF = 40;

describe('B1 research lock', () => {
  it('states PASS as dump → clusters → atomic next steps', () => {
    expect(RESEARCH_PASS).toMatch(/dump → clusters → atomic next steps/i);
    expect(LLM_SYSTEM_PROMPT).toMatch(/clusters of atomic next steps/i);
    expect(LLM_SYSTEM_PROMPT).toMatch(/scaffolding/i);
    expect(LLM_SYSTEM_PROMPT).toMatch(/user-modelled map/i);
    expect(LLM_SYSTEM_PROMPT).not.toMatch(/adult AuDHD user/i);
  });

  it('names every FAIL frame in the optional LLM system prompt', () => {
    expect(RESEARCH_FAIL).toHaveLength(7);
    expect(LLM_SYSTEM_PROMPT).toMatch(/diagnos(?:e|is).{0,20}AuDHD/i);
    expect(LLM_SYSTEM_PROMPT).toMatch(/medication dose, timing, or optim/i);
    expect(LLM_SYSTEM_PROMPT).toMatch(/wait for Peak or wait for coverage/i);
    expect(LLM_SYSTEM_PROMPT).toMatch(/plasma/i);
    expect(LLM_SYSTEM_PROMPT).toMatch(/dopamine-tank/i);
    expect(LLM_SYSTEM_PROMPT).toMatch(/shame or guilt/i);
    expect(LLM_SYSTEM_PROMPT).toMatch(/hard interrupt as clinical hygiene/i);
    expect(LLM_SYSTEM_PROMPT).toMatch(/not a clinician/i);
  });

  it('hard-rejects FAIL claims in generated LLM text', () => {
    const banned = [
      'You have AuDHD',
      'Diagnose ADHD from this dump',
      'Increase your dose this afternoon',
      'Wait for Peak before you start',
      'Wait for coverage then email them',
      'This follows your plasma level',
      'Refill the dopamine tank',
      'You should feel shame for stalling',
      'Use a hard interrupt as clinical hygiene',
    ];
    for (const line of banned) {
      expect(llmOutputIsBanned(line), line).toBe(true);
      expect(
        parseLlmTasks(
          JSON.stringify({
            tasks: [{ text: line, estimateMinutes: 5, load: 'low' }],
          }),
          BUF
        )
      ).toBeNull();
    }
  });

  it('allows ordinary next-step copy', () => {
    expect(containsResearchFail('Email the boss then tidy the desk')).toBe(
      false
    );
    expect(containsResearchFail('Peak can hold medium load if you want it')).toBe(
      false
    );
    expect(
      containsResearchFail(
        'Onset, Peak, and Comedown are user-anchored focus-energy zones — not a plasma prediction',
        { allowNegation: true }
      )
    ).toBe(false);
  });

  it('keeps product UI strings free of FAIL claims (disclaimer may negate them)', () => {
    const skip = new Set(['_meta', 'disclaimer.pkZones']);
    const records = [
      ...Object.entries(stringsP0),
      ...Object.entries(stringsP1),
    ];
    for (const [key, value] of records) {
      if (skip.has(key) || key === '_meta') continue;
      if (typeof value !== 'string') continue;
      expect(containsResearchFail(value, { allowNegation: true }), key).toBe(
        false
      );
    }
  });
});
