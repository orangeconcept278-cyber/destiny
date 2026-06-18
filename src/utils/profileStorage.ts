import { AllFortuneData, ChatMessage, PastEvent } from "../types";

export interface SavedProfile {
  id: string;
  name: string;
  savedAt: string;
  data: AllFortuneData;
  report?: string;
  chatHistory?: ChatMessage[];
}

const PROFILES_KEY = "astria-profiles-v1";
const LAST_PROFILE_KEY = "astria-last-profile-id";

const LEGACY_PLACEHOLDER_EVENT_TEXTS = new Set([
  "初めての就職・就労",
  "転職、または生活拠点の大きな移転",
]);

const LEGACY_DEFAULT_CONCERNS =
  "仕事に集中すると家庭が疎かになり、葛藤を繰り返す。完璧主義に陥って身動きが取れなくなる癖がある。";

const LEGACY_DEFAULT_QUESTIONS =
  "今取り組んでいるキャリアの方向性は、自分の命式やダシャー期と合致しているでしょうか？3年以内に転機が来るタイミングを知りたいです。";

export const DEFAULT_QUESTIONS = "今日から3年後までの運勢、金運、恋愛運";

function stripLegacyPlaceholderPastEvents(events: PastEvent[]): PastEvent[] {
  return events.filter((event) => !LEGACY_PLACEHOLDER_EVENT_TEXTS.has(event.event));
}

function normalizeConcerns(concerns: string | undefined): string {
  if (!concerns || concerns === LEGACY_DEFAULT_CONCERNS) return "";
  return concerns;
}

function normalizeQuestions(questions: string | undefined): string {
  if (!questions || questions === LEGACY_DEFAULT_QUESTIONS) return DEFAULT_QUESTIONS;
  return questions;
}

function readProfiles(): SavedProfile[] {
  try {
    const raw = localStorage.getItem(PROFILES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeProfiles(profiles: SavedProfile[]): void {
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
}

export function getProfiles(): SavedProfile[] {
  return readProfiles().sort(
    (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
  );
}

export function saveProfile(
  name: string,
  data: AllFortuneData,
  report?: string,
  chatHistory?: ChatMessage[]
): SavedProfile {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("プロフィール名を入力してください。");

  const profiles = readProfiles();
  const existing = profiles.find((p) => p.name === trimmed);

  const profile: SavedProfile = {
    id: existing?.id ?? crypto.randomUUID(),
    name: trimmed,
    savedAt: new Date().toISOString(),
    data: normalizeFortuneData(data),
    ...(report ? { report } : {}),
    ...(chatHistory && chatHistory.length > 0 ? { chatHistory } : {}),
  };

  const next = existing
    ? profiles.map((p) => (p.id === existing.id ? profile : p))
    : [...profiles, profile];

  writeProfiles(next);
  setLastProfileId(profile.id);
  return profile;
}

export function loadProfile(id: string): SavedProfile | null {
  const profile = readProfiles().find((p) => p.id === id);
  if (!profile) return null;
  return {
    ...profile,
    data: normalizeFortuneData(profile.data),
    chatHistory: profile.chatHistory ?? [],
  };
}

export function deleteProfile(id: string): void {
  const profiles = readProfiles().filter((p) => p.id !== id);
  writeProfiles(profiles);
  if (getLastProfileId() === id) {
    localStorage.removeItem(LAST_PROFILE_KEY);
  }
}

export function getLastProfileId(): string | null {
  return localStorage.getItem(LAST_PROFILE_KEY);
}

export function setLastProfileId(id: string): void {
  localStorage.setItem(LAST_PROFILE_KEY, id);
}

export function normalizeFortuneData(data: AllFortuneData): AllFortuneData {
  return {
    ...data,
    pastEvents: stripLegacyPlaceholderPastEvents(data.pastEvents ?? []),
    futureYearNotes: data.futureYearNotes ?? [],
    concerns: normalizeConcerns(data.concerns),
    questions: normalizeQuestions(data.questions),
  };
}

export function migrateStoredProfiles(): void {
  const profiles = readProfiles();
  const migrated = profiles.map((profile) => ({
    ...profile,
    data: normalizeFortuneData(profile.data),
  }));

  const changed = migrated.some((profile, index) => {
    const before = profiles[index]?.data;
    if (!before) return false;
    return (
      JSON.stringify(profile.data.pastEvents) !== JSON.stringify(before.pastEvents ?? []) ||
      profile.data.concerns !== (before.concerns ?? "") ||
      profile.data.questions !== (before.questions ?? "")
    );
  });

  if (changed) {
    writeProfiles(migrated);
  }
}
