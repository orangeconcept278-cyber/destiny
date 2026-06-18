import { ChatMessage } from "../types";

export const WELCOME_CHAT_TEXT =
  "統合鑑定のサマリーと各占術セクションを順次構築しています。読み終えたら、気になる箇所や時期についてこのルームで深掘り質問してください。より具体的な解説をお届けします。";

export function createWelcomeChatMessage(): ChatMessage {
  return {
    id: "welcome",
    role: "model",
    text: WELCOME_CHAT_TEXT,
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  };
}
