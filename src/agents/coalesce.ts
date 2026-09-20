/**
 * Prevent agent prompt spam: coalesce by kind + cooldown.
 */

const DEFAULT_COOLDOWN_MS = 12 * 60 * 1000; // 12 minutes between same-kind prompts

export function shouldShowPrompt(
  kind: string,
  lastKind: string | null,
  lastAt: number | null,
  now = Date.now(),
  cooldownMs = DEFAULT_COOLDOWN_MS
): boolean {
  if (!lastAt || !lastKind) return true;
  if (lastKind !== kind) {
    // Different kind: still respect a short global quiet period
    return now - lastAt >= Math.min(cooldownMs, 90_000);
  }
  return now - lastAt >= cooldownMs;
}

export function markPromptShown(
  kind: string,
  now = Date.now()
): { lastPromptKind: string; lastPromptAt: number } {
  return { lastPromptKind: kind, lastPromptAt: now };
}
