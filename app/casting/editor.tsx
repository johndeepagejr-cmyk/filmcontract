import {
  View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView,
  Dimensions, TextInput, Modal, Platform, ActivityIndicator,
} from "react-native";
import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { router, useLocalSearchParams } from "expo-router";
import { useAuth } from "@/hooks/use-auth";
import { Spacing, Radius, Typography } from "@/constants/design-tokens";
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, Easing,
  runOnJS,
} from "react-native-reanimated";

const { width: SCREEN_W } = Dimensions.get("window");
const TIMELINE_W = SCREEN_W - 32;
const PREVIEW_H = (SCREEN_W * 9) / 16;

// ─── Types ──────────────────────────────────────────────────
type EditorTab = "trim" | "slate" | "enhance" | "export";

interface TrimState {
  startPct: number; // 0-1
  endPct: number;   // 0-1
}

interface SlateConfig {
  name: string;
  height: string;
  location: string;
  agency: string;
  contact: string;
  duration: 3 | 5 | 10;
  fontColor: string;
  bgColor: string;
  position: "top" | "center" | "bottom";
}

interface EnhanceSettings {
  autoLevels: boolean;
  noiseReduction: boolean;
  volumeNormalize: boolean;
  skinSmoothing: boolean;
}

interface ExportSettings {
  targetSize: 25 | 50 | 100;
  resolution: "720p" | "1080p";
}

// ─── Undo/Redo Stack ────────────────────────────────────────
interface EditorState {
  trim: TrimState;
  slate: SlateConfig;
  enhance: EnhanceSettings;
}

const TAB_CONFIG: { key: EditorTab; label: string; icon: string }[] = [
  { key: "trim", label: "Trim", icon: "scissors" },
  { key: "slate", label: "Slate", icon: "text.alignleft" },
  { key: "enhance", label: "Enhance", icon: "wand.and.stars" },
  { key: "export", label: "Export", icon: "square.and.arrow.down" },
];

const FONT_COLORS = ["#FFFFFF", "#FFD60A", "#30D158", "#0A84FF", "#FF453A"];
const BG_COLORS = ["#000000", "#1a1a2e", "#0d1b2a", "#2d1b69", "#1b3a2d"];

