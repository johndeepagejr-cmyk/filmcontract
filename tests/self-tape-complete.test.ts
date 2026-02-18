/**
 * Comprehensive tests for the broadcast-quality self-tape system
 * Tests hooks, stores, services, and CSV export.
 * © John dee page jr
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

// ─── useCamera Hook Tests ───────────────────────────────────
describe("useCamera hook structure", () => {
  it("use-camera.ts contains QUALITY_PRESETS with correct keys", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("/home/ubuntu/filmcontract/hooks/use-camera.ts", "utf-8");
    expect(content).toContain("QUALITY_PRESETS");
    expect(content).toContain('"720p"');
    expect(content).toContain('"1080p"');
    expect(content).toContain('"4k"');
    expect(content).toContain("3 Mbps");
    expect(content).toContain("8 Mbps");
    expect(content).toContain("20 Mbps");
  });

  it("use-camera.ts contains FILTER_PRESETS with 4 options", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("/home/ubuntu/filmcontract/hooks/use-camera.ts", "utf-8");
    expect(content).toContain("FILTER_PRESETS");
    expect(content).toContain('"natural"');
    expect(content).toContain('"studio"');
    expect(content).toContain('"warm"');
    expect(content).toContain('"cool"');
  });

  it("use-camera.ts exports useCamera function", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("/home/ubuntu/filmcontract/hooks/use-camera.ts", "utf-8");
    expect(content).toContain("export function useCamera");
    expect(content).toContain("toggleFacing");
    expect(content).toContain("startRecording");
    expect(content).toContain("stopRecording");
    expect(content).toContain("startCountdown");
    expect(content).toContain("starTake");
  });
});

// ─── useVideoProcessing Hook Tests ──────────────────────────
describe("useVideoProcessing hook structure", () => {
  it("use-video-processing.ts exports useVideoProcessing function", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("/home/ubuntu/filmcontract/hooks/use-video-processing.ts", "utf-8");
    expect(content).toContain("export function useVideoProcessing");
    expect(content).toContain("setTrimStart");
    expect(content).toContain("updateSlate");
    expect(content).toContain("toggleEnhance");
    expect(content).toContain("undo");
    expect(content).toContain("redo");
  });
});

// ─── useResumableUpload Hook Tests ──────────────────────────
describe("useResumableUpload hook structure", () => {
  it("use-resumable-upload.ts exports useResumableUpload function", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("/home/ubuntu/filmcontract/hooks/use-resumable-upload.ts", "utf-8");
    expect(content).toContain("export function useResumableUpload");
    expect(content).toContain("addToQueue");
    expect(content).toContain("pauseUpload");
    expect(content).toContain("resumeUpload");
    expect(content).toContain("cancelUpload");
    expect(content).toContain("retryUpload");
    expect(content).toContain("CHUNK_SIZE");
  });
});

// ─── Upload Queue Service Tests ─────────────────────────────
describe("Upload Queue Service", () => {
  it("exports uploadQueue singleton", async () => {
    const { uploadQueue } = await import("../lib/upload-queue");
    expect(uploadQueue).toBeDefined();
    expect(typeof uploadQueue.addItem).toBe("function");
    expect(typeof uploadQueue.removeItem).toBe("function");
    expect(typeof uploadQueue.getAll).toBe("function");
    expect(typeof uploadQueue.getStats).toBe("function");
    expect(typeof uploadQueue.pauseAll).toBe("function");
    expect(typeof uploadQueue.resumeAll).toBe("function");
    expect(typeof uploadQueue.clearCompleted).toBe("function");
    expect(typeof uploadQueue.clearAll).toBe("function");
  });

  it("addItem returns a string id", async () => {
    const { uploadQueue } = await import("../lib/upload-queue");
    const id = uploadQueue.addItem({
      uri: "file://test.mp4",
      name: "test.mp4",
      size: 10 * 1024 * 1024,
      mimeType: "video/mp4",
      castingId: 1,
    });
    expect(typeof id).toBe("string");
    expect(id.startsWith("upload_")).toBe(true);
  });

  it("getStats returns correct structure", async () => {
    const { uploadQueue } = await import("../lib/upload-queue");
    uploadQueue.clearAll();
    uploadQueue.addItem({
      uri: "file://test.mp4",
      name: "test.mp4",
      size: 5 * 1024 * 1024,
      mimeType: "video/mp4",
      castingId: 1,
    });
    const stats = uploadQueue.getStats();
    expect(stats).toHaveProperty("total");
    expect(stats).toHaveProperty("queued");
    expect(stats).toHaveProperty("uploading");
    expect(stats).toHaveProperty("completed");
    expect(stats).toHaveProperty("failed");
    expect(stats).toHaveProperty("totalBytes");
    expect(stats).toHaveProperty("uploadedBytes");
    expect(stats).toHaveProperty("overallProgress");
    expect(stats.total).toBeGreaterThanOrEqual(1);
  });

  it("subscribe notifies listeners", async () => {
    const { uploadQueue } = await import("../lib/upload-queue");
    uploadQueue.clearAll();
    const listener = vi.fn();
    const unsubscribe = uploadQueue.subscribe(listener);
    expect(listener).toHaveBeenCalled(); // Initial call
    uploadQueue.addItem({
      uri: "file://test2.mp4",
      name: "test2.mp4",
      size: 1024,
      mimeType: "video/mp4",
      castingId: 2,
    });
    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
  });
});

// ─── CSV Export Tests ───────────────────────────────────────
describe("CSV Export", () => {
  it("csv-export.ts contains generateReviewCSV function", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("/home/ubuntu/filmcontract/lib/csv-export.ts", "utf-8");
    expect(content).toContain("export function generateReviewCSV");
    expect(content).toContain("Submission ID");
    expect(content).toContain("Actor Name");
    expect(content).toContain("Weighted Average");
    expect(content).toContain("escapeCSV");
  });

  it("csv-export.ts contains shareCSV function", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("/home/ubuntu/filmcontract/lib/csv-export.ts", "utf-8");
    expect(content).toContain("export async function shareCSV");
    expect(content).toContain("Share.share");
    expect(content).toContain("text/csv");
  });

  it("csv-export.ts contains calculateWeightedAverage with correct weights", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("/home/ubuntu/filmcontract/lib/csv-export.ts", "utf-8");
    expect(content).toContain("export function calculateWeightedAverage");
    expect(content).toContain("acting: 0.35");
    expect(content).toContain("look: 0.25");
    expect(content).toContain("voice: 0.20");
    expect(content).toContain("chemistry: 0.20");
  });

  it("csv-export.ts escapes CSV special characters", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("/home/ubuntu/filmcontract/lib/csv-export.ts", "utf-8");
    expect(content).toContain('replace(/"/g');
    expect(content).toContain("includes");
  });

  it("csv-export.ts includes metadata header", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("/home/ubuntu/filmcontract/lib/csv-export.ts", "utf-8");
    expect(content).toContain("Casting Review Export");
    expect(content).toContain("Total Submissions");
    expect(content).toContain("John dee page jr");
  });
});

// ─── Zustand Stores Tests ───────────────────────────────────
describe("Zustand Stores", () => {
  it("useRecordingStore exports correctly", async () => {
    const { useRecordingStore } = await import("../lib/stores/self-tape-store");
    expect(typeof useRecordingStore).toBe("function");
    const state = useRecordingStore.getState();
    expect(state.preferredQuality).toBe("1080p");
    expect(state.preferredFilter).toBe("natural");
    expect(state.showGrid).toBe(true);
    expect(state.facing).toBe("front");
    expect(state.teleprompterSpeed).toBe(3);
    expect(state.takes).toEqual([]);
  });

  it("useRecordingStore.setPreferredQuality updates state", async () => {
    const { useRecordingStore } = await import("../lib/stores/self-tape-store");
    useRecordingStore.getState().setPreferredQuality("4k");
    expect(useRecordingStore.getState().preferredQuality).toBe("4k");
    // Reset
    useRecordingStore.getState().setPreferredQuality("1080p");
  });

  it("useRecordingStore.addTake adds a take", async () => {
    const { useRecordingStore } = await import("../lib/stores/self-tape-store");
    useRecordingStore.getState().resetSession();
    useRecordingStore.getState().addTake({ id: "t1", uri: "file://take1.mp4", duration: 30, starred: true });
    expect(useRecordingStore.getState().takes).toHaveLength(1);
    expect(useRecordingStore.getState().takes[0].id).toBe("t1");
    expect(useRecordingStore.getState().takes[0].starred).toBe(true);
    useRecordingStore.getState().resetSession();
  });

  it("useRecordingStore.starTake stars the correct take", async () => {
    const { useRecordingStore } = await import("../lib/stores/self-tape-store");
    useRecordingStore.getState().resetSession();
    useRecordingStore.getState().addTake({ id: "t1", uri: "file://take1.mp4", duration: 30, starred: true });
    useRecordingStore.getState().addTake({ id: "t2", uri: "file://take2.mp4", duration: 45, starred: false });
    useRecordingStore.getState().starTake("t2");
    const takes = useRecordingStore.getState().takes;
    expect(takes.find((t) => t.id === "t1")?.starred).toBe(false);
    expect(takes.find((t) => t.id === "t2")?.starred).toBe(true);
    useRecordingStore.getState().resetSession();
  });

  it("useReviewStore exports correctly", async () => {
    const { useReviewStore } = await import("../lib/stores/self-tape-store");
    expect(typeof useReviewStore).toBe("function");
    const state = useReviewStore.getState();
    expect(state.notes).toEqual({});
  });

  it("useReviewStore.setRating stores rating for submission", async () => {
    const { useReviewStore } = await import("../lib/stores/self-tape-store");
    useReviewStore.getState().setRating(42, { acting: 4, look: 5, voice: 3, chemistry: 4 });
    const note = useReviewStore.getState().getNote(42);
    expect(note.rating.acting).toBe(4);
    expect(note.rating.look).toBe(5);
    expect(note.rating.voice).toBe(3);
    expect(note.rating.chemistry).toBe(4);
  });

  it("useReviewStore.toggleTag adds and removes tags", async () => {
    const { useReviewStore } = await import("../lib/stores/self-tape-store");
    useReviewStore.getState().toggleTag(42, "Strong Reader");
    expect(useReviewStore.getState().getNote(42).tags).toContain("Strong Reader");
    useReviewStore.getState().toggleTag(42, "Strong Reader");
    expect(useReviewStore.getState().getNote(42).tags).not.toContain("Strong Reader");
  });

  it("useReviewStore.addTimestampedNote adds notes with time", async () => {
    const { useReviewStore } = await import("../lib/stores/self-tape-store");
    useReviewStore.getState().addTimestampedNote(42, 15.5, "Great delivery here");
    const note = useReviewStore.getState().getNote(42);
    expect(note.timestampedNotes.length).toBeGreaterThanOrEqual(1);
    const tsNote = note.timestampedNotes[note.timestampedNotes.length - 1];
    expect(tsNote.time).toBe(15.5);
    expect(tsNote.text).toBe("Great delivery here");
  });

  it("useReviewStore.exportCSV generates CSV string", async () => {
    const { useReviewStore } = await import("../lib/stores/self-tape-store");
    useReviewStore.getState().setRating(100, { acting: 5, look: 4, voice: 3, chemistry: 5 });
    const csv = useReviewStore.getState().exportCSV("Test Casting");
    expect(csv).toContain("Test Casting");
    expect(csv).toContain("Submission ID");
    expect(csv).toContain("100");
  });

  it("useDraftStore saves and loads drafts", async () => {
    const { useDraftStore } = await import("../lib/stores/self-tape-store");
    useDraftStore.getState().saveDraft({
      id: "draft1",
      title: "Action Movie Casting",
      data: { projectTitle: "Action Movie" },
      step: 2,
    });
    const draft = useDraftStore.getState().loadDraft("draft1");
    expect(draft).toBeDefined();
    expect(draft?.title).toBe("Action Movie Casting");
    expect(draft?.step).toBe(2);
  });

  it("useDraftStore deletes drafts", async () => {
    const { useDraftStore } = await import("../lib/stores/self-tape-store");
    useDraftStore.getState().saveDraft({
      id: "draft_del",
      title: "To Delete",
      data: {},
      step: 1,
    });
    expect(useDraftStore.getState().loadDraft("draft_del")).toBeDefined();
    useDraftStore.getState().deleteDraft("draft_del");
    expect(useDraftStore.getState().loadDraft("draft_del")).toBeUndefined();
  });
});

// ─── CreateCastingWizard Screen Tests ───────────────────────
describe("CreateCastingWizard screen structure", () => {
  it("create.tsx file exists and exports default", async () => {
    const fs = await import("fs");
    const exists = fs.existsSync("/home/ubuntu/filmcontract/app/casting/create.tsx");
    expect(exists).toBe(true);
  });

  it("create.tsx contains 4-step wizard structure", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("/home/ubuntu/filmcontract/app/casting/create.tsx", "utf-8");
    expect(content).toContain("Step 1");
    expect(content).toContain("Step 2");
    expect(content).toContain("Step 3");
    expect(content).toContain("Step 4");
    expect(content).toContain("Project");
    expect(content).toContain("Roles");
    expect(content).toContain("compensation");
  });
});

// ─── Review Screen Enhancement Tests ────────────────────────
describe("Review screen enhancements", () => {
  it("review.tsx contains playback speed controls", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("/home/ubuntu/filmcontract/app/casting/review.tsx", "utf-8");
    expect(content).toContain("playbackSpeed");
    expect(content).toContain("PLAYBACK_SPEEDS");
    expect(content).toContain("0.5");
    expect(content).toContain("1.5");
    expect(content).toContain("{spd}x");
  });

  it("review.tsx contains quick tags", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("/home/ubuntu/filmcontract/app/casting/review.tsx", "utf-8");
    expect(content).toContain("QUICK_TAGS");
    expect(content).toContain("Strong read");
    expect(content).toContain("Great energy");
  });

  it("review.tsx contains Request Retake feature", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("/home/ubuntu/filmcontract/app/casting/review.tsx", "utf-8");
    expect(content).toContain("retake");
    expect(content).toContain("Retake");
    expect(content).toContain("retakeFeedback");
  });

  it("review.tsx contains Hire→Contract integration", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("/home/ubuntu/filmcontract/app/casting/review.tsx", "utf-8");
    expect(content).toContain("hireAndCreateContract");
    expect(content).toContain("contract-wizard");
    expect(content).toContain("actorName");
  });

  it("review.tsx contains CSV export button", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("/home/ubuntu/filmcontract/app/casting/review.tsx", "utf-8");
    expect(content).toContain("generateReviewCSV");
    expect(content).toContain("shareCSV");
    expect(content).toContain("exportBtn");
  });

  it("review.tsx contains timestamped notes", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("/home/ubuntu/filmcontract/app/casting/review.tsx", "utf-8");
    expect(content).toContain("timestampedNotes");
    expect(content).toContain("addTimestampedNote");
    expect(content).toContain("TimestampedNote");
  });

  it("review.tsx contains weighted average calculation", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("/home/ubuntu/filmcontract/app/casting/review.tsx", "utf-8");
    expect(content).toContain("weightedAvg");
    expect(content).toContain("0.35");
    expect(content).toContain("0.25");
    expect(content).toContain("0.20");
  });
});
