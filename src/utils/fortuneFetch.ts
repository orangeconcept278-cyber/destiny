import { fetchWithTimeout } from "./fetchWithTimeout";
import { sleep } from "./sleep";

const MAX_ATTEMPTS = 4;
const RETRYABLE_STATUSES = new Set([503, 429, 504]);

const RETRYABLE_CODES = new Set([
  "GEMINI_UNAVAILABLE",
  "RESOURCE_EXHAUSTED",
  "QUOTA_EXCEEDED",
  "TIMEOUT",
]);

export const GEMINI_RETRY_MESSAGE = "Geminiが混雑しています。再試行中…";

function isRetryableResponse(status: number, code?: string): boolean {
  if (RETRYABLE_STATUSES.has(status)) return true;
  if (code && RETRYABLE_CODES.has(code)) return true;
  return false;
}

export async function fetchFortuneWithRetry(
  url: string,
  init: RequestInit,
  onRetry?: (attempt: number) => void
): Promise<Response> {
  let lastResponse: Response | null = null;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const response = await fetchWithTimeout(url, init);
    if (response.ok) return response;

    const errJson = await response.clone().json().catch(() => ({} as { code?: string }));
    lastResponse = response;

    const retryable = isRetryableResponse(response.status, errJson.code);
    if (!retryable || attempt === MAX_ATTEMPTS - 1) {
      return response;
    }

    onRetry?.(attempt + 1);
    const delayMs = Math.min(1000 * 2 ** attempt, 16000);
    await sleep(delayMs);
  }

  return lastResponse!;
}
