import React, { useMemo } from "react";
import { AllFortuneData } from "../types";
import { Sparkles, Compass, AlertCircle, Award, Palette, Workflow, Eye } from "lucide-react";

interface MultiAlignmentVisualizerProps {
  data: AllFortuneData;
}

interface AlignmentTheme {
  title: string;
  description: string;
  intensity: "HIGH" | "MEDIUM" | "LOW"; // 三重・二重・単独
  colorClass: string;
  borderColor: string;
  bgGradient: string;
  icon: React.ReactNode;
  alignments: {
    system: "西洋占星術" | "インド占星術" | "四柱推命" | "数秘術";
    factor: string;
    translation: string;
  }[];
  guidance: string;
}

export default function MultiAlignmentVisualizer({ data }: MultiAlignmentVisualizerProps) {
  const alignmentsResult = useMemo(() => {
    const list: AlignmentTheme[] = [];

    // ──────────────────────────────────────────────
    // Theme 1: 社会的権威・規律・キャリアの志向（Leadership & Structure）
    // ──────────────────────────────────────────────
    const leadershipAlignments: AlignmentTheme["alignments"] = [];
    
    // Check Western
    if (
      data.western.mc.includes("山羊座") || 
      data.western.mc.includes("牡羊座") ||
      data.western.stellium.includes("10室") ||
      data.western.housePlacements.includes("10室")
    ) {
      leadershipAlignments.push({
        system: "西洋占星術",
        factor: `MCが${data.western.mc || "山羊座系"} / 10室配置`,
        translation: "社会的頂点(MC)の強調およびキャリア室の充実",
      });
    }

    // Check Vedic
    if (
      data.vedic.ashtakavarga.includes("10室") && 
      parseInt(data.vedic.ashtakavarga.match(/\d+/)?.[0] || "0", 10) >= 30
    ) {
      leadershipAlignments.push({
        system: "インド占星術",
        factor: "10室アシュタカヴァルガ高得点 (30点以上)",
        translation: "仕事・栄誉を示す第10宮が周囲から協力されやすい配置",
      });
    }

    // Check pillars
    if (
      data.fourPillars.starsBias.includes("官星") || 
      data.fourPillars.starsBias.includes("官殺") ||
      ["庚", "戊", "甲"].includes(data.fourPillars.dayMaster)
    ) {
      leadershipAlignments.push({
        system: "四柱推命",
        factor: `日主: ${data.fourPillars.dayMaster} / 官殺旺盛`,
        translation: "自分（日主）を律する社会的役割（官星）と強い責任感",
      });
    }

    // Check Numerology
    if ([1, 8, 22].includes(Number(data.numerology.lifePath))) {
      leadershipAlignments.push({
        system: "数秘術",
        factor: `ライフパス: ${data.numerology.lifePath}`,
        translation: "リーダーシップ、困難突破、統率力を示すコアナンバー",
      });
    }

    if (leadershipAlignments.length >= 2) {
      list.push({
        title: "社会的責任とブレなき統率力 (Core Authority & Focus)",
        description: "周囲を巻き込み、組織や自己ビジネスで長期的な頂点を目指す、天性と義務感の融合。",
        intensity: leadershipAlignments.length >= 3 ? "HIGH" : "MEDIUM",
        colorClass: "text-amber-400 fill-amber-500",
        borderColor: "border-amber-500/20 hover:border-amber-500/40",
        bgGradient: "from-amber-500/5 to-transparent",
        icon: <Award className="w-5 h-5 text-amber-400" />,
        alignments: leadershipAlignments,
        guidance: "高い自己管理能力が周囲を引っ張りますが、厳格すぎると自身が燃え尽きます。弱みを見せること自体が他者の安心感を醸成します。",
      });
    }

    // ──────────────────────────────────────────────
    // Theme 2: 深い感受性・アート・哲学的洞察 (High Sensitivity & Creative Insight)
    // ──────────────────────────────────────────────
    const creativeAlignments: AlignmentTheme["alignments"] = [];

    // Check Western
    if (
      data.western.stellium.includes("12室") || 
      data.western.housePlacements.includes("12室") ||
      data.western.housePlacements.includes("5室") ||
      data.western.aspects.toLowerCase().includes("neptune") ||
      data.western.aspects.includes("海王星")
    ) {
      creativeAlignments.push({
        system: "西洋占星術",
        factor: "海王星アスペクト / 第5室・12室の強調",
        translation: "芸術や無意識（12室）、創造（5室）への強い結びつき",
      });
    }

    // Check Vedic
    if (
      data.vedic.nakshatra.includes("ハスタ") ||
      data.vedic.nakshatra.includes("ローヒニー") ||
      data.vedic.shadbala.includes("月:強")
    ) {
      creativeAlignments.push({
        system: "インド占星術",
        factor: `ナクシャトラ: ${data.vedic.nakshatra}`,
        translation: "繊細な手仕事、豊かな情緒、創造性を宿す月の親和宿星",
      });
    }

    // Check pillars
    if (
      data.fourPillars.starsBias.includes("食傷") || 
      data.fourPillars.starsBias.includes("食神") || 
      data.fourPillars.starsBias.includes("傷官") ||
      ["乙", "丁", "辛", "癸"].includes(data.fourPillars.dayMaster)
    ) {
      creativeAlignments.push({
        system: "四柱推命",
        factor: `日主: ${data.fourPillars.dayMaster} / 食傷・比劫型のエレメント`,
        translation: "自己表現・繊細な美的感覚（食傷星）と言葉や造形への傾倒",
      });
    }

    // Check Numerology
    if ([3, 7, 9, 11, 33].includes(Number(data.numerology.lifePath))) {
      creativeAlignments.push({
        system: "数秘術",
        factor: `ライフパス: ${data.numerology.lifePath}`,
        translation: "表現欲求（3）、思索的哲学（7）、直感とインスピレーション（11/33）",
      });
    }

    if (creativeAlignments.length >= 2) {
      list.push({
        title: "美の探求と直感的インサイト (Intuitive Craftsmanship)",
        description: "極めて精緻なセンサーを持ち、目に見えない価値や美の本質、真理を表現する精神性。",
        intensity: creativeAlignments.length >= 3 ? "HIGH" : "MEDIUM",
        colorClass: "text-fuchsia-400 fill-fuchsia-500",
        borderColor: "border-fuchsia-500/20 hover:border-fuchsia-500/40",
        bgGradient: "from-fuchsia-500/5 to-transparent",
        icon: <Palette className="w-5 h-5 text-fuchsia-400" />,
        alignments: creativeAlignments,
        guidance: "社会通念に自分を合わせようとすると五感が疲弊します。1人きりの聖域（アトリエ・没頭時間）を確保し、心のノイズを排することが最高の養生です。",
      });
    }

    // ──────────────────────────────────────────────
    // Theme 3: 葛藤の克服・自己鍛錬・完璧主義 (Structural Friction & Transformation)
    // ──────────────────────────────────────────────
    const frictionAlignments: AlignmentTheme["alignments"] = [];

    // Check Western
    if (
      data.western.aspects.toLowerCase().includes("saturn") || 
      data.western.aspects.includes("土星") || 
      data.western.aspects.includes("スクエア")
    ) {
      frictionAlignments.push({
        system: "西洋占星術",
        factor: "土星(Saturn)やスクエア(90度アスペクト)の強調",
        translation: "制限や自己鍛錬、課題を投げかける重厚な星のアライン",
      });
    }

    // Check Vedic
    if (
      data.vedic.shadbala.toLowerCase().includes("土星") || 
      data.vedic.dasha.includes("土星")
    ) {
      frictionAlignments.push({
        system: "インド占星術",
        factor: "土星(Shani)によるダシャー期またはシャドバラ支配",
        translation: "時間をかけた忍耐、試練、長期の現実構築を促す時期観",
      });
    }

    // Check pillars
    if (
      data.fourPillars.starsBias.includes("比劫星旺盛") || 
      data.fourPillars.void.includes(data.fourPillars.dayMaster) ||
      ["庚", "辛"].includes(data.fourPillars.dayMaster)
    ) {
      frictionAlignments.push({
        system: "四柱推命",
        factor: `日主: ${data.fourPillars.dayMaster} / 剛毅な金五行主導`,
        translation: "葛藤を乗り越え己を叩き上げて輝く、鉄鉱石または磨かれる宝石たる性質",
      });
    }

    // Check Numerology
    if ([4, 7, 22].includes(Number(data.numerology.lifePath))) {
      frictionAlignments.push({
        system: "数秘術",
        factor: `ライフパス: ${data.numerology.lifePath}`,
        translation: "盤石な基礎の構築（4）、内省と孤高の絶対探求（7）",
      });
    }

    if (frictionAlignments.length >= 2) {
      list.push({
        title: "自己鍛錬と極限突破の命運 (Alchemy through Refinement)",
        description: "容易な妥協を許さず、高い障壁に直面するたび、強固に内面を精錬（錬金術）していく宿命。",
        intensity: frictionAlignments.length >= 3 ? "HIGH" : "MEDIUM",
        colorClass: "text-cyan-400 fill-cyan-500",
        borderColor: "border-cyan-500/20 hover:border-cyan-500/40",
        bgGradient: "from-cyan-500/5 to-transparent",
        icon: <Compass className="w-5 h-5 text-cyan-400" />,
        alignments: frictionAlignments,
        guidance: "「自分はまだまだ足りない」という完璧主義の呪縛を解くこと。バックテストにある節目の苦戦は、すべて次のステージのための殻破り（熟成）のトリガーです。",
      });
    }

    // Fallback if low matches
    if (list.length === 0) {
      list.push({
        title: "多角的多彩の調和 (Multi-Disciplinary Synthesis)",
        description: "特定の極端な偏りがなく、複数の個性がゆるやかに織りなされている柔軟な器。",
        intensity: "LOW",
        colorClass: "text-neutral-400 fill-neutral-500",
        borderColor: "border-neutral-800",
        bgGradient: "from-neutral-800/2 to-transparent",
        icon: <Workflow className="w-5 h-5 text-neutral-400" />,
        alignments: [
          { system: "西洋占星術", factor: "ハウス均衡配置", translation: "すべての天体が複数のハウスに分散" },
          { system: "四柱推命", factor: "五行中庸", translation: "極端に少ない・多い五行がなくバランスが最良" },
        ],
        guidance: "極端な偏りがないため、どの環境にも順応。一方で何を最優先すべきか迷いやすい。直感的な数秘や年の運気を羅針盤にしてください。",
      });
    }

    return list;
  }, [data]);

  return (
    <div className="space-y-6" id="multi-alignment-container">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-5 h-5 text-natural-olive animate-pulse animate-none" id="sparkles-align" />
        <h2 className="text-base font-bold text-neutral-800 font-serif tracking-wide">
          【最重要工程】占術アライメント (運命の多重収束)
        </h2>
      </div>
      <p className="text-xs text-neutral-500 leading-relaxed max-w-2xl font-sans">
        異なる発祥・歴史を持つ東洋と西洋の占い。それらが「同じ生年月日」という1つの鍵から、
        独立して全く同じ傾向（象意）をあぶり出す現象が「多重収束」です。ここで浮き出たテーマこそが、
        あなたの人生における最高の「楽譜的主題（コンチェルト）」となります。
      </p>

      <div className="grid grid-cols-1 gap-5 mt-4">
        {alignmentsResult.map((theme, idx) => (
          <div
            key={idx}
            className="relative overflow-hidden bg-white border border-natural-border p-6 rounded-2xl transition-all duration-300 flex flex-col justify-between shadow-sm hover:shadow-md"
            id={`align-card-${idx}`}
          >
            {/* Top Row: Header & Intensity */}
            <div>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-natural-light-cream rounded-xl">
                    {theme.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-neutral-800 tracking-wide font-serif">
                      {theme.title}
                    </h3>
                    <p className="text-[11px] text-neutral-500 mt-1 max-w-xl leading-relaxed">
                      {theme.description}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <span
                    className={`text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                      theme.intensity === "HIGH"
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : theme.intensity === "MEDIUM"
                        ? "bg-amber-50/50 text-amber-750 border border-amber-200/50"
                        : "bg-neutral-100 text-neutral-500 border border-neutral-200"
                    }`}
                  >
                    {theme.intensity === "HIGH" ? "三重収束（確信度：極高）" : theme.intensity === "MEDIUM" ? "二重収束（確信度：中）" : "単独仮説（確信度：低）"}
                  </span>
                </div>
              </div>

              {/* Alignments Proof Points */}
              <div className="mt-5 space-y-2.5 bg-natural-light-cream/40 p-4 rounded-xl border border-natural-border/60">
                <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1 flex items-center gap-1.5 font-sans">
                  <Eye className="w-3.5 h-3.5" /> 各占術における独立検出パラメータ
                </div>
                {theme.alignments.map((align, aIdx) => (
                  <div key={aIdx} className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 text-xs">
                    <div className="sm:col-span-3">
                      <span className="inline-block text-[10px] font-semibold text-natural-olive px-2 py-0.5 bg-white border border-natural-border rounded-lg">
                        {align.system}
                      </span>
                    </div>
                    <div className="sm:col-span-4 text-neutral-700 font-medium">
                      {align.factor}
                    </div>
                    <div className="sm:col-span-5 text-neutral-500 text-[11px] italic">
                      └ {align.translation}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Prescription */}
            <div className="mt-5 pt-4 border-t border-natural-border/50">
              <div className="flex items-start gap-2 text-xs">
                <AlertCircle className={`w-4 h-4 mt-0.5 shrink-0 ${theme.intensity === "HIGH" ? "text-natural-olive" : "text-neutral-400"}`} />
                <div className="text-neutral-600 leading-relaxed font-sans">
                  <span className="font-bold text-neutral-800">【現実の処方箋】</span>
                  {theme.guidance}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
