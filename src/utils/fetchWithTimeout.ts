const DEFAULT_FETCH_TIMEOUT_MS = 30000;

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit,
  timeoutMs: number = DEFAULT_FETCH_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("鑑定生成に少し時間がかかっています。しばらく待ってから再度お試しください。");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
