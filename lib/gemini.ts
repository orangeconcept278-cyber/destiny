import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

export const FORTUNE_OVERVIEW_MAX_TOKENS = 800;
export const FORTUNE_SECTION_MAX_TOKENS = 2000;
export const FORTUNE_TIMEOUT_MS = 9000;

const FORTUNE_MODELS = ["gemini-2.5-flash-lite", "gemini-2.0-flash", "gemini-2.5-flash"];

const CHAT_MODEL_FALLBACKS = [
  process.env.GEMINI_MODEL,
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-2.5-flash-lite",
].filter((m): m is string => Boolean(m));

export interface ApiErrorBody {
  error: string;
  code: string;
  hint?: string;
}

export function formatApiError(error: unknown): string {
  return toApiErrorResponse(error).body.error;
}

export function toApiErrorResponse(error: unknown): { status: number; body: ApiErrorBody } {
  const message = String((error as { message?: string })?.message ?? error ?? "");

  if (message === "TIMEOUT" || /timeout|timed out|DEADLINE_EXCEEDED/i.test(message)) {
    return {
      status: 504,
      body: {
        error: "鑑定生成が制限時間（10秒）を超えました。",
        code: "TIMEOUT",
        hint: "簡易鑑定でも時間がかかっています。数十秒待って再試行するか、相談ルームで個別に質問してください。",
      },
    };
  }

  if (message.includes("CONSUMER_SUSPENDED") || message.includes("has been suspended")) {
    return {
      status: 500,
      body: {
        error: "Gemini APIキーがGoogle側で停止されています。",
        code: "API_KEY_SUSPENDED",
        hint: "AI Studioで新しいキーを発行し、環境変数を更新してください。",
      },
    };
  }

  if (message.includes("API key not valid") || message.includes("API_KEY_INVALID")) {
    return {
      status: 500,
      body: {
        error: "Gemini APIキーが無効です。",
        code: "API_KEY_INVALID",
        hint: "GEMINI_API_KEY を確認してください。",
      },
    };
  }

  if (message.includes("503") || message.includes("high demand") || message.includes("UNAVAILABLE")) {
    return {
      status: 503,
      body: {
        error: "Geminiモデルが現在混雑しています。",
        code: "GEMINI_UNAVAILABLE",
        hint: "1〜2分待ってから再度お試しください。",
      },
    };
  }

  if (message.includes("429") || message.includes("quota")) {
    return {
      status: 429,
      body: {
        error: "Gemini APIの利用上限に達しました。",
        code: "QUOTA_EXCEEDED",
        hint: "しばらく待つか、Google AI Studioで利用状況を確認してください。",
      },
    };
  }

  if (!apiKey || apiKey.includes("ここにAPIキーを貼り付け") || apiKey === "MY_GEMINI_API_KEY") {
    return {
      status: 500,
      body: {
        error: "Gemini APIキーが設定されていません。",
        code: "API_KEY_MISSING",
        hint: "GEMINI_API_KEY を環境変数に設定してください。",
      },
    };
  }

  return {
    status: 500,
    body: {
      error: message || "鑑定の生成に失敗しました。",
      code: "GEMINI_ERROR",
    },
  };
}

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

export async function generateFortuneContent(options: {
  contents: string;
  systemInstruction: string;
  maxOutputTokens?: number;
}) {
  const ai = getClient();
  let lastError: unknown;
  const maxOutputTokens = options.maxOutputTokens ?? FORTUNE_OVERVIEW_MAX_TOKENS;

  for (const model of FORTUNE_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: options.contents,
        config: {
          systemInstruction: options.systemInstruction,
          temperature: 0.45,
          maxOutputTokens,
        },
      });
      console.log(`[Gemini] 鑑定生成成功: model=${model} tokens=${maxOutputTokens}`);
      return response;
    } catch (error) {
      lastError = error;
      console.warn(`[Gemini] fortune model=${model} failed`);
    }
  }

  throw lastError;
}

export async function generateWithFallback(options: {
  contents: string | { role: string; parts: { text: string }[] }[];
  systemInstruction: string;
  temperature: number;
  maxOutputTokens?: number;
}) {
  const ai = getClient();
  let lastError: unknown;

  for (const model of CHAT_MODEL_FALLBACKS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: options.contents,
          config: {
            systemInstruction: options.systemInstruction,
            temperature: options.temperature,
            ...(options.maxOutputTokens ? { maxOutputTokens: options.maxOutputTokens } : {}),
          },
        });
        console.log(`[Gemini] 対話生成成功: model=${model}`);
        return response;
      } catch (error) {
        lastError = error;
        if (isRetryableGeminiError(error) && attempt === 0) {
          await new Promise((resolve) => setTimeout(resolve, 1500));
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

export function withFortuneTimeout<T>(promise: Promise<T>): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error("TIMEOUT")), FORTUNE_TIMEOUT_MS);
    }),
  ]);
}
