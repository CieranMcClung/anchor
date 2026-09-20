/**
 * User-provided OpenAI-compatible credentials. localStorage only.
 * Never read Cursor/server env secrets into the SPA bundle.
 */

const KEY = 'keel-llm-v1';

export const DEFAULT_LLM_BASE_URL = 'https://api.openai.com/v1';
export const DEFAULT_LLM_MODEL = 'gpt-4o-mini';

export interface LlmSettings {
  apiKey: string;
  baseUrl: string;
  model: string;
}

export function defaultLlmSettings(): LlmSettings {
  return {
    apiKey: '',
    baseUrl: DEFAULT_LLM_BASE_URL,
    model: DEFAULT_LLM_MODEL,
  };
}

export function loadLlmSettings(): LlmSettings {
  const fallback = defaultLlmSettings();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return {
      apiKey: typeof parsed.apiKey === 'string' ? parsed.apiKey : '',
      baseUrl:
        typeof parsed.baseUrl === 'string' && parsed.baseUrl.trim()
          ? parsed.baseUrl.trim().replace(/\/+$/, '')
          : DEFAULT_LLM_BASE_URL,
      model:
        typeof parsed.model === 'string' && parsed.model.trim()
          ? parsed.model.trim()
          : DEFAULT_LLM_MODEL,
    };
  } catch {
    return fallback;
  }
}

export function saveLlmSettings(partial: Partial<LlmSettings>): LlmSettings {
  const next = { ...loadLlmSettings(), ...partial };
  next.baseUrl = next.baseUrl.trim().replace(/\/+$/, '') || DEFAULT_LLM_BASE_URL;
  next.model = next.model.trim() || DEFAULT_LLM_MODEL;
  next.apiKey = next.apiKey.trim();
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* quota / private mode */
  }
  return next;
}

export function clearLlmSettings(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export function hasLlmKey(settings = loadLlmSettings()): boolean {
  return settings.apiKey.trim().length > 0;
}
