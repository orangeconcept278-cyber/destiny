import { ChatMessage } from "../types";

export const WELCOME_CHAT_TEXT =
  "簡易統合鑑定が完了しました。本鑑定は試作版の要点まとめです。各セクションの深掘り、時期の詳細、仕事・恋愛・金運については、この相談ルームで何でもご質問ください。詳細な解説をお届けします。";

export function createWelcomeChatMessage(): ChatMessage {
  return {
    id: "welcome",
    role: "model",
    text: WELCOME_CHAT_TEXT,
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  };
}
