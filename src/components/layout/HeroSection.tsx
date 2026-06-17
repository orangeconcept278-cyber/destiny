import { ArrowRight, Sparkles } from "lucide-react";

interface HeroSectionProps {
  onStart: () => void;
  onViewFlow: () => void;
}

export default function HeroSection({ onStart, onViewFlow }: HeroSectionProps) {
  return (
    <section
      id="hero"
      className="no-print hero-section relative flex items-end overflow-hidden"
    >
      <img
        src="/images/hero-header.png"
        alt=""
        className="absolute inset-0 w-full h-full object-cover object-right-center hero-image"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/55 to-black/30" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-6 pb-16 md:pb-20 pt-24">
        <span className="inline-block text-[10px] font-bold text-white/90 bg-white/10 backdrop-blur-sm px-3 py-1 border border-white/20 rounded-full tracking-[0.2em] uppercase mb-4">
          Syncretic Destiny Matrix
        </span>
        <h2 className="text-2xl md:text-4xl lg:text-[2.6rem] font-serif font-normal tracking-tight text-white leading-snug max-w-3xl">
          東洋・西洋の命運データベースを架橋する、究極の統合鑑定
        </h2>
        <p className="text-xs md:text-sm text-white/80 leading-relaxed font-sans mt-4 max-w-2xl">
          「四柱推命」「インド占星術」「西洋占星術」「数秘術」──4つの占術エンジンに出生情報を同時インプット。
          命運の重なる収束地帯を検出し、AIが現実的な処方を提示します。
        </p>
        <div className="flex flex-wrap items-center gap-4 mt-7">
          <button
            onClick={onStart}
            className="inline-flex items-center gap-2 px-6 py-3 bg-natural-olive-dark hover:bg-natural-olive text-white text-xs font-bold uppercase tracking-widest rounded-xl shadow-lg transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            今すぐ統合鑑定をはじめる
          </button>
          <button
            onClick={onViewFlow}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/90 hover:text-white transition-colors cursor-pointer"
          >
            鑑定の流れを見る
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
