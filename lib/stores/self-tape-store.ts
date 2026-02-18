/**
 * Self-Tape Zustand Stores — Persisted state for recording, editing, upload, and review
 * Uses AsyncStorage for persistence across app restarts.
 * © John dee page jr
 */
import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Storage Helpers ────────────────────────────────────────
const KEYS = {
  recording: "@filmcontract:recording_state",
  editing: "@filmcontract:editing_state",
  review: "@filmcontract:review_state",
  drafts: "@filmcontract:casting_drafts",
} as const;

async function loadState<T>(key: string): Promise<T | null> {
  try {
    const stored = await AsyncStorage.getItem(key);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

async function saveState(key: string, state: any) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(state));
  } catch {
    // Silently fail
  }
}

// ═══════════════════════════════════════════════════════════
// RECORDING STORE
// ═══════════════════════════════════════════════════════════
export interface RecordingTake {
  id: string;
  uri: string;
  duration: number;
  starred: boolean;
  createdAt: string;
}

interface RecordingState {
  // Settings (persisted)
  preferredQuality: "720p" | "1080p" | "4k";
  preferredFilter: "natural" | "studio" | "warm" | "cool";
  showGrid: boolean;
  facing: "front" | "back";
  teleprompterSpeed: number;
  teleprompterMirror: boolean;

  // Session (not persisted)
  takes: RecordingTake[];
  activeTakeIndex: number;
  isRecording: boolean;
  castingId: number | null;

  // Actions
  setPreferredQuality: (q: "720p" | "1080p" | "4k") => void;
  setPreferredFilter: (f: "natural" | "studio" | "warm" | "cool") => void;
  toggleGrid: () => void;
  toggleFacing: () => void;
  setTeleprompterSpeed: (speed: number) => void;
  setTeleprompterMirror: (mirror: boolean) => void;
  addTake: (take: Omit<RecordingTake, "createdAt">) => void;
  removeTake: (id: string) => void;
  starTake: (id: string) => void;
  setActiveTake: (index: number) => void;
  setCastingId: (id: number | null) => void;
  resetSession: () => void;
  hydrate: () => Promise<void>;
}

export const useRecordingStore = create<RecordingState>((set, get) => ({
  preferredQuality: "1080p",
  preferredFilter: "natural",
  showGrid: true,
  facing: "front",
  teleprompterSpeed: 3,
  teleprompterMirror: false,
  takes: [],
  activeTakeIndex: -1,
  isRecording: false,
  castingId: null,

  setPreferredQuality: (q) => {
    set({ preferredQuality: q });
    saveState(KEYS.recording, { preferredQuality: q, preferredFilter: get().preferredFilter, showGrid: get().showGrid, facing: get().facing, teleprompterSpeed: get().teleprompterSpeed, teleprompterMirror: get().teleprompterMirror });
  },
  setPreferredFilter: (f) => {
    set({ preferredFilter: f });
    saveState(KEYS.recording, { preferredQuality: get().preferredQuality, preferredFilter: f, showGrid: get().showGrid, facing: get().facing, teleprompterSpeed: get().teleprompterSpeed, teleprompterMirror: get().teleprompterMirror });
  },
  toggleGrid: () => {
    const next = !get().showGrid;
    set({ showGrid: next });
    saveState(KEYS.recording, { preferredQuality: get().preferredQuality, preferredFilter: get().preferredFilter, showGrid: next, facing: get().facing, teleprompterSpeed: get().teleprompterSpeed, teleprompterMirror: get().teleprompterMirror });
  },
  toggleFacing: () => {
    const next = get().facing === "front" ? "back" : "front";
    set({ facing: next as "front" | "back" });
    saveState(KEYS.recording, { preferredQuality: get().preferredQuality, preferredFilter: get().preferredFilter, showGrid: get().showGrid, facing: next, teleprompterSpeed: get().teleprompterSpeed, teleprompterMirror: get().teleprompterMirror });
  },
  setTeleprompterSpeed: (speed) => {
    set({ teleprompterSpeed: speed });
    saveState(KEYS.recording, { preferredQuality: get().preferredQuality, preferredFilter: get().preferredFilter, showGrid: get().showGrid, facing: get().facing, teleprompterSpeed: speed, teleprompterMirror: get().teleprompterMirror });
  },
  setTeleprompterMirror: (mirror) => {
    set({ teleprompterMirror: mirror });
    saveState(KEYS.recording, { preferredQuality: get().preferredQuality, preferredFilter: get().preferredFilter, showGrid: get().showGrid, facing: get().facing, teleprompterSpeed: get().teleprompterSpeed, teleprompterMirror: mirror });
  },
  addTake: (take) => {
    const newTake: RecordingTake = { ...take, createdAt: new Date().toISOString() };
    set((s) => ({
      takes: [...s.takes, newTake],
      activeTakeIndex: s.takes.length,
    }));
  },
  removeTake: (id) => {
    set((s) => {
      const newTakes = s.takes.filter((t) => t.id !== id);
      return { takes: newTakes, activeTakeIndex: Math.min(s.activeTakeIndex, newTakes.length - 1) };
    });
  },
  starTake: (id) => {
    set((s) => ({
      takes: s.takes.map((t) => ({ ...t, starred: t.id === id })),
    }));
  },
  setActiveTake: (index) => set({ activeTakeIndex: index }),
  setCastingId: (id) => set({ castingId: id }),
  resetSession: () => set({ takes: [], activeTakeIndex: -1, isRecording: false, castingId: null }),
  hydrate: async () => {
    const stored = await loadState<Partial<RecordingState>>(KEYS.recording);
    if (stored) {
      set({
        preferredQuality: stored.preferredQuality || "1080p",
        preferredFilter: stored.preferredFilter || "natural",
        showGrid: stored.showGrid ?? true,
        facing: stored.facing || "front",
        teleprompterSpeed: stored.teleprompterSpeed ?? 3,
        teleprompterMirror: stored.teleprompterMirror ?? false,
      });
    }
  },
}));

