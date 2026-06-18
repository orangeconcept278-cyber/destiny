import { AllFortuneData } from "../types";
import { FortuneSectionId } from "../../lib/fortuneSections";
import { FortuneSectionResult } from "../../lib/fortuneTypes";

const STORAGE_KEY = "astria-section-cache-v1";

export interface CachedFortuneSession {
  dataKey: string;
  overview: string;
  sections: Partial<Record<FortuneSectionId, FortuneSectionResult>>;
  updatedAt: string;
}

function readAll(): Record<string, CachedFortuneSession> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeAll(cache: Record<string, CachedFortuneSession>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
}

export function fortuneDataCacheKey(data: AllFortuneData): string {
  return JSON.stringify({
    birthDate: data.basicInfo.birthDate,
    birthTime: data.basicInfo.birthTime,
    gender: data.basicInfo.gender,
    location: data.basicInfo.location,
    western: data.western,
    vedic: data.vedic,
    fourPillars: data.fourPillars,
    numerology: data.numerology,
    concerns: data.concerns,
    questions: data.questions,
    pastEvents: data.pastEvents,
    futureYearNotes: data.futureYearNotes,
  });
}

export function loadCachedSession(dataKey: string): CachedFortuneSession | null {
  const session = readAll()[dataKey];
  if (!session?.overview) return null;
  return session;
}

export function saveCachedOverview(dataKey: string, overview: string): void {
  const all = readAll();
  const existing = all[dataKey];
  all[dataKey] = {
    dataKey,
    overview,
    sections: existing?.sections ?? {},
    updatedAt: new Date().toISOString(),
  };
  writeAll(all);
}

export function saveCachedSection(
  dataKey: string,
  sectionId: FortuneSectionId,
  result: FortuneSectionResult
): void {
  const all = readAll();
  const existing = all[dataKey];
  all[dataKey] = {
    dataKey,
    overview: existing?.overview ?? "",
    sections: { ...(existing?.sections ?? {}), [sectionId]: result },
    updatedAt: new Date().toISOString(),
  };
  writeAll(all);
}

export function clearCachedSession(dataKey: string): void {
  const all = readAll();
  delete all[dataKey];
  writeAll(all);
}
