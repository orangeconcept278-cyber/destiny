import React, { useState } from "react";
import { AllFortuneData, PastEvent, FutureYearNote } from "../types";
import { getCurrentYear, getFutureYears } from "../utils/dateUtils";
import { Plus, Trash2, Calendar, GitCommit, CheckCircle2, Milestone, Settings, Sunrise } from "lucide-react";

interface TimelineMilestoneProps {
  data: AllFortuneData;
  onChangePastEvents: (events: PastEvent[]) => void;
  onChangeFutureYearNotes: (notes: FutureYearNote[]) => void;
}

export default function TimelineMilestone({
  data,
  onChangePastEvents,
  onChangeFutureYearNotes,
}: TimelineMilestoneProps) {
  const currentYear = getCurrentYear();
  const [newEventYear, setNewEventYear] = useState<string>(String(currentYear - 1));
  const [newEventText, setNewEventText] = useState<string>("");

  const addEvent = () => {
    if (!newEventText.trim()) return;
    const yearNum = parseInt(newEventYear, 10);
    if (isNaN(yearNum)) return;

    const nEvent: PastEvent = {
      id: Math.random().toString(36).substring(2, 9),
      year: yearNum,
      event: newEventText,
    };

    onChangePastEvents([...data.pastEvents, nEvent].sort((a, b) => a.year - b.year));
    setNewEventText("");
  };

  const removeEvent = (id: string) => {
    onChangePastEvents(data.pastEvents.filter((e) => e.id !== id));
  };

  const getFutureMemo = (year: number) =>
    data.futureYearNotes?.find((n) => n.year === year)?.memo ?? "";

  const updateFutureMemo = (year: number, memo: string) => {
    const existing = data.futureYearNotes ?? [];
    const without = existing.filter((n) => n.year !== year);
    const next = memo.trim()
      ? [...without, { year, memo }].sort((a, b) => a.year - b.year)
      : without;
    onChangeFutureYearNotes(next);
  };

  // Pre-calculate future years and their astrological triggers
  const futureYears = getFutureYears(5, currentYear).map((yr) => {
    const py = (Number(data.numerology.personalYear) + (yr - currentYear) - 1) % 9 + 1;
    
    // Period stage mapping
    let phase: "仕込み・内省" | "挑戦・山場" | "収穫・好機" | "試練・調整" = "仕込み・内省";
    let desc = "";
    let triggerColor = "";

    // Map by Personal Year and Day Master
    if ([1, 5, 8].includes(py)) {
      phase = "挑戦・山場";
      desc = "新規躍進、多忙を極めるビジネスや独立への勝負期。攻めの姿勢。";
      triggerColor = "text-amber-400 bg-amber-500/10 border-amber-500/20";
    } else if ([3, 6, 9].includes(py)) {
      phase = "収穫・好機";
      desc = "これまで撒いた種が実を結ぶ、金運・人間関係の最盛期。表現の成果。";
      triggerColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    } else if ([4, 7].includes(py)) {
      phase = "試練・調整";
      desc = "足元を固め、断捨離と学び、心身のメンテナンス。過度な拡張は禁物。";
      triggerColor = "text-cyan-400 bg-cyan-500/10 border-cyan-500/20";
    } else {
      phase = "仕込み・内省";
      desc = "次なる9年周期への準備。自己投資、種まき、静けさを尊ぶ時期。";
      triggerColor = "text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20";
    }

    return {
      year: yr,
      personalYear: py,
      phase,
      desc,
      triggerColor,
    };
  });

  return (
    <div className="space-y-6" id="timeline-milestone-panel">
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Left Side: Backtesting past events */}
        <div className="flex-1 bg-white p-6 rounded-2xl border border-natural-border shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
            <div className="flex items-center gap-2">
              <Milestone className="w-5 h-5 text-natural-olive" id="icon-milestone" />
              <h3 className="text-sm font-bold text-neutral-800 font-serif">
                鑑定精度を上げる：答え合わせ材料 (過去の出来事)
              </h3>
            </div>
            <span className="text-[10px] text-neutral-400 font-medium">※ 5〜10個推奨</span>
          </div>

          <p className="text-xs text-neutral-500 leading-relaxed mb-4 font-sans">
            確定している人生のイベント。就職、転職、独立、結婚、引越し、健康の節目などを登録。
            AIが「なぜその年に出来事があったか」を四柱推命の大運・流年やインド占星術のダシャー期と自動対比分析（バックテスト）します。
          </p>

          {/* List of enrolled Events */}
          <div className="space-y-2 mb-4 max-h-[220px] overflow-y-auto pr-1">
            {data.pastEvents.length === 0 ? (
              <div className="text-center py-8 text-neutral-400 text-xs border border-dashed border-natural-border rounded-xl bg-natural-light-cream/20">
                出来事が登録されていません。下記フォームから追加してください。
              </div>
            ) : (
              data.pastEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="flex items-center justify-between bg-natural-light-cream/40 p-3 rounded-xl border border-natural-border hover:bg-natural-light-cream/60 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-natural-olive bg-white px-2.5 py-0.5 rounded-lg border border-natural-border">
                      {ev.year}年
                    </span>
                    <span className="text-xs text-neutral-700 font-medium font-sans">{ev.event}</span>
                  </div>
                  <button
                    onClick={() => removeEvent(ev.id)}
                    className="p-1 px-1.5 text-neutral-400 hover:text-red-650 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="イベントを削除"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Add input */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-natural-light-cream/30 border border-natural-border/70 p-3 rounded-xl">
            <div className="sm:col-span-3">
              <input
                type="number"
                value={newEventYear}
                onChange={(e) => setNewEventYear(e.target.value)}
                placeholder={String(currentYear - 1)}
                className="w-full bg-white text-xs text-neutral-800 px-3 py-2 rounded-lg border border-natural-border focus:outline-none focus:border-natural-olive font-semibold font-sans animate-none"
                min="1900"
                max="2100"
              />
            </div>
            <div className="sm:col-span-7">
              <input
                type="text"
                value={newEventText}
                onChange={(e) => setNewEventText(e.target.value)}
                placeholder="例: IT企業への転職と都内へ転居"
                className="w-full bg-white text-xs text-neutral-700 px-3 py-2 rounded-lg border border-natural-border focus:outline-none focus:border-natural-olive font-sans animate-none"
              />
            </div>
            <button
              onClick={addEvent}
              className="sm:col-span-2 w-full py-2 bg-natural-olive hover:opacity-90 text-white font-semibold text-xs flex items-center justify-center gap-1 transition-opacity rounded-lg font-sans cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> 追加
            </button>
          </div>
        </div>

        {/* Right Side: Destiny Future Roadmap */}
        <div className="flex-1 bg-white p-6 rounded-2xl border border-natural-border shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Sunrise className="w-5 h-5 text-natural-olive" id="sunrise-timeline" />
            <h3 className="text-sm font-bold text-neutral-800 font-serif">
              近未来の運命変動盤 {currentYear} ─ {currentYear + 4} (Time Mapping)
            </h3>
          </div>
          <p className="text-xs text-neutral-500 leading-relaxed mb-4 font-sans">
            数秘術のパーソナルイヤー期から抽出される5年間の大きなサイクル。
            統合鑑定書では、更に東洋占術（ヴィムショッタリ・ダシャーや流年歳運）と密に重ね合わせた精密な年運期をお届けします。
          </p>

          <div className="space-y-3">
            {futureYears.map((item) => {
              // Map elegant natural triggers of color
              let triggerStyle = "";
              if (item.phase === "挑戦・山場") {
                triggerStyle = "text-amber-800 bg-amber-50 border-amber-200";
              } else if (item.phase === "収穫・好機") {
                triggerStyle = "text-natural-olive bg-natural-light-cream border-natural-border";
              } else if (item.phase === "試練・調整") {
                triggerStyle = "text-amber-900 bg-amber-50/50 border-amber-200/50";
              } else {
                triggerStyle = "text-neutral-700 bg-neutral-100 border-neutral-200";
              }

              return (
                <div
                  key={item.year}
                  className="group relative flex gap-3 p-3.5 bg-neutral-50/40 rounded-xl border border-natural-border/60 hover:border-natural-border transition-all duration-300"
                >
                  {/* Year Indicator */}
                  <div className="flex flex-col justify-center items-center shrink-0 w-12 border-r border-natural-border/50 pr-2">
                    <span className="text-xs font-semibold text-neutral-800 font-serif tracking-tight">
                      {item.year}年
                    </span>
                    <span className="text-[9px] text-neutral-500 mt-0.5">年運 {item.personalYear}</span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${triggerStyle}`}
                      >
                        {item.phase}
                      </span>
                      <span className="text-neutral-400 text-[10px]">変動周期</span>
                    </div>
                    <p className="text-xs text-neutral-600 leading-relaxed font-sans mt-0.5">
                      {item.desc}
                    </p>
                    <textarea
                      value={getFutureMemo(item.year)}
                      onChange={(e) => updateFutureMemo(item.year, e.target.value)}
                      rows={2}
                      placeholder="この年のメモ・予定・注目テーマ（保存されます）"
                      className="w-full mt-2 text-[11px] font-sans text-neutral-700 leading-relaxed p-2.5 bg-white border border-natural-border focus:border-natural-olive rounded-lg focus:outline-none transition-all resize-none"
                    />
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </div>
  );
}
