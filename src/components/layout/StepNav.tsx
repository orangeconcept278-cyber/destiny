import { ReactNode } from "react";
import { User, Layers, Calendar, BookOpen } from "lucide-react";
import { AppTab } from "../../types/layout";

interface StepNavProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  reportReady: boolean;
}

const STEPS: { id: AppTab; label: string; short: string; icon: React.ReactNode }[] = [
  { id: "input", label: "基本設定 ＆ 占術カルテ", short: "1", icon: <User className="w-4 h-4" /> },
  { id: "alignment", label: "収束アライメント", short: "2", icon: <Layers className="w-4 h-4" /> },
  { id: "timeline", label: "流年時間割", short: "3", icon: <Calendar className="w-4 h-4" /> },
  { id: "report", label: "統合鑑定書 ＆ 相談", short: "4", icon: <BookOpen className="w-4 h-4" /> },
];

export default function StepNav({ activeTab, onTabChange, reportReady }: StepNavProps) {
  return (
    <div
      id="step-nav"
      className="no-print bg-white border border-natural-border rounded-2xl shadow-md px-2 py-2 md:px-4 md:py-3 -mt-8 relative z-20"
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-1 md:gap-2">
        {STEPS.map((step) => {
          const isActive = activeTab === step.id;
          const isDisabled = step.id === "report" && !reportReady;

          return (
            <button
              key={step.id}
              onClick={() => {
                if (!isDisabled) onTabChange(step.id);
              }}
              disabled={isDisabled}
              className={`flex items-center gap-2 px-3 py-2.5 md:py-3 rounded-xl text-left transition-all ${
                isActive
                  ? "bg-natural-light-cream border border-natural-border text-natural-olive shadow-sm"
                  : isDisabled
                  ? "opacity-40 cursor-not-allowed text-neutral-400"
                  : "text-neutral-600 hover:bg-natural-light-cream/60 hover:text-natural-olive"
              }`}
            >
              <span
                className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                  isActive ? "bg-natural-olive text-white" : "bg-neutral-100 text-neutral-500"
                }`}
              >
                {isActive ? step.icon : step.short}
              </span>
              <span className="text-[10px] md:text-xs font-semibold leading-tight">
                <span className="hidden sm:inline">{step.short}. </span>
                {step.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
