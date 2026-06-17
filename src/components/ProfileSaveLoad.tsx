import React from "react";
import { FolderOpen, Save, Trash2, Download } from "lucide-react";
import { loadProfile, SavedProfile } from "../utils/profileStorage";

interface ProfileSaveLoadProps {
  savedProfiles: SavedProfile[];
  selectedProfileId: string;
  profileNameInput: string;
  profileMsg: string;
  onSelectProfile: (id: string) => void;
  onNameChange: (name: string) => void;
  onLoad: () => void;
  onSave: () => void;
  onDelete: () => void;
  onDownloadMarkdown?: () => void;
  onDownloadJson?: () => void;
  canDownload?: boolean;
  compact?: boolean;
}

export default function ProfileSaveLoad({
  savedProfiles,
  selectedProfileId,
  profileNameInput,
  profileMsg,
  onSelectProfile,
  onNameChange,
  onLoad,
  onSave,
  onDelete,
  onDownloadMarkdown,
  onDownloadJson,
  canDownload = false,
  compact = false,
}: ProfileSaveLoadProps) {
  return (
    <div className={`bg-white border border-natural-border rounded-2xl shadow-sm space-y-3 ${compact ? "p-4" : "p-5"}`}>
      <div className="flex items-center gap-2">
        <FolderOpen className="w-4 h-4 text-natural-olive" />
        <h3 className="text-sm font-semibold text-natural-olive font-serif">
          設定の保存・呼び出し
        </h3>
      </div>
      {!compact && (
        <p className="text-xs text-neutral-500">
          出生情報・占術カルテ・流年時間割・悩み・問い・鑑定書・カウンセリング対話をまとめて保存できます。次回起動時は最後に使った設定を自動で読み込みます。
        </p>
      )}
      {compact && (
        <p className="text-xs text-neutral-500">
          流年時間割の内容（過去の出来事・未来メモ）もプロフィールに含めて保存されます。
        </p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="lg:col-span-2">
          <label className="block text-neutral-500 text-xs font-semibold mb-1.5 uppercase tracking-wider">
            保存済みプロフィール
          </label>
          <select
            value={selectedProfileId}
            onChange={(e) => {
              const id = e.target.value;
              onSelectProfile(id);
              const profile = id ? loadProfile(id) : null;
              if (profile) onNameChange(profile.name);
            }}
            className="w-full bg-natural-light-cream/40 border border-natural-border rounded-lg px-3 py-2 text-xs text-natural-text focus:outline-none focus:border-natural-olive"
          >
            <option value="">— 選択してください —</option>
            {savedProfiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}（{new Date(p.savedAt).toLocaleDateString("ja-JP")}）
              </option>
            ))}
          </select>
        </div>
        <div className="lg:col-span-2">
          <label className="block text-neutral-500 text-xs font-semibold mb-1.5 uppercase tracking-wider">
            プロフィール名（保存時）
          </label>
          <input
            type="text"
            value={profileNameInput}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="例: 自分、友人A"
            className="w-full bg-natural-light-cream/40 border border-natural-border rounded-lg px-3 py-2 text-xs text-natural-text focus:outline-none focus:border-natural-olive"
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={onLoad}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-natural-light-cream hover:bg-natural-cream text-natural-olive border border-natural-border rounded-lg transition-all"
        >
          <FolderOpen className="w-3.5 h-3.5" />
          読み込む
        </button>
        <button
          onClick={onSave}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-natural-olive hover:opacity-90 text-white rounded-lg transition-all"
        >
          <Save className="w-3.5 h-3.5" />
          現在の設定を保存
        </button>
        <button
          onClick={onDelete}
          disabled={!selectedProfileId}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Trash2 className="w-3.5 h-3.5" />
          削除
        </button>
        {canDownload && onDownloadMarkdown && (
          <button
            onClick={onDownloadMarkdown}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-white hover:bg-natural-light-cream text-natural-olive border border-natural-border rounded-lg transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            MDダウンロード
          </button>
        )}
        {canDownload && onDownloadJson && (
          <button
            onClick={onDownloadJson}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-white hover:bg-natural-light-cream text-natural-olive border border-natural-border rounded-lg transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            JSONダウンロード
          </button>
        )}
      </div>
      {profileMsg && (
        <p className="text-xs text-natural-olive bg-natural-light-cream/60 border border-natural-border px-3 py-2 rounded-lg">
          {profileMsg}
        </p>
      )}
    </div>
  );
}
