export type FortuneSectionId = "western" | "bazi" | "jyotish" | "numerology" | "integration";

export const FORTUNE_SECTION_ORDER: FortuneSectionId[] = [
  "western",
  "bazi",
  "jyotish",
  "numerology",
  "integration",
];

/** タブを開いたときに遅延生成する占術（統合結論は含まない） */
export const LAZY_FORTUNE_SECTION_ORDER: FortuneSectionId[] = [
  "western",
  "bazi",
  "jyotish",
  "numerology",
];

export const FORTUNE_OVERVIEW_LOADING = "総合鑑定を生成中";

export const REPORT_TAB_LABELS: Record<"overview" | FortuneSectionId, string> = {
  overview: "総合鑑定",
  western: "西洋占星術",
  bazi: "四柱推命",
  jyotish: "ジョーティシュ",
  numerology: "数秘術",
  integration: "統合結論",
};

export const FORTUNE_SECTION_META: Record<
  FortuneSectionId,
  { title: string; loading: string }
> = {
  western: {
    title: "## 西洋占星術鑑定（トロピカル）",
    loading: "西洋占星術を分析中",
  },
  bazi: {
    title: "## 四柱推命鑑定（八字）",
    loading: "四柱推命を分析中",
  },
  jyotish: {
    title: "## インド占星術鑑定（ジョーティシュ）",
    loading: "ジョーティシュを分析中",
  },
  numerology: {
    title: "## 数秘術鑑定",
    loading: "数秘術を分析中",
  },
  integration: {
    title: "## 統合鑑定・マルチアライメント",
    loading: "統合結論を生成中",
  },
};

export function isFortuneSectionId(value: unknown): value is FortuneSectionId {
  return (
    value === "western" ||
    value === "bazi" ||
    value === "jyotish" ||
    value === "numerology" ||
    value === "integration"
  );
}

