import React, { useState, useEffect } from "react";
import { AllFortuneData, PastEvent, ChatMessage } from "./types";
import { generateInitialAstroData } from "./utils/astrologyCalc";
import { createWelcomeChatMessage } from "./utils/chatUtils";
import { downloadSessionMarkdown, downloadSessionJson } from "./utils/sessionExport";
import {
  getProfiles,
  saveProfile,
  loadProfile,
  deleteProfile,
  getLastProfileId,
  setLastProfileId,
  normalizeFortuneData,
  SavedProfile,
} from "./utils/profileStorage";
import AstroChartEditor from "./components/AstroChartEditor";
import MultiAlignmentVisualizer from "./components/MultiAlignmentVisualizer";
import TimelineMilestone from "./components/TimelineMilestone";
import CounselingRoom from "./components/CounselingRoom";
import ProfileSaveLoad from "./components/ProfileSaveLoad";
import {
  Sparkles,
  Compass,
  Layers,
  Calendar,
  BookOpen,
  User,
  Heart,
  HelpCircle,
  Cpu,
  Bookmark,
  ChevronRight,
  ArrowRight,
  RefreshCw,
} from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<"input" | "alignment" | "timeline" | "report">("input");
  
  // Set up deterministic initial dates & calculate profiles
  const [fortuneData, setFortuneData] = useState<AllFortuneData>(() => {
    return generateInitialAstroData(
      "女性",
      "東京",
      "未婚",
      "なし",
      "1992-05-15",
      "10:30"
    );
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [report, setReport] = useState<string>("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [savedProfiles, setSavedProfiles] = useState<SavedProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  const [profileNameInput, setProfileNameInput] = useState<string>("");
  const [profileMsg, setProfileMsg] = useState<string>("");

  const refreshProfiles = () => setSavedProfiles(getProfiles());

  const resolveChatHistory = (savedReport?: string, savedChat?: ChatMessage[]) => {
    if (savedChat && savedChat.length > 0) return savedChat;
    if (savedReport) return [createWelcomeChatMessage()];
    return [];
  };

  const applyProfile = (profile: SavedProfile) => {
    setFortuneData(normalizeFortuneData(profile.data));
    setReport(profile.report ?? "");
    setChatHistory(resolveChatHistory(profile.report, profile.chatHistory));
    setSelectedProfileId(profile.id);
    setProfileNameInput(profile.name);
    setLastProfileId(profile.id);
    setErrorMsg("");
    setProfileMsg(`「${profile.name}」を読み込みました。`);
  };

  useEffect(() => {
    const profiles = getProfiles();
    setSavedProfiles(profiles);

    const lastId = getLastProfileId();
    const lastProfile = lastId ? profiles.find((p) => p.id === lastId) : null;
    if (lastProfile) {
      setFortuneData(normalizeFortuneData(lastProfile.data));
      setReport(lastProfile.report ?? "");
      setChatHistory(resolveChatHistory(lastProfile.report, lastProfile.chatHistory));
      setSelectedProfileId(lastProfile.id);
      setProfileNameInput(lastProfile.name);
    }
  }, []);

  const handleSaveProfile = () => {
    try {
      const saved = saveProfile(
        profileNameInput,
        fortuneData,
        report || undefined,
        report ? chatHistory : undefined
      );
      refreshProfiles();
      setSelectedProfileId(saved.id);
      setProfileMsg(`「${saved.name}」を保存しました（鑑定書・カウンセリング含む）。`);
    } catch (err: any) {
      setProfileMsg(err.message || "保存に失敗しました。");
    }
  };

  const handleDownloadMarkdown = () => {
    if (!report) {
      setProfileMsg("鑑定書が未生成のためダウンロードできません。");
      return;
    }
    downloadSessionMarkdown(profileNameInput || "鑑定", fortuneData, report, chatHistory);
    setProfileMsg("Markdownファイルをダウンロードしました。");
  };

  const handleDownloadJson = () => {
    if (!report) {
      setProfileMsg("鑑定書が未生成のためダウンロードできません。");
      return;
    }
    downloadSessionJson(profileNameInput || "鑑定", fortuneData, report, chatHistory);
    setProfileMsg("JSONファイルをダウンロードしました。");
  };

  const handleLoadProfile = () => {
    if (!selectedProfileId) {
      setProfileMsg("読み込むプロフィールを選択してください。");
      return;
    }
    const profile = loadProfile(selectedProfileId);
    if (!profile) {
      setProfileMsg("プロフィールが見つかりませんでした。");
      refreshProfiles();
      return;
    }
    applyProfile(profile);
  };

  const handleDeleteProfile = () => {
    if (!selectedProfileId) {
      setProfileMsg("削除するプロフィールを選択してください。");
      return;
    }
    const profile = loadProfile(selectedProfileId);
    if (!profile) return;
    if (!window.confirm(`「${profile.name}」を削除しますか？`)) return;

    deleteProfile(selectedProfileId);
    refreshProfiles();
    setSelectedProfileId("");
    setProfileNameInput("");
    setProfileMsg(`「${profile.name}」を削除しました。`);
  };

  // Handle BirthDate/Time live calculations & sync
  const handleDateOrTimeChange = (field: "birthDate" | "birthTime" | "gender" | "location" | "maritalStatus" | "children", val: string) => {
    const updatedBasic = {
      ...fortuneData.basicInfo,
      [field]: val
    };

    // Calculate auto astro profile based on date change
    const autoSeed = generateInitialAstroData(
      updatedBasic.gender,
      updatedBasic.location,
      updatedBasic.maritalStatus,
      updatedBasic.children,
      updatedBasic.birthDate,
      updatedBasic.birthTime
    );

    setFortuneData((prev) => ({
      ...prev,
      basicInfo: updatedBasic,
      // Overwrite sub calculators to prevent mismatch with birth date, while keeping past events/concerns
      western: autoSeed.western,
      vedic: autoSeed.vedic,
      fourPillars: autoSeed.fourPillars,
      numerology: autoSeed.numerology,
    }));
  };

  const handleResetToCalculated = () => {
    const reset = generateInitialAstroData(
      fortuneData.basicInfo.gender,
      fortuneData.basicInfo.location,
      fortuneData.basicInfo.maritalStatus,
      fortuneData.basicInfo.children,
      fortuneData.basicInfo.birthDate,
      fortuneData.basicInfo.birthTime
    );
    // Preserving user typed worries & questions
    setFortuneData((prev) => ({
      ...reset,
      concerns: prev.concerns,
      questions: prev.questions,
      pastEvents: prev.pastEvents,
    }));
  };

  // Submit report synthesis request to endpoint
  const handleSynthesizeDestiny = async () => {
    setLoading(true);
    setErrorMsg("");
    setReport("");
    setChatHistory([]);

    try {
      const response = await fetch("/api/fortune", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fortuneData),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || "鑑定を構築中にエラーが生じました。");
      }

      const resJson = await response.json();
      setReport(resJson.report);
      setChatHistory([createWelcomeChatMessage()]);
      setActiveTab("report");
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "ネットワークに接続できませんでした。");
    } finally {
      setLoading(false);
    }
  };

  const profileSaveLoadProps = {
    savedProfiles,
    selectedProfileId,
    profileNameInput,
    profileMsg,
    onSelectProfile: setSelectedProfileId,
    onNameChange: setProfileNameInput,
    onLoad: handleLoadProfile,
    onSave: handleSaveProfile,
    onDelete: handleDeleteProfile,
    onDownloadMarkdown: handleDownloadMarkdown,
    onDownloadJson: handleDownloadJson,
    canDownload: Boolean(report),
  };

  return (
    <div className="min-h-screen bg-natural-bg text-natural-text flex flex-col font-sans select-none antialiased selection:bg-natural-olive/20 selection:text-natural-text" id="app-root-container">
      
      {/* Mystic Top Navigation header */}
      <header className="no-print sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-natural-border px-6 py-4 flex items-center justify-between shadow-sm" id="app-header">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-natural-olive rounded-xl flex items-center justify-center text-white shadow-md shadow-natural-olive/10">
            <Compass className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-wider font-serif text-natural-olive">
              ASTRIA <span className="font-sans font-normal text-xs text-neutral-500">| 統合鑑定システム</span>
            </h1>
            <p className="text-[10px] text-neutral-500 mt-0.5">
              四柱推命・ジョーティシュ・西洋占星術・数秘術アライメント
            </p>
          </div>
        </div>

        {/* Integration Status Indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-natural-light-cream border border-natural-border rounded-lg text-[10px] text-natural-olive font-bold uppercase tracking-wider">
          <Cpu className="w-3.5 h-3.5" />
          <span>四星統合エンジン 安定稼働</span>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 py-8 space-y-8 select-text">
        
        {/* Banner Intro explaining logic */}
        <div className="no-print bg-gradient-to-br from-natural-olive to-natural-olive-dark text-white p-6 md:p-8 rounded-3xl relative overflow-hidden shadow-md">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-3xl space-y-2.5">
            <span className="text-[10px] font-bold text-natural-cream bg-white/10 px-2.5 py-1 border border-white/10 rounded-full tracking-widest uppercase">
              Syncretic Destiny Matrix
            </span>
            <h2 className="text-xl md:text-2xl font-normal tracking-tight font-serif text-white/95">
              東洋・西洋の命運データベースを架橋する、究極の統合鑑定
            </h2>
            <p className="text-xs md:text-sm text-neutral-200 leading-relaxed font-sans mt-2">
              「四柱推命」「インド占星術」「西洋占星術」「数秘術」
              それぞれ全く異なる起源を持つ4つの占術エンジンに、あなたの出生情報を同時インプット。
              命運の重なる『収束地帯』を検出し、過去の出来事（バックテスト）に潜む星のトリガーを立証。
              最後はAIによるプロンプト鑑定スタイルを徹底厳守し、目の前の課題を突破する『現実的処方』を提示します。
            </p>
          </div>
        </div>

        {/* Dynamic Interactive Navigation Tabs */}
        <div className="no-print flex border-b border-natural-border text-xs font-semibold overflow-x-auto gap-2" id="nav-tabs">
          <button
            onClick={() => setActiveTab("input")}
            className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-all shrink-0 uppercase tracking-wider ${
              activeTab === "input"
                ? "border-natural-olive text-natural-olive font-semibold"
                : "border-transparent text-neutral-500 hover:text-neutral-700"
            }`}
          >
            <User className="w-4 h-4" /> 1. 基本設定 ＆ 占術カルテ
          </button>
          
          <button
            onClick={() => setActiveTab("alignment")}
            className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-all shrink-0 uppercase tracking-wider ${
              activeTab === "alignment"
                ? "border-natural-olive text-natural-olive font-semibold"
                : "border-transparent text-neutral-500 hover:text-neutral-700"
            }`}
          >
            <Layers className="w-4 h-4" /> 2. 収束アライメント
          </button>

          <button
            onClick={() => setActiveTab("timeline")}
            className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-all shrink-0 uppercase tracking-wider ${
              activeTab === "timeline"
                ? "border-natural-olive text-natural-olive font-semibold"
                : "border-transparent text-neutral-500 hover:text-neutral-700"
            }`}
          >
            <Calendar className="w-4 h-4" /> 3. 流年時間割
          </button>

          <button
            onClick={() => {
              if (report) setActiveTab("report");
            }}
            disabled={!report}
            className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-all shrink-0 uppercase tracking-wider ${
              !report
                ? "opacity-40 cursor-not-allowed border-transparent text-neutral-400"
                : activeTab === "report"
                ? "border-natural-olive text-natural-olive font-semibold"
                : "border-transparent text-neutral-500 hover:text-neutral-700"
            }`}
          >
            <BookOpen className="w-4 h-4" /> 4. 統合鑑定書 ＆ 相談
          </button>
        </div>

        {/* Tab Panels */}
        <div className="mt-2" id="tab-panels-viewport">
          {/* TAB 1: Input Setup and Astro Profile Editor */}
          {activeTab === "input" && (
            <div className="space-y-8 animate-fadeIn" id="panel-input">

              <ProfileSaveLoad {...profileSaveLoadProps} />
              
              {/* Birth Base information panel */}
              <div className="bg-white border border-natural-border p-6 rounded-2xl grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 shadow-sm">
                
                {/* Gender */}
                <div>
                  <label className="block text-neutral-500 text-xs font-semibold mb-1.5 uppercase tracking-wider">相談者性別</label>
                  <select
                    value={fortuneData.basicInfo.gender}
                    onChange={(e) => handleDateOrTimeChange("gender", e.target.value)}
                    className="w-full bg-natural-light-cream/40 border border-natural-border rounded-lg px-3 py-2 text-xs text-natural-text focus:outline-none focus:border-natural-olive animate-none"
                  >
                    <option value="女性">女性</option>
                    <option value="男性">男性</option>
                    <option value="その他">その他 (非公表)</option>
                  </select>
                </div>

                {/* Birth date */}
                <div>
                  <label className="block text-neutral-500 text-xs font-semibold mb-1.5 uppercase tracking-wider">出生年月日</label>
                  <input
                    type="date"
                    value={fortuneData.basicInfo.birthDate}
                    onChange={(e) => handleDateOrTimeChange("birthDate", e.target.value)}
                    className="w-full bg-natural-light-cream/40 border border-natural-border rounded-lg px-3 py-2 text-xs text-natural-text focus:outline-none focus:border-natural-olive font-sans"
                  />
                </div>

                {/* Birth time */}
                <div>
                  <label className="block text-neutral-500 text-xs font-semibold mb-1.5 uppercase tracking-wider">出生時刻</label>
                  <input
                    type="time"
                    value={fortuneData.basicInfo.birthTime}
                    onChange={(e) => handleDateOrTimeChange("birthTime", e.target.value)}
                    className="w-full bg-natural-light-cream/40 border border-natural-border rounded-lg px-3 py-2 text-xs text-natural-text focus:outline-none focus:border-natural-olive font-sans"
                  />
                </div>

                {/* Location */}
                <div>
                  <label className="block text-neutral-500 text-xs font-semibold mb-1.5 uppercase tracking-wider">現在地 / 出生地</label>
                  <input
                    type="text"
                    value={fortuneData.basicInfo.location || ""}
                    onChange={(e) => handleDateOrTimeChange("location", e.target.value)}
                    className="w-full bg-natural-light-cream/40 border border-natural-border rounded-lg px-3 py-2 text-xs text-natural-text focus:outline-none focus:border-natural-olive"
                    placeholder="例: 東京"
                  />
                </div>

                {/* MaritalStatus */}
                <div>
                  <label className="block text-neutral-500 text-xs font-semibold mb-1.5 uppercase tracking-wider">婚姻状況</label>
                  <select
                    value={fortuneData.basicInfo.maritalStatus}
                    onChange={(e) => handleDateOrTimeChange("maritalStatus", e.target.value)}
                    className="w-full bg-natural-light-cream/40 border border-natural-border rounded-lg px-3 py-2 text-xs text-natural-text focus:outline-none focus:border-natural-olive"
                  >
                    <option value="未婚">未婚</option>
                    <option value="既婚">既婚</option>
                    <option value="離婚・再婚準備">離婚・その他</option>
                  </select>
                </div>

                {/* Children */}
                <div>
                  <label className="block text-neutral-500 text-xs font-semibold mb-1.5 uppercase tracking-wider">子供の有無</label>
                  <input
                    type="text"
                    value={fortuneData.basicInfo.children}
                    onChange={(e) => handleDateOrTimeChange("children", e.target.value)}
                    className="w-full bg-natural-light-cream/40 border border-natural-border rounded-lg px-3 py-2 text-xs text-natural-text focus:outline-none focus:border-natural-olive"
                    placeholder="例: なし、子供2人"
                  />
                </div>
              </div>

              {/* Edit core charts */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Bookmark className="w-5 h-5 text-natural-olive" />
                  <h3 className="text-sm font-semibold text-natural-olive font-serif">
                    占術データベース＆手動編集パネル (Astro Chart Adjuster)
                  </h3>
                </div>
                <p className="text-xs text-neutral-500 leading-relaxed mb-4">
                  選択した出生日付と自動連動して推奨パラメータが埋まります。ご自身の詳細な命式（西洋ASC、インドのヨーガ、四柱調候、数秘マスターナンバーなど）のデータが他アプリ・鑑定サイトであらかじめ判明している場合は、自由に下記フォームを書き換えて、より精度の高い「統合AI鑑定」を実行させることができます。
                </p>
                <AstroChartEditor
                  data={fortuneData}
                  onChange={setFortuneData}
                  onResetToCalculated={handleResetToCalculated}
                />
              </div>

              {/* Inner states: Concerns and core questions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-2xl border border-natural-border shadow-sm">
                <div>
                  <label className="block text-neutral-700 text-xs font-bold mb-1 px-1 flex items-center gap-1.5 uppercase tracking-wider font-serif">
                    <Heart className="w-4 h-4 text-natural-olive shrink-0" />
                    繰り返す悩み・自己イメージ (自分でも気づいている癖や課題)
                  </label>
                  <textarea
                    value={fortuneData.concerns}
                    onChange={(e) => setFortuneData((prev) => ({ ...prev, concerns: e.target.value }))}
                    rows={4}
                    className="w-full text-xs font-sans text-natural-text leading-relaxed p-4 bg-natural-light-cream/20 border border-natural-border focus:border-natural-olive rounded-xl focus:outline-none transition-all resize-none mt-2"
                    placeholder="例: 人を信用するまでに非常に時間がかかり、疑い深い行動をとって関係を自壊させてしまう。仕事では責任を背負いすぎて頻繁にメンタルを消耗する。"
                  />
                </div>
                <div>
                  <label className="block text-neutral-700 text-xs font-bold mb-1 px-1 flex items-center gap-1.5 uppercase tracking-wider font-serif">
                    <HelpCircle className="w-4 h-4 text-natural-olive shrink-0" />
                    いちばん聞きたい具体的な問い (ビジネス・運勢・恋愛等)
                  </label>
                  <textarea
                    value={fortuneData.questions}
                    onChange={(e) => setFortuneData((prev) => ({ ...prev, questions: e.target.value }))}
                    rows={4}
                    className="w-full text-xs font-sans text-natural-text leading-relaxed p-4 bg-natural-light-cream/20 border border-natural-border focus:border-natural-olive rounded-xl focus:outline-none transition-all resize-none mt-2"
                    placeholder="例: 現在進行中のプロジェクトは、自分の現在のマハーダシャー期や大運、数秘のパーソナルイヤーの運気と合致していますでしょうか？3年以内の転職、仕事の最良の独立時期を知りたいです。"
                  />
                </div>
              </div>

              {/* Submit / Synthesize Button */}
              <div className="flex flex-col items-center justify-center pt-4">
                {errorMsg && (
                  <div className="mb-4 text-xs text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-xl max-w-md text-center">
                    {errorMsg}
                  </div>
                )}
                <button
                  onClick={handleSynthesizeDestiny}
                  disabled={loading}
                  className="group relative cursor-pointer font-sans text-xs font-bold uppercase tracking-widest text-white px-8 py-4 bg-gradient-to-r from-natural-olive via-natural-olive to-natural-olive-dark hover:opacity-95 transition-all duration-300 rounded-xl shadow-md flex items-center gap-2"
                  id="btn-synthesize-main"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                      天体の軌道をアライメント中...
                    </>
                  ) : (
                    <>
                      鑑定を開始する
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                    </>
                  )}
                </button>
                <p className="text-[10px] text-neutral-500 mt-2.5 font-sans">
                  ※ 統合鑑定AI（Gemini）が約15〜35秒で詳細鑑定書を生成します。混雑時は自動で別モデルに切り替えます。
                </p>
              </div>

            </div>
          )}

          {/* TAB 2: Multi-Alignment Vis */}
          {activeTab === "alignment" && (
            <div className="animate-fadeIn" id="panel-alignment">
              <MultiAlignmentVisualizer data={fortuneData} />
            </div>
          )}

          {/* TAB 3: Timeline & Backtesting */}
          {activeTab === "timeline" && (
            <div className="animate-fadeIn space-y-6" id="panel-timeline">
              <ProfileSaveLoad {...profileSaveLoadProps} compact />
              <TimelineMilestone
                data={fortuneData}
                onChangePastEvents={(events) =>
                  setFortuneData((prev) => ({ ...prev, pastEvents: events }))
                }
                onChangeFutureYearNotes={(notes) =>
                  setFortuneData((prev) => ({ ...prev, futureYearNotes: notes }))
                }
              />
            </div>
          )}

          {/* TAB 4: Final Report and Counseling interactive space */}
          {activeTab === "report" && (
            <div className="animate-fadeIn space-y-4" id="panel-report">
              {report ? (
                <>
                  <div className="no-print">
                    <ProfileSaveLoad {...profileSaveLoadProps} compact />
                  </div>
                  <CounselingRoom
                    report={report}
                    data={fortuneData}
                    chatHistory={chatHistory}
                    onChatHistoryChange={setChatHistory}
                    onDownloadMarkdown={handleDownloadMarkdown}
                    onDownloadJson={handleDownloadJson}
                    profileName={profileNameInput || "鑑定"}
                  />
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                  <Compass className="w-12 h-12 text-neutral-400 animate-pulse" />
                  <div>
                    <h3 className="font-semibold text-neutral-600 text-sm">鑑定書が未生成です</h3>
                    <p className="text-xs text-neutral-500 max-w-sm mt-1">
                      「1. 基本設定 ＆ 占術カルテ」タブで出生情報・不安を記述し、最下の「鑑定を開始する」ボタンを押すとこのタブが解放されます。
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab("input")}
                    className="mt-2 text-xs font-semibold px-4 py-2 bg-natural-light-cream hover:bg-natural-cream text-natural-olive border border-natural-border transition-all rounded-lg"
                  >
                    基本設定タブに戻る
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="no-print mt-auto border-t border-natural-border px-6 py-4 text-center text-[10px] text-neutral-500 select-text" id="app-footer">
        <div>
          四宿統合五行アライメント鑑定システム ─ 西洋、ジョーティシュ、八字算命、数秘複合検証台
        </div>
        <div className="mt-1 font-mono text-[9px]">
          Copyright © 2026 Integrated Destiny Synthesizer System. All Rights Reserved.
        </div>
      </footer>
    </div>
  );
}
