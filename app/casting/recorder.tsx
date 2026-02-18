import {
  View, Text, TouchableOpacity, StyleSheet, Alert, Platform,
  Dimensions, TextInput, ScrollView, Modal, ActivityIndicator,
} from "react-native";
import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { router, useLocalSearchParams } from "expo-router";
import { useAuth } from "@/hooks/use-auth";
import { Spacing, Radius, Typography } from "@/constants/design-tokens";
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withRepeat, withSequence,
  runOnJS, Easing,
} from "react-native-reanimated";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const PREVIEW_RATIO = 16 / 9;
const PREVIEW_H = Math.min(SCREEN_H * 0.65, SCREEN_W * PREVIEW_RATIO);

// ─── Types ──────────────────────────────────────────────────
type QualityPreset = "720p" | "1080p" | "4k";
type FilterMode = "natural" | "studio" | "warm" | "cool";

interface Take {
  id: number;
  uri: string;
  duration: number;
  starred: boolean;
  timestamp: number;
}

const QUALITY_PRESETS: Record<QualityPreset, { label: string; resolution: string; bitrate: string; icon: string }> = {
  "720p": { label: "Fast", resolution: "1280×720", bitrate: "3 Mbps", icon: "speedometer" },
  "1080p": { label: "Standard", resolution: "1920×1080", bitrate: "8 Mbps", icon: "aspectratio" },
  "4k": { label: "Premium", resolution: "3840×2160", bitrate: "20 Mbps", icon: "sparkles" },
};

const FILTER_MODES: { key: FilterMode; label: string; desc: string }[] = [
  { key: "natural", label: "Natural", desc: "No adjustments" },
  { key: "studio", label: "Studio Light", desc: "+2 exposure" },
  { key: "warm", label: "Warm", desc: "Warm tones" },
  { key: "cool", label: "Cool", desc: "Cool tones" },
];

const DURATION_OPTIONS = [
  { value: 30, label: "30s" },
  { value: 60, label: "1 min" },
  { value: 120, label: "2 min" },
  { value: 300, label: "5 min" },
];

