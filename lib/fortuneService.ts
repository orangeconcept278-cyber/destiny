import { calculatePersonalYear } from "../src/utils/astrologyCalc";
import { buildRoadmapYearHeadings } from "../src/utils/dateUtils";
import { generateWithFallback } from "./gemini";

function hasStaleYearsInReport(report: string, currentYear: number): boolean {
  const section = report.split("未来時間割").pop() ?? report;
  for (let year = currentYear - 10; year < currentYear; year++) {
    if (section.includes(`${year}年`)) return true;
  }
  return false;
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
    basicInfo?: { gender?: string; location?: string; maritalStatus?: string; children?: string; birthDate?: string };
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
  const currentDateLabel = new Date().toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const roadmapYears = Array.from({ length: 5 }, (_, i) => currentYear + i);
  const birthDate = basicInfo?.birthDate ?? "";
  const roadmapYearLines = roadmapYears
    .map((year) => {
      const py = birthDate ? calculatePersonalYear(birthDate, year) : "未計算";
      return `・${year}年（パーソナルイヤー: ${py}）`;
    })
    .join("\n");
  const roadmapHeadings = buildRoadmapYearHeadings(currentYear, 5);

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
性別: ${basicInfo?.gender || "未指定"}
現在地: ${basicInfo?.location || "未指定"}
未既婚: ${basicInfo?.maritalStatus || "未指定"}
子供の有無: ${basicInfo?.children || "未指定"}

■■ 【3体系＋数秘】の統合データ ■■
【1】西洋占星術骨格 (トロピカル)
・アセンダント（ASC）: ${western?.ascendant || "未確定"}
・MC: ${western?.mc || "未確定"}
・天体ステリウム（特定ハウス・サインへの集中）: ${western?.stellium || "なし/未入力"}
・主要アスペクト: ${western?.aspects || "未入力"}
・主要天体のハウス位置: ${western?.housePlacements || "未入力"}

【2】インド占星術骨格 (サイデリアル/ジョーティシュ)
・ラグナ（上昇宮）: ${vedic?.lagna || "未確定"}
・月のナクシャトラ（宿曜）: ${vedic?.nakshatra || "未確定"}
・主要ヨーガ（星の組み合わせ）: ${vedic?.yogas || "未指定"}
・シャドバラ（天体の強さ。最強/最弱）: ${vedic?.shadbala || "未指定"}
・アシュタカヴァルガ（ハウスの得点。最高/最低ハウス）: ${vedic?.ashtakavarga || "未指定"}
・ダシャーの現在地: ${vedic?.dasha || "未指定"}

【3】四柱推命骨格 (八字)
・日主（日干・自分自身の本質）: ${fourPillars?.dayMaster || "未確定"}
・調候用神（命式のバランスを整える最重要五行）: ${fourPillars?.usefulGod || "未指定"}
・通変星の偏り: ${fourPillars?.starsBias || "未指定"}
・空亡（天中殺）: ${fourPillars?.void || "未指定"}
・現在の大運（10年周期の運気）: ${fourPillars?.major运 || "未指定"}
・現在の流年（${currentYear}年の運気）: ${fourPillars?.year运 || "未指定"}

【4】数秘術
・ライフパスナンバー（誕生数）: ${numerology?.lifePath || "未計算"}
・ディスティニーナンバー（表現数）: ${numerology?.destinyNum || "未計算"}
・ソウルナンバー（ハート数）: ${numerology?.soulNum || "未計算"}
・現在のパーソナルイヤー（${currentYear}年の個人年運）: ${numerology?.personalYear || "未計算"}

■■ 流年時間割メモ（ユーザー入力・あれば反映） ■■
${
  futureYearNotes && futureYearNotes.length > 0
    ? futureYearNotes.map((n) => `・${n.year}年: ${n.memo}`).join("\n")
    : "（なし）"
}

■■ 答え合わせ材料（バックテスト） ■■
過去の確定イベントと年:
${
  pastEvents && pastEvents.length > 0
    ? pastEvents.map((e) => `・${e.year}年: ${e.event}`).join("\n")
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

  const contents: { role: string; parts: { text: string }[] }[] = [];
  if (chatHistory && chatHistory.length > 0) {
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
    temperature: 0.75,
  });

  return response.text ?? "";
}
