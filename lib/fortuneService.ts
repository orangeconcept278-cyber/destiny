import { buildRoadmapYearHeadings } from "./dateUtils.js";
import { calculatePersonalYear } from "./personalYear.js";
import { generateFortuneContent, generateWithFallback } from "./gemini.js";

function summarizePastEvents(events?: { year: number; event: string }[]): string {
  if (!events?.length) return "なし";
  return events
    .slice(0, 5)
    .map((e) => `${e.year}:${e.event}`)
    .join(" / ");
}

function summarizeFutureNotes(notes?: { year: number; memo: string }[]): string {
  if (!notes?.length) return "なし";
  return notes
    .filter((n) => n.memo.trim())
    .slice(0, 3)
    .map((n) => `${n.year}:${n.memo}`)
    .join(" / ");
}

export async function generateFortuneReport(body: Record<string, unknown>): Promise<string> {
  const {
    basicInfo,
    western,
    vedic,
    fourPillars,
    numerology,
    pastEvents,
    concerns,
    questions,
    futureYearNotes,
  } = body as {
    basicInfo?: { gender?: string; location?: string; birthDate?: string };
    western?: Record<string, string>;
    vedic?: Record<string, string>;
    fourPillars?: Record<string, string>;
    numerology?: Record<string, string>;
    pastEvents?: { year: number; event: string }[];
    concerns?: string;
    questions?: string;
    futureYearNotes?: { year: number; memo: string }[];
  };

  const currentYear = new Date().getFullYear();
  const birthDate = basicInfo?.birthDate ?? "";
  const roadmapHeadings = buildRoadmapYearHeadings(currentYear, 5);
  const thisYearPy = birthDate ? calculatePersonalYear(birthDate, currentYear) : "?";

  const systemInstruction = `
あなたは統合鑑定者です。西洋・インド・四柱・数秘を横断して簡易鑑定書を書きます。
基準年は ${currentYear} 年。未来ロードマップは ${currentYear}〜${currentYear + 4} 年のみ。
病気・死期の断定は禁止。出力は日本語・合計1200字以内・簡潔に。
各セクションは短く。詳細な深掘りは相談ルームに委ねる前提です。
`;

  const prompt = `
【試作版・簡易統合鑑定書】以下のデータから、指定見出しどおりに簡潔な鑑定書を生成してください。

冒頭に1行だけ「※本鑑定は試作版の簡易鑑定です。詳細は相談ルームで深掘りできます。」と書いてください。

## 指定見出し（この順・この名前で）
### コアテーマ要約
（4占術それぞれ1〜2文。専門用語には括弧で短い説明）

### マルチ一致
（2件まで。一致度:高/中 を明記）

### 答え合わせ
（過去イベントが「なし」なら「未入力のため省略」。ある場合のみ各1行）

### 未来時間割
（次の見出しをそのまま使い、各年2〜3文）
${roadmapHeadings}

### 問いへの回答
（相談者の問いに3〜5文で回答）

【相談者】${basicInfo?.gender || "?"} / ${basicInfo?.location || "?"} / 生:${birthDate || "?"}
【西洋】ASC:${western?.ascendant || "?"} MC:${western?.mc || "?"} ステリウム:${western?.stellium || "-"}
【インド】ラグナ:${vedic?.lagna || "?"} ダシャー:${vedic?.dasha || "-"}
【四柱】日主:${fourPillars?.dayMaster || "?"} 用神:${fourPillars?.usefulGod || "-"} 大運:${fourPillars?.major运 || "-"} 流年:${fourPillars?.year运 || "-"}
【数秘】LP:${numerology?.lifePath || "?"} PY${currentYear}:${thisYearPy}
【悩み】${concerns?.trim() || "なし"}
【問い】${questions?.trim() || "なし"}
【過去イベント】${summarizePastEvents(pastEvents)}
【未来メモ】${summarizeFutureNotes(futureYearNotes)}
`;

  const response = await generateFortuneContent({
    contents: prompt,
    systemInstruction,
  });

  return response.text ?? "";
}

export async function generateFortuneChat(body: Record<string, unknown>): Promise<string> {
  const { chatHistory, report, userInput, basicData } = body as {
    chatHistory?: { role: string; text: string }[];
    report?: string;
    userInput?: string;
    basicData?: unknown;
  };

  const systemInstruction = `
あなたは統合鑑定者です。相談者は簡易鑑定書を読んだうえで対話しています。
詳細な深掘り・補足鑑定を担当してください。鑑定書と矛盾しないこと。
各回答は「根拠（占術パラメータ）」と「具体的な処方」を短く示すこと。
病気・医療・死期の予言は禁止。

【簡易鑑定書】
${report}

【相談者データ】
${JSON.stringify(basicData)}
`;

  const contents: { role: string; parts: { text: string }[] }[] = [];
  if (chatHistory?.length) {
    for (const msg of chatHistory) {
      contents.push({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.text }],
      });
    }
  }

  contents.push({
    role: "user",
    parts: [{ text: userInput ?? "" }],
  });

  const response = await generateWithFallback({
    contents,
    systemInstruction,
    temperature: 0.7,
    maxOutputTokens: 2000,
  });

  return response.text ?? "";
}