// ─── Component ──────────────────────────────────────────────
export default function SelfTapeEditorScreen() {
  const { castingId, videoUri, duration: durParam, quality } = useLocalSearchParams<{
    castingId: string; videoUri: string; duration?: string; quality?: string;
  }>();
  const { user } = useAuth();
  const colors = useColors();
  const videoDuration = parseInt(durParam || "120", 10);

  const [activeTab, setActiveTab] = useState<EditorTab>("trim");
  const [isPlaying, setIsPlaying] = useState(false);
  const [playheadPct, setPlayheadPct] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Trim
  const [trim, setTrim] = useState<TrimState>({ startPct: 0, endPct: 1 });

  // Slate
  const [slate, setSlate] = useState<SlateConfig>({
    name: user?.name || "",
    height: "",
    location: "",
    agency: "",
    contact: user?.email || "",
    duration: 5,
    fontColor: "#FFFFFF",
    bgColor: "#000000",
    position: "center",
  });

  // Enhance
  const [enhance, setEnhance] = useState<EnhanceSettings>({
    autoLevels: false,
    noiseReduction: false,
    volumeNormalize: true,
    skinSmoothing: false,
  });

  // Export
  const [exportSettings, setExportSettings] = useState<ExportSettings>({
    targetSize: 50,
    resolution: "1080p",
  });

  // Undo/Redo
  const [undoStack, setUndoStack] = useState<EditorState[]>([]);
  const [redoStack, setRedoStack] = useState<EditorState[]>([]);

  const saveState = useCallback(() => {
    setUndoStack((prev) => [...prev.slice(-20), { trim, slate, enhance }]);
    setRedoStack([]);
  }, [trim, slate, enhance]);

  const undo = useCallback(() => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setRedoStack((r) => [...r, { trim, slate, enhance }]);
    setTrim(prev.trim);
    setSlate(prev.slate);
    setEnhance(prev.enhance);
    setUndoStack((s) => s.slice(0, -1));
  }, [undoStack, trim, slate, enhance]);

  const redo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack((s) => [...s, { trim, slate, enhance }]);
    setTrim(next.trim);
    setSlate(next.slate);
    setEnhance(next.enhance);
    setRedoStack((r) => r.slice(0, -1));
  }, [redoStack, trim, slate, enhance]);

  // ─── Playback Simulation ──────────────────────────────────
  const playTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isPlaying) {
      playTimer.current = setInterval(() => {
        setPlayheadPct((prev) => {
          const next = prev + (1 / (videoDuration * 10));
          if (next >= trim.endPct) {
            setIsPlaying(false);
            return trim.endPct;
          }
          return next;
        });
      }, 100);
    } else if (playTimer.current) {
      clearInterval(playTimer.current);
    }
    return () => { if (playTimer.current) clearInterval(playTimer.current); };
  }, [isPlaying, trim.endPct, videoDuration]);

  const togglePlay = useCallback(() => {
    if (!isPlaying && playheadPct >= trim.endPct) {
      setPlayheadPct(trim.startPct);
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, playheadPct, trim]);

  // ─── Computed Values ──────────────────────────────────────
  const trimmedDuration = useMemo(() => {
    return Math.round(videoDuration * (trim.endPct - trim.startPct));
  }, [videoDuration, trim]);

  const totalDuration = useMemo(() => {
    return trimmedDuration + slate.duration;
  }, [trimmedDuration, slate.duration]);

  const estimatedSize = useMemo(() => {
    const bitrateMap = { "720p": 3, "1080p": 8 };
    const bitrate = bitrateMap[exportSettings.resolution];
    const rawMB = (totalDuration * bitrate) / 8;
    return Math.min(rawMB, exportSettings.targetSize);
  }, [totalDuration, exportSettings]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // ─── Process & Continue ───────────────────────────────────
  const processAndContinue = useCallback(() => {
    setIsProcessing(true);
    // Simulate processing time
    setTimeout(() => {
      setIsProcessing(false);
      router.push({
        pathname: "/casting/upload" as any,
        params: {
          castingId,
          videoUri: videoUri || "processed_video.mp4",
          duration: String(totalDuration),
          fileSize: String(Math.round(estimatedSize)),
          quality: exportSettings.resolution,
          slateName: slate.name,
          slateHeight: slate.height,
          slateLocation: slate.location,
          slateAgency: slate.agency,
        },
      });
    }, 2000);
  }, [castingId, videoUri, totalDuration, estimatedSize, exportSettings, slate]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* ─── Video Preview ───────────────────────────────── */}
      <View style={[styles.preview, { backgroundColor: "#000" }]}>
        {/* Simulated video */}
        <View style={styles.videoPlaceholder}>
          <IconSymbol name="film" size={40} color="rgba(255,255,255,0.3)" />
          <Text style={styles.videoPlaceholderText}>Video Preview</Text>
          {quality && <Text style={styles.videoPlaceholderSub}>{quality}</Text>}
        </View>

        {/* Slate preview overlay */}
        {activeTab === "slate" && (
          <View style={[
            styles.slatePreview,
            { backgroundColor: slate.bgColor + "CC" },
            slate.position === "top" && { top: 0, bottom: undefined, height: 80 },
            slate.position === "center" && { top: "30%", bottom: undefined, height: 100 },
            slate.position === "bottom" && { bottom: 0, top: undefined, height: 80 },
          ]}>
            <Text style={[styles.slateName, { color: slate.fontColor }]}>{slate.name || "Your Name"}</Text>
            <Text style={[styles.slateDetails, { color: slate.fontColor + "CC" }]}>
              {[slate.height, slate.location, slate.agency].filter(Boolean).join(" · ") || "Height · Location · Agency"}
            </Text>
          </View>
        )}

        {/* Enhance indicator */}
        {activeTab === "enhance" && (enhance.autoLevels || enhance.noiseReduction || enhance.volumeNormalize || enhance.skinSmoothing) && (
          <View style={styles.enhanceIndicator}>
            <IconSymbol name="wand.and.stars" size={14} color="#FFD60A" />
            <Text style={styles.enhanceIndicatorText}>Enhanced</Text>
          </View>
        )}

        {/* Play/Pause overlay */}
        <TouchableOpacity onPress={togglePlay} style={styles.playOverlay} activeOpacity={0.8}>
          {!isPlaying && (
            <View style={styles.playBtn}>
              <IconSymbol name="play.fill" size={32} color="#fff" />
            </View>
          )}
        </TouchableOpacity>

        {/* Time display */}
        <View style={styles.timeDisplay}>
          <Text style={styles.timeText}>{formatTime(Math.round(playheadPct * videoDuration))}</Text>
          <Text style={styles.timeSep}>/</Text>
          <Text style={[styles.timeText, { opacity: 0.6 }]}>{formatTime(trimmedDuration)}</Text>
        </View>
      </View>

      {/* ─── Timeline ────────────────────────────────────── */}
      <View style={styles.timelineContainer}>
        {/* Waveform background */}
        <View style={[styles.timeline, { backgroundColor: colors.surface }]}>
          {/* Trim region */}
          <View style={[styles.trimRegion, {
            left: `${trim.startPct * 100}%`,
            width: `${(trim.endPct - trim.startPct) * 100}%`,
            backgroundColor: colors.primary + "30",
          }]} />

          {/* Trim handles */}
          <TouchableOpacity
            style={[styles.trimHandle, styles.trimHandleLeft, { left: `${trim.startPct * 100}%`, backgroundColor: colors.primary }]}
            onPress={() => { saveState(); setTrim((t) => ({ ...t, startPct: Math.max(0, t.startPct - 0.05) })); }}
          >
            <View style={styles.trimHandleBar} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.trimHandle, styles.trimHandleRight, { left: `${trim.endPct * 100}%`, backgroundColor: colors.primary }]}
            onPress={() => { saveState(); setTrim((t) => ({ ...t, endPct: Math.min(1, t.endPct + 0.05) })); }}
          >
            <View style={styles.trimHandleBar} />
          </TouchableOpacity>

          {/* Playhead */}
          <View style={[styles.playhead, { left: `${playheadPct * 100}%`, backgroundColor: "#FF3B30" }]} />

          {/* Waveform bars */}
          {Array.from({ length: 50 }).map((_, i) => (
            <View
              key={i}
              style={[styles.waveBar, {
                left: `${(i / 50) * 100}%`,
                height: 4 + Math.random() * 20,
                backgroundColor: i / 50 >= trim.startPct && i / 50 <= trim.endPct
                  ? colors.primary + "60"
                  : colors.border,
              }]}
            />
          ))}
        </View>

        {/* Timeline labels */}
        <View style={styles.timelineLabels}>
          <Text style={[styles.timelineLabel, { color: colors.muted }]}>{formatTime(Math.round(trim.startPct * videoDuration))}</Text>
          <Text style={[styles.timelineLabel, { color: colors.primary, fontWeight: "700" }]}>
            {formatTime(trimmedDuration)} trimmed
          </Text>
          <Text style={[styles.timelineLabel, { color: colors.muted }]}>{formatTime(Math.round(trim.endPct * videoDuration))}</Text>
        </View>
      </View>

      {/* ─── Undo/Redo Bar ───────────────────────────────── */}
      <View style={styles.undoRedoBar}>
        <TouchableOpacity onPress={undo} disabled={undoStack.length === 0} style={[styles.undoBtn, undoStack.length === 0 && { opacity: 0.3 }]}>
          <IconSymbol name="arrow.uturn.backward" size={18} color={colors.foreground} />
          <Text style={[styles.undoBtnText, { color: colors.foreground }]}>Undo</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={redo} disabled={redoStack.length === 0} style={[styles.undoBtn, redoStack.length === 0 && { opacity: 0.3 }]}>
          <IconSymbol name="arrow.uturn.forward" size={18} color={colors.foreground} />
          <Text style={[styles.undoBtnText, { color: colors.foreground }]}>Redo</Text>
        </TouchableOpacity>
      </View>

      {/* ─── Tab Bar ─────────────────────────────────────── */}
      <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
        {TAB_CONFIG.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={[styles.tab, activeTab === tab.key && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          >
            <IconSymbol name={tab.icon as any} size={18} color={activeTab === tab.key ? colors.primary : colors.muted} />
            <Text style={[styles.tabLabel, { color: activeTab === tab.key ? colors.primary : colors.muted }]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ─── Tab Content ─────────────────────────────────── */}
      <ScrollView style={styles.tabContent} contentContainerStyle={styles.tabContentInner} showsVerticalScrollIndicator={false}>
        {/* TRIM TAB */}
        {activeTab === "trim" && (
          <View style={styles.tabPanel}>
            <Text style={[styles.panelTitle, { color: colors.foreground }]}>Trim Video</Text>
            <Text style={[styles.panelDesc, { color: colors.muted }]}>
              Drag the handles on the timeline above to set start and end points.
            </Text>

            <View style={styles.trimControls}>
              <View style={[styles.trimInput, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.trimInputLabel, { color: colors.muted }]}>Start</Text>
                <Text style={[styles.trimInputValue, { color: colors.foreground }]}>{formatTime(Math.round(trim.startPct * videoDuration))}</Text>
                <View style={styles.trimInputBtns}>
                  <TouchableOpacity onPress={() => { saveState(); setTrim((t) => ({ ...t, startPct: Math.max(0, t.startPct - 0.01) })); }}>
                    <IconSymbol name="backward.fill" size={16} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => { saveState(); setTrim((t) => ({ ...t, startPct: Math.min(t.endPct - 0.05, t.startPct + 0.01) })); }}>
                    <IconSymbol name="forward.fill" size={16} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={[styles.trimInput, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.trimInputLabel, { color: colors.muted }]}>End</Text>
                <Text style={[styles.trimInputValue, { color: colors.foreground }]}>{formatTime(Math.round(trim.endPct * videoDuration))}</Text>
                <View style={styles.trimInputBtns}>
                  <TouchableOpacity onPress={() => { saveState(); setTrim((t) => ({ ...t, endPct: Math.max(t.startPct + 0.05, t.endPct - 0.01) })); }}>
                    <IconSymbol name="backward.fill" size={16} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => { saveState(); setTrim((t) => ({ ...t, endPct: Math.min(1, t.endPct + 0.01) })); }}>
                    <IconSymbol name="forward.fill" size={16} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={[styles.trimSummary, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.trimSummaryRow}>
                <Text style={[styles.trimSummaryLabel, { color: colors.muted }]}>Original</Text>
                <Text style={[styles.trimSummaryValue, { color: colors.foreground }]}>{formatTime(videoDuration)}</Text>
              </View>
              <View style={styles.trimSummaryRow}>
                <Text style={[styles.trimSummaryLabel, { color: colors.muted }]}>Trimmed</Text>
                <Text style={[styles.trimSummaryValue, { color: colors.primary, fontWeight: "700" }]}>{formatTime(trimmedDuration)}</Text>
              </View>
              <View style={styles.trimSummaryRow}>
                <Text style={[styles.trimSummaryLabel, { color: colors.muted }]}>Removed</Text>
                <Text style={[styles.trimSummaryValue, { color: colors.error }]}>{formatTime(videoDuration - trimmedDuration)}</Text>
              </View>
            </View>
          </View>
        )}

        {/* SLATE TAB */}
        {activeTab === "slate" && (
          <View style={styles.tabPanel}>
            <Text style={[styles.panelTitle, { color: colors.foreground }]}>Slate Overlay</Text>
            <Text style={[styles.panelDesc, { color: colors.muted }]}>
              Auto-generated from your profile. Customize below.
            </Text>

            <View style={styles.slateForm}>
              <View style={styles.formRow}>
                <Text style={[styles.formLabel, { color: colors.foreground }]}>Name *</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]}
                  value={slate.name}
                  onChangeText={(v) => { saveState(); setSlate((s) => ({ ...s, name: v })); }}
                  placeholder="Your full name"
                  placeholderTextColor={colors.muted}
                />
              </View>
              <View style={styles.formRow}>
                <Text style={[styles.formLabel, { color: colors.foreground }]}>Height</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]}
                  value={slate.height}
                  onChangeText={(v) => setSlate((s) => ({ ...s, height: v }))}
                  placeholder={'5\'10"'}
                  placeholderTextColor={colors.muted}
                />
              </View>
              <View style={styles.formRow}>
                <Text style={[styles.formLabel, { color: colors.foreground }]}>Location</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]}
                  value={slate.location}
                  onChangeText={(v) => setSlate((s) => ({ ...s, location: v }))}
                  placeholder="Los Angeles, CA"
                  placeholderTextColor={colors.muted}
                />
              </View>
              <View style={styles.formRow}>
                <Text style={[styles.formLabel, { color: colors.foreground }]}>Agency</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]}
                  value={slate.agency}
                  onChangeText={(v) => setSlate((s) => ({ ...s, agency: v }))}
                  placeholder="Agency name"
                  placeholderTextColor={colors.muted}
                />
              </View>
            </View>

            {/* Slate duration */}
            <Text style={[styles.settingLabel, { color: colors.foreground }]}>Slate Duration</Text>
            <View style={styles.optionRow}>
              {([3, 5, 10] as const).map((d) => (
                <TouchableOpacity
                  key={d}
                  onPress={() => { saveState(); setSlate((s) => ({ ...s, duration: d })); }}
                  style={[styles.optionChip, { backgroundColor: slate.duration === d ? colors.primary : colors.surface, borderColor: colors.border }]}
                >
                  <Text style={[styles.optionChipText, { color: slate.duration === d ? "#fff" : colors.foreground }]}>{d}s</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Font color */}
            <Text style={[styles.settingLabel, { color: colors.foreground, marginTop: 12 }]}>Text Color</Text>
            <View style={styles.colorRow}>
              {FONT_COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setSlate((s) => ({ ...s, fontColor: c }))}
                  style={[styles.colorSwatch, { backgroundColor: c, borderColor: slate.fontColor === c ? colors.primary : colors.border }]}
                >
                  {slate.fontColor === c && <IconSymbol name="checkmark" size={14} color={c === "#FFFFFF" ? "#000" : "#fff"} />}
                </TouchableOpacity>
              ))}
            </View>

            {/* Background color */}
            <Text style={[styles.settingLabel, { color: colors.foreground, marginTop: 12 }]}>Background</Text>
            <View style={styles.colorRow}>
              {BG_COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setSlate((s) => ({ ...s, bgColor: c }))}
                  style={[styles.colorSwatch, { backgroundColor: c, borderColor: slate.bgColor === c ? colors.primary : colors.border }]}
                >
                  {slate.bgColor === c && <IconSymbol name="checkmark" size={14} color="#fff" />}
                </TouchableOpacity>
              ))}
            </View>

            {/* Position */}
            <Text style={[styles.settingLabel, { color: colors.foreground, marginTop: 12 }]}>Position</Text>
            <View style={styles.optionRow}>
              {(["top", "center", "bottom"] as const).map((p) => (
                <TouchableOpacity
                  key={p}
                  onPress={() => setSlate((s) => ({ ...s, position: p }))}
                  style={[styles.optionChip, { backgroundColor: slate.position === p ? colors.primary : colors.surface, borderColor: colors.border, flex: 1 }]}
                >
                  <Text style={[styles.optionChipText, { color: slate.position === p ? "#fff" : colors.foreground, textTransform: "capitalize" }]}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ENHANCE TAB */}
        {activeTab === "enhance" && (
          <View style={styles.tabPanel}>
            <Text style={[styles.panelTitle, { color: colors.foreground }]}>Enhance</Text>
            <Text style={[styles.panelDesc, { color: colors.muted }]}>
              Apply post-processing to improve your self-tape quality.
            </Text>

            {[
              { key: "autoLevels" as const, label: "Auto-Levels", desc: "Automatically adjust brightness and contrast", icon: "wand.and.stars" },
              { key: "noiseReduction" as const, label: "Noise Reduction", desc: "Reduce background noise from audio", icon: "speaker.wave.2.fill" },
              { key: "volumeNormalize" as const, label: "Volume Normalize", desc: "Even out audio volume levels", icon: "waveform" },
              { key: "skinSmoothing" as const, label: "Skin Smoothing", desc: "Subtle skin tone smoothing (light)", icon: "sparkles" },
            ].map((item) => (
              <TouchableOpacity
                key={item.key}
                onPress={() => { saveState(); setEnhance((e) => ({ ...e, [item.key]: !e[item.key] })); }}
                style={[styles.enhanceOption, {
                  backgroundColor: enhance[item.key] ? colors.primary + "10" : colors.surface,
                  borderColor: enhance[item.key] ? colors.primary : colors.border,
                }]}
              >
                <View style={[styles.enhanceIconWrap, { backgroundColor: enhance[item.key] ? colors.primary + "20" : colors.border + "40" }]}>
                  <IconSymbol name={item.icon as any} size={20} color={enhance[item.key] ? colors.primary : colors.muted} />
                </View>
                <View style={styles.enhanceInfo}>
                  <Text style={[styles.enhanceLabel, { color: colors.foreground }]}>{item.label}</Text>
                  <Text style={[styles.enhanceDesc, { color: colors.muted }]}>{item.desc}</Text>
                </View>
                <View style={[styles.enhanceToggle, { backgroundColor: enhance[item.key] ? colors.primary : colors.border }]}>
                  <View style={[styles.enhanceToggleKnob, { transform: [{ translateX: enhance[item.key] ? 16 : 0 }] }]} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* EXPORT TAB */}
        {activeTab === "export" && (
          <View style={styles.tabPanel}>
            <Text style={[styles.panelTitle, { color: colors.foreground }]}>Export Settings</Text>
            <Text style={[styles.panelDesc, { color: colors.muted }]}>
              Configure compression and resolution for your final video.
            </Text>

            {/* Target size */}
            <Text style={[styles.settingLabel, { color: colors.foreground }]}>Target File Size</Text>
            <View style={styles.optionRow}>
              {([25, 50, 100] as const).map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => setExportSettings((e) => ({ ...e, targetSize: s }))}
                  style={[styles.optionChip, {
                    backgroundColor: exportSettings.targetSize === s ? colors.primary : colors.surface,
                    borderColor: colors.border, flex: 1,
                  }]}
                >
                  <Text style={[styles.optionChipText, { color: exportSettings.targetSize === s ? "#fff" : colors.foreground }]}>{s} MB</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Resolution */}
            <Text style={[styles.settingLabel, { color: colors.foreground, marginTop: 16 }]}>Resolution</Text>
            <View style={styles.optionRow}>
              {(["720p", "1080p"] as const).map((r) => (
                <TouchableOpacity
                  key={r}
                  onPress={() => setExportSettings((e) => ({ ...e, resolution: r }))}
                  style={[styles.optionChip, {
                    backgroundColor: exportSettings.resolution === r ? colors.primary : colors.surface,
                    borderColor: colors.border, flex: 1,
                  }]}
                >
                  <Text style={[styles.optionChipText, { color: exportSettings.resolution === r ? "#fff" : colors.foreground }]}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Export summary */}
            <View style={[styles.exportSummary, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.exportSummaryTitle, { color: colors.foreground }]}>Export Summary</Text>
              <View style={styles.exportRow}>
                <Text style={[styles.exportLabel, { color: colors.muted }]}>Video Duration</Text>
                <Text style={[styles.exportValue, { color: colors.foreground }]}>{formatTime(trimmedDuration)}</Text>
              </View>
              <View style={styles.exportRow}>
                <Text style={[styles.exportLabel, { color: colors.muted }]}>Slate Duration</Text>
                <Text style={[styles.exportValue, { color: colors.foreground }]}>{slate.duration}s</Text>
              </View>
              <View style={styles.exportRow}>
                <Text style={[styles.exportLabel, { color: colors.muted }]}>Total Duration</Text>
                <Text style={[styles.exportValue, { color: colors.primary, fontWeight: "700" }]}>{formatTime(totalDuration)}</Text>
              </View>
              <View style={[styles.exportDivider, { backgroundColor: colors.border }]} />
              <View style={styles.exportRow}>
                <Text style={[styles.exportLabel, { color: colors.muted }]}>Resolution</Text>
                <Text style={[styles.exportValue, { color: colors.foreground }]}>{exportSettings.resolution === "720p" ? "1280×720" : "1920×1080"}</Text>
              </View>
              <View style={styles.exportRow}>
                <Text style={[styles.exportLabel, { color: colors.muted }]}>Est. File Size</Text>
                <Text style={[styles.exportValue, { color: colors.foreground }]}>{estimatedSize.toFixed(1)} MB</Text>
              </View>
              <View style={styles.exportRow}>
                <Text style={[styles.exportLabel, { color: colors.muted }]}>Enhancements</Text>
                <Text style={[styles.exportValue, { color: colors.foreground }]}>
                  {Object.values(enhance).filter(Boolean).length} applied
                </Text>
              </View>
            </View>

            {/* Process button */}
            <TouchableOpacity
              onPress={processAndContinue}
              style={[styles.processBtn, { backgroundColor: colors.primary }]}
              activeOpacity={0.8}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <View style={styles.processingRow}>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.processBtnText}>Processing...</Text>
                </View>
              ) : (
                <View style={styles.processingRow}>
                  <IconSymbol name="sparkles" size={20} color="#fff" />
                  <Text style={styles.processBtnText}>Process & Continue to Upload</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },
  preview: { width: SCREEN_W, height: PREVIEW_H, position: "relative" },
  videoPlaceholder: { flex: 1, alignItems: "center", justifyContent: "center", gap: 6 },
  videoPlaceholderText: { color: "rgba(255,255,255,0.4)", fontSize: 14, fontWeight: "600" },
  videoPlaceholderSub: { color: "rgba(255,255,255,0.25)", fontSize: 11 },

  slatePreview: { position: "absolute", left: 0, right: 0, alignItems: "center", justifyContent: "center", paddingHorizontal: 20 },
  slateName: { fontSize: 22, fontWeight: "800" },
  slateDetails: { fontSize: 13, marginTop: 4 },

  enhanceIndicator: { position: "absolute", top: 12, right: 12, flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(0,0,0,0.6)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  enhanceIndicatorText: { color: "#FFD60A", fontSize: 11, fontWeight: "700" },

  playOverlay: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  playBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center" },

  timeDisplay: { position: "absolute", bottom: 8, right: 12, flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(0,0,0,0.6)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  timeText: { color: "#fff", fontSize: 13, fontWeight: "700", fontVariant: ["tabular-nums"] },
  timeSep: { color: "rgba(255,255,255,0.4)", fontSize: 12 },

  // Timeline
  timelineContainer: { paddingHorizontal: 16, paddingTop: 12 },
  timeline: { height: 40, borderRadius: 8, overflow: "hidden", position: "relative" },
  trimRegion: { position: "absolute", top: 0, bottom: 0 },
  trimHandle: { position: "absolute", top: 0, bottom: 0, width: 14, zIndex: 10, alignItems: "center", justifyContent: "center" },
  trimHandleLeft: { marginLeft: -7, borderTopLeftRadius: 4, borderBottomLeftRadius: 4 },
  trimHandleRight: { marginLeft: -7, borderTopRightRadius: 4, borderBottomRightRadius: 4 },
  trimHandleBar: { width: 3, height: 16, backgroundColor: "#fff", borderRadius: 1.5 },
  playhead: { position: "absolute", top: 0, bottom: 0, width: 2, marginLeft: -1, zIndex: 15 },
  waveBar: { position: "absolute", bottom: 0, width: 2, borderRadius: 1 },
  timelineLabels: { flexDirection: "row", justifyContent: "space-between", paddingTop: 4 },
  timelineLabel: { fontSize: 11, fontVariant: ["tabular-nums"] },

  // Undo/Redo
  undoRedoBar: { flexDirection: "row", justifyContent: "center", gap: 24, paddingVertical: 8 },
  undoBtn: { flexDirection: "row", alignItems: "center", gap: 4, padding: 6 },
  undoBtnText: { fontSize: 12, fontWeight: "600" },

  // Tabs
  tabBar: { flexDirection: "row", borderBottomWidth: 1, paddingHorizontal: 8 },
  tab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabLabel: { fontSize: 12, fontWeight: "700" },

  // Tab content
  tabContent: { flex: 1 },
  tabContentInner: { paddingHorizontal: 16, paddingBottom: 100, paddingTop: 12 },
  tabPanel: { gap: 12 },
  panelTitle: { fontSize: 18, fontWeight: "800" },
  panelDesc: { fontSize: 13, lineHeight: 19 },

  // Trim
  trimControls: { flexDirection: "row", gap: 10 },
  trimInput: { flex: 1, borderRadius: 12, borderWidth: 1, padding: 12, gap: 6 },
  trimInputLabel: { fontSize: 11, fontWeight: "600" },
  trimInputValue: { fontSize: 20, fontWeight: "800", fontVariant: ["tabular-nums"] },
  trimInputBtns: { flexDirection: "row", gap: 16, marginTop: 4 },
  trimSummary: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 8 },
  trimSummaryRow: { flexDirection: "row", justifyContent: "space-between" },
  trimSummaryLabel: { fontSize: 13 },
  trimSummaryValue: { fontSize: 13, fontVariant: ["tabular-nums"] },

  // Slate form
  slateForm: { gap: 10 },
  formRow: { gap: 4 },
  formLabel: { fontSize: 13, fontWeight: "600" },
  formInput: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  settingLabel: { fontSize: 13, fontWeight: "700" },
  optionRow: { flexDirection: "row", gap: 8 },
  optionChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, borderWidth: 1, alignItems: "center" },
  optionChipText: { fontSize: 14, fontWeight: "600" },
  colorRow: { flexDirection: "row", gap: 10 },
  colorSwatch: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, alignItems: "center", justifyContent: "center" },

  // Enhance
  enhanceOption: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1 },
  enhanceIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  enhanceInfo: { flex: 1, gap: 2 },
  enhanceLabel: { fontSize: 15, fontWeight: "700" },
  enhanceDesc: { fontSize: 12 },
  enhanceToggle: { width: 40, height: 24, borderRadius: 12, padding: 2, justifyContent: "center" },
  enhanceToggleKnob: { width: 20, height: 20, borderRadius: 10, backgroundColor: "#fff" },

  // Export
  exportSummary: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 10, marginTop: 8 },
  exportSummaryTitle: { fontSize: 16, fontWeight: "700", marginBottom: 4 },
  exportRow: { flexDirection: "row", justifyContent: "space-between" },
  exportLabel: { fontSize: 13 },
  exportValue: { fontSize: 13, fontVariant: ["tabular-nums"] },
  exportDivider: { height: 1, marginVertical: 4 },
  processBtn: { alignItems: "center", paddingVertical: 16, borderRadius: 14, marginTop: 16 },
  processBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  processingRow: { flexDirection: "row", alignItems: "center", gap: 8 },
});
