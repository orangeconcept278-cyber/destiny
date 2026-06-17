import { ChatMessage } from "../types";

export const WELCOME_CHAT_TEXT =
  "統合鑑定が修了いたしました。あなたの宿命の『楽譜』を多角的に、そして極めて立体的に構築した鑑定書をご用意しました。この鑑定結果に沿って、さらに深掘りしたい課題、仕事や人間関係、時期の過ごし方について何でもご質問ください。この先どのように『美しく演奏するか』を共に探求しましょう。";

export function createWelcomeChatMessage(): ChatMessage {
  return {
    id: "welcome",
    role: "model",
    text: WELCOME_CHAT_TEXT,
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  };
}
