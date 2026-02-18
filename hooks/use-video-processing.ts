/**
 * useVideoProcessing — Reusable video editing/processing hook
 * Extracted from SelfTapeEditor for reuse across the app.
 * © John dee page jr
 */
import { useState, useCallback, useRef } from "react";

// ─── Types ──────────────────────────────────────────────────
export type EditorTool = "trim" | "slate" | "enhance" | "export";

export interface TrimState {
  startTime: number;
  endTime: number;
  duration: number;
}

export interface SlateConfig {
  name: string;
  height: string;
  location: string;
  agency: string;
  contact: string;
  duration: 3 | 5 | 10;
  fontColor: string;
  backgroundColor: string;
  enabled: boolean;
}

export interface EnhanceSettings {
  autoLevels: boolean;
  volumeNormalize: boolean;
  noiseReduction: boolean;
  skinSmoothing: boolean;
}

export type ExportResolution = "720p" | "1080p";
export type ExportTargetSize = 25 | 50 | 100;

export interface ExportConfig {
  resolution: ExportResolution;
  targetSize: ExportTargetSize;
  estimatedSize: number; // MB
}

export interface UndoAction {
  id: string;
  type: "trim" | "slate" | "enhance";
  previousState: any;
  description: string;
}

export interface VideoProcessingState {
  activeTool: EditorTool;
  isPlaying: boolean;
  currentTime: number;
  trim: TrimState;
  slate: SlateConfig;
  enhance: EnhanceSettings;
  exportConfig: ExportConfig;
  undoStack: UndoAction[];
  redoStack: UndoAction[];
  isProcessing: boolean;
  processProgress: number;
}

const defaultSlate: SlateConfig = {
  name: "",
  height: "",
  location: "",
  agency: "",
  contact: "",
  duration: 5,
  fontColor: "#FFFFFF",
  backgroundColor: "#000000",
  enabled: true,
};

const defaultEnhance: EnhanceSettings = {
  autoLevels: false,
  volumeNormalize: false,
  noiseReduction: false,
  skinSmoothing: false,
};

