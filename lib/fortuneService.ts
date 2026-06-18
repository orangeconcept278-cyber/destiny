import {
  FORTUNE_OVERVIEW_MAX_TOKENS,
  FORTUNE_SECTION_MAX_TOKENS,
  generateFortuneContent,
  generateWithFallback,
} from "./gemini.js";
import { buildFortuneContext, parseFortuneInput } from "./fortuneData.js";
import { buildRoadmapYearHeadings } from "./dateUtils.js";
import { FortuneSectionId, FORTUNE_SECTION_META, isFortuneSectionId } from "./fortuneSections.js";
import { FortuneSectionResult, PriorSummaries } from "./fortuneTypes.js";
import { parseSectionResponse } from "./sectionParse.js";

const SECTION_STYLE = `
各論点は「①結論→②根拠（パラメータ引用）→③処方」の順で書く。
専門用語には括弧で短い説明を添える。推測は【推測】と明記。
病気・死期の断定は禁止。前セクションの要約と矛盾しないこと。
`;

const SECTION_OUTPUT_RULE = `
【出力形式（厳守）】
次の2ブロックのみを出力すること。JSON・コードブロック・前置きは禁止。

<<<SUMMARY>>>
（200〜300字の要約。結論とキーワードのみ。Markdown見出しは不要）

<<<FULLTEXT>>>
（1000〜2000字の詳細鑑定本文。見出しは###や####を使用可）
`;