// ─── Component ──────────────────────────────────────────────
export default function SelfTapeRecorderScreen() {
  const { castingId, maxDuration: maxDurParam } = useLocalSearchParams<{ castingId: string; maxDuration?: string }>();
  const { user } = useAuth();
  const colors = useColors();

  // Camera state
  const [facing, setFacing] = useState<"front" | "back">("front");
  const [flashOn, setFlashOn] = useState(false);
  const [gridOn, setGridOn] = useState(false);
  const [quality, setQuality] = useState<QualityPreset>("1080p");
  const [filter, setFilter] = useState<FilterMode>("natural");
  const [showSettings, setShowSettings] = useState(false);

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [maxDuration, setMaxDuration] = useState(parseInt(maxDurParam || "300", 10));
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Takes
  const [takes, setTakes] = useState<Take[]>([]);
  const [activeTakeIndex, setActiveTakeIndex] = useState(-1);
  const takeCounter = useRef(0);

  // Teleprompter
  const [teleprompterText, setTeleprompterText] = useState("");
  const [showTeleprompter, setShowTeleprompter] = useState(false);
  const [teleprompterSpeed, setTeleprompterSpeed] = useState(5);
  const [teleprompterMirrored, setTeleprompterMirrored] = useState(false);
  const [showTeleprompterSetup, setShowTeleprompterSetup] = useState(false);

  // Audio level (simulated for UI)
  const audioLevel = useSharedValue(0);

  // Animations
  const recordPulse = useSharedValue(1);
  const countdownScale = useSharedValue(0);

  // ─── Recording Timer ──────────────────────────────────────
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => {
        setElapsed((prev) => {
          const next = prev + 1;
          if (next >= maxDuration - 10 && next === maxDuration - 10) {
            // 10 second warning
            Alert.alert("Warning", "10 seconds remaining!");
          }
          if (next >= maxDuration) {
            stopRecording();
            return maxDuration;
          }
          return next;
        });
        // Simulate audio levels
        audioLevel.value = withTiming(Math.random() * 0.8 + 0.1, { duration: 100 });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording, isPaused, maxDuration]);

  // Record pulse animation
  useEffect(() => {
    if (isRecording) {
      recordPulse.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 600, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      );
    } else {
      recordPulse.value = withTiming(1, { duration: 200 });
    }
  }, [isRecording]);

  const recordPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: recordPulse.value }],
  }));

  // ─── Countdown ────────────────────────────────────────────
  const startCountdown = useCallback(() => {
    setCountdown(3);
    let count = 3;
    const interval = setInterval(() => {
      count--;
      if (count <= 0) {
        clearInterval(interval);
        setCountdown(null);
        startRecordingActual();
      } else {
        setCountdown(count);
      }
    }, 1000);
  }, []);

  // ─── Recording Controls ───────────────────────────────────
  const startRecordingActual = useCallback(() => {
    setIsRecording(true);
    setIsPaused(false);
    setElapsed(0);
  }, []);

  const stopRecording = useCallback(() => {
    setIsRecording(false);
    setIsPaused(false);
    // Save take
    takeCounter.current++;
    const newTake: Take = {
      id: takeCounter.current,
      uri: `take_${takeCounter.current}_${Date.now()}.mp4`,
      duration: elapsed,
      starred: takes.length === 0, // First take is auto-starred
      timestamp: Date.now(),
    };
    setTakes((prev) => [...prev, newTake]);
    setActiveTakeIndex(takes.length);
    setElapsed(0);
  }, [elapsed, takes]);

  const togglePause = useCallback(() => {
    setIsPaused((prev) => !prev);
  }, []);

  const handleRecordPress = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else if (takes.length >= 5) {
      Alert.alert("Max Takes", "You've reached the 5-take limit. Delete a take to record another.");
    } else {
      startCountdown();
    }
  }, [isRecording, takes.length, startCountdown, stopRecording]);

  // ─── Take Management ──────────────────────────────────────
  const starTake = useCallback((id: number) => {
    setTakes((prev) => prev.map((t) => ({ ...t, starred: t.id === id })));
  }, []);

  const deleteTake = useCallback((id: number) => {
    Alert.alert("Delete Take", "Are you sure you want to delete this take?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          setTakes((prev) => {
            const filtered = prev.filter((t) => t.id !== id);
            if (filtered.length > 0 && !filtered.some((t) => t.starred)) {
              filtered[0].starred = true;
            }
            return filtered;
          });
          setActiveTakeIndex((prev) => Math.max(0, prev - 1));
        },
      },
    ]);
  }, []);

  // ─── Proceed to Editor ────────────────────────────────────
  const proceedToEditor = useCallback(() => {
    const starredTake = takes.find((t) => t.starred);
    if (!starredTake) {
      Alert.alert("No Take Selected", "Please star your best take before continuing.");
      return;
    }
    router.push({
      pathname: "/casting/editor" as any,
      params: {
        castingId,
        videoUri: starredTake.uri,
        duration: String(starredTake.duration),
        quality,
      },
    });
  }, [takes, castingId, quality]);

  // ─── Format Time ──────────────────────────────────────────
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const remainingTime = maxDuration - elapsed;
  const progressPct = (elapsed / maxDuration) * 100;

  // ─── Audio Level Bar ──────────────────────────────────────
  const audioLevelStyle = useAnimatedStyle(() => ({
    width: `${audioLevel.value * 100}%`,
  }));

  // ─── Filter Overlay Color ─────────────────────────────────
  const filterOverlay = useMemo(() => {
    switch (filter) {
      case "studio": return "rgba(255,248,220,0.08)";
      case "warm": return "rgba(255,180,100,0.1)";
      case "cool": return "rgba(100,180,255,0.1)";
      default: return "transparent";
    }
  }, [filter]);

  return (
    <View style={styles.root}>
      {/* ─── Camera Preview Area ─────────────────────────── */}
      <View style={[styles.cameraPreview, { backgroundColor: "#000" }]}>
        {/* Simulated camera view */}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: "#1a1a2e" }]}>
          <View style={[styles.cameraPlaceholder]}>
            <IconSymbol name="camera.fill" size={48} color="rgba(255,255,255,0.3)" />
            <Text style={styles.cameraPlaceholderText}>Camera Preview</Text>
            <Text style={styles.cameraPlaceholderSub}>{QUALITY_PRESETS[quality].resolution} · {QUALITY_PRESETS[quality].bitrate}</Text>
          </View>
        </View>

        {/* Filter overlay */}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: filterOverlay }]} pointerEvents="none" />

        {/* Grid overlay */}
        {gridOn && (
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <View style={[styles.gridLine, styles.gridH1]} />
            <View style={[styles.gridLine, styles.gridH2]} />
            <View style={[styles.gridLine, styles.gridV1]} />
            <View style={[styles.gridLine, styles.gridV2]} />
          </View>
        )}

        {/* ─── Top Bar ───────────────────────────────────── */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.topBtn}>
            <IconSymbol name="xmark" size={22} color="#fff" />
          </TouchableOpacity>

          <View style={styles.topCenter}>
            {isRecording && (
              <View style={styles.recordingIndicator}>
                <View style={[styles.recordDot, remainingTime <= 10 && { backgroundColor: "#FF3B30" }]} />
                <Text style={styles.recordTimeText}>{formatTime(elapsed)}</Text>
                <Text style={styles.recordTimeSep}>/</Text>
                <Text style={[styles.recordTimeText, { opacity: 0.6 }]}>{formatTime(maxDuration)}</Text>
              </View>
            )}
          </View>

          <View style={styles.topRight}>
            <TouchableOpacity onPress={() => setFlashOn(!flashOn)} style={styles.topBtn}>
              <IconSymbol name={flashOn ? "flashlight.on.fill" : "flashlight.off.fill"} size={20} color={flashOn ? "#FFD60A" : "#fff"} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setGridOn(!gridOn)} style={styles.topBtn}>
              <IconSymbol name="grid" size={20} color={gridOn ? "#30D158" : "#fff"} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowSettings(true)} style={styles.topBtn}>
              <IconSymbol name="gearshape.fill" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── Teleprompter Overlay ──────────────────────── */}
        {showTeleprompter && teleprompterText.length > 0 && (
          <View style={[styles.teleprompterOverlay, teleprompterMirrored && { transform: [{ scaleX: -1 }] }]}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.teleprompterContent}
            >
              <Text style={[styles.teleprompterText, { fontSize: 16 + teleprompterSpeed }]}>
                {teleprompterText}
              </Text>
            </ScrollView>
            <View style={styles.teleprompterFade} />
          </View>
        )}

        {/* ─── Audio Level Meter ─────────────────────────── */}
        {isRecording && (
          <View style={styles.audioMeter}>
            <IconSymbol name="mic.fill" size={14} color="#30D158" />
            <View style={styles.audioMeterTrack}>
              <Animated.View style={[styles.audioMeterFill, audioLevelStyle]} />
            </View>
          </View>
        )}

        {/* ─── Duration Progress Bar ─────────────────────── */}
        {isRecording && (
          <View style={styles.durationBar}>
            <View style={[styles.durationFill, { width: `${progressPct}%`, backgroundColor: remainingTime <= 10 ? "#FF3B30" : "#30D158" }]} />
          </View>
        )}

        {/* ─── Countdown Overlay ─────────────────────────── */}
        {countdown !== null && (
          <View style={styles.countdownOverlay}>
            <View style={styles.countdownCircle}>
              <Text style={styles.countdownText}>{countdown}</Text>
            </View>
          </View>
        )}
      </View>

      {/* ─── Controls Area ───────────────────────────────── */}
      <View style={[styles.controlsArea, { backgroundColor: colors.background }]}>
        {/* Filter strip */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterStrip}>
          {FILTER_MODES.map((f) => (
            <TouchableOpacity
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={[styles.filterChip, filter === f.key && { backgroundColor: colors.primary + "20", borderColor: colors.primary }]}
            >
              <Text style={[styles.filterChipText, { color: filter === f.key ? colors.primary : colors.muted }]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            onPress={() => setShowTeleprompterSetup(true)}
            style={[styles.filterChip, showTeleprompter && { backgroundColor: "#FFD60A20", borderColor: "#FFD60A" }]}
          >
            <IconSymbol name="text.alignleft" size={14} color={showTeleprompter ? "#FFD60A" : colors.muted} />
            <Text style={[styles.filterChipText, { color: showTeleprompter ? "#FFD60A" : colors.muted }]}>Teleprompter</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Main controls row */}
        <View style={styles.mainControls}>
          {/* Camera flip */}
          <TouchableOpacity
            onPress={() => setFacing(facing === "front" ? "back" : "front")}
            style={styles.sideBtn}
            disabled={isRecording}
          >
            <IconSymbol name="arrow.triangle.2.circlepath.camera" size={28} color={isRecording ? colors.muted : "#fff"} />
            <Text style={[styles.sideBtnLabel, { color: colors.muted }]}>Flip</Text>
          </TouchableOpacity>

          {/* Record button */}
          <View style={styles.recordBtnContainer}>
            <Animated.View style={[styles.recordBtnOuter, recordPulseStyle]}>
              <TouchableOpacity
                onPress={handleRecordPress}
                style={[styles.recordBtn, isRecording && styles.recordBtnActive]}
                activeOpacity={0.7}
              >
                {isRecording ? (
                  <View style={styles.stopSquare} />
                ) : (
                  <View style={styles.recordCircle} />
                )}
              </TouchableOpacity>
            </Animated.View>
            <Text style={[styles.recordLabel, { color: colors.muted }]}>
              {isRecording ? "STOP" : countdown !== null ? "GET READY" : "RECORD"}
            </Text>
          </View>

          {/* Pause (during recording) or Takes count */}
          {isRecording ? (
            <TouchableOpacity onPress={togglePause} style={styles.sideBtn}>
              <IconSymbol name={isPaused ? "play.fill" : "pause.fill"} size={28} color="#FFD60A" />
              <Text style={[styles.sideBtnLabel, { color: colors.muted }]}>{isPaused ? "Resume" : "Pause"}</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.sideBtn}>
              <View style={[styles.takesCounter, { backgroundColor: colors.surface }]}>
                <Text style={[styles.takesCountText, { color: colors.foreground }]}>{takes.length}/5</Text>
              </View>
              <Text style={[styles.sideBtnLabel, { color: colors.muted }]}>Takes</Text>
            </View>
          )}
        </View>

        {/* Takes strip */}
        {takes.length > 0 && !isRecording && (
          <View style={styles.takesSection}>
            <View style={styles.takesSectionHeader}>
              <Text style={[styles.takesSectionTitle, { color: colors.foreground }]}>Takes</Text>
              {takes.length > 0 && (
                <TouchableOpacity onPress={proceedToEditor} style={[styles.continueBtn, { backgroundColor: colors.primary }]}>
                  <Text style={styles.continueBtnText}>Continue to Editor</Text>
                  <IconSymbol name="arrow.right" size={16} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.takesStrip}>
              {takes.map((take, idx) => (
                <View key={take.id} style={[styles.takeCard, { backgroundColor: colors.surface, borderColor: take.starred ? colors.primary : colors.border }]}>
                  <View style={styles.takeCardTop}>
                    <View style={[styles.takeThumb, { backgroundColor: "#1a1a2e" }]}>
                      <IconSymbol name="film" size={20} color="rgba(255,255,255,0.5)" />
                    </View>
                    <View style={styles.takeInfo}>
                      <Text style={[styles.takeName, { color: colors.foreground }]}>Take {idx + 1}</Text>
                      <Text style={[styles.takeDuration, { color: colors.muted }]}>{formatTime(take.duration)}</Text>
                    </View>
                  </View>
                  <View style={styles.takeActions}>
                    <TouchableOpacity onPress={() => starTake(take.id)} style={styles.takeActionBtn}>
                      <IconSymbol name={take.starred ? "star.fill" : "star"} size={18} color={take.starred ? "#FFD60A" : colors.muted} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deleteTake(take.id)} style={styles.takeActionBtn}>
                      <IconSymbol name="trash" size={16} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                  {take.starred && (
                    <View style={[styles.starredBadge, { backgroundColor: colors.primary }]}>
                      <Text style={styles.starredBadgeText}>BEST</Text>
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {/* ─── Settings Modal ──────────────────────────────── */}
      <Modal visible={showSettings} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>Recording Settings</Text>
              <TouchableOpacity onPress={() => setShowSettings(false)} style={styles.modalClose}>
                <IconSymbol name="xmark" size={20} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            {/* Quality Presets */}
            <Text style={[styles.settingLabel, { color: colors.foreground }]}>Video Quality</Text>
            <View style={styles.qualityRow}>
              {(Object.entries(QUALITY_PRESETS) as [QualityPreset, typeof QUALITY_PRESETS["720p"]][]).map(([key, preset]) => (
                <TouchableOpacity
                  key={key}
                  onPress={() => setQuality(key)}
                  style={[styles.qualityCard, { backgroundColor: colors.surface, borderColor: quality === key ? colors.primary : colors.border }]}
                >
                  <Text style={[styles.qualityTitle, { color: quality === key ? colors.primary : colors.foreground }]}>{key}</Text>
                  <Text style={[styles.qualityDesc, { color: colors.muted }]}>{preset.label}</Text>
                  <Text style={[styles.qualityBitrate, { color: colors.muted }]}>{preset.bitrate}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Duration Limit */}
            <Text style={[styles.settingLabel, { color: colors.foreground, marginTop: 20 }]}>Max Duration</Text>
            <View style={styles.durationRow}>
              {DURATION_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => setMaxDuration(opt.value)}
                  style={[styles.durationChip, { backgroundColor: maxDuration === opt.value ? colors.primary : colors.surface, borderColor: colors.border }]}
                >
                  <Text style={[styles.durationChipText, { color: maxDuration === opt.value ? "#fff" : colors.foreground }]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Camera Facing */}
            <Text style={[styles.settingLabel, { color: colors.foreground, marginTop: 20 }]}>Camera</Text>
            <View style={styles.durationRow}>
              <TouchableOpacity
                onPress={() => setFacing("front")}
                style={[styles.durationChip, { backgroundColor: facing === "front" ? colors.primary : colors.surface, borderColor: colors.border, flex: 1 }]}
              >
                <Text style={[styles.durationChipText, { color: facing === "front" ? "#fff" : colors.foreground }]}>Front</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setFacing("back")}
                style={[styles.durationChip, { backgroundColor: facing === "back" ? colors.primary : colors.surface, borderColor: colors.border, flex: 1 }]}
              >
                <Text style={[styles.durationChipText, { color: facing === "back" ? "#fff" : colors.foreground }]}>Back</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── Teleprompter Setup Modal ────────────────────── */}
      <Modal visible={showTeleprompterSetup} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background, maxHeight: SCREEN_H * 0.7 }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>Teleprompter</Text>
              <TouchableOpacity onPress={() => setShowTeleprompterSetup(false)} style={styles.modalClose}>
                <IconSymbol name="xmark" size={20} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.settingLabel, { color: colors.foreground }]}>Paste Your Sides / Script</Text>
            <TextInput
              style={[styles.scriptInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]}
              value={teleprompterText}
              onChangeText={setTeleprompterText}
              placeholder="Paste your script or sides here..."
              placeholderTextColor={colors.muted}
              multiline
              textAlignVertical="top"
            />

            <Text style={[styles.settingLabel, { color: colors.foreground, marginTop: 16 }]}>Scroll Speed: {teleprompterSpeed}</Text>
            <View style={styles.speedRow}>
              {[1, 3, 5, 7, 10].map((spd) => (
                <TouchableOpacity
                  key={spd}
                  onPress={() => setTeleprompterSpeed(spd)}
                  style={[styles.durationChip, { backgroundColor: teleprompterSpeed === spd ? colors.primary : colors.surface, borderColor: colors.border }]}
                >
                  <Text style={[styles.durationChipText, { color: teleprompterSpeed === spd ? "#fff" : colors.foreground }]}>{spd}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              onPress={() => setTeleprompterMirrored(!teleprompterMirrored)}
              style={[styles.mirrorToggle, { backgroundColor: teleprompterMirrored ? colors.primary + "20" : colors.surface, borderColor: teleprompterMirrored ? colors.primary : colors.border }]}
            >
              <IconSymbol name="arrow.triangle.2.circlepath.camera" size={18} color={teleprompterMirrored ? colors.primary : colors.muted} />
              <Text style={[styles.mirrorToggleText, { color: teleprompterMirrored ? colors.primary : colors.foreground }]}>Mirror Text (for self-tape setup)</Text>
            </TouchableOpacity>

            <View style={styles.teleprompterActions}>
              <TouchableOpacity
                onPress={() => { setShowTeleprompter(true); setShowTeleprompterSetup(false); }}
                style={[styles.enableBtn, { backgroundColor: colors.primary }]}
                disabled={teleprompterText.length === 0}
              >
                <Text style={styles.enableBtnText}>Enable Teleprompter</Text>
              </TouchableOpacity>
              {showTeleprompter && (
                <TouchableOpacity
                  onPress={() => { setShowTeleprompter(false); setShowTeleprompterSetup(false); }}
                  style={[styles.disableBtn, { borderColor: colors.error }]}
                >
                  <Text style={[styles.disableBtnText, { color: colors.error }]}>Disable</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  cameraPreview: { width: SCREEN_W, height: PREVIEW_H, position: "relative" },
  cameraPlaceholder: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  cameraPlaceholderText: { color: "rgba(255,255,255,0.5)", fontSize: 16, fontWeight: "600" },
  cameraPlaceholderSub: { color: "rgba(255,255,255,0.3)", fontSize: 12 },

  // Grid
  gridLine: { position: "absolute", backgroundColor: "rgba(255,255,255,0.2)" },
  gridH1: { left: 0, right: 0, top: "33.33%", height: 0.5 },
  gridH2: { left: 0, right: 0, top: "66.66%", height: 0.5 },
  gridV1: { top: 0, bottom: 0, left: "33.33%", width: 0.5 },
  gridV2: { top: 0, bottom: 0, left: "66.66%", width: 0.5 },

  // Top bar
  topBar: { position: "absolute", top: 0, left: 0, right: 0, flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingTop: Platform.OS === "ios" ? 50 : 12, paddingBottom: 8, zIndex: 10 },
  topBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center" },
  topCenter: { flex: 1, alignItems: "center" },
  topRight: { flexDirection: "row", gap: 8 },
  recordingIndicator: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(0,0,0,0.6)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  recordDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#FF3B30" },
  recordTimeText: { color: "#fff", fontSize: 16, fontWeight: "700", fontVariant: ["tabular-nums"] },
  recordTimeSep: { color: "rgba(255,255,255,0.4)", fontSize: 14 },

  // Teleprompter
  teleprompterOverlay: { position: "absolute", top: 80, left: 16, right: 16, height: PREVIEW_H * 0.35, backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 12, overflow: "hidden", zIndex: 5 },
  teleprompterContent: { padding: 16 },
  teleprompterText: { color: "#FFD60A", fontWeight: "500", lineHeight: 28 },
  teleprompterFade: { position: "absolute", bottom: 0, left: 0, right: 0, height: 40, backgroundColor: "rgba(0,0,0,0.5)" },

  // Audio meter
  audioMeter: { position: "absolute", bottom: 50, left: 16, right: 16, flexDirection: "row", alignItems: "center", gap: 8, zIndex: 5 },
  audioMeterTrack: { flex: 1, height: 4, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 2, overflow: "hidden" },
  audioMeterFill: { height: "100%", backgroundColor: "#30D158", borderRadius: 2 },

  // Duration bar
  durationBar: { position: "absolute", bottom: 0, left: 0, right: 0, height: 3, backgroundColor: "rgba(255,255,255,0.1)" },
  durationFill: { height: "100%", borderRadius: 1.5 },

  // Countdown
  countdownOverlay: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.6)", zIndex: 20 },
  countdownCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: "#fff" },
  countdownText: { color: "#fff", fontSize: 64, fontWeight: "800" },

  // Controls
  controlsArea: { flex: 1, paddingTop: 8 },
  filterStrip: { paddingHorizontal: 12, gap: 8, paddingBottom: 12 },
  filterChip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.15)" },
  filterChipText: { fontSize: 12, fontWeight: "600" },

  mainControls: { flexDirection: "row", alignItems: "center", justifyContent: "space-around", paddingVertical: 12, paddingHorizontal: 24 },
  sideBtn: { alignItems: "center", gap: 4, width: 60 },
  sideBtnLabel: { fontSize: 11, fontWeight: "500" },
  takesCounter: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  takesCountText: { fontSize: 16, fontWeight: "800" },

  recordBtnContainer: { alignItems: "center", gap: 6 },
  recordBtnOuter: { width: 76, height: 76, borderRadius: 38, borderWidth: 3, borderColor: "#fff", alignItems: "center", justifyContent: "center" },
  recordBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#FF3B30", alignItems: "center", justifyContent: "center" },
  recordBtnActive: { backgroundColor: "transparent" },
  recordCircle: { width: 54, height: 54, borderRadius: 27, backgroundColor: "#FF3B30" },
  stopSquare: { width: 28, height: 28, borderRadius: 6, backgroundColor: "#FF3B30" },
  recordLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1 },

  // Takes section
  takesSection: { paddingTop: 8 },
  takesSectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, marginBottom: 8 },
  takesSectionTitle: { fontSize: 16, fontWeight: "700" },
  continueBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  continueBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  takesStrip: { paddingHorizontal: 12, gap: 10, paddingBottom: 16 },
  takeCard: { width: 140, borderRadius: 12, padding: 10, borderWidth: 1.5, gap: 8, position: "relative" },
  takeCardTop: { flexDirection: "row", gap: 8, alignItems: "center" },
  takeThumb: { width: 40, height: 40, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  takeInfo: { flex: 1, gap: 2 },
  takeName: { fontSize: 13, fontWeight: "700" },
  takeDuration: { fontSize: 11 },
  takeActions: { flexDirection: "row", justifyContent: "space-between" },
  takeActionBtn: { padding: 4 },
  starredBadge: { position: "absolute", top: -6, right: -6, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  starredBadgeText: { color: "#fff", fontSize: 9, fontWeight: "800" },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: "800" },
  modalClose: { padding: 8 },
  settingLabel: { fontSize: 14, fontWeight: "700", marginBottom: 10 },

  qualityRow: { flexDirection: "row", gap: 10 },
  qualityCard: { flex: 1, padding: 12, borderRadius: 12, borderWidth: 1.5, alignItems: "center", gap: 4 },
  qualityTitle: { fontSize: 16, fontWeight: "800" },
  qualityDesc: { fontSize: 11, fontWeight: "600" },
  qualityBitrate: { fontSize: 10 },

  durationRow: { flexDirection: "row", gap: 8 },
  durationChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  durationChipText: { fontSize: 14, fontWeight: "600" },

  // Teleprompter setup
  scriptInput: { borderRadius: 12, borderWidth: 1, padding: 14, fontSize: 15, minHeight: 150, lineHeight: 22 },
  speedRow: { flexDirection: "row", gap: 8 },
  mirrorToggle: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderRadius: 12, borderWidth: 1, marginTop: 16 },
  mirrorToggleText: { fontSize: 14, fontWeight: "600" },
  teleprompterActions: { flexDirection: "row", gap: 10, marginTop: 20 },
  enableBtn: { flex: 1, alignItems: "center", paddingVertical: 14, borderRadius: 12 },
  enableBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  disableBtn: { paddingHorizontal: 20, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5 },
  disableBtnText: { fontSize: 14, fontWeight: "700" },
});
