import React, { useRef, useEffect } from "react";
import { AllFortuneData, ChatMessage } from "../types";
import { Send, User, Sparkles, Loader, Compass, Download, Printer } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { printSession } from "../utils/printSession";
import { getCurrentDateLabel } from "../utils/dateUtils";

interface CounselingRoomProps {
  report: string;
  data: AllFortuneData;
  chatHistory: ChatMessage[];
  onChatHistoryChange: (history: ChatMessage[]) => void;
  onDownloadMarkdown: () => void;
  onDownloadJson: () => void;
  profileName?: string;
  reportLoadingLabel?: string | null;
}

export default function CounselingRoom({
  report,
  data,
  chatHistory,
  onChatHistoryChange,
  onDownloadMarkdown,
  onDownloadJson,
  profileName = "鑑定",
  reportLoadingLabel = null,
}: CounselingRoomProps) {
  const [input, setInput] = React.useState<string>("");
  const [loading, setLoading] = React.useState<boolean>(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, loading]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input;
    setInput("");

    const userMessage: ChatMessage = {
      id: Math.random().toString(36).substring(2, 9),
      role: "user",
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const nextHistory = [...chatHistory, userMessage];
    onChatHistoryChange(nextHistory);
    setLoading(true);

    try {
      const response = await fetch("/api/fortune-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatHistory: chatHistory.map((h) => ({ role: h.role, text: h.text })),
          report: report,
          userInput: userText,
          basicData: {
            basicInfo: data.basicInfo,
            western: data.western,
            vedic: data.vedic,
            fourPillars: data.fourPillars,
            numerology: data.numerology,
          },
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        const detail = [errJson.error, errJson.hint].filter(Boolean).join(" ");
        throw new Error(detail || "占術対話サーバーからの応答がありません。");
      }

      const resData = await response.json();

      const aiMessage: ChatMessage = {
        id: Math.random().toString(36).substring(2, 9),
        role: "model",
        text: resData.text,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      onChatHistoryChange([...nextHistory, aiMessage]);
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: Math.random().toString(36).substring(2, 9),
        role: "model",
        text: `【接続エラー】申し訳ございません。通信状態が一時的に不安定です。再送をお試しください。（エラー原因: ${err.message}）`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      onChatHistoryChange([...nextHistory, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="printable-session">
      <div className="print-only print-cover">
        <h1>ASTRIA 統合鑑定セッション</h1>
        <p>プロフィール: {profileName}</p>
        <p>
          出生: {data.basicInfo.birthDate} {data.basicInfo.birthTime} ／ {data.basicInfo.location}
        </p>
        <p>出力日: {getCurrentDateLabel()}</p>
      </div>

      <div
        className="flex flex-col xl:flex-row gap-6 h-[85vh] overflow-hidden"
        id="counseling-room-layout"
      >
      <div
        id="print-report-section"
        className="flex-1 bg-white border border-natural-border rounded-2xl flex flex-col h-full overflow-hidden shadow-sm"
      >
        <div className="no-print bg-white px-5 py-4 border-b border-natural-border flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Compass className="w-5 h-5 text-natural-olive shrink-0" id="compass-report" />
            <h3 className="font-bold text-natural-olive text-sm font-serif tracking-wide truncate">
              統合鑑定書 ─ 運命の立体複写 (Fortune Map)
            </h3>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onDownloadMarkdown}
              className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-semibold bg-natural-light-cream hover:bg-natural-cream text-natural-olive border border-natural-border rounded-lg transition-all"
              title="鑑定書とカウンセリングをMarkdownでダウンロード"
            >
              <Download className="w-3 h-3" />
              MD
            </button>
            <button
              onClick={onDownloadJson}
              className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-semibold bg-natural-light-cream hover:bg-natural-cream text-natural-olive border border-natural-border rounded-lg transition-all"
              title="全データをJSONでダウンロード"
            >
              <Download className="w-3 h-3" />
              JSON
            </button>
            <button
              onClick={() => printSession("report", profileName)}
              className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-semibold bg-natural-light-cream hover:bg-natural-cream text-natural-olive border border-natural-border rounded-lg transition-all"
              title="鑑定書のみ印刷（PDF保存可）"
            >
              <Printer className="w-3 h-3" />
              印刷
            </button>
            <button
              onClick={() => printSession("full", profileName)}
              className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-semibold bg-natural-olive hover:opacity-90 text-white rounded-lg transition-all"
              title="鑑定書とカウンセリングを印刷"
            >
              <Printer className="w-3 h-3" />
              印刷+対話
            </button>
          </div>
        </div>

        <div
          id="print-report-content"
          className="flex-1 overflow-y-auto p-6 md:p-8 space-y-4 markdown-body text-natural-text font-sans select-text bg-natural-light-cream/5"
        >
          <ReactMarkdown
            components={{
              h1: ({ children }) => (
                <h1 className="text-base font-bold text-natural-olive pb-2 border-b border-natural-border tracking-tight mt-6 first:mt-0 font-serif">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-xs font-bold text-neutral-800 mt-5 mb-2 flex items-center gap-2 font-serif border-l-2 border-natural-olive pl-2">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-xs font-bold text-natural-olive-dark mt-4 mb-1">
                  {children}
                </h3>
              ),
              p: ({ children }) => (
                <p className="text-xs leading-relaxed text-natural-text mb-3 font-medium">
                  {children}
                </p>
              ),
              ul: ({ children }) => (
                <ul className="list-disc pl-5 my-2 space-y-1 text-xs text-neutral-600">
                  {children}
                </ul>
              ),
              li: ({ children }) => (
                <li className="leading-relaxed text-xs">{children}</li>
              ),
              strong: ({ children }) => (
                <strong className="text-natural-olive font-bold">{children}</strong>
              ),
              blockquote: ({ children }) => (
                <blockquote className="border-l-2 border-natural-olive bg-natural-light-cream/40 px-4 py-2 my-3 rounded-r text-xs italic text-neutral-600 font-serif">
                  {children}
                </blockquote>
              ),
            }}
          >
            {report}
          </ReactMarkdown>

          {reportLoadingLabel && (
            <div className="no-print mt-6 p-4 rounded-xl border border-natural-border bg-white shadow-sm flex items-center gap-3">
              <Loader className="w-5 h-5 text-natural-olive animate-spin shrink-0" />
              <div>
                <p className="text-xs font-semibold text-natural-olive">{reportLoadingLabel}</p>
                <p className="text-[10px] text-neutral-500 mt-1">
                  各占術を順番に深掘りしています。完了までしばらくお待ちください…
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div
        id="print-chat-section"
        className="xl:w-[480px] bg-white border border-natural-border rounded-2xl flex flex-col h-full overflow-hidden shadow-sm"
      >
        <div className="no-print bg-white px-5 py-4 border-b border-natural-border flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-natural-olive animate-ping shrink-0" />
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-neutral-800 text-sm font-serif truncate">
              対話型カウンセリングルーム
            </h4>
            <p className="text-[10px] text-neutral-500 mt-0.5 font-sans">
              対話内容はプロフィール保存・ダウンロードに含まれます
            </p>
          </div>
        </div>

        <div className="print-only mb-4">
          <h2 className="text-lg font-serif font-bold text-natural-olive border-b border-natural-border pb-2">
            カウンセリング対話記録
          </h2>
        </div>

        <div id="print-chat-content" className="flex-1 overflow-y-auto p-4 space-y-4 bg-natural-light-cream/10">
          {chatHistory.map((msg) => {
            const isModel = msg.role === "model";
            return (
              <div
                key={msg.id}
                className={`print-chat-message flex gap-3 max-w-[85%] ${
                  isModel ? "mr-auto" : "ml-auto flex-row-reverse"
                }`}
              >
                <div
                  className={`no-print w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    isModel
                      ? "bg-natural-light-cream border border-natural-border text-natural-olive"
                      : "bg-neutral-200 text-neutral-600"
                  }`}
                >
                  {isModel ? <Sparkles className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                <div className="space-y-1">
                  <div
                    className={`print-chat-bubble p-3 rounded-2xl text-xs leading-relaxed font-sans ${
                      isModel
                        ? "print-chat-bubble-model bg-white border border-natural-border text-natural-text rounded-tl-none shadow-sm"
                        : "print-chat-bubble-user bg-natural-olive text-white rounded-tr-none shadow-sm font-medium"
                    }`}
                  >
                    {isModel ? (
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed text-xs">{children}</p>,
                          ul: ({ children }) => <ul className="list-disc pl-4 space-y-1 mb-2 last:mb-0 text-xs">{children}</ul>,
                          li: ({ children }) => <li className="leading-relaxed text-xs">{children}</li>,
                          strong: ({ children }) => <strong className="text-natural-olive font-bold">{children}</strong>,
                        }}
                      >
                        {msg.text}
                      </ReactMarkdown>
                    ) : (
                      msg.text
                    )}
                  </div>
                  <span className={`block text-[9px] text-neutral-400 ${isModel ? "text-left pl-1" : "text-right pr-1"}`}>
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3 max-w-[85%] mr-auto">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-natural-light-cream border border-natural-border text-natural-olive">
                <Loader className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-white border border-natural-border p-3 rounded-2xl rounded-tl-none text-xs text-neutral-500 flex items-center gap-2 shadow-sm">
                <span>鑑定天体を再照合中</span>
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <form
          onSubmit={handleSendMessage}
          className="no-print p-3 bg-white border-t border-natural-border flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            placeholder={loading ? "応答を受信中..." : "処方について追加質問を入力..."}
            className="flex-1 bg-natural-light-cream/30 border border-natural-border focus:border-natural-olive rounded-xl px-4 py-2.5 text-xs text-natural-text placeholder-neutral-400 focus:outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="p-2.5 bg-natural-olive hover:opacity-90 disabled:opacity-45 disabled:pointer-events-none text-white rounded-xl transition-opacity shrink-0 cursor-pointer"
            id="btn-chat-send"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
      </div>
    </div>
  );
}
