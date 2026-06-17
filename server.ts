import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { calculatePersonalYear } from "./src/utils/astrologyCalc.ts";
import { buildRoadmapYearHeadings } from "./src/utils/dateUtils.ts";

dotenv.config({ override: true });

const apiKey = process.env.GEMINI_API_KEY;

function formatApiError(error: any): string {
  const message = String(error?.message ?? error ?? "");
  if (message.includes("CONSUMER_SUSPENDED") || message.includes("has been suspended")) {
    return "Gemini APIキーがGoogle側で停止されています。AI Studioで新しいキーを発行し、.env を更新してサーバーを再起動してください。";
  }
  if (message.includes("API key not valid") || message.includes("API_KEY_INVALID")) {
    return "Gemini APIキーが無効です。.env の GEMINI_API_KEY を確認してください。";
  }
  if (
    message.includes("503") ||
    message.includes("high demand") ||
    message.includes("UNAVAILABLE")
  ) {
    return "Geminiモデルが現在混雑しています。1〜2分待ってから再度お試しください。";
  }
  if (message.includes("429") || message.includes("quota")) {
    return "Gemini APIの利用上限に達しました。しばらく待つか、Google AI Studioで利用状況を確認してください。";
  }
  if (!apiKey || apiKey.includes("ここにAPIキーを貼り付け") || apiKey === "MY_GEMINI_API_KEY") {
    return "Gemini APIキーが設定されていません。.env に GEMINI_API_KEY を設定してください。";
  }
  return message || "鑑定の生成に失敗しました。";
}

if (!apiKey || apiKey.includes("ここにAPIキーを貼り付け") || apiKey === "MY_GEMINI_API_KEY") {
  console.warn("[警告] GEMINI_API_KEY が未設定です。鑑定生成は失敗します。");
}

const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

const MODEL_FALLBACKS = [
  process.env.GEMINI_MODEL,
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-2.5-flash-lite",
].filter((m): m is string => Boolean(m));

function isRetryableGeminiError(error: any): boolean {
  const message = String(error?.message ?? "");
  return (
    message.includes("503") ||
    message.includes("429") ||
    message.includes("UNAVAILABLE") ||
    message.includes("high demand") ||
    message.includes("quota")
  );
}

async function generateWithFallback(options: {
  contents: string | { role: string; parts: { text: string }[] }[];
  systemInstruction: string;
  temperature: number;
}) {
  let lastError: any;

  for (const model of MODEL_FALLBACKS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: options.contents,
          config: {
            systemInstruction: options.systemInstruction,
            temperature: options.temperature,
          },
        });
        console.log(`[Gemini] 鑑定生成成功: model=${model}`);
        return response;
      } catch (error: any) {
        lastError = error;
        if (isRetryableGeminiError(error) && attempt === 0) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          continue;
        }
        if (isRetryableGeminiError(error)) {
          console.warn(`[Gemini] model=${model} が利用不可のため次のモデルを試行します`);
          break;
        }
        throw error;
      }
    }
  }

  throw lastError;
}

