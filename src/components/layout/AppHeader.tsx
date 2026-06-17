import { Cpu } from "lucide-react";

const NAV_ITEMS = [
  { label: "ホーム", href: "#hero" },
  { label: "鑑定の流れ", href: "#step-nav" },
  { label: "機能紹介", href: "#tab-panels-viewport" },
  { label: "料金プラン", href: "#tab-panels-viewport" },
  { label: "ガイド", href: "#tab-panels-viewport" },
  { label: "よくある質問", href: "#tab-panels-viewport" },
];

export default function AppHeader() {
  return (
    <header
      className="no-print sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-natural-border"
      id="app-header"
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between gap-4">
        <a href="#hero" className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl overflow-hidden border border-natural-border shadow-md shadow-natural-olive/10 bg-white">
            <img
              src="/images/logo-mark.png"
              alt="ASTRIAロゴ"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <p className="text-sm font-bold tracking-wider font-serif text-natural-olive leading-tight">
              ASTRIA
            </p>
            <p className="text-[10px] text-neutral-500">統合鑑定システム</p>
          </div>
        </a>

        <nav className="hidden lg:flex items-center gap-5 text-[11px] font-medium text-neutral-600">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="hover:text-natural-olive transition-colors whitespace-nowrap"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-natural-olive-dark text-natural-cream rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0">
          <Cpu className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">四星統合エンジン 安定稼働</span>
          <span className="sm:hidden">安定稼働</span>
        </div>
      </div>
    </header>
  );
}
