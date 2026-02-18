import {
  View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView,
  Dimensions, ActivityIndicator, Platform,
} from "react-native";
import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { router, useLocalSearchParams } from "expo-router";
import { useAuth } from "@/hooks/use-auth";
import { Spacing, Radius, Typography } from "@/constants/design-tokens";
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withRepeat,
  withSequence, Easing,
} from "react-native-reanimated";

const { width: SCREEN_W } = Dimensions.get("window");
const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks

// ─── Types ──────────────────────────────────────────────────
type UploadStatus = "queued" | "uploading" | "paused" | "completed" | "failed" | "processing";

interface UploadFile {
  id: string;
  name: string;
  uri: string;
  totalSize: number;
  uploadedSize: number;
  status: UploadStatus;
  progress: number;
  speed: number; // bytes/sec
  eta: number; // seconds
  chunks: number;
  completedChunks: number;
  retries: number;
  error?: string;
}

// ─── Component ──────────────────────────────────────────────
export default function ResumableUploadScreen() {
  const {
    castingId, videoUri, duration, fileSize, quality,
    slateName, slateHeight, slateLocation, slateAgency,
  } = useLocalSearchParams<{
    castingId: string; videoUri?: string; duration?: string; fileSize?: string;
    quality?: string; slateName?: string; slateHeight?: string;
    slateLocation?: string; slateAgency?: string;
  }>();
  const { user } = useAuth();
  const colors = useColors();

  const fileSizeMB = parseInt(fileSize || "50", 10);
  const fileSizeBytes = fileSizeMB * 1024 * 1024;
  const totalChunks = Math.ceil(fileSizeBytes / CHUNK_SIZE);

  // Upload state
  const [files, setFiles] = useState<UploadFile[]>([
    {
      id: "main-video",
      name: videoUri || "self-tape.mp4",
      uri: videoUri || "",
      totalSize: fileSizeBytes,
      uploadedSize: 0,
      status: "queued",
      progress: 0,
      speed: 0,
      eta: 0,
      chunks: totalChunks,
      completedChunks: 0,
      retries: 0,
    },
  ]);

  const [isBackgroundMode, setIsBackgroundMode] = useState(false);
  const [showDetails, setShowDetails] = useState(true);
  const uploadTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTime = useRef<number>(0);

  // Animations
  const pulseAnim = useSharedValue(1);
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    pulseAnim.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseAnim.value,
  }));

  // ─── Upload Simulation ────────────────────────────────────
  const startUpload = useCallback(() => {
    startTime.current = Date.now();
    setFiles((prev) => prev.map((f) => f.id === "main-video" ? { ...f, status: "uploading" as const } : f));

    uploadTimer.current = setInterval(() => {
      setFiles((prev) => {
        return prev.map((f) => {
          if (f.status !== "uploading") return f;

          // Simulate variable upload speed (2-8 MB/s)
          const speedVariance = (Math.random() * 6 + 2) * 1024 * 1024;
          const chunkProgress = speedVariance / 10; // per 100ms tick
          const newUploaded = Math.min(f.totalSize, f.uploadedSize + chunkProgress);
          const newProgress = newUploaded / f.totalSize;
          const newCompletedChunks = Math.floor(newProgress * f.chunks);
          const elapsed = (Date.now() - startTime.current) / 1000;
          const speed = elapsed > 0 ? newUploaded / elapsed : 0;
          const remaining = f.totalSize - newUploaded;
          const eta = speed > 0 ? remaining / speed : 0;

          if (newProgress >= 1) {
            if (uploadTimer.current) clearInterval(uploadTimer.current);
            return {
              ...f,
              uploadedSize: f.totalSize,
              progress: 1,
              completedChunks: f.chunks,
              speed: 0,
              eta: 0,
              status: "processing" as const,
            };
          }

          return {
            ...f,
            uploadedSize: newUploaded,
            progress: newProgress,
            completedChunks: newCompletedChunks,
            speed,
            eta,
          };
        });
      });
    }, 100);
  }, []);

  // Auto-transition from processing to completed
  useEffect(() => {
    const processingFile = files.find((f) => f.status === "processing");
    if (processingFile) {
      const timer = setTimeout(() => {
        setFiles((prev) => prev.map((f) => f.status === "processing" ? { ...f, status: "completed" as const } : f));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [files]);

  const pauseUpload = useCallback(() => {
    if (uploadTimer.current) {
      clearInterval(uploadTimer.current);
      uploadTimer.current = null;
    }
    setFiles((prev) => prev.map((f) => f.status === "uploading" ? { ...f, status: "paused" as const, speed: 0 } : f));
  }, []);

  const resumeUpload = useCallback(() => {
    startTime.current = Date.now();
    setFiles((prev) => prev.map((f) => f.status === "paused" ? { ...f, status: "uploading" as const } : f));

    uploadTimer.current = setInterval(() => {
      setFiles((prev) => {
        return prev.map((f) => {
          if (f.status !== "uploading") return f;
          const speedVariance = (Math.random() * 6 + 2) * 1024 * 1024;
          const chunkProgress = speedVariance / 10;
          const newUploaded = Math.min(f.totalSize, f.uploadedSize + chunkProgress);
          const newProgress = newUploaded / f.totalSize;
          const newCompletedChunks = Math.floor(newProgress * f.chunks);
          const elapsed = (Date.now() - startTime.current) / 1000;
          const speed = elapsed > 0 ? (newUploaded - f.uploadedSize) / elapsed : 0;
          const remaining = f.totalSize - newUploaded;
          const eta = speed > 0 ? remaining / speed : 0;

          if (newProgress >= 1) {
            if (uploadTimer.current) clearInterval(uploadTimer.current);
            return { ...f, uploadedSize: f.totalSize, progress: 1, completedChunks: f.chunks, speed: 0, eta: 0, status: "processing" as const };
          }
          return { ...f, uploadedSize: newUploaded, progress: newProgress, completedChunks: newCompletedChunks, speed, eta };
        });
      });
    }, 100);
  }, []);

  const cancelUpload = useCallback(() => {
    Alert.alert("Cancel Upload", "Are you sure? Your progress will be lost.", [
      { text: "Keep Uploading", style: "cancel" },
      {
        text: "Cancel",
        style: "destructive",
        onPress: () => {
          if (uploadTimer.current) clearInterval(uploadTimer.current);
          router.back();
        },
      },
    ]);
  }, []);

  const retryUpload = useCallback(() => {
    setFiles((prev) => prev.map((f) => f.status === "failed" ? { ...f, status: "queued" as const, retries: f.retries + 1 } : f));
    startUpload();
  }, [startUpload]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (uploadTimer.current) clearInterval(uploadTimer.current);
    };
  }, []);

  // ─── Format Helpers ───────────────────────────────────────
  const formatBytes = (bytes: number) => {
    if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${bytes} B`;
  };

  const formatSpeed = (bytesPerSec: number) => {
    if (bytesPerSec >= 1024 * 1024) return `${(bytesPerSec / (1024 * 1024)).toFixed(1)} MB/s`;
    if (bytesPerSec >= 1024) return `${(bytesPerSec / 1024).toFixed(0)} KB/s`;
    return `${bytesPerSec.toFixed(0)} B/s`;
  };

  const formatEta = (seconds: number) => {
    if (seconds <= 0) return "--";
    if (seconds < 60) return `${Math.ceil(seconds)}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.ceil(seconds % 60)}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  const mainFile = files[0];
  const isComplete = mainFile.status === "completed";
  const isUploading = mainFile.status === "uploading";
  const isPaused = mainFile.status === "paused";
  const isProcessing = mainFile.status === "processing";
  const isFailed = mainFile.status === "failed";
  const isQueued = mainFile.status === "queued";

  // ─── Status Color ─────────────────────────────────────────
  const statusColor = useMemo(() => {
    switch (mainFile.status) {
      case "uploading": return colors.primary;
      case "paused": return "#FFD60A";
      case "completed": return colors.success;
      case "failed": return colors.error;
      case "processing": return "#AF52DE";
      default: return colors.muted;
    }
  }, [mainFile.status, colors]);

  const statusLabel = useMemo(() => {
    switch (mainFile.status) {
      case "queued": return "Ready to Upload";
      case "uploading": return "Uploading...";
      case "paused": return "Paused";
      case "completed": return "Upload Complete";
      case "failed": return "Upload Failed";
      case "processing": return "Processing...";
    }
  }, [mainFile.status]);

  return (
    <ScreenContainer edges={["top", "left", "right"]} className="flex-1">
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* ─── Header ────────────────────────────────────── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <IconSymbol name="chevron.left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Upload Self-Tape</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* ─── Upload Card ───────────────────────────────── */}
        <View style={[styles.uploadCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Thumbnail + Info */}
          <View style={styles.uploadCardTop}>
            <View style={[styles.thumbnail, { backgroundColor: "#1a1a2e" }]}>
              <IconSymbol name="film" size={28} color="rgba(255,255,255,0.5)" />
            </View>
            <View style={styles.uploadInfo}>
              <Text style={[styles.fileName, { color: colors.foreground }]} numberOfLines={1}>
                {mainFile.name}
              </Text>
              <Text style={[styles.fileDetails, { color: colors.muted }]}>
                {formatBytes(mainFile.totalSize)} · {quality || "1080p"} · {duration || "0"}s
              </Text>
              <View style={styles.statusRow}>
                <Animated.View style={[styles.statusDot, { backgroundColor: statusColor }, (isUploading || isProcessing) && pulseStyle]} />
                <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
              </View>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressSection}>
            <View style={[styles.progressTrack, { backgroundColor: colors.border + "40" }]}>
              <Animated.View
                style={[styles.progressFill, {
                  width: `${mainFile.progress * 100}%`,
                  backgroundColor: statusColor,
                }]}
              />
            </View>
            <View style={styles.progressLabels}>
              <Text style={[styles.progressPct, { color: colors.foreground }]}>
                {Math.round(mainFile.progress * 100)}%
              </Text>
              <Text style={[styles.progressBytes, { color: colors.muted }]}>
                {formatBytes(mainFile.uploadedSize)} / {formatBytes(mainFile.totalSize)}
              </Text>
            </View>
          </View>

          {/* Upload Stats */}
          {(isUploading || isPaused) && (
            <View style={[styles.statsRow, { borderTopColor: colors.border }]}>
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: colors.muted }]}>Speed</Text>
                <Text style={[styles.statValue, { color: colors.foreground }]}>
                  {isUploading ? formatSpeed(mainFile.speed) : "—"}
                </Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: colors.muted }]}>ETA</Text>
                <Text style={[styles.statValue, { color: colors.foreground }]}>
                  {isUploading ? formatEta(mainFile.eta) : "—"}
                </Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: colors.muted }]}>Chunks</Text>
                <Text style={[styles.statValue, { color: colors.foreground }]}>
                  {mainFile.completedChunks}/{mainFile.chunks}
                </Text>
              </View>
            </View>
          )}

          {/* Processing indicator */}
          {isProcessing && (
            <View style={[styles.processingBanner, { backgroundColor: "#AF52DE" + "15" }]}>
              <ActivityIndicator size="small" color="#AF52DE" />
              <Text style={[styles.processingText, { color: "#AF52DE" }]}>
                Server is processing your video (adding slate, applying enhancements)...
              </Text>
            </View>
          )}

          {/* Completed banner */}
          {isComplete && (
            <View style={[styles.completedBanner, { backgroundColor: colors.success + "15" }]}>
              <IconSymbol name="checkmark.circle.fill" size={24} color={colors.success} />
              <View style={styles.completedInfo}>
                <Text style={[styles.completedTitle, { color: colors.success }]}>Upload Complete!</Text>
                <Text style={[styles.completedDesc, { color: colors.muted }]}>
                  Your self-tape has been uploaded and is ready for review.
                </Text>
              </View>
            </View>
          )}

          {/* Failed banner */}
          {isFailed && (
            <View style={[styles.failedBanner, { backgroundColor: colors.error + "15" }]}>
              <IconSymbol name="exclamationmark.triangle" size={24} color={colors.error} />
              <View style={styles.completedInfo}>
                <Text style={[styles.completedTitle, { color: colors.error }]}>Upload Failed</Text>
                <Text style={[styles.completedDesc, { color: colors.muted }]}>
                  {mainFile.error || "Connection lost. Tap retry to resume from where you left off."}
                </Text>
              </View>
            </View>
          )}

          {/* Control Buttons */}
          <View style={styles.controlBtns}>
            {isQueued && (
              <TouchableOpacity onPress={startUpload} style={[styles.primaryBtn, { backgroundColor: colors.primary }]}>
                <IconSymbol name="arrow.up.circle.fill" size={20} color="#fff" />
                <Text style={styles.primaryBtnText}>Start Upload</Text>
              </TouchableOpacity>
            )}

            {isUploading && (
              <>
                <TouchableOpacity onPress={pauseUpload} style={[styles.controlBtn, { backgroundColor: "#FFD60A" + "20", borderColor: "#FFD60A" }]}>
                  <IconSymbol name="pause.fill" size={18} color="#FFD60A" />
                  <Text style={[styles.controlBtnText, { color: "#FFD60A" }]}>Pause</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={cancelUpload} style={[styles.controlBtn, { backgroundColor: colors.error + "10", borderColor: colors.error }]}>
                  <IconSymbol name="xmark" size={18} color={colors.error} />
                  <Text style={[styles.controlBtnText, { color: colors.error }]}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}

            {isPaused && (
              <>
                <TouchableOpacity onPress={resumeUpload} style={[styles.primaryBtn, { backgroundColor: colors.primary }]}>
                  <IconSymbol name="play.fill" size={18} color="#fff" />
                  <Text style={styles.primaryBtnText}>Resume</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={cancelUpload} style={[styles.controlBtn, { backgroundColor: colors.error + "10", borderColor: colors.error }]}>
                  <IconSymbol name="xmark" size={18} color={colors.error} />
                  <Text style={[styles.controlBtnText, { color: colors.error }]}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}

            {isFailed && (
              <>
                <TouchableOpacity onPress={retryUpload} style={[styles.primaryBtn, { backgroundColor: colors.primary }]}>
                  <IconSymbol name="arrow.counterclockwise" size={18} color="#fff" />
                  <Text style={styles.primaryBtnText}>Retry (Attempt {mainFile.retries + 1})</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={cancelUpload} style={[styles.controlBtn, { backgroundColor: colors.error + "10", borderColor: colors.error }]}>
                  <IconSymbol name="xmark" size={18} color={colors.error} />
                  <Text style={[styles.controlBtnText, { color: colors.error }]}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}

            {isComplete && (
              <TouchableOpacity
                onPress={() => router.push({ pathname: "/casting/[id]" as any, params: { id: castingId } })}
                style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
              >
                <IconSymbol name="checkmark" size={18} color="#fff" />
                <Text style={styles.primaryBtnText}>View Casting</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ─── Chunk Details (Expandable) ────────────────── */}
        {showDetails && (isUploading || isPaused) && (
          <View style={[styles.chunkDetails, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowDetails(!showDetails)} style={styles.chunkHeader}>
              <Text style={[styles.chunkTitle, { color: colors.foreground }]}>Chunk Details</Text>
              <IconSymbol name="chevron.right" size={16} color={colors.muted} />
            </TouchableOpacity>

            <View style={styles.chunkGrid}>
              {Array.from({ length: Math.min(mainFile.chunks, 20) }).map((_, i) => {
                const isCompleted = i < mainFile.completedChunks;
                const isCurrent = i === mainFile.completedChunks;
                return (
                  <View
                    key={i}
                    style={[
                      styles.chunkBlock,
                      {
                        backgroundColor: isCompleted ? colors.success : isCurrent ? colors.primary : colors.border + "40",
                      },
                    ]}
                  />
                );
              })}
              {mainFile.chunks > 20 && (
                <Text style={[styles.chunkMore, { color: colors.muted }]}>+{mainFile.chunks - 20} more</Text>
              )}
            </View>

            <View style={styles.chunkLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
                <Text style={[styles.legendText, { color: colors.muted }]}>Completed</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
                <Text style={[styles.legendText, { color: colors.muted }]}>In Progress</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.border + "40" }]} />
                <Text style={[styles.legendText, { color: colors.muted }]}>Pending</Text>
              </View>
            </View>
          </View>
        )}

        {/* ─── Submission Info ────────────────────────────── */}
        <View style={[styles.submissionInfo, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.infoTitle, { color: colors.foreground }]}>Submission Details</Text>
          {[
            { label: "Name", value: slateName || user?.name || "—" },
            { label: "Height", value: slateHeight || "—" },
            { label: "Location", value: slateLocation || "—" },
            { label: "Agency", value: slateAgency || "—" },
            { label: "Video Quality", value: quality || "1080p" },
            { label: "Duration", value: duration ? `${duration}s` : "—" },
          ].map((item) => (
            <View key={item.label} style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.muted }]}>{item.label}</Text>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>{item.value}</Text>
            </View>
          ))}
        </View>

        {/* ─── Tips ──────────────────────────────────────── */}
        <View style={[styles.tipsCard, { backgroundColor: colors.primary + "08", borderColor: colors.primary + "20" }]}>
          <IconSymbol name="info.circle" size={18} color={colors.primary} />
          <View style={styles.tipsContent}>
            <Text style={[styles.tipsTitle, { color: colors.primary }]}>Upload Tips</Text>
            <Text style={[styles.tipsText, { color: colors.muted }]}>
              {"\u2022"} Stay on Wi-Fi for fastest uploads{"\n"}
              {"\u2022"} Upload resumes automatically if interrupted{"\n"}
              {"\u2022"} 5MB chunks ensure reliable delivery{"\n"}
              {"\u2022"} You can pause and resume anytime
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

