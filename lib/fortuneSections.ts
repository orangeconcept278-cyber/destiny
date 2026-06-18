export type FortuneSectionId = "western" | "bazi" | "jyotish" | "numerology" | "integration";

export const FORTUNE_SECTION_ORDER: FortuneSectionId[] = [
  "western",
  "bazi",
  "jyotish",
  "numerology",
  "integration",
];

export const FORTUNE_SECTION_META: Record<
  FortuneSectionId,
  { title: string; loading: string }
> = {
  western: {
    title: "## 西洋占星術鑑定（トロピカル）",
    loading: "西洋占星術を解析中…",
  },
  bazi: {
    title: "## 四柱推命鑑定（八字）",
    loading: "四柱推命の命式を展開中…",
  },
  jyotish: {
    title: "## インド占星術鑑定（ジョーティシュ）",
    loading: "ジョーティシュのダシャーを照合中…",
  },
  numerology: {
    title: "## 数秘術鑑定",
    loading: "数秘術のサイクルを計算中…",
  },
  integration: {
    title: "## 統合鑑定・マルチアライメント",
    loading: "四体系の収束点を統合中…",
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
