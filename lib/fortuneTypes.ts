import { FortuneSectionId } from "./fortuneSections.js";

export interface FortuneSectionResult {
  fullText: string;
  summary: string;
}

/** 次セクションへ渡す要約のみ（fullText は含めない） */
export type PriorSummaries = Partial<Record<"overview" | FortuneSectionId, string>>;