// ─── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingBottom: 100 },

  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12 },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "800" },

  uploadCard: { borderRadius: 16, borderWidth: 1, overflow: "hidden", marginBottom: 16 },
  uploadCardTop: { flexDirection: "row", gap: 14, padding: 16 },
  thumbnail: { width: 64, height: 64, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  uploadInfo: { flex: 1, gap: 4 },
  fileName: { fontSize: 15, fontWeight: "700" },
  fileDetails: { fontSize: 12 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: "700" },

  progressSection: { paddingHorizontal: 16, paddingBottom: 12 },
  progressTrack: { height: 8, borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 4 },
  progressLabels: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  progressPct: { fontSize: 14, fontWeight: "800", fontVariant: ["tabular-nums"] },
  progressBytes: { fontSize: 11, fontVariant: ["tabular-nums"] },

  statsRow: { flexDirection: "row", borderTopWidth: 1, paddingVertical: 12, marginHorizontal: 16 },
  statItem: { flex: 1, alignItems: "center", gap: 2 },
  statLabel: { fontSize: 10, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  statValue: { fontSize: 14, fontWeight: "700", fontVariant: ["tabular-nums"] },
  statDivider: { width: 1, height: 30, alignSelf: "center" },

  processingBanner: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14, marginHorizontal: 16, marginBottom: 12, borderRadius: 10 },
  processingText: { flex: 1, fontSize: 12, fontWeight: "600", lineHeight: 18 },

  completedBanner: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 14, marginHorizontal: 16, marginBottom: 12, borderRadius: 10 },
  completedInfo: { flex: 1, gap: 4 },
  completedTitle: { fontSize: 15, fontWeight: "700" },
  completedDesc: { fontSize: 12, lineHeight: 18 },

  failedBanner: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 14, marginHorizontal: 16, marginBottom: 12, borderRadius: 10 },

  controlBtns: { flexDirection: "row", gap: 10, padding: 16, paddingTop: 4 },
  primaryBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 12 },
  primaryBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  controlBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5 },
  controlBtnText: { fontSize: 14, fontWeight: "700" },

  chunkDetails: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 16, gap: 12 },
  chunkHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  chunkTitle: { fontSize: 14, fontWeight: "700" },
  chunkGrid: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  chunkBlock: { width: 14, height: 14, borderRadius: 3 },
  chunkMore: { fontSize: 11, alignSelf: "center", marginLeft: 4 },
  chunkLegend: { flexDirection: "row", gap: 16 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 10, fontWeight: "600" },

  submissionInfo: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 16, gap: 10 },
  infoTitle: { fontSize: 16, fontWeight: "700", marginBottom: 4 },
  infoRow: { flexDirection: "row", justifyContent: "space-between" },
  infoLabel: { fontSize: 13 },
  infoValue: { fontSize: 13, fontWeight: "600" },

  tipsCard: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 20 },
  tipsContent: { flex: 1, gap: 4 },
  tipsTitle: { fontSize: 13, fontWeight: "700" },
  tipsText: { fontSize: 12, lineHeight: 20 },
});
