import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

export function formatApiError(error: unknown): string {
  const message = String((error as { message?: string })?.message ?? error ?? "");
  if (message.includes("CONSUMER_SUSPENDED") || message.includes("has been suspended")) {
    return "Gemini APIキーがGoogle側で停止されています。AI Studioで新しいキーを発行し、環境変数を更新してください。";
  }
  if (message.includes("API key not valid") || message.includes("API_KEY_INVALID")) {
    return "Gemini APIキーが無効です。GEMINI_API_KEY を確認してください。";
  }
  if (
    message.includes("503") ||
    message.includes("high demand") ||
    message.includes("UNAVAILABLE")
  ) {
    return "Geminiモデルが現在混雑しています。1〜2分待ってから再度お試しください。";
  }
  if (message.includes("429") || message.includes("quota")) {
    return "Gemini APIの利用上限に達しました。しばらく待つか、Google AI Studioで利用状況を確認してください。";
  }
  if (!apiKey || apiKey.includes("ここにAPIキーを貼り付け") || apiKey === "MY_GEMINI_API_KEY") {
    return "Gemini APIキーが設定されていません。GEMINI_API_KEY を環境変数に設定してください。";
  }
  return message || "鑑定の生成に失敗しました。";
}

const MODEL_FALLBACKS = [
  process.env.GEMINI_MODEL,
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-2.5-flash-lite",
].filter((m): m is string => Boolean(m));

function isRetryableGeminiError(error: unknown): boolean {
  const message = String((error as { message?: string })?.message ?? "");
  return (
    message.includes("503") ||
    message.includes("429") ||
    message.includes("UNAVAILABLE") ||
    message.includes("high demand") ||
    message.includes("quota")
  );
}

function getClient(): GoogleGenAI {
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

export async function generateWithFallback(options: {
  contents: string | { role: string; parts: { text: string }[] }[];
  systemInstruction: string;
  temperature: number;
}) {
  const ai = getClient();
  let lastError: unknown;

  for (const model of MODEL_FALLBACKS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: options.contents,
          config: {
            systemInstruction: options.systemInstruction,
            temperature: options.temperature,
          },
        });
        console.log(`[Gemini] 鑑定生成成功: model=${model}`);
        return response;
      } catch (error) {
        lastError = error;
        if (isRetryableGeminiError(error) && attempt === 0) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          continue;
        }
        if (isRetryableGeminiError(error)) {
          console.warn(`[Gemini] model=${model} が利用不可のため次のモデルを試行します`);
          break;
        }
        throw error;
      }
    }
  }

  throw lastError;
}
