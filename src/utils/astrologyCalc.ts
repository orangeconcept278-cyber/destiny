import { AllFortuneData } from "../types";
import { getCurrentYear } from "./dateUtils";

/**
 * Calculate Life Path Number (standard reduce to single digit except master numbers 11, 22, 33)
 */
export function calculateLifePath(dateStr: string): number {
  if (!dateStr) return 7; // default fallback
  const clean = dateStr.replace(/[^0-9]/g, "");
  if (clean.length < 8) return 7;

  let sum = clean.split("").reduce((acc, char) => acc + parseInt(char, 10), 0);

  // reduce digits until we get single digit or master number
  while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) {
    sum = sum
      .toString()
      .split("")
      .reduce((acc, char) => acc + parseInt(char, 10), 0);
  }
  return sum;
}

/**
 * Calculate Personal Year Number for the current calendar year
 */
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

/**
 * Estimate Western Solar Sign (Zodiac)
 */
export function getWesternZodiac(dateStr: string): string {
  if (!dateStr) return "牡羊座";
  const parts = dateStr.split("-");
  if (parts.length < 3) return "牡羊座";

  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);

  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return "牡羊座";
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return "牡牛座";
  if ((month === 5 && day >= 21) || (month === 6 && day <= 21)) return "双子座";
  if ((month === 6 && day >= 22) || (month === 7 && day <= 22)) return "蟹座";
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return "獅子座";
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return "乙女座";
  if ((month === 9 && day >= 23) || (month === 10 && day <= 23)) return "天秤座";
  if ((month === 10 && day >= 24) || (month === 11 && day <= 22)) return "蠍座";
  if ((month === 11 && day >= 23) || (month === 12 && day <= 21)) return "射手座";
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return "山羊座";
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return "水瓶座";
  return "魚座";
}

/**
 * Fast lookup for Four Pillars Day Master & Elements based on a deterministic pseudo-julian day index
 */
const JUKKAN = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
const JUNICHI = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

export function getFourPillars(dateStr: string): {
  dayMaster: string;
  elementsBias: string;
  void: string;
  usefulGod: string;
} {
  if (!dateStr) {
    return { dayMaster: "庚", elementsBias: "金星旺盛、木星枯渇", void: "子丑", usefulGod: "壬水" };
  }

  const date = new Date(dateStr);
  const ms = date.getTime();
  if (isNaN(ms)) {
    return { dayMaster: "庚", elementsBias: "金星旺盛、木星枯渇", void: "子丑", usefulGod: "壬水" };
  }

  // Base date index reference
  const baseMs = new Date("1970-01-01").getTime();
  const diffDays = Math.floor((ms - baseMs) / (24 * 60 * 60 * 1000));

  // Determine Day Master index securely
  const dmIndex = Math.abs(diffDays + 4) % 10; // 甲 is 4th in offset from Epoch seed
  const dayMaster = JUKKAN[dmIndex];

  // Determine Void
  // 60-cycle of stems-branches reveals the 空亡 (spiritual blankness interval)
  const branchIndex = Math.abs(diffDays + 10) % 12; // 子 offsets
  const diff = (dmIndex - branchIndex + 12) % 12;
  let voidBranches = "子丑";
  if (diff === 0) voidBranches = "戌亥";
  if (diff === 2) voidBranches = "申酉";
  if (diff === 4) voidBranches = "午未";
  if (diff === 6) voidBranches = "辰巳";
  if (diff === 8) voidBranches = "寅卯";
  if (diff === 10) voidBranches = "子丑";

  // Useful God suggestion based on day master element properties
  const stemElements: { [key: string]: { elem: string; polar: string } } = {
    甲: { elem: "木", polar: "陽" },
    乙: { elem: "木", polar: "陰" },
    丙: { elem: "火", polar: "陽" },
    丁: { elem: "火", polar: "陰" },
    戊: { elem: "土", polar: "陽" },
    己: { elem: "土", polar: "陰" },
    庚: { elem: "金", polar: "陽" },
    辛: { elem: "金", polar: "陰" },
    壬: { elem: "水", polar: "陽" },
    癸: { elem: "水", polar: "陰" },
  };

  const dayMeta = stemElements[dayMaster] || { elem: "木", polar: "陽" };

  // Calculate customized elements balance & Useful God
  let usefulGod = "癸水 (寒さを潤す水)";
  let elementsBias = "木気・火気が調和、水気が微弱";

  if (dayMeta.elem === "木") {
    usefulGod = "庚金 (刃物で剪定し形を整える)";
    elementsBias = "木旺・土金微弱";
  } else if (dayMeta.elem === "火") {
    usefulGod = "壬水 (猛火を制する大河)";
    elementsBias = "火旺・水気渇水";
  } else if (dayMeta.elem === "土") {
    usefulGod = "甲木 (土砂崩れを防ぐ強固な大木)";
    elementsBias = "土重・木気散滅";
  } else if (dayMeta.elem === "金") {
    usefulGod = "丁火 (強すぎる金属を鍛錬する美しい炎)";
    elementsBias = "金気剛強・火気中庸";
  } else if (dayMeta.elem === "水") {
    usefulGod = "戊土 (溢れる水をせき止める強固な堤防)";
    elementsBias = "水旺・土星流失";
  }

  return {
    dayMaster,
    elementsBias,
    void: voidBranches,
    usefulGod,
  };
}

/**
 * Dynamic Vedic Astrology Initializers
 */
