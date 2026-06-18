import {
  FORTUNE_SECTION_META,
  FortuneSectionId,
  LAZY_FORTUNE_SECTION_ORDER,
} from "../../lib/fortuneSections";
import { FortuneSectionResult, PriorSummaries } from "../../lib/fortuneTypes";
import { normalizeSectionResult } from "../../lib/sectionParse";

export type ReportTabId = "overview" | FortuneSectionId;

export function buildFullReport(
  overview: string,
  sections: Partial<Record<FortuneSectionId, FortuneSectionResult>>
): string {
  if (!overview.trim()) return "";
  let report = overview.trim();
  for (const id of LAZY_FORTUNE_SECTION_ORDER) {
    const raw = sections[id];
    if (!raw?.fullText?.trim()) continue;
    const { fullText } = normalizeSectionResult(raw);
    if (fullText) {
      report += `\n\n${FORTUNE_SECTION_META[id].title}\n\n${fullText}`;
    }
  }
  return report;
}

export function buildPriorSummaries(
  overview: string,
  sections: Partial<Record<FortuneSectionId, FortuneSectionResult>>
): PriorSummaries {
  const summaries: PriorSummaries = { overview };
  for (const id of LAZY_FORTUNE_SECTION_ORDER) {
    const raw = sections[id];
    if (!raw) continue;
    const { summary } = normalizeSectionResult(raw);
    if (summary) summaries[id] = summary;
  }
  return summaries;
}