// ─── Hook ───────────────────────────────────────────────────
export function useVideoProcessing(videoDuration: number) {
  const [state, setState] = useState<VideoProcessingState>({
    activeTool: "trim",
    isPlaying: false,
    currentTime: 0,
    trim: { startTime: 0, endTime: videoDuration, duration: videoDuration },
    slate: defaultSlate,
    enhance: defaultEnhance,
    exportConfig: { resolution: "1080p", targetSize: 50, estimatedSize: 0 },
    undoStack: [],
    redoStack: [],
    isProcessing: false,
    processProgress: 0,
  });

  const playbackTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const update = useCallback((partial: Partial<VideoProcessingState>) => {
    setState((prev) => ({ ...prev, ...partial }));
  }, []);

  // ─── Tool Selection ───────────────────────────────────────
  const setActiveTool = useCallback((tool: EditorTool) => {
    update({ activeTool: tool });
  }, [update]);

  // ─── Playback ─────────────────────────────────────────────
  const togglePlayback = useCallback(() => {
    setState((prev) => {
      if (prev.isPlaying) {
        if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
        return { ...prev, isPlaying: false };
      }
      playbackTimerRef.current = setInterval(() => {
        setState((p) => {
          const next = p.currentTime + 0.1;
          if (next >= p.trim.endTime) {
            if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
            return { ...p, currentTime: p.trim.startTime, isPlaying: false };
          }
          return { ...p, currentTime: next };
        });
      }, 100);
      return { ...prev, isPlaying: true };
    });
  }, []);

  const seekTo = useCallback((time: number) => {
    update({ currentTime: Math.max(0, Math.min(time, videoDuration)) });
  }, [update, videoDuration]);

  // ─── Trim ─────────────────────────────────────────────────
  const setTrimStart = useCallback((time: number) => {
    setState((prev) => {
      const action: UndoAction = {
        id: Math.random().toString(36).slice(2, 8),
        type: "trim",
        previousState: { ...prev.trim },
        description: `Trim start to ${time.toFixed(1)}s`,
      };
      const startTime = Math.max(0, Math.min(time, prev.trim.endTime - 0.5));
      return {
        ...prev,
        trim: { ...prev.trim, startTime, duration: prev.trim.endTime - startTime },
        undoStack: [...prev.undoStack, action],
        redoStack: [],
      };
    });
  }, []);

  const setTrimEnd = useCallback((time: number) => {
    setState((prev) => {
      const action: UndoAction = {
        id: Math.random().toString(36).slice(2, 8),
        type: "trim",
        previousState: { ...prev.trim },
        description: `Trim end to ${time.toFixed(1)}s`,
      };
      const endTime = Math.min(videoDuration, Math.max(time, prev.trim.startTime + 0.5));
      return {
        ...prev,
        trim: { ...prev.trim, endTime, duration: endTime - prev.trim.startTime },
        undoStack: [...prev.undoStack, action],
        redoStack: [],
      };
    });
  }, [videoDuration]);

  // ─── Slate ────────────────────────────────────────────────
  const updateSlate = useCallback((partial: Partial<SlateConfig>) => {
    setState((prev) => ({
      ...prev,
      slate: { ...prev.slate, ...partial },
    }));
  }, []);

  // ─── Enhance ──────────────────────────────────────────────
  const toggleEnhance = useCallback((key: keyof EnhanceSettings) => {
    setState((prev) => ({
      ...prev,
      enhance: { ...prev.enhance, [key]: !prev.enhance[key] },
    }));
  }, []);

  // ─── Export ───────────────────────────────────────────────
  const updateExport = useCallback((partial: Partial<ExportConfig>) => {
    setState((prev) => ({
      ...prev,
      exportConfig: { ...prev.exportConfig, ...partial },
    }));
  }, []);

  const estimateFileSize = useCallback((): number => {
    const { resolution, targetSize } = state.exportConfig;
    const duration = state.trim.duration;
    const bitrateMap = { "720p": 3, "1080p": 8 };
    const bitrate = bitrateMap[resolution];
    const rawSize = (bitrate * duration) / 8; // MB
    return Math.min(rawSize, targetSize);
  }, [state.exportConfig, state.trim.duration]);

  // ─── Undo / Redo ──────────────────────────────────────────
  const undo = useCallback(() => {
    setState((prev) => {
      if (prev.undoStack.length === 0) return prev;
      const action = prev.undoStack[prev.undoStack.length - 1];
      const newUndo = prev.undoStack.slice(0, -1);
      const redoAction: UndoAction = {
        ...action,
        previousState: action.type === "trim" ? { ...prev.trim } : action.previousState,
      };
      return {
        ...prev,
        trim: action.type === "trim" ? action.previousState : prev.trim,
        undoStack: newUndo,
        redoStack: [...prev.redoStack, redoAction],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setState((prev) => {
      if (prev.redoStack.length === 0) return prev;
      const action = prev.redoStack[prev.redoStack.length - 1];
      const newRedo = prev.redoStack.slice(0, -1);
      const undoAction: UndoAction = {
        ...action,
        previousState: action.type === "trim" ? { ...prev.trim } : action.previousState,
      };
      return {
        ...prev,
        trim: action.type === "trim" ? action.previousState : prev.trim,
        undoStack: [...prev.undoStack, undoAction],
        redoStack: newRedo,
      };
    });
  }, []);

  // ─── Processing Simulation ────────────────────────────────
  const startProcessing = useCallback((onComplete: (outputUri: string) => void) => {
    update({ isProcessing: true, processProgress: 0 });
    const interval = setInterval(() => {
      setState((prev) => {
        const next = prev.processProgress + Math.random() * 8 + 2;
        if (next >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            update({ isProcessing: false, processProgress: 100 });
            onComplete(`file://processed_${Date.now()}.mp4`);
          }, 300);
          return { ...prev, processProgress: 100 };
        }
        return { ...prev, processProgress: next };
      });
    }, 200);
  }, [update]);

  const formatTime = useCallback((seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${m}:${s.toString().padStart(2, "0")}.${ms}`;
  }, []);

  const reset = useCallback(() => {
    if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
    setState({
      activeTool: "trim",
      isPlaying: false,
      currentTime: 0,
      trim: { startTime: 0, endTime: videoDuration, duration: videoDuration },
      slate: defaultSlate,
      enhance: defaultEnhance,
      exportConfig: { resolution: "1080p", targetSize: 50, estimatedSize: 0 },
      undoStack: [],
      redoStack: [],
      isProcessing: false,
      processProgress: 0,
    });
  }, [videoDuration]);

  return {
    state,
    setActiveTool,
    togglePlayback,
    seekTo,
    setTrimStart,
    setTrimEnd,
    updateSlate,
    toggleEnhance,
    updateExport,
    estimateFileSize,
    undo,
    redo,
    startProcessing,
    formatTime,
    reset,
  };
}