// ═══════════════════════════════════════════════════════════
// REVIEW STORE
// ═══════════════════════════════════════════════════════════
export interface ReviewRating {
  acting: number;
  look: number;
  voice: number;
  chemistry: number;
}

export interface ReviewNote {
  submissionId: number;
  rating: ReviewRating;
  tags: string[];
  producerNotes: string;
  timestampedNotes: { time: number; text: string; createdAt: string }[];
  updatedAt: string;
}

interface ReviewState {
  notes: Record<number, ReviewNote>; // keyed by submissionId
  setRating: (submissionId: number, rating: ReviewRating) => void;
  setTags: (submissionId: number, tags: string[]) => void;
  toggleTag: (submissionId: number, tag: string) => void;
  setProducerNotes: (submissionId: number, notes: string) => void;
  addTimestampedNote: (submissionId: number, time: number, text: string) => void;
  getNote: (submissionId: number) => ReviewNote;
  exportCSV: (castingTitle: string) => string;
  hydrate: () => Promise<void>;
}

const defaultNote: ReviewNote = {
  submissionId: 0,
  rating: { acting: 0, look: 0, voice: 0, chemistry: 0 },
  tags: [],
  producerNotes: "",
  timestampedNotes: [],
  updatedAt: new Date().toISOString(),
};

