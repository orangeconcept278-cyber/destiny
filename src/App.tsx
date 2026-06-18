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
  migrateStoredProfiles,
  SavedProfile,
} from "./utils/profileStorage";
import AstroChartEditor from "./components/AstroChartEditor";
import PastEventsPanel from "./components/PastEventsPanel";
import MultiAlignmentVisualizer from "./components/MultiAlignmentVisualizer";
import TimelineMilestone from "./components/TimelineMilestone";
import CounselingRoom from "./components/CounselingRoom";
import ProfileSaveLoad from "./components/ProfileSaveLoad";
import AppHeader from "./components/layout/AppHeader";
import HeroSection from "./components/layout/HeroSection";
import StepNav from "./components/layout/StepNav";
import AppFooter from "./components/layout/AppFooter";
import { AppTab } from "./types/layout";
import { FORTUNE_SECTION_META, FORTUNE_SECTION_ORDER } from "../lib/fortuneSections";
import {
  Compass,
  Heart,
  HelpCircle,
  Bookmark,
  ArrowRight,
  RefreshCw,
} from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>("input");
  
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
  const [reportLoadingLabel, setReportLoadingLabel] = useState<string | null>(null);
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
    migrateStoredProfiles();
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

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Submit report synthesis request to endpoint (overview + sequential sections)
  const handleSynthesizeDestiny = async () => {
    setLoading(true);
    setErrorMsg("");
    setReport("");
    setReportLoadingLabel(null);
    setChatHistory([]);

    try {
      const response = await fetch("/api/fortune", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fortuneData),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        const detail = [errJson.error, errJson.hint].filter(Boolean).join(" ");
        throw new Error(detail || "鑑定を構築中にエラーが生じました。");
      }

      const resJson = await response.json();
      const overview: string = resJson.report;
      let fullReport = overview;

      setReport(fullReport);
      setChatHistory([createWelcomeChatMessage()]);
      setActiveTab("report");
      setLoading(false);
      setTimeout(() => scrollTo("tab-panels-viewport"), 80);

      for (const sectionId of FORTUNE_SECTION_ORDER) {
        const meta = FORTUNE_SECTION_META[sectionId];
        setReportLoadingLabel(meta.loading);

        const sectionRes = await fetch("/api/fortune-section", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            section: sectionId,
            data: fortuneData,
            overview,
          }),
        });

        if (!sectionRes.ok) {
          const errJson = await sectionRes.json().catch(() => ({}));
          const detail = [errJson.error, errJson.hint].filter(Boolean).join(" ");
          throw new Error(detail || `${meta.title}の生成に失敗しました。`);
        }

        const sectionJson = await sectionRes.json();
        fullReport += `\n\n${meta.title}\n\n${sectionJson.content}`;
        setReport(fullReport);
      }

      setReportLoadingLabel(null);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "ネットワークに接続できませんでした。");
      setReportLoadingLabel(null);
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

  const handleStartAppraisal = () => {
    setActiveTab("input");
    setTimeout(() => scrollTo("tab-panels-viewport"), 80);
  };

  const handleViewFlow = () => {
    scrollTo("step-nav");
  };

  const handleTabChange = (tab: AppTab) => {
    setActiveTab(tab);
    setTimeout(() => scrollTo("tab-panels-viewport"), 80);
  };

  return (
    <div className="min-h-screen bg-natural-bg text-natural-text flex flex-col font-sans select-none antialiased selection:bg-natural-olive/20 selection:text-natural-text" id="app-root-container">
      <AppHeader />

      <HeroSection onStart={handleStartAppraisal} onViewFlow={handleViewFlow} />

      <div className="max-w-7xl w-full mx-auto px-4 md:px-6">
        <StepNav
          activeTab={activeTab}
          onTabChange={handleTabChange}
          reportReady={Boolean(report)}
        />
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 py-8 space-y-8 select-text">
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

              <PastEventsPanel
                events={fortuneData.pastEvents}
                onChange={(events) =>
                  setFortuneData((prev) => ({ ...prev, pastEvents: events }))
                }
              />

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
                    placeholder="例: 今日から3年後までの運勢、金運、恋愛運"
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
                  disabled={loading || !!reportLoadingLabel}
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
                  ※ 総合サマリーの後、各占術セクションを順次読み込みます（全体で約1分）。詳細は相談ルームでも深掘りできます。
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
                    reportLoadingLabel={reportLoadingLabel}
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

      <AppFooter />
    </div>
  );
}