function formatPriorSummaries(summaries?: PriorSummaries): string {
  if (!summaries) return "（なし）";

  const lines: string[] = [];
  if (summaries.overview?.trim()) {
    lines.push(`### 統合サマリー要約\n${summaries.overview.trim()}`);
  }

  const sectionOrder: FortuneSectionId[] = ["western", "bazi", "jyotish", "numerology"];
  for (const id of sectionOrder) {
    const text = summaries[id]?.trim();
    if (!text) continue;
    const label = FORTUNE_SECTION_META[id].title.replace(/^##\s*/, "");
    lines.push(`### ${label}要約\n${text}`);
  }

  return lines.length ? lines.join("\n\n") : "（なし）";
}


export async function generateFortuneReport(body: Record<string, unknown>): Promise<string> {
  const input = parseFortuneInput(body);
  const ctx = buildFortuneContext(input);

  const roadmapHeadings = buildRoadmapYearHeadings(ctx.currentYear, 3);

  const systemInstruction = `
あなたは統合鑑定者です。4占術を横断する「総合鑑定」を書きます。
基準年:${ctx.currentYear}年。出力は600〜900字。簡潔だが格調高く。
`;

  const prompt = `
【総合鑑定】以下データから、相談者向けの総合鑑定を生成してください。

### 指定見出し
## 統合鑑定サマリー
（相談者の人生の主題を2〜3文で）

### 四体系の要点（各1文）
- 西洋:
- インド:
- 四柱:
- 数秘:

### いま最も意識すべきテーマ
（1〜2文）

### 時系列の未来時間割
今後数年間の運気の流れをロードマップとして提示します。
${roadmapHeadings}
（各年の見出しをそのまま使用し、各年2文で運気の流れと注意点を記述）

### 相談者の問いへの統合回答
（2文）

【相談者】${ctx.basicBlock}
【悩み】${ctx.concerns}
【問い】${ctx.questions}
【過去イベント】
${ctx.pastEvents}
【未来メモ】
${ctx.futureNotes}
【西洋要点】${ctx.westernBlock}
【インド要点】${ctx.vedicBlock}
【四柱要点】${ctx.baziBlock}
【数秘要点】${ctx.numerologyBlock}
`;

  const response = await generateFortuneContent({
    contents: prompt,
    systemInstruction,
    maxOutputTokens: FORTUNE_OVERVIEW_MAX_TOKENS,
    lean: true,
  });

  return response.text ?? "";
}

export async function generateFortuneSection(
  section: FortuneSectionId,
  body: Record<string, unknown>,
  priorSummaries?: PriorSummaries
): Promise<FortuneSectionResult> {
  if (!isFortuneSectionId(section)) {
    throw new Error(`INVALID_SECTION:${section}`);
  }

  const input = parseFortuneInput(body);
  const ctx = buildFortuneContext(input);
  const summariesBlock = formatPriorSummaries(priorSummaries);

  const systemInstruction = `
あなたは統合鑑定者です。今回は「${section}」パートのみを深く書きます。
${SECTION_STYLE}
${SECTION_OUTPUT_RULE}
基準年:${ctx.currentYear}年。
`;

  const contextSection = `
【これまでの占術要約（整合性の参考のみ。全文は渡していない）】
${summariesBlock}
`;

  let prompt = "";

  switch (section) {
    case "western":
      prompt = `
【西洋占星術・詳細鑑定】トロピカル式。fullTextは1000〜2000字、summaryは200〜300字。
${contextSection}

### fullTextに含める内容
- ASC/MCの意味と人生への影響
- ステリウム・アスペクト・ハウス配置の解釈
- 強みと課題（各①②③形式）
- 今年${ctx.currentYear}年の行動指針

### summaryに含める内容
- 西洋占星術の結論3点とキーワード（次の占術が参照する短い要約）

【データ】${ctx.basicBlock}
${ctx.westernBlock}
【悩み】${ctx.concerns}
【問い】${ctx.questions}
`;
      break;
    case "bazi":
      prompt = `
【四柱推命・詳細鑑定】fullTextは1000〜2000字、summaryは200〜300字。
${contextSection}

### fullTextに含める内容
- 日主の本質と格局
- 調候用神・通変星・空亡の意味
- 現在大運と${ctx.currentYear}年流年の読み
- 仕事・対人の処方
- 西洋占星術の要約と接続できる点があれば1〜2文で言及

### summaryに含める内容
- 四柱推命の結論3点とキーワード

【データ】${ctx.basicBlock}
${ctx.baziBlock}
【悩み】${ctx.concerns}
`;
      break;
    case "jyotish":
      prompt = `
【インド占星術（ジョーティシュ）・詳細鑑定】fullTextは1000〜2000字、summaryは200〜300字。
${contextSection}

### fullTextに含める内容
- ラグナとナクシャトラの本質
- ヨーガ・シャドバラ・アシュタカヴァルガ
- 現在のダシャー期の意味と過ごし方
- カルマ的課題と処方
- これまでの占術要約と接続できる点があれば言及

### summaryに含める内容
- ジョーティシュの結論3点とキーワード

【データ】${ctx.basicBlock}
${ctx.vedicBlock}
【悩み】${ctx.concerns}
`;
      break;
    case "numerology":
      prompt = `
【数秘術・詳細鑑定】fullTextは1000〜2000字、summaryは200〜300字。
${contextSection}

### fullTextに含める内容
- ライフパス・表現数・ソウルナンバーの統合読み
- ${ctx.currentYear}年パーソナルイヤー${ctx.thisYearPy}の意味
- 9年サイクル上の現在地
- 金運・仕事・関係性への示唆
- これまでの占術要約との一致・補足

### summaryに含める内容
- 数秘術の結論3点とキーワード

【データ】${ctx.basicBlock}
${ctx.numerologyBlock}
【問い】${ctx.questions}
`;
      break;
    case "integration":
      prompt = `
【統合鑑定・マルチアライメント】fullTextは1000〜2000字、summaryは200〜300字。

【各占術の要約のみを統合して鑑定すること。詳細全文は与えられていない】
${summariesBlock}

### fullTextに含める内容
1. 三重/二重一致（2〜3件、確信度付き）— 上記要約を統合して述べる
2. 答え合わせ（過去イベントがある場合）
3. 未来時間割（次の見出しをそのまま使用、各年2〜3文）
${ctx.roadmapHeadings}
4. 相談者の問いへの統合回答

### summaryに含める内容
- 統合鑑定の最終結論と行動指針（短く）

【相談者】${ctx.basicBlock}
【過去イベント】
${ctx.pastEvents}
【未来メモ】
${ctx.futureNotes}
【悩み】${ctx.concerns}
【問い】${ctx.questions}
`;
      break;
  }

  const response = await generateFortuneContent({
    contents: prompt,
    systemInstruction,
    maxOutputTokens: FORTUNE_SECTION_MAX_TOKENS,
  });

  return parseSectionResponse(response.text ?? "");
}

export async function generateFortuneChat(body: Record<string, unknown>): Promise<string> {
  const { chatHistory, report, userInput, basicData } = body as {
    chatHistory?: { role: string; text: string }[];
    report?: string;
    userInput?: string;
    basicData?: unknown;
  };

  const systemInstruction = `
あなたは統合鑑定者です。相談者は分割生成された詳細鑑定書を読んだうえで対話しています。
鑑定書と矛盾しないこと。各回答は根拠と処方を示すこと。病気・死期の予言は禁止。

【鑑定書全文】
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