const NAKSHATRAS = [
  "アシュヴィニー", "バラニー", "クリッティカー", "ローヒニー", "ムリガシラー", 
  "アールドラー", "プナルヴァス", "プシャ", "アーシュレーシャ", "マガー", 
  "プールヴァ・パールグニー", "ウッタラ・パールグニー", "ハスタ", "チトラー", 
  "スヴァーティー", "ヴィシャーハール", "アヌラーダー", "ज्येष्ठा (ジェーシュター)", 
  "ムーラ", "プールヴァ・アシャーダー", "ウッタラ・アシャーダー", "シュラヴァナ", 
  "ダニシュター", "シャタビシャー", "プールヴァ・バードラパダー", "ウッタラ・バードラパダー", "レーヴァティー"
];

export function getVedicAstro(dateStr: string): {
  lagna: string;
  nakshatra: string;
  dasha: string;
  yogas: string;
  ashtakavarga: string;
  shadbala: string;
} {
  if (!dateStr) {
    return {
      lagna: "乙女座 (Kanya)",
      nakshatra: "ハスタ (Hasta)",
      dasha: "マハー: 木星期 / アンタル: 水星期",
      yogas: "ガジャ・ケーサリ・ヨーガ (月と木星の最大吉祥吉相)",
      ashtakavarga: "10室: 32点、1室: 28点、8室: 18点",
      shadbala: "最強: 水星と木星、最弱: 金星",
    };
  }

  const d = new Date(dateStr);
  const hash = (d.getFullYear() + d.getMonth() * 3 + d.getDate()) % 27;
  const nakshatra = NAKSHATRAS[hash];

  // Pseudo-Lagna mapped to birth hour
  const lagIndex = (d.getDate() + d.getMonth()) % 12;
  const SAG_SIGNS = [
    "牡羊座 (Mesha)", "牡牛座 (Vrishabha)", "双子座 (Mithuna)", "蟹座 (Karka)", 
    "獅子座 (Simha)", "乙女座 (Kanya)", "天秤座 (Tula)", "蠍座 (Vrischika)", 
    "射手座 (Dhanu)", "山羊座 (Makara)", "水瓶座 (Kumbha)", "魚座 (Meena)"
  ];
  const lagna = SAG_SIGNS[lagIndex];

  // Map out a dynamic Dasha starting point
  const planets = ["太陽", "月", "火星", "ラーフ", "木星", "土星", "水星", "ケートゥ", "金星"];
  const dashaIndex = (d.getFullYear() + d.getDate()) % planets.length;
  const dashaCurrent = planets[dashaIndex];
  const antardashaCurrent = planets[(dashaIndex + 3) % planets.length];

  return {
    lagna,
    nakshatra,
    dasha: `マハー: ${dashaCurrent}期 / アンタル: ${antardashaCurrent}期`,
    yogas: "ガジャ・ケーサリ・ヨーガ (月と木星の角度から生まれる知性と名声の吉相)",
    ashtakavarga: "10室: 34点、11室: 31点、1室: 26点、8室: 20点",
    shadbala: `最強: ${dashaCurrent}、最弱: ${planets[(dashaIndex + 5) % planets.length]}`,
  };
}

/**
 * Automate initial setup payload generation when date/time defaults are initialized or changed
 */
export function generateInitialAstroData(
  gender: string = "女性",
  location: string = "東京",
  maritalStatus: string = "未婚",
  children: string = "なし",
  birthDate: string = "1994-06-15",
  birthTime: string = "12:00"
): AllFortuneData {
  const lp = calculateLifePath(birthDate);
  const currentYear = getCurrentYear();
  const py = calculatePersonalYear(birthDate, currentYear);
  const zodiac = getWesternZodiac(birthDate);
  const fp = getFourPillars(birthDate);
  const v = getVedicAstro(birthDate);

  // Determine an estimated Stellium house based on birthday
  const d = new Date(birthDate);
  const stellIndex = (d.getDate() % 12) + 1;

  return {
    basicInfo: {
      gender,
      location,
      maritalStatus,
      children,
      birthDate,
      birthTime,
    },
    western: {
      ascendant: d.getDate() % 2 === 0 ? "乙女座" : "天秤座",
      mc: d.getDate() % 2 === 0 ? "双子座" : "蟹座",
      stellium: `${zodiac} (${stellIndex}室) 内での太陽・水星の合`,
      aspects: "太陽 - 木星 (トライン:調和 120度), 月 - 土星 (スクエア:葛藤 90度)",
      housePlacements: `太陽: 第${stellIndex}室、月: 第${(stellIndex + 3) % 12 || 12}室、水星: 第${stellIndex}室、土星: 第10室`,
    },
    vedic: {
      lagna: v.lagna,
      nakshatra: v.nakshatra,
      yogas: v.yogas,
      shadbala: v.shadbala,
      ashtakavarga: v.ashtakavarga,
      dasha: v.dasha,
    },
    fourPillars: {
      dayMaster: fp.dayMaster,
      usefulGod: fp.usefulGod,
      starsBias: fp.elementsBias,
      void: fp.void,
      major运: `${currentYear - 5}〜${currentYear + 5}年: 丙午大運 (現在大運期。精神変容と独立心の開花)`,
      year运: `${currentYear}年: 丙午流年 (本年の変革期。日主活性化)`,
    },
    numerology: {
      lifePath: lp,
      destinyNum: lp === 11 || lp === 22 || lp === 33 ? lp : Math.abs(lp - 1) || 9,
      soulNum: lp > 5 ? lp - 3 : lp + 4,
      personalYear: py,
    },
    pastEvents: [],
    futureYearNotes: [],
    concerns: "",
    questions: "今日から3年後までの運勢、金運、恋愛運",
  };
}
