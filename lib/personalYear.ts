import { getCurrentYear } from "./dateUtils";

export function calculatePersonalYear(
  dateStr: string,
  currentYear: number = getCurrentYear()
): number {
  if (!dateStr) return 1;
  const parts = dateStr.split("-");
  if (parts.length < 3) return 1;

  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);

  let sum = currentYear + month + day;
  while (sum > 9) {
    sum = sum
      .toString()
      .split("")
      .reduce((acc, char) => acc + parseInt(char, 10), 0);
  }
  return sum;
}
