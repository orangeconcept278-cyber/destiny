export interface BasicInfo {
  gender: string;
  location: string;
  maritalStatus: string;
  children: string;
  birthDate: string; // YYYY-MM-DD
  birthTime: string; // HH:MM
}

export interface WesternAstrology {
  ascendant: string;
  mc: string;
  stellium: string;
  aspects: string;
  housePlacements: string;
}

export interface VedicAstrology {
  lagna: string;
  nakshatra: string;
  yogas: string;
  shadbala: string; // "太陽:強、月:弱" 等
  ashtakavarga: string; // "10室: 38点、8室: 19点" 等
  dasha: string; // "マハー: 太陽期、アンタル: 木星期" 等
}

export interface FourPillars {
  dayMaster: string; // 甲、乙...
  usefulGod: string; // 木、火...
  starsBias: string; // 官星過多、食傷なし 等
  void: string; // 子丑、戌亥 等
  major运: string; // "2021-2031: 丙午大運" 等
  year运: string; // "2026: 丙午" 等
}

export interface Numerology {
  lifePath: number | string; // ライフパス
  destinyNum: number | string; // 表現数
  soulNum: number | string; // ハート数
  personalYear: number | string; // 個人年運
}

export interface PastEvent {
  id: string;
  year: number;
  event: string;
}

export interface FutureYearNote {
  year: number;
  memo: string;
}

export interface AllFortuneData {
  basicInfo: BasicInfo;
  western: WesternAstrology;
  vedic: VedicAstrology;
  fourPillars: FourPillars;
  numerology: Numerology;
  pastEvents: PastEvent[];
  futureYearNotes: FutureYearNote[];
  concerns: string;
  questions: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: string;
}
