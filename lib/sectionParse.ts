import { FortuneSectionResult } from "./fortuneTypes.js";
import { FortuneSectionId } from "./fortuneSections.js";

const SUMMARY_MARKER = "<<<SUMMARY>>>";
const FULLTEXT_MARKER = "<<<FULLTEXT>>>";

export interface FortuneSectionApiResponse {
  section?: FortuneSectionId | string;
  fullText?: unknown;
  summary?: unknown;
  /** 旧API互換 */
  content?: unknown;
}

function stripCodeFence(raw: string): string {
  return raw.trim().replace(/^```(?:json|markdown|md)?\s*/i, "").replace(/\s*```$/i, "").trim();
}

function unescapeJsonString(value: string): string {
  return value
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, "\\");
}

function denormalizeMarkdown(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "";
  if (trimmed.includes("\\n") && !trimmed.includes("\n")) {
    return unescapeJsonString(trimmed);
  }
  return trimmed;
}

export function looksLikeSectionJson(text: string): boolean {
  const t = text.trim();
  return t.startsWith("{") && (t.includes('"fullText"') || t.includes('"summary"'));
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

function parseDelimiterResponse(raw: string): FortuneSectionResult | null {
  const summaryIdx = raw.indexOf(SUMMARY_MARKER);
  const fullTextIdx = raw.indexOf(FULLTEXT_MARKER);

  if (summaryIdx < 0 || fullTextIdx < 0 || fullTextIdx <= summaryIdx) {
    return null;
  }

  const summary = denormalizeMarkdown(raw.slice(summaryIdx + SUMMARY_MARKER.length, fullTextIdx));
  const fullText = denormalizeMarkdown(raw.slice(fullTextIdx + FULLTEXT_MARKER.length));

  if (!fullText) return null;

  return {
    fullText,
    summary: summary || fullText.slice(0, 300),
  };
}

function parseJsonGeminiResponse(raw: string): FortuneSectionResult | null {
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
        fullText: denormalizeMarkdown(fullText),
        summary: denormalizeMarkdown(summary ?? fullText.slice(0, 300)),
      };
    }
  }

  if (looksLikeSectionJson(trimmed)) {
    const fullText = extractJsonStringField(trimmed, "fullText");
    if (fullText) {
      const summary = extractJsonStringField(trimmed, "summary");
      return {
        fullText: denormalizeMarkdown(fullText),
        summary: denormalizeMarkdown(summary ?? fullText.slice(0, 300)),
      };
    }
  }

  return null;
}

function toSectionResult(fullText: unknown, summary?: unknown): FortuneSectionResult {
  const text = denormalizeMarkdown(String(fullText ?? ""));
  const sum = summary ? denormalizeMarkdown(String(summary)) : "";
  return {
    fullText: text,
    summary: sum || text.slice(0, 300),
  };
}

/** Gemini生出力を fullText / summary に分解 */
export function parseSectionResponse(raw: string): FortuneSectionResult {
  const trimmed = stripCodeFence(raw);

  const delimiter = parseDelimiterResponse(trimmed);
  if (delimiter) return delimiter;

  const json = parseJsonGeminiResponse(trimmed);
  if (json) return json;

  if (looksLikeSectionJson(trimmed)) {
    return { fullText: "", summary: "" };
  }

  return {
    fullText: denormalizeMarkdown(trimmed),
    summary: denormalizeMarkdown(trimmed).slice(0, 300),
  };
}

/** APIレスポンス・キャッシュを表示用の統一型に正規化 */
export function coerceFortuneSectionResult(input: unknown): FortuneSectionResult {
  if (!input || typeof input !== "object") {
    return { fullText: "", summary: "" };
  }

  const obj = input as FortuneSectionApiResponse;
  let fullText = String(obj.fullText ?? obj.content ?? "").trim();
  let summary = String(obj.summary ?? "").trim();

  if (looksLikeSectionJson(fullText)) {
    const parsed = parseSectionResponse(fullText);
    fullText = parsed.fullText;
    if (!summary || looksLikeSectionJson(summary)) {
      summary = parsed.summary;
    }
  }

  if (looksLikeSectionJson(summary)) {
    summary = parseSectionResponse(summary).summary;
  }

  fullText = denormalizeMarkdown(fullText);
  summary = denormalizeMarkdown(summary);

  if (fullText.startsWith("{") && fullText.includes("fullText")) {
    const reparsed = parseSectionResponse(fullText);
    fullText = reparsed.fullText;
    if (!summary) summary = reparsed.summary;
  }

  return {
    fullText,
    summary: summary || fullText.slice(0, 300),
  };
}

/** @deprecated coerceFortuneSectionResult を使用 */
export function normalizeSectionResult(result: FortuneSectionResult): FortuneSectionResult {
  return coerceFortuneSectionResult(result);
}
