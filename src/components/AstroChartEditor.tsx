import React from "react";
import { AllFortuneData } from "../types";
import { getCurrentYear } from "../utils/dateUtils";
import {
  Sparkles,
  HelpCircle,
  Sunset,
  History,
  Info,
  Layers,
  Search,
  BookOpen,
} from "lucide-react";

const JUKKAN = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];

interface AstroChartEditorProps {
  data: AllFortuneData;
  onChange: (updated: AllFortuneData) => void;
  onResetToCalculated: () => void;
}

export default function AstroChartEditor({
  data,
  onChange,
  onResetToCalculated,
}: AstroChartEditorProps) {
  const currentYear = getCurrentYear();

  // Update helpers
  const updateWestern = (key: keyof AllFortuneData["western"], val: string) => {
    onChange({
      ...data,
      western: { ...data.western, [key]: val },
    });
  };

  const updateVedic = (key: keyof AllFortuneData["vedic"], val: string) => {
    onChange({
      ...data,
      vedic: { ...data.vedic, [key]: val },
    });
  };

  const updateFourPillars = (key: keyof AllFortuneData["fourPillars"], val: string) => {
    onChange({
      ...data,
      fourPillars: { ...data.fourPillars, [key]: val },
    });
  };

  const updateNumerology = (key: keyof AllFortuneData["numerology"], val: string | number) => {
    onChange({
      ...data,
      numerology: { ...data.numerology, [key]: val },
    });
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Sync Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-natural-border p-5 rounded-xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-natural-light-cream rounded-lg text-natural-olive">
            <Layers className="w-5 h-5 animate-none" id="layers-icon" />
          </div>
          <div>
            <h4 className="font-semibold text-neutral-800 text-sm font-serif">生年月日の自動同期</h4>
            <p className="text-neutral-500 text-xs mt-0.5">
              生年月日を変更すると、4占術の基本定義が自動で一時計算され推奨値が割り振られます。
            </p>
          </div>
        </div>
        <button
          onClick={onResetToCalculated}
          className="px-4 py-2 self-start sm:self-center text-xs font-semibold bg-natural-olive hover:opacity-90 text-white transition-opacity duration-200 rounded-lg shadow-sm font-sans"
          id="btn-recalc"
        >
          全データを再初期化
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Western Astrology */}
        <div className="bg-white p-6 rounded-2xl border border-natural-border shadow-sm hover:shadow-md transition-all duration-350">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-natural-border/60">
            <div className="w-2.5 h-2.5 bg-natural-olive rounded-full" />
            <h3 className="text-sm font-bold text-natural-olive font-serif tracking-wider">
              1. 西洋占星術 (トロピカルカルテ)
            </h3>
          </div>
          <div className="space-y-4 text-xs font-sans">
            <div>
              <label className="block text-neutral-600 font-bold mb-1">
                アセンダント (ASC) <span className="text-neutral-450 font-normal">─ 東の地平線の上昇宮</span>
              </label>
              <input
                type="text"
                value={data.western.ascendant}
                onChange={(e) => updateWestern("ascendant", e.target.value)}
                className="w-full bg-natural-light-cream/35 border border-natural-border focus:border-natural-olive rounded-lg px-3 py-2 text-natural-text focus:outline-none transition-all font-medium"
                placeholder="例: 天秤座"
              />
            </div>
            <div>
              <label className="block text-neutral-600 font-bold mb-1">
                MC (天頂) <span className="text-neutral-450 font-normal">─ 社会的な到達・キャリア像</span>
              </label>
              <input
                type="text"
                value={data.western.mc}
                onChange={(e) => updateWestern("mc", e.target.value)}
                className="w-full bg-natural-light-cream/35 border border-natural-border focus:border-natural-olive rounded-lg px-3 py-2 text-natural-text focus:outline-none transition-all font-medium"
                placeholder="例: 双子座"
              />
            </div>
            <div>
              <label className="block text-neutral-600 font-bold mb-1">
                ステリウム (特定サインやハウス極端集中)
              </label>
              <input
                type="text"
                value={data.western.stellium}
                onChange={(e) => updateWestern("stellium", e.target.value)}
                className="w-full bg-natural-light-cream/35 border border-natural-border focus:border-natural-olive rounded-lg px-3 py-2 text-natural-text focus:outline-none transition-all font-medium"
                placeholder="例: 第10室 (蟹座) に太陽・金星・水星がステリウム"
              />
            </div>
            <div>
              <label className="block text-neutral-600 font-bold mb-1">主要アスペクト (合・衝・アングル等)</label>
              <textarea
                value={data.western.aspects}
                onChange={(e) => updateWestern("aspects", e.target.value)}
                rows={2}
                className="w-full bg-natural-light-cream/35 border border-natural-border focus:border-natural-olive rounded-lg px-3 py-2 text-natural-text focus:outline-none transition-all resize-none font-medium"
                placeholder="例: 太陽と冥王星がコンジャンクション、月と土星がスクエア"
              />
            </div>
            <div>
              <label className="block text-neutral-600 font-bold mb-1">主要天体のハウス配置</label>
              <input
                type="text"
                value={data.western.housePlacements}
                onChange={(e) => updateWestern("housePlacements", e.target.value)}
                className="w-full bg-natural-light-cream/35 border border-natural-border focus:border-natural-olive rounded-lg px-3 py-2 text-natural-text focus:outline-none transition-all font-medium"
                placeholder="例: 太陽:10室、月:6室、水星:10室、冥王星:1室"
              />
            </div>
          </div>
        </div>

        {/* Vedic Astrology (Jyotish) */}
        <div className="bg-white p-6 rounded-2xl border border-natural-border shadow-sm hover:shadow-md transition-all duration-350">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-natural-border/60">
            <div className="w-2.5 h-2.5 bg-natural-olive rounded-full" />
            <h3 className="text-sm font-bold text-natural-olive font-serif tracking-wider">
              2. インド占星術 (ジョーティシュ/サイデリアル)
            </h3>
          </div>
          <div className="space-y-4 text-xs font-sans">
            <div>
              <label className="block text-neutral-600 font-bold mb-1">
                ラグナ (上昇宮) <span className="text-neutral-450 font-normal">─ サイデリアルによる星座</span>
              </label>
              <input
                type="text"
                value={data.vedic.lagna}
                onChange={(e) => updateVedic("lagna", e.target.value)}
                className="w-full bg-natural-light-cream/35 border border-natural-border focus:border-natural-olive rounded-lg px-3 py-2 text-natural-text focus:outline-none transition-all font-medium"
                placeholder="例: 乙女座 (Kanya)"
              />
            </div>
            <div>
              <label className="block text-neutral-600 font-bold mb-1">
                月のナクシャトラ <span className="text-neutral-450 font-normal">─ 27宿による精神の依り代宿星</span>
              </label>
              <input
                type="text"
                value={data.vedic.nakshatra}
                onChange={(e) => updateVedic("nakshatra", e.target.value)}
                className="w-full bg-natural-light-cream/35 border border-natural-border focus:border-natural-olive rounded-lg px-3 py-2 text-natural-text focus:outline-none transition-all font-medium"
                placeholder="例: ハスタ (Hasta)"
              />
            </div>
            <div>
              <label className="block text-neutral-600 font-bold mb-1">
                主要ヨーガ <span className="text-neutral-450 font-normal">─ 天体アライメントが成す吉相・凶相</span>
              </label>
              <input
                type="text"
                value={data.vedic.yogas}
                onChange={(e) => updateVedic("yogas", e.target.value)}
                className="w-full bg-natural-light-cream/35 border border-natural-border focus:border-natural-olive rounded-lg px-3 py-2 text-natural-text focus:outline-none transition-all font-medium"
                placeholder="例: ガジャ・ケーサリ・ヨーガ"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-neutral-600 font-bold mb-1">シャドバラ (天体の強さ評価)</label>
                <input
                  type="text"
                  value={data.vedic.shadbala}
                  onChange={(e) => updateVedic("shadbala", e.target.value)}
                  className="w-full bg-natural-light-cream/35 border border-natural-border focus:border-natural-olive rounded-lg px-3 py-2 text-natural-text focus:outline-none transition-all font-medium"
                  placeholder="例: 最強:木星・水星 最弱:金星"
                />
              </div>
              <div>
                <label className="block text-neutral-600 font-bold mb-1">アシュタカヴァルガ点数</label>
                <input
                  type="text"
                  value={data.vedic.ashtakavarga}
                  onChange={(e) => updateVedic("ashtakavarga", e.target.value)}
                  className="w-full bg-natural-light-cream/35 border border-natural-border focus:border-natural-olive rounded-lg px-3 py-2 text-natural-text focus:outline-none transition-all font-medium"
                  placeholder="例: 10室:34点、8室:19点"
                />
              </div>
            </div>
            <div>
              <label className="block text-neutral-600 font-bold mb-1">ヴィムショッタリ・ダシャー (現在地)</label>
              <input
                type="text"
                value={data.vedic.dasha}
                onChange={(e) => updateVedic("dasha", e.target.value)}
                className="w-full bg-natural-light-cream/35 border border-natural-border focus:border-natural-olive rounded-lg px-3 py-2 text-natural-text focus:outline-none transition-all font-medium"
                placeholder="例: マハーダシャー:木星期 / アンタルダシャー:土星期"
              />
            </div>
          </div>
        </div>

        {/* Four Pillars of Destiny (Bazi) */}
        <div className="bg-white p-6 rounded-2xl border border-natural-border shadow-sm hover:shadow-md transition-all duration-350">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-natural-border/60">
            <div className="w-2.5 h-2.5 bg-natural-olive rounded-full" />
            <h3 className="text-sm font-bold text-natural-olive font-serif tracking-wider">
              3. 四柱推命 (定気 / 干支八字命式)
            </h3>
          </div>
          <div className="space-y-4 text-xs font-sans">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-neutral-600 font-bold mb-1">
                  日主 (日干) <span className="text-neutral-450 font-normal">─ 自己の根源たる本質</span>
                </label>
                <select
                  value={data.fourPillars.dayMaster}
                  onChange={(e) => updateFourPillars("dayMaster", e.target.value)}
                  className="w-full bg-natural-light-cream/35 border border-natural-border focus:border-natural-olive rounded-lg px-3 py-2 text-natural-text focus:outline-none transition-all font-medium"
                >
                  {JUKKAN.map((jk) => (
                    <option key={jk} value={jk}>
                      {jk}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-neutral-600 font-bold mb-1">
                  調候用神 <span className="text-neutral-450 font-normal">─ 命式の温度調和に必要な五行</span>
                </label>
                <input
                  type="text"
                  value={data.fourPillars.usefulGod}
                  onChange={(e) => updateFourPillars("usefulGod", e.target.value)}
                  className="w-full bg-natural-light-cream/35 border border-natural-border focus:border-natural-olive rounded-lg px-3 py-2 text-natural-text focus:outline-none transition-all font-medium"
                  placeholder="例: 癸水 (寒さや暑さを中和する五行)"
                />
              </div>
            </div>
            <div>
              <label className="block text-neutral-600 font-bold mb-1">通変星の偏り (生み出す力・抑える力)</label>
              <input
                type="text"
                value={data.fourPillars.starsBias}
                onChange={(e) => updateFourPillars("starsBias", e.target.value)}
                className="w-full bg-natural-light-cream/35 border border-natural-border focus:border-natural-olive rounded-lg px-3 py-2 text-natural-text focus:outline-none transition-all font-medium"
                placeholder="例: 官殺(偏官・正官)が極端に旺盛。その反面、比劫が不足"
              />
            </div>
            <div>
              <label className="block text-neutral-600 font-bold mb-1">空亡 (天中殺 ─ 空虚化するサイクル)</label>
              <input
                type="text"
                value={data.fourPillars.void}
                onChange={(e) => updateFourPillars("void", e.target.value)}
                className="w-full bg-natural-light-cream/35 border border-natural-border focus:border-natural-olive rounded-lg px-3 py-2 text-natural-text focus:outline-none transition-all font-medium"
                placeholder="例: 子丑 空亡"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-neutral-600 font-bold mb-1">現在の大運 (10年サイクル)</label>
                <input
                  type="text"
                   value={data.fourPillars.major运}
                  onChange={(e) => updateFourPillars("major运", e.target.value)}
                  className="w-full bg-natural-light-cream/35 border border-natural-border focus:border-natural-olive rounded-lg px-3 py-2 text-natural-text focus:outline-none transition-all font-medium"
                  placeholder="例: 丙午大運 (傷官・帝旺)"
                />
              </div>
              <div>
                <label className="block text-neutral-600 font-bold mb-1">現在の流年 (流年歳運)</label>
                <input
                  type="text"
                  value={data.fourPillars.year运}
                  onChange={(e) => updateFourPillars("year运", e.target.value)}
                  className="w-full bg-natural-light-cream/35 border border-natural-border focus:border-natural-olive rounded-lg px-3 py-2 text-natural-text focus:outline-none transition-all font-medium"
                  placeholder={`例: ${currentYear}年 丙午 (流年傷官)`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Numerology */}
        <div className="bg-white p-6 rounded-2xl border border-natural-border shadow-sm hover:shadow-md transition-all duration-350">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-natural-border/60">
            <div className="w-2.5 h-2.5 bg-natural-olive rounded-full" />
            <h3 className="text-sm font-bold text-natural-olive font-serif tracking-wider">
              4. 数秘術 (コアナンバーズ / 暗合計算)
            </h3>
          </div>
          <div className="space-y-4 text-xs font-sans">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-neutral-600 font-bold mb-1">
                  ライフパス (誕生数) <span className="text-neutral-400 font-normal">─ 生涯の使命・思考特性</span>
                </label>
                <input
                  type="number"
                  value={data.numerology.lifePath}
                  onChange={(e) => updateNumerology("lifePath", parseInt(e.target.value, 10))}
                  className="w-full bg-natural-light-cream/35 border border-natural-border focus:border-natural-olive rounded-lg px-3 py-2 text-natural-text focus:outline-none transition-all font-medium font-sans"
                  placeholder="例: 7 (単数還元)"
                  min={1}
                  max={33}
                />
              </div>
              <div>
                <label className="block text-neutral-600 font-bold mb-1">
                  ディスティニー (表現数) <span className="text-neutral-400 font-normal">─ 表に現れる能力</span>
                </label>
                <input
                  type="number"
                  value={data.numerology.destinyNum}
                  onChange={(e) => updateNumerology("destinyNum", parseInt(e.target.value, 10))}
                  className="w-full bg-natural-light-cream/35 border border-natural-border focus:border-natural-olive rounded-lg px-3 py-2 text-natural-text focus:outline-none transition-all font-medium font-sans"
                  placeholder="例: 8"
                  min={1}
                  max={33}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-neutral-600 font-bold mb-1">
                  ソウルナンバー <span className="text-neutral-400 font-normal">─ 魂究極の内在的喜び</span>
                </label>
                <input
                  type="number"
                  value={data.numerology.soulNum}
                  onChange={(e) => updateNumerology("soulNum", parseInt(e.target.value, 10))}
                  className="w-full bg-natural-light-cream/35 border border-natural-border focus:border-natural-olive rounded-lg px-3 py-2 text-natural-text focus:outline-none transition-all font-medium font-sans"
                  placeholder="例: 5"
                  min={1}
                  max={33}
                />
              </div>
              <div>
                <label className="block text-neutral-600 font-bold mb-1">
                  現在のパーソナルイヤー <span className="text-neutral-450 font-normal">─ {currentYear}年個人年運</span>
                </label>
                <input
                  type="number"
                  value={data.numerology.personalYear}
                  onChange={(e) => updateNumerology("personalYear", parseInt(e.target.value, 10))}
                  className="w-full bg-natural-light-cream/35 border border-natural-border focus:border-natural-olive rounded-lg px-3 py-2 text-natural-text focus:outline-none transition-all font-medium font-sans"
                  placeholder="例: 4"
                  min={1}
                  max={9}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
