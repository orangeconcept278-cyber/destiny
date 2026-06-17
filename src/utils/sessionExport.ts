import { AllFortuneData, ChatMessage } from "../types";

function sanitizeFilename(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, "_").trim() || "鑑定";
}

export function buildSessionBaseName(profileName: string): string {
  const date = new Date().toISOString().slice(0, 10);
  return `ASTRIA鑑定_${sanitizeFilename(profileName)}_${date}`;
}

export function downloadTextFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function buildSessionMarkdown(
  profileName: string,
  data: AllFortuneData,
  report: string,
  chatHistory: ChatMessage[]
): string {
  const { basicInfo } = data;
  const counseling = chatHistory
    .map((msg) => {
      const speaker = msg.role === "user" ? "相談者" : "鑑定者";
      return `### ${speaker}（${msg.timestamp}）\n\n${msg.text}`;
    })
    .join("\n\n---\n\n");

  return `# ASTRIA 統合鑑定セッション

- プロフィール名: ${profileName}
- 出力日時: ${new Date().toLocaleString("ja-JP")}
- 性別: ${basicInfo.gender}
- 出生: ${basicInfo.birthDate} ${basicInfo.birthTime}
- 所在地: ${basicInfo.location}

---

## 統合鑑定書

${report}

---

## カウンセリング対話

${counseling || "（対話なし）"}
`;
}

export function buildSessionJson(
  profileName: string,
  data: AllFortuneData,
  report: string,
  chatHistory: ChatMessage[]
): string {
  return JSON.stringify(
    {
      profileName,
      exportedAt: new Date().toISOString(),
      data,
      report,
      chatHistory,
    },
    null,
    2
  );
}

export function downloadSessionMarkdown(
  profileName: string,
  data: AllFortuneData,
  report: string,
  chatHistory: ChatMessage[]
): void {
  const date = new Date().toISOString().slice(0, 10);
  const filename = `${buildSessionBaseName(profileName)}.md`;
  downloadTextFile(filename, buildSessionMarkdown(profileName, data, report, chatHistory));
}

export function downloadSessionJson(
  profileName: string,
  data: AllFortuneData,
  report: string,
  chatHistory: ChatMessage[]
): void {
  const filename = `${buildSessionBaseName(profileName)}.json`;
  downloadTextFile(filename, buildSessionJson(profileName, data, report, chatHistory));
}
