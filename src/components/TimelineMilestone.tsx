import React from "react";
import { AllFortuneData, PastEvent, FutureYearNote } from "../types";
import { getCurrentYear, getFutureYears } from "../utils/dateUtils";
import { Sunrise } from "lucide-react";
import PastEventsPanel from "./PastEventsPanel";

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

  const futureYears = getFutureYears(5, currentYear).map((yr) => {
    const py = (Number(data.numerology.personalYear) + (yr - currentYear) - 1) % 9 + 1;

    let phase: "仕込み・内省" | "挑戦・山場" | "収穫・好機" | "試練・調整" = "仕込み・内省";
    let desc = "";

    if ([1, 5, 8].includes(py)) {
      phase = "挑戦・山場";
      desc = "新規躍進、多忙を極めるビジネスや独立への勝負期。攻めの姿勢。";
    } else if ([3, 6, 9].includes(py)) {
      phase = "収穫・好機";
      desc = "これまで撒いた種が実を結ぶ、金運・人間関係の最盛期。表現の成果。";
    } else if ([4, 7].includes(py)) {
      phase = "試練・調整";
      desc = "足元を固め、断捨離と学び、心身のメンテナンス。過度な拡張は禁物。";
    } else {
      phase = "仕込み・内省";
      desc = "次なる9年周期への準備。自己投資、種まき、静けさを尊ぶ時期。";
    }

    return { year: yr, personalYear: py, phase, desc };
  });

  return (
    <div className="space-y-6" id="timeline-milestone-panel">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <PastEventsPanel
            events={data.pastEvents}
            onChange={onChangePastEvents}
            syncNote="基本設定（Step 1）で登録した内容と同期表示されます。ここからの編集も保存されます。"
          />
        </div>

        <div className="flex-1 bg-white p-6 rounded-2xl border border-natural-border shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Sunrise className="w-5 h-5 text-natural-olive" />
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
                  <div className="flex flex-col justify-center items-center shrink-0 w-12 border-r border-natural-border/50 pr-2">
                    <span className="text-xs font-semibold text-neutral-800 font-serif tracking-tight">
                      {item.year}年
                    </span>
                    <span className="text-[9px] text-neutral-500 mt-0.5">年運 {item.personalYear}</span>
                  </div>

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
