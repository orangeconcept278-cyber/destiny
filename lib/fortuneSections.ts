export type FortuneSectionId = "western" | "bazi" | "jyotish" | "numerology" | "integration";

export const FORTUNE_SECTION_ORDER: FortuneSectionId[] = [
  "western",
  "bazi",
  "jyotish",
  "numerology",
  "integration",
];

export const FORTUNE_TOTAL_STEPS = 1 + FORTUNE_SECTION_ORDER.length;

export const FORTUNE_OVERVIEW_LOADING = "総合サマリーを生成中";

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

export function formatFortuneProgress(label: string, step: number, total = FORTUNE_TOTAL_STEPS): string {
  return `${label}（${step}/${total}）`;
}

/** セクション間の待機（Gemini 503 回避） */
export const FORTUNE_SECTION_DELAY_MS = 2500;
