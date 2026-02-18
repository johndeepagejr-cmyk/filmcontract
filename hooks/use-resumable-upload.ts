/**
 * useResumableUpload — Reusable chunked upload hook with progress tracking
 * Extracted from ResumableUpload screen for reuse across the app.
 * © John dee page jr
 */
import { useState, useCallback, useRef } from "react";

// ─── Types ──────────────────────────────────────────────────
export type UploadStatus = "queued" | "uploading" | "paused" | "completed" | "failed" | "cancelled";

export interface UploadItem {
  id: string;
  fileName: string;
  fileUri: string;
  fileSize: number; // bytes
  mimeType: string;
  status: UploadStatus;
  progress: number; // 0-100
  uploadedBytes: number;
  speed: number; // bytes per second
  eta: number; // seconds remaining
  chunksTotal: number;
  chunksUploaded: number;
  retryCount: number;
  error: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
  thumbnailUri?: string;
}

export interface UploadQueueState {
  items: UploadItem[];
  maxConcurrent: number;
  activeCount: number;
  totalProgress: number;
  isProcessing: boolean;
}

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 3000, 10000]; // exponential backoff

// ─── Hook ───────────────────────────────────────────────────
export function useResumableUpload(maxConcurrent = 3) {
  const [state, setState] = useState<UploadQueueState>({
    items: [],
    maxConcurrent,
    activeCount: 0,
    totalProgress: 0,
    isProcessing: false,
  });

  const uploadTimersRef = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());

  const calculateTotalProgress = useCallback((items: UploadItem[]): number => {
    if (items.length === 0) return 0;
    const total = items.reduce((sum, item) => sum + item.progress, 0);
    return total / items.length;
  }, []);

  // ─── Add to Queue ─────────────────────────────────────────
  const addToQueue = useCallback((file: {
    uri: string;
    name: string;
    size: number;
    mimeType: string;
    thumbnailUri?: string;
  }): string => {
    const id = Math.random().toString(36).slice(2, 10);
    const chunksTotal = Math.ceil(file.size / CHUNK_SIZE);

    const item: UploadItem = {
      id,
      fileName: file.name,
      fileUri: file.uri,
      fileSize: file.size,
      mimeType: file.mimeType,
      status: "queued",
      progress: 0,
      uploadedBytes: 0,
      speed: 0,
      eta: 0,
      chunksTotal,
      chunksUploaded: 0,
      retryCount: 0,
      error: null,
      startedAt: null,
      completedAt: null,
      thumbnailUri: file.thumbnailUri,
    };

    setState((prev) => {
      const newItems = [...prev.items, item];
      return {
        ...prev,
        items: newItems,
        totalProgress: calculateTotalProgress(newItems),
      };
    });

    return id;
  }, [calculateTotalProgress]);

  // ─── Start Upload (simulated) ─────────────────────────────
  const startUpload = useCallback((itemId: string) => {
    setState((prev) => {
      const items = prev.items.map((item) =>
        item.id === itemId
          ? { ...item, status: "uploading" as const, startedAt: new Date(), error: null }
          : item
      );
      return { ...prev, items, activeCount: prev.activeCount + 1, isProcessing: true };
    });

    // Simulate chunked upload
    const timer = setInterval(() => {
      setState((prev) => {
        const item = prev.items.find((i) => i.id === itemId);
        if (!item || item.status !== "uploading") {
          clearInterval(timer);
          return prev;
        }

        const chunkProgress = CHUNK_SIZE * (0.8 + Math.random() * 0.4);
        const newUploaded = Math.min(item.uploadedBytes + chunkProgress, item.fileSize);
        const newChunksUploaded = Math.floor(newUploaded / CHUNK_SIZE);
        const progress = (newUploaded / item.fileSize) * 100;
        const elapsed = (Date.now() - (item.startedAt?.getTime() || Date.now())) / 1000;
        const speed = elapsed > 0 ? newUploaded / elapsed : 0;
        const remaining = item.fileSize - newUploaded;
        const eta = speed > 0 ? remaining / speed : 0;

        const isComplete = newUploaded >= item.fileSize;

        if (isComplete) {
          clearInterval(timer);
          uploadTimersRef.current.delete(itemId);
        }

        const items = prev.items.map((i) =>
          i.id === itemId
            ? {
                ...i,
                uploadedBytes: newUploaded,
                chunksUploaded: newChunksUploaded,
                progress: isComplete ? 100 : progress,
                speed,
                eta,
                status: isComplete ? ("completed" as const) : ("uploading" as const),
                completedAt: isComplete ? new Date() : null,
              }
            : i
        );

        return {
          ...prev,
          items,
          activeCount: isComplete ? prev.activeCount - 1 : prev.activeCount,
          totalProgress: calculateTotalProgress(items),
          isProcessing: items.some((i) => i.status === "uploading"),
        };
      });
    }, 300);

    uploadTimersRef.current.set(itemId, timer);
  }, [calculateTotalProgress]);

  // ─── Pause ────────────────────────────────────────────────
  const pauseUpload = useCallback((itemId: string) => {
    const timer = uploadTimersRef.current.get(itemId);
    if (timer) {
      clearInterval(timer);
      uploadTimersRef.current.delete(itemId);
    }

    setState((prev) => {
      const items = prev.items.map((i) =>
        i.id === itemId ? { ...i, status: "paused" as const, speed: 0, eta: 0 } : i
      );
      return {
        ...prev,
        items,
        activeCount: Math.max(0, prev.activeCount - 1),
        isProcessing: items.some((i) => i.status === "uploading"),
      };
    });
  }, []);

  // ─── Resume ───────────────────────────────────────────────
  const resumeUpload = useCallback((itemId: string) => {
    startUpload(itemId);
  }, [startUpload]);

  // ─── Cancel ───────────────────────────────────────────────
  const cancelUpload = useCallback((itemId: string) => {
    const timer = uploadTimersRef.current.get(itemId);
    if (timer) {
      clearInterval(timer);
      uploadTimersRef.current.delete(itemId);
    }

    setState((prev) => {
      const items = prev.items.map((i) =>
        i.id === itemId ? { ...i, status: "cancelled" as const, speed: 0, eta: 0 } : i
      );
      return {
        ...prev,
        items,
        activeCount: Math.max(0, prev.activeCount - 1),
        totalProgress: calculateTotalProgress(items),
        isProcessing: items.some((i) => i.status === "uploading"),
      };
    });
  }, [calculateTotalProgress]);

  // ─── Retry ────────────────────────────────────────────────
  const retryUpload = useCallback((itemId: string) => {
    setState((prev) => {
      const item = prev.items.find((i) => i.id === itemId);
      if (!item || item.retryCount >= MAX_RETRIES) return prev;

      const items = prev.items.map((i) =>
        i.id === itemId
          ? { ...i, status: "queued" as const, retryCount: i.retryCount + 1, error: null }
          : i
      );
      return { ...prev, items };
    });

    // Delay based on retry count
    const item = state.items.find((i) => i.id === itemId);
    const delay = RETRY_DELAYS[Math.min((item?.retryCount || 0), RETRY_DELAYS.length - 1)];
    setTimeout(() => startUpload(itemId), delay);
  }, [state.items, startUpload]);

  // ─── Remove from Queue ────────────────────────────────────
  const removeFromQueue = useCallback((itemId: string) => {
    const timer = uploadTimersRef.current.get(itemId);
    if (timer) {
      clearInterval(timer);
      uploadTimersRef.current.delete(itemId);
    }

    setState((prev) => {
      const items = prev.items.filter((i) => i.id !== itemId);
      return {
        ...prev,
        items,
        totalProgress: calculateTotalProgress(items),
        isProcessing: items.some((i) => i.status === "uploading"),
      };
    });
  }, [calculateTotalProgress]);

  // ─── Start All Queued ─────────────────────────────────────
  const startAll = useCallback(() => {
    const queued = state.items.filter((i) => i.status === "queued");
    const toStart = queued.slice(0, maxConcurrent - state.activeCount);
    toStart.forEach((item) => startUpload(item.id));
  }, [state.items, state.activeCount, maxConcurrent, startUpload]);

  // ─── Pause All ────────────────────────────────────────────
  const pauseAll = useCallback(() => {
    state.items
      .filter((i) => i.status === "uploading")
      .forEach((item) => pauseUpload(item.id));
  }, [state.items, pauseUpload]);

  // ─── Helpers ──────────────────────────────────────────────
  const formatBytes = useCallback((bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }, []);

  const formatSpeed = useCallback((bytesPerSecond: number): string => {
    if (bytesPerSecond < 1024 * 1024) return `${(bytesPerSecond / 1024).toFixed(0)} KB/s`;
    return `${(bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`;
  }, []);

  const formatETA = useCallback((seconds: number): string => {
    if (seconds < 60) return `${Math.ceil(seconds)}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.ceil(seconds % 60)}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  }, []);

  const clearCompleted = useCallback(() => {
    setState((prev) => {
      const items = prev.items.filter((i) => i.status !== "completed" && i.status !== "cancelled");
      return { ...prev, items, totalProgress: calculateTotalProgress(items) };
    });
  }, [calculateTotalProgress]);

  return {
    state,
    addToQueue,
    startUpload,
    pauseUpload,
    resumeUpload,
    cancelUpload,
    retryUpload,
    removeFromQueue,
    startAll,
    pauseAll,
    clearCompleted,
    formatBytes,
    formatSpeed,
    formatETA,
  };
}
