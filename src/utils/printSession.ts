import { buildSessionBaseName } from "./sessionExport";

export type PrintMode = "report" | "full";

export function printSession(mode: PrintMode, profileName: string = "鑑定"): void {
  const previousTitle = document.title;
  const baseName = buildSessionBaseName(profileName);
  document.title = mode === "full" ? `${baseName}_対話付き` : baseName;

  document.documentElement.setAttribute("data-print-mode", mode);

  const cleanup = () => {
    document.title = previousTitle;
    document.documentElement.removeAttribute("data-print-mode");
    window.removeEventListener("afterprint", cleanup);
  };

  window.addEventListener("afterprint", cleanup);
  window.print();
}
