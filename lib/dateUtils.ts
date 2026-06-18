export function getCurrentYear(): number {
  return new Date().getFullYear();
}

export function buildRoadmapYearHeadings(fromYear: number = getCurrentYear(), count: number = 5): string {
  const years = Array.from({ length: count }, (_, i) => fromYear + i);
  return years
    .map((year) => `#### ${year}年（ここに「仕込み期」「挑戦・山場」「収穫・好機」「試練・調整」のいずれかを明記）`)
    .join("\n");
}
