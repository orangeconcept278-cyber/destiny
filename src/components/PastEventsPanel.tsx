import React, { useState } from "react";
import { PastEvent } from "../types";
import { getCurrentYear } from "../utils/dateUtils";
import { Plus, Trash2, Milestone } from "lucide-react";

interface PastEventsPanelProps {
  events: PastEvent[];
  onChange: (events: PastEvent[]) => void;
  syncNote?: string;
}

export default function PastEventsPanel({ events, onChange, syncNote }: PastEventsPanelProps) {
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

    onChange([...events, nEvent].sort((a, b) => a.year - b.year));
    setNewEventText("");
  };

  const removeEvent = (id: string) => {
    onChange(events.filter((e) => e.id !== id));
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-natural-border shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
        <div className="flex items-center gap-2">
          <Milestone className="w-5 h-5 text-natural-olive" />
          <h3 className="text-sm font-bold text-neutral-800 font-serif">
            鑑定精度を上げる：答え合わせ材料 (過去の出来事)
          </h3>
        </div>
        <span className="text-[10px] text-neutral-400 font-medium">※ 5〜10個推奨（任意）</span>
      </div>

      {syncNote && (
        <p className="text-[10px] text-natural-olive/80 mb-3 font-sans">{syncNote}</p>
      )}

      <p className="text-xs text-neutral-500 leading-relaxed mb-4 font-sans">
        確定している人生のイベント。就職、転職、独立、結婚、引越し、健康の節目などを登録。
        AIが「なぜその年に出来事があったか」を四柱推命の大運・流年やインド占星術のダシャー期と自動対比分析（バックテスト）します。
      </p>

      <div className="space-y-2 mb-4 max-h-[220px] overflow-y-auto pr-1">
        {events.length === 0 ? (
          <div className="text-center py-8 text-neutral-400 text-xs border border-dashed border-natural-border rounded-xl bg-natural-light-cream/20">
            出来事が登録されていません。下記フォームから追加してください。
          </div>
        ) : (
          events.map((ev) => (
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
  );
}
