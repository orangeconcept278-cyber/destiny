export function getCurrentYear(): number {
  return new Date().getFullYear();
}

export function getCurrentDateLabel(): string {
  return new Date().toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function getFutureYears(count: number = 5, fromYear: number = getCurrentYear()): number[] {
  return Array.from({ length: count }, (_, i) => fromYear + i);
}

export function buildRoadmapYearHeadings(fromYear: number = getCurrentYear(), count: number = 5): string {
  return getFutureYears(count, fromYear)
    .map((year) => `#### ${year}年（ここに「仕込み期」「挑戦・山場」「収穫・好機」「試練・調整」のいずれかを明記）`)
    .join("\n");
}