export const useReviewStore = create<ReviewState>((set, get) => ({
  notes: {},

  setRating: (submissionId, rating) => {
    set((s) => {
      const existing = s.notes[submissionId] || { ...defaultNote, submissionId };
      const updated = { ...existing, rating, updatedAt: new Date().toISOString() };
      const notes = { ...s.notes, [submissionId]: updated };
      saveState(KEYS.review, notes);
      return { notes };
    });
  },

  setTags: (submissionId, tags) => {
    set((s) => {
      const existing = s.notes[submissionId] || { ...defaultNote, submissionId };
      const updated = { ...existing, tags, updatedAt: new Date().toISOString() };
      const notes = { ...s.notes, [submissionId]: updated };
      saveState(KEYS.review, notes);
      return { notes };
    });
  },

  toggleTag: (submissionId, tag) => {
    set((s) => {
      const existing = s.notes[submissionId] || { ...defaultNote, submissionId };
      const tags = existing.tags.includes(tag)
        ? existing.tags.filter((t) => t !== tag)
        : [...existing.tags, tag];
      const updated = { ...existing, tags, updatedAt: new Date().toISOString() };
      const notes = { ...s.notes, [submissionId]: updated };
      saveState(KEYS.review, notes);
      return { notes };
    });
  },

  setProducerNotes: (submissionId, producerNotes) => {
    set((s) => {
      const existing = s.notes[submissionId] || { ...defaultNote, submissionId };
      const updated = { ...existing, producerNotes, updatedAt: new Date().toISOString() };
      const notes = { ...s.notes, [submissionId]: updated };
      saveState(KEYS.review, notes);
      return { notes };
    });
  },

  addTimestampedNote: (submissionId, time, text) => {
    set((s) => {
      const existing = s.notes[submissionId] || { ...defaultNote, submissionId };
      const tsNote = { time, text, createdAt: new Date().toISOString() };
      const updated = {
        ...existing,
        timestampedNotes: [...existing.timestampedNotes, tsNote],
        updatedAt: new Date().toISOString(),
      };
      const notes = { ...s.notes, [submissionId]: updated };
      saveState(KEYS.review, notes);
      return { notes };
    });
  },

  getNote: (submissionId) => {
    return get().notes[submissionId] || { ...defaultNote, submissionId };
  },

  exportCSV: (castingTitle) => {
    const notes = Object.values(get().notes);
    const headers = [
      "Submission ID", "Acting", "Look", "Voice", "Chemistry", "Weighted Avg",
      "Tags", "Producer Notes", "Timestamped Notes Count", "Updated At",
    ];
    const rows = notes.map((n) => {
      const avg = [
        n.rating.acting * 0.35,
        n.rating.look * 0.25,
        n.rating.voice * 0.20,
        n.rating.chemistry * 0.20,
      ].reduce((a, b) => a + b, 0);
      return [
        n.submissionId,
        n.rating.acting,
        n.rating.look,
        n.rating.voice,
        n.rating.chemistry,
        avg.toFixed(2),
        `"${n.tags.join(", ")}"`,
        `"${n.producerNotes.replace(/"/g, '""')}"`,
        n.timestampedNotes.length,
        n.updatedAt,
      ].join(",");
    });
    return `# ${castingTitle} - Review Notes Export\n${headers.join(",")}\n${rows.join("\n")}`;
  },

  hydrate: async () => {
    const stored = await loadState<Record<number, ReviewNote>>(KEYS.review);
    if (stored) set({ notes: stored });
  },
}));

// ═══════════════════════════════════════════════════════════
// CASTING DRAFT STORE
// ═══════════════════════════════════════════════════════════
export interface CastingDraft {
  id: string;
  title: string;
  data: any; // WizardData from create.tsx
  step: number;
  updatedAt: string;
}

interface DraftState {
  drafts: CastingDraft[];
  activeDraftId: string | null;
  saveDraft: (draft: Omit<CastingDraft, "updatedAt">) => void;
  loadDraft: (id: string) => CastingDraft | undefined;
  deleteDraft: (id: string) => void;
  setActiveDraft: (id: string | null) => void;
  hydrate: () => Promise<void>;
}

export const useDraftStore = create<DraftState>((set, get) => ({
  drafts: [],
  activeDraftId: null,

  saveDraft: (draft) => {
    const updated: CastingDraft = { ...draft, updatedAt: new Date().toISOString() };
    set((s) => {
      const exists = s.drafts.findIndex((d) => d.id === draft.id);
      const drafts = exists >= 0
        ? s.drafts.map((d) => (d.id === draft.id ? updated : d))
        : [...s.drafts, updated];
      saveState(KEYS.drafts, drafts);
      return { drafts };
    });
  },

  loadDraft: (id) => get().drafts.find((d) => d.id === id),

  deleteDraft: (id) => {
    set((s) => {
      const drafts = s.drafts.filter((d) => d.id !== id);
      saveState(KEYS.drafts, drafts);
      return { drafts, activeDraftId: s.activeDraftId === id ? null : s.activeDraftId };
    });
  },

  setActiveDraft: (id) => set({ activeDraftId: id }),

  hydrate: async () => {
    const stored = await loadState<CastingDraft[]>(KEYS.drafts);
    if (stored) set({ drafts: stored });
  },
}));