function hasStaleYearsInReport(report: string, currentYear: number): boolean {
  const section = report.split("未来時間割").pop() ?? report;
  for (let year = currentYear - 10; year < currentYear; year++) {
    if (section.includes(`${year}年`)) return true;
  }
  return false;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: Fortune Generation
  app.post("/api/fortune", async (req, res) => {
    try {
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
      } = req.body;

      const currentYear = new Date().getFullYear();
      const currentDateLabel = new Date().toLocaleDateString("ja-JP", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const roadmapYears = Array.from({ length: 5 }, (_, i) => currentYear + i);
      const roadmapEndYear = roadmapYears[roadmapYears.length - 1];
      const birthDate = basicInfo?.birthDate ?? "";
      const roadmapYearLines = roadmapYears
        .map((year) => {
          const py = birthDate ? calculatePersonalYear(birthDate, year) : "未計算";
          return `・${year}年（パーソナルイヤー: ${py}）`;
        })
        .join("\n");
      const roadmapHeadings = buildRoadmapYearHeadings(currentYear, 5);

      // Construct system instruction that enforces strict guidelines
      const systemInstruction = `
あなたは西洋占星術・インド占星術（ジョーティシュ）・四柱推命・数秘術を横断して読む「統合鑑定者」です。
相談者の人生の楽譜を具体的に・深く読み解きます。

【鑑定基準日】
今日は ${currentDateLabel} です。「今年」「現在」は必ず ${currentYear} 年を指します。
${currentYear - 1} 年以前の西暦を、未来ロードマップや「現在〜」の期間に含めることは厳禁です。

【絶対遵守する出力スタイル】
1. 各論点は必ず「①結論」→「②どの占術体系のどのパラメータが根拠か（具体的に数値を引用）」→「③現実でどう行動するか（処方）」の順で書いてください。
2. 専門用語（例：調候用神、マハー・ダシャー、ステリウム等）を使う場合は、直後に必ず括弧書き等で「一言で訳した説明」を添えてください。
3. 事実（命式の配置など）、推測（そこから読み取れる傾向）、提案（処方）を厳格に分けて書いてください。推測については必ず「【推測】」と明記すること。
4. 励ましで薄めず、耳に痛いこと（乗り越えるべき課題や弱点）も根拠を示して誠実に伝えてください。
5. 占い倫理：出生図・命式は人生の「楽譜」であり、決定された「録音」ではありません。本人がどう弾くかが最重要であるというスタンスを貫いてください。病気・障害・死期は断定的に読まず、体調面は一般的傾向として伝えること。医療は専門医を優先するよう添えてください。

【鑑定の流れ】
1. 【各体系の骨格化（西洋・インド・四柱・数秘について、本人の特筆すべき特徴を提示）】
2. 【収束（マルチ・アライメント）の提示】
   - 2つ以上の占星術/東洋占術の体系が独立して「全く同じ結論・テーマ」を指している箇所を2〜3つ特定してください。
   - 一致度として、三重一致（確信度：高・確実なコアテーマ）、二重一致（確信度：中・主要テーマ）、単独（確信度：低・推測）を明示してください。
3. 【答え合わせ（バックテスト検証）】
   - 相談者が登録した過去の具体的イベントと、その時期の運気の巡り（四柱の大運・流年、インドのヴィムショッタリ・ダシャー、数秘のパーソナルイヤーなど）がどう連動・トリガーしていたかを一致判定し、解説してください（一致しない場合は正しくそう述べる）。
4. 【時系列の未来時間割】
   - 冒頭に「今後数年間の運気の流れをロードマップとして提示します。」と1行書いた後、下記の見出しを**このままコピーして使用**し、各年の解説を書いてください。見出しの年号変更・削除・追加は禁止です：
${roadmapHeadings}
   - 上記以外の年号（特に ${currentYear - 2}年、${currentYear - 1}年）を未来の区間として使わないでください。
   - 「現在〜${currentYear - 1}年」のような、過去の年を終点にする表現は禁止です。
   - 四柱の「丙午流年」は ${currentYear} 年の流年として解釈してください（2024年ではありません）。
5. 【リロケーション・相性（任意・データが有る場合）】
   - もし重要天体のMC経度情報や関係者のデータ、その他追加の考慮事項があれば、これらについても論じてください。
`;

      const prompt = `
以下の相談者の総合鑑定データをもとに、上記のシステム指示、ルール、スタイルに100%忠実に、究極に深みのある統合鑑定書を生成してください。

【鑑定基準日】${currentDateLabel}（基準年: ${currentYear}年）

■■ 未来ロードマップで使用する年（変更禁止）■■
${roadmapYearLines}

■■ 相談者基本情報 ■■
性別: ${basicInfo.gender || "未指定"}
現在地: ${basicInfo.location || "未指定"}
未既婚: ${basicInfo.maritalStatus || "未指定"}
子供の有無: ${basicInfo.children || "未指定"}

■■ 【3体系＋数秘】の統合データ ■■
【1】西洋占星術骨格 (トロピカル)
・アセンダント（ASC）: ${western.ascendant || "未確定"}
・MC: ${western.mc || "未確定"}
・天体ステリウム（特定ハウス・サインへの集中）: ${western.stellium || "なし/未入力"}
・主要アスペクト: ${western.aspects || "未入力"}
・主要天体のハウス位置: ${western.housePlacements || "未入力"}

【2】インド占星術骨格 (サイデリアル/ジョーティシュ)
・ラグナ（上昇宮）: ${vedic.lagna || "未確定"}
・月のナクシャトラ（宿曜）: ${vedic.nakshatra || "未確定"}
・主要ヨーガ（星の組み合わせ）: ${vedic.yogas || "未指定"}
・シャドバラ（天体の強さ。最強/最弱）: ${vedic.shadbala || "未指定"}
・アシュタカヴァルガ（ハウスの得点。最高/最低ハウス）: ${vedic.ashtakavarga || "未指定"}
・ダシャーの現在地: ${vedic.dasha || "未指定"}

【3】四柱推命骨格 (八字)
・日主（日干・自分自身の本質）: ${fourPillars.dayMaster || "未確定"}
・調候用神（命式のバランスを整える最重要五行）: ${fourPillars.usefulGod || "未指定"}
・通変星の偏り: ${fourPillars.starsBias || "未指定"}
・空亡（天中殺）: ${fourPillars.void || "未指定"}
・現在の大運（10年周期の運気）: ${fourPillars.major运 || "未指定"}
・現在の流年（${currentYear}年の運気）: ${fourPillars.year运 || "未指定"}

【4】数秘術
・ライフパスナンバー（誕生数）: ${numerology.lifePath || "未計算"}
・ディスティニーナンバー（表現数）: ${numerology.destinyNum || "未計算"}
・ソウルナンバー（ハート数）: ${numerology.soulNum || "未計算"}
・現在のパーソナルイヤー（${currentYear}年の個人年運）: ${numerology.personalYear || "未計算"}

■■ 流年時間割メモ（ユーザー入力・あれば反映） ■■
${
  futureYearNotes && futureYearNotes.length > 0
    ? futureYearNotes.map((n: { year: number; memo: string }) => `・${n.year}年: ${n.memo}`).join("\n")
    : "（なし）"
}

■■ 答え合わせ材料（バックテスト） ■■
過去の確定イベントと年:
${
  pastEvents && pastEvents.length > 0
    ? pastEvents.map((e: any) => `・${e.year}年: ${e.event}`).join("\n")
    : "（なし）"
}

■■ 繰り返す悩み・自己イメージ（自分でも気づいている癖や課題） ■■
${concerns || "（特になし）"}

■■ いちばん聞きたい問い ■■
${questions || "（特になし）"}
`;

      let response = await generateWithFallback({
        contents: prompt,
        systemInstruction,
        temperature: 0.55,
      });

      if (hasStaleYearsInReport(response.text ?? "", currentYear)) {
        console.warn("[Gemini] 未来時間割に過去年号を検出。再生成します。");
        response = await generateWithFallback({
          contents: `${prompt}

【再生成指示】
前回の出力は基準年 ${currentYear} 年より前の年号を未来ロードマップに含めていました。
必ず ${roadmapYears.join("年、")}年 のみを使用して、未来時間割を書き直してください。`,
          systemInstruction,
          temperature: 0.4,
        });
      }

      res.json({ report: response.text });
    } catch (error: any) {
      console.error("Fortune generation error:", error);
      res.status(500).json({ error: formatApiError(error) });
    }
  });

  // API Route: Interactive Counseling Chat based on Report & Current Session State
  app.post("/api/fortune/chat", async (req, res) => {
    try {
      const { chatHistory, report, userInput, basicData } = req.body;

      // Restructure chat format for Google GenAI SDK
      // The SDK expects contents in form of parts / role.
      // Format history to be Gemini compliant
      const systemInstruction = `
あなたは西洋占星術・インド占星術・四柱推命・数秘術を横断する「統合鑑定者」です。
現在、相談者があなたの作成した「統合鑑定書」を読んだうえで、あなたと直接対話を行っています。

【統合鑑定書（前提コンテキスト）】
${report}

【相談者のデータ】
${JSON.stringify(basicData)}

【対話ルール】
1. 相談者の個別の悩み、時期の捉え方、具体的な不安を温かく、かつ占術的な根拠（西洋/インド/四柱/数秘）を的確に紐付けながら解消に導いてください。
2. 決して鑑定書から逸脱した矛盾した内容を言わないでください。同じ「楽譜（宿命）」を多角的に、より具体的なレベルにブレイクダウンしてアドバイスする役割です。
3. 今回も、各アドバイスには「①根拠（特定の星、十干十二支、ダシャーなど）」「②現実的な処方箋」を明確に示してください。
4. 病気・医療・死期に関する不適切な予言は一切厳禁です。
5. 占い師として説教や抽象的な励ましをするだけでなく、相談者自身が人生の主導権を握れるよう「楽譜をどう美しく演奏するか」を一緒に探る対話にしてください。
`;

      // Build historical contents
      const contents = [];
      if (chatHistory && chatHistory.length > 0) {
        for (const msg of chatHistory) {
          contents.push({
            role: msg.role === "user" ? "user" : "model",
            parts: [{ text: msg.text }],
          });
        }
      }

      // Add the final user message
      contents.push({
        role: "user",
        parts: [{ text: userInput }],
      });

      const response = await generateWithFallback({
        contents,
        systemInstruction,
        temperature: 0.75,
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Fortune chat error:", error);
      res.status(500).json({ error: formatApiError(error) });
    }
  });

  // Serve Vite app or compiled production client
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[統合鑑定盤サーバー] 起動中... http://localhost:${PORT}`);
  });
}

startServer();
