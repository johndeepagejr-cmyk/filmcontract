/**
 * useCamera — Reusable camera hook for self-tape recording
 * Extracted from SelfTapeRecorder for reuse across the app.
 * © John dee page jr
 */
import { useState, useCallback, useRef } from "react";
import { Platform, Alert } from "react-native";

// ─── Types ──────────────────────────────────────────────────
export type CameraFacing = "front" | "back";
export type FlashMode = "off" | "on" | "auto";
export type QualityPreset = "720p" | "1080p" | "4k";
export type FilterPreset = "natural" | "studio" | "warm" | "cool";

export interface QualityConfig {
  label: string;
  resolution: string;
  bitrate: string;
  icon: string;
}

export const QUALITY_PRESETS: Record<QualityPreset, QualityConfig> = {
  "720p": { label: "Fast", resolution: "1280×720", bitrate: "3 Mbps", icon: "bolt.fill" },
  "1080p": { label: "Standard", resolution: "1920×1080", bitrate: "8 Mbps", icon: "sparkles" },
  "4k": { label: "Premium", resolution: "3840×2160", bitrate: "20 Mbps", icon: "star.fill" },
};

export const FILTER_PRESETS: { key: FilterPreset; label: string; description: string }[] = [
  { key: "natural", label: "Natural", description: "No adjustments" },
  { key: "studio", label: "Studio Light", description: "+2 exposure" },
  { key: "warm", label: "Warm", description: "Warm tones" },
  { key: "cool", label: "Cool", description: "Cool tones" },
];

export interface Take {
  id: string;
  uri: string;
  duration: number;
  timestamp: Date;
  starred: boolean;
}

export interface CameraState {
  facing: CameraFacing;
  flash: FlashMode;
  quality: QualityPreset;
  filter: FilterPreset;
  showGrid: boolean;
  isRecording: boolean;
  recordingDuration: number;
  takes: Take[];
  activeTakeIndex: number;
  audioLevel: number;
  countdown: number | null;
}

const initialState: CameraState = {
  facing: "front",
  flash: "off",
  quality: "1080p",
  filter: "natural",
  showGrid: true,
  isRecording: false,
  recordingDuration: 0,
  takes: [],
  activeTakeIndex: -1,
  audioLevel: 0,
  countdown: null,
};

// ─── Hook ───────────────────────────────────────────────────
export function useCamera(maxTakes = 5) {
  const [state, setState] = useState<CameraState>(initialState);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const update = useCallback((partial: Partial<CameraState>) => {
    setState((prev) => ({ ...prev, ...partial }));
  }, []);

  const toggleFacing = useCallback(() => {
    setState((prev) => ({ ...prev, facing: prev.facing === "front" ? "back" : "front" }));
  }, []);

  const cycleFlash = useCallback(() => {
    setState((prev) => {
      const modes: FlashMode[] = ["off", "on", "auto"];
      const idx = modes.indexOf(prev.flash);
      return { ...prev, flash: modes[(idx + 1) % modes.length] };
    });
  }, []);

  const setQuality = useCallback((quality: QualityPreset) => {
    update({ quality });
  }, [update]);

  const setFilter = useCallback((filter: FilterPreset) => {
    update({ filter });
  }, [update]);

  const toggleGrid = useCallback(() => {
    setState((prev) => ({ ...prev, showGrid: !prev.showGrid }));
  }, []);

  const startCountdown = useCallback((onComplete: () => void) => {
    let count = 3;
    update({ countdown: count });
    countdownTimerRef.current = setInterval(() => {
      count -= 1;
      if (count <= 0) {
        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
        update({ countdown: null });
        onComplete();
      } else {
        update({ countdown: count });
      }
    }, 1000);
  }, [update]);

  const startRecording = useCallback((maxDuration?: number) => {
    if (state.takes.length >= maxTakes) {
      Alert.alert("Max Takes", `You've reached the maximum of ${maxTakes} takes. Delete one to record again.`);
      return;
    }

    update({ isRecording: true, recordingDuration: 0 });

    recordingTimerRef.current = setInterval(() => {
      setState((prev) => {
        const newDuration = prev.recordingDuration + 1;
        if (maxDuration && newDuration >= maxDuration) {
          if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
          return { ...prev, recordingDuration: newDuration, isRecording: false };
        }
        return { ...prev, recordingDuration: newDuration };
      });
    }, 1000);
  }, [state.takes.length, maxTakes, update]);

  const stopRecording = useCallback((videoUri?: string) => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);

    const newTake: Take = {
      id: Math.random().toString(36).slice(2, 10),
      uri: videoUri || `file://take_${Date.now()}.mp4`,
      duration: state.recordingDuration,
      timestamp: new Date(),
      starred: state.takes.length === 0, // Star first take by default
    };

    setState((prev) => ({
      ...prev,
      isRecording: false,
      takes: [...prev.takes, newTake],
      activeTakeIndex: prev.takes.length,
    }));

    return newTake;
  }, [state.recordingDuration, state.takes.length]);

  const starTake = useCallback((takeId: string) => {
    setState((prev) => ({
      ...prev,
      takes: prev.takes.map((t) => ({ ...t, starred: t.id === takeId })),
    }));
  }, []);

  const deleteTake = useCallback((takeId: string) => {
    setState((prev) => {
      const newTakes = prev.takes.filter((t) => t.id !== takeId);
      const newIndex = Math.min(prev.activeTakeIndex, newTakes.length - 1);
      return { ...prev, takes: newTakes, activeTakeIndex: Math.max(newIndex, 0) };
    });
  }, []);

  const setActiveTake = useCallback((index: number) => {
    update({ activeTakeIndex: index });
  }, [update]);

  const getStarredTake = useCallback((): Take | undefined => {
    return state.takes.find((t) => t.starred) || state.takes[0];
  }, [state.takes]);

  const simulateAudioLevel = useCallback(() => {
    // Simulates audio metering for UI display
    const level = Math.random() * 0.7 + 0.1;
    update({ audioLevel: level });
  }, [update]);

  const reset = useCallback(() => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    setState(initialState);
  }, []);

  const formatDuration = useCallback((seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }, []);

  return {
    state,
    toggleFacing,
    cycleFlash,
    setQuality,
    setFilter,
    toggleGrid,
    startCountdown,
    startRecording,
    stopRecording,
    starTake,
    deleteTake,
    setActiveTake,
    getStarredTake,
    simulateAudioLevel,
    reset,
    formatDuration,
  };
}
