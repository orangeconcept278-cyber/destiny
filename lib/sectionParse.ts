import { FortuneSectionResult } from "./fortuneTypes.js";

function stripCodeFence(raw: string): string {
  return raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
}

function unescapeJsonString(value: string): string {
  return value
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, "\\");
}

function extractJsonStringField(raw: string, field: string): string | null {
  const keyPattern = new RegExp(`"${field}"\\s*:\\s*"`);
  const match = raw.match(keyPattern);
  if (!match || match.index === undefined) return null;

  let i = match.index + match[0].length;
  let escaped = "";

  while (i < raw.length) {
    const ch = raw[i];
    if (ch === "\\" && i + 1 < raw.length) {
      escaped += ch + raw[i + 1];
      i += 2;
      continue;
    }
    if (ch === '"') break;
    escaped += ch;
    i++;
  }

  return unescapeJsonString(escaped);
}

function tryParseJsonObject(text: string): { fullText?: unknown; summary?: unknown } | null {
  try {
    return JSON.parse(text) as { fullText?: unknown; summary?: unknown };
  } catch {
    return null;
  }
}

export function parseSectionResponse(raw: string): FortuneSectionResult {
  const trimmed = stripCodeFence(raw);

  const direct = tryParseJsonObject(trimmed);
  if (direct?.fullText) {
    return toSectionResult(direct.fullText, direct.summary);
  }

  const jsonStart = trimmed.indexOf("{");
  if (jsonStart >= 0) {
    const slice = trimmed.slice(jsonStart);
    const sliced = tryParseJsonObject(slice);
    if (sliced?.fullText) {
      return toSectionResult(sliced.fullText, sliced.summary);
    }

    const fullText = extractJsonStringField(slice, "fullText");
    if (fullText) {
      const summary = extractJsonStringField(slice, "summary");
      return {
        fullText: fullText.trim(),
        summary: (summary ?? fullText.slice(0, 300)).trim(),
      };
    }
  }

  if (trimmed.startsWith("{") && trimmed.includes('"fullText"')) {
    const fullText = extractJsonStringField(trimmed, "fullText");
    if (fullText) {
      const summary = extractJsonStringField(trimmed, "summary");
      return {
        fullText: fullText.trim(),
        summary: (summary ?? fullText.slice(0, 300)).trim(),
      };
    }
  }

  return {
    fullText: trimmed,
    summary: trimmed.slice(0, 300),
  };
}

function toSectionResult(fullText: unknown, summary?: unknown): FortuneSectionResult {
  const text = String(fullText).trim();
  const sum = summary ? String(summary).trim() : "";
  return {
    fullText: text,
    summary: sum || text.slice(0, 300),
  };
}

/** キャッシュ等に保存済みの生JSON文字列を表示用に正規化 */
export function normalizeSectionResult(result: FortuneSectionResult): FortuneSectionResult {
  const raw = result.fullText?.trim() ?? "";
  if (!raw.startsWith("{") || !raw.includes('"fullText"')) {
    return result;
  }
  const parsed = parseSectionResponse(raw);
  return {
    fullText: parsed.fullText,
    summary: result.summary?.trim() && !result.summary.trim().startsWith("{")
      ? result.summary
      : parsed.summary,
  };
}
