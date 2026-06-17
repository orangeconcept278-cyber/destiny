import { AllFortuneData, ChatMessage } from "../types";

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
    pastEvents: data.pastEvents ?? [],
    futureYearNotes: data.futureYearNotes ?? [],
    concerns: data.concerns ?? "",
    questions: data.questions ?? "",
  };
}
