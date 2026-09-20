/**
 * Optional B1 LLM enhance. User key from localStorage only.
 * Any miss/fail → caller keeps the local heuristic result. Never throws to UI.
 */

import type { AtomicTask } from './aiBrainDump';
import { deconstructLocal, inferLoad, isOffline, toAtomicTask } from './aiBrainDump';
import { hasLlmKey, loadLlmSettings } from './llmKey';
import { LLM_SYSTEM_PROMPT, llmOutputIsBanned } from './researchGuardrails';

const TIMEOUT_MS = 8000;

interface LlmTask {
  text?: unknown;
  estimateMinutes?: unknown;
  load?: unknown;
  dependsOn?: unknown;
  noise?: unknown;
}

function extractJson(content: string): unknown {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = (fenced?.[1] ?? content).trim();
  const start = body.indexOf('{');
  const end = body.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('no-json');
  }
  return JSON.parse(body.slice(start, end + 1));
}

export function parseLlmTasks(
  content: string,
  bufferPercent: number
): AtomicTask[] | null {
  try {
    if (llmOutputIsBanned(content)) return null;
    const parsed = extractJson(content) as { tasks?: unknown };
    if (!Array.isArray(parsed.tasks) || parsed.tasks.length === 0) return null;
    const tasks: AtomicTask[] = [];
    for (const raw of parsed.tasks as LlmTask[]) {
      if (!raw || typeof raw.text !== 'string') continue;
      const text = raw.text.trim();
      if (text.length < 2) continue;
      if (llmOutputIsBanned(text)) continue;
      const load =
        raw.load === 'low' || raw.load === 'medium' || raw.load === 'high'
          ? raw.load
          : inferLoad(text);
      const dependsOn =
        typeof raw.dependsOn === 'number' &&
        Number.isInteger(raw.dependsOn) &&
        raw.dependsOn >= 0 &&
        raw.dependsOn < (parsed.tasks as unknown[]).length &&
        raw.dependsOn !== tasks.length
          ? raw.dependsOn
          : undefined;
      tasks.push(
        toAtomicTask(text, bufferPercent, {
          load,
          estimateMinutes:
            typeof raw.estimateMinutes === 'number' ? raw.estimateMinutes : undefined,
          dependsOn,
          noise: raw.noise === true,
        })
      );
    }
    return tasks.length > 0 ? tasks.slice(0, 12) : null;
  } catch {
    return null;
  }
}

export async function enhanceBrainDump(
  raw: string,
  bufferPercent: number,
  fetchImpl: typeof fetch = fetch
): Promise<{ tasks: AtomicTask[]; source: 'local' | 'llm' }> {
  const local = deconstructLocal(raw, bufferPercent);

  if (isOffline() || !hasLlmKey()) {
    return { tasks: local.tasks, source: 'local' };
  }

  const llm = loadLlmSettings();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetchImpl(`${llm.baseUrl}/chat/completions`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${llm.apiKey}`,
      },
      body: JSON.stringify({
        model: llm.model,
        temperature: 0.2,
        messages: [
          { role: 'system', content: LLM_SYSTEM_PROMPT },
          { role: 'user', content: raw.trim() },
        ],
      }),
    });
    if (!res.ok) return { tasks: local.tasks, source: 'local' };
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) return { tasks: local.tasks, source: 'local' };
    const parsed = parseLlmTasks(content, bufferPercent);
    if (!parsed) return { tasks: local.tasks, source: 'local' };
    return { tasks: parsed, source: 'llm' };
  } catch {
    return { tasks: local.tasks, source: 'local' };
  } finally {
    clearTimeout(timer);
  }
}
