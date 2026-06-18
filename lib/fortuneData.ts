import { buildRoadmapYearHeadings } from "./dateUtils.js";
import { calculatePersonalYear } from "./personalYear.js";

export interface FortuneInput {
  basicInfo?: {
    gender?: string;
    location?: string;
    maritalStatus?: string;
    children?: string;
    birthDate?: string;
  };
  western?: Record<string, string>;
  vedic?: Record<string, string>;
  fourPillars?: Record<string, string>;
  numerology?: Record<string, string>;
  pastEvents?: { year: number; event: string }[];
  concerns?: string;
  questions?: string;
  futureYearNotes?: { year: number; memo: string }[];
}

export function parseFortuneInput(body: Record<string, unknown>): FortuneInput {
  return body as FortuneInput;
}

function summarizePastEvents(events?: { year: number; event: string }[]): string {
  if (!events?.length) return "なし";
  return events.map((e) => `・${e.year}年: ${e.event}`).join("\n");
}

function summarizeFutureNotes(notes?: { year: number; memo: string }[]): string {
  if (!notes?.length) return "なし";
  return notes
    .filter((n) => n.memo.trim())
    .map((n) => `・${n.year}年: ${n.memo}`)
    .join("\n");
}

export function buildFortuneContext(input: FortuneInput) {
  const currentYear = new Date().getFullYear();
  const birthDate = input.basicInfo?.birthDate ?? "";
  const thisYearPy = birthDate ? calculatePersonalYear(birthDate, currentYear) : "?";

  return {
    currentYear,
    birthDate,
    thisYearPy,
    roadmapHeadings: buildRoadmapYearHeadings(currentYear, 5),
    basicBlock: `性別:${input.basicInfo?.gender || "?"} 所在地:${input.basicInfo?.location || "?"} 生:${birthDate || "?"} 婚姻:${input.basicInfo?.maritalStatus || "?"} 子:${input.basicInfo?.children || "?"}`,
    westernBlock: `ASC:${input.western?.ascendant || "?"} MC:${input.western?.mc || "?"} ステリウム:${input.western?.stellium || "-"} アスペクト:${input.western?.aspects || "-"} ハウス:${input.western?.housePlacements || "-"}`,
    vedicBlock: `ラグナ:${input.vedic?.lagna || "?"} ナクシャトラ:${input.vedic?.nakshatra || "?"} ヨーガ:${input.vedic?.yogas || "-"} シャドバラ:${input.vedic?.shadbala || "-"} アシュタカ:${input.vedic?.ashtakavarga || "-"} ダシャー:${input.vedic?.dasha || "-"}`,
    baziBlock: `日主:${input.fourPillars?.dayMaster || "?"} 用神:${input.fourPillars?.usefulGod || "-"} 通変星:${input.fourPillars?.starsBias || "-"} 空亡:${input.fourPillars?.void || "-"} 大運:${input.fourPillars?.major运 || "-"} 流年:${input.fourPillars?.year运 || "-"}`,
    numerologyBlock: `LP:${input.numerology?.lifePath || "?"} 表現数:${input.numerology?.destinyNum || "?"} ソウル:${input.numerology?.soulNum || "?"} PY${currentYear}:${thisYearPy} 登録PY:${input.numerology?.personalYear || "?"}`,
    concerns: input.concerns?.trim() || "なし",
    questions: input.questions?.trim() || "なし",
    pastEvents: summarizePastEvents(input.pastEvents),
    futureNotes: summarizeFutureNotes(input.futureYearNotes),
  };
}
