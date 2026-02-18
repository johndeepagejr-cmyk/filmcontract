import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput,
  Dimensions, Modal, FlatList, Alert, Platform,
} from "react-native";
import { useState, useCallback, useMemo } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { router, useLocalSearchParams } from "expo-router";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import * as Haptics from "expo-haptics";
import { generateReviewCSV, shareCSV, calculateWeightedAverage } from "@/lib/csv-export";

const { width: SCREEN_W } = Dimensions.get("window");
const VIDEO_H = (SCREEN_W * 9) / 16;

// ─── Types ──────────────────────────────────────────────────
type ReviewTab = "grid" | "detail" | "compare";
type RatingCategory = "acting" | "look" | "voice" | "chemistry";

interface Rating {
  acting: number;
  look: number;
  voice: number;
  chemistry: number;
}

interface TimestampedNote {
  id: string;
  time: number; // seconds
  text: string;
  createdAt: string;
}

interface ReviewSubmission {
  id: number;
  actorName: string;
  actorEmail: string;
  actorId?: number;
  status: string;
  videoUrl: string | null;
  notes: string;
  createdAt: string;
  rating: Rating;
  producerNotes: string;
  tags: string[];
  timestampedNotes: TimestampedNote[];
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  submitted: { bg: "#DBEAFE", text: "#1D4ED8" },
  reviewing: { bg: "#E0E7FF", text: "#4338CA" },
  shortlisted: { bg: "#FEF3C7", text: "#B45309" },
  callback: { bg: "#D1FAE5", text: "#065F46" },
  hired: { bg: "#CFFAFE", text: "#0E7490" },
  rejected: { bg: "#FEE2E2", text: "#991B1B" },
  passed: { bg: "#FEE2E2", text: "#991B1B" },
};

const RATING_CATEGORIES: { key: RatingCategory; label: string; icon: string; weight: number }[] = [
  { key: "acting", label: "Acting", icon: "theatermasks.fill", weight: 0.35 },
  { key: "look", label: "Look", icon: "person.fill", weight: 0.25 },
  { key: "voice", label: "Voice", icon: "mic.fill", weight: 0.20 },
  { key: "chemistry", label: "Chemistry", icon: "sparkles", weight: 0.20 },
];

const QUICK_TAGS = [
  { label: "Callback", color: "#22C55E", icon: "phone.fill" },
  { label: "Wrong type", color: "#EF4444", icon: "xmark" },
  { label: "Great energy", color: "#F59E0B", icon: "bolt.fill" },
  { label: "Poor audio", color: "#EF4444", icon: "speaker.slash.fill" },
  { label: "Booked", color: "#0EA5E9", icon: "checkmark.seal.fill" },
  { label: "Strong read", color: "#8B5CF6", icon: "star.fill" },
];

const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

// ─── Component ──────────────────────────────────────────────
export default function ProducerReviewScreen() {
  const { castingId, castingTitle } = useLocalSearchParams<{ castingId: string; castingTitle?: string }>();
  const { user } = useAuth();
  const colors = useColors();

  const [activeTab, setActiveTab] = useState<ReviewTab>("grid");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [compareIds, setCompareIds] = useState<number[]>([]);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [currentRating, setCurrentRating] = useState<Rating>({ acting: 0, look: 0, voice: 0, chemistry: 0 });
  const [producerNotes, setProducerNotes] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "rating" | "name">("newest");

  // New enhanced features
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedPicker, setShowSpeedPicker] = useState(false);
  const [activeTags, setActiveTags] = useState<Record<number, string[]>>({});
  const [showRetakeModal, setShowRetakeModal] = useState(false);
  const [retakeFeedback, setRetakeFeedback] = useState("");
  const [timestampedNotes, setTimestampedNotes] = useState<Record<number, TimestampedNote[]>>({});
  const [newTimestampNote, setNewTimestampNote] = useState("");
  const [currentPlaybackTime, setCurrentPlaybackTime] = useState(0);

  // Fetch submissions
  const submissionsQuery = trpc.casting.getSubmissions.useQuery(
    { castingCallId: parseInt(castingId || "0", 10) },
    { enabled: !!castingId },
  );

  const updateStatusMutation = trpc.casting.updateSubmissionStatus.useMutation({
    onSuccess: () => submissionsQuery.refetch(),
  });

  const submissions: ReviewSubmission[] = useMemo(() => {
    const raw = (submissionsQuery.data || []) as any[];
    return raw.map((s: any) => ({
      id: s.id,
      actorName: s.actorName || s.user?.name || "Unknown Actor",
      actorEmail: s.actorEmail || s.user?.email || "",
      actorId: s.actorId,
      status: s.status || "submitted",
      videoUrl: s.videoUrl || null,
      notes: s.notes || "",
      createdAt: s.createdAt || new Date().toISOString(),
      rating: s.rating || { acting: 0, look: 0, voice: 0, chemistry: 0 },
      producerNotes: s.producerNotes || "",
      tags: activeTags[s.id] || [],
      timestampedNotes: timestampedNotes[s.id] || [],
    }));
  }, [submissionsQuery.data, activeTags, timestampedNotes]);

  // Filtered & sorted
  const filteredSubmissions = useMemo(() => {
    let result = submissions;
    if (filterStatus !== "all") {
      result = result.filter((s) => s.status === filterStatus);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((s) =>
        s.actorName.toLowerCase().includes(q) ||
        s.actorEmail.toLowerCase().includes(q) ||
        s.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    switch (sortBy) {
      case "rating":
        result = [...result].sort((a, b) => weightedAvg(b.rating) - weightedAvg(a.rating));
        break;
      case "name":
        result = [...result].sort((a, b) => a.actorName.localeCompare(b.actorName));
        break;
      default:
        result = [...result].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return result;
  }, [submissions, filterStatus, searchQuery, sortBy]);

  const detailSubmission = useMemo(() => submissions.find((s) => s.id === detailId), [submissions, detailId]);
  const compareSubmissions = useMemo(() => submissions.filter((s) => compareIds.includes(s.id)), [submissions, compareIds]);

  // ─── Weighted Average ─────────────────────────────────────
  const weightedAvg = useCallback((rating: Rating): number => {
    const vals = RATING_CATEGORIES.map((c) => ({ val: rating[c.key], weight: c.weight }));
    const rated = vals.filter((v) => v.val > 0);
    if (rated.length === 0) return 0;
    const totalWeight = rated.reduce((sum, v) => sum + v.weight, 0);
    return rated.reduce((sum, v) => sum + (v.val * v.weight) / totalWeight, 0);
  }, []);

  const formatWeightedAvg = useCallback((rating: Rating): string => {
    const avg = weightedAvg(rating);
    return avg > 0 ? avg.toFixed(1) : "—";
  }, [weightedAvg]);

  // ─── Actions ──────────────────────────────────────────────
  const toggleSelect = useCallback((id: number) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  }, []);

  const openDetail = useCallback((id: number) => {
    setDetailId(id);
    setActiveTab("detail");
  }, []);

  const startCompare = useCallback(() => {
    if (selectedIds.length < 2 || selectedIds.length > 3) {
      Alert.alert("Compare", "Select 2-3 submissions to compare.");
      return;
    }
    setCompareIds(selectedIds);
    setActiveTab("compare");
  }, [selectedIds]);

  const updateStatus = useCallback((submissionId: number, status: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateStatusMutation.mutate({ submissionId, status: status as any });
  }, [updateStatusMutation]);

  // ─── Quick Tags ───────────────────────────────────────────
  const toggleTag = useCallback((submissionId: number, tag: string) => {
    setActiveTags((prev) => {
      const current = prev[submissionId] || [];
      const next = current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag];
      return { ...prev, [submissionId]: next };
    });
  }, []);

  // ─── Timestamped Notes ────────────────────────────────────
  const addTimestampedNote = useCallback((submissionId: number) => {
    if (!newTimestampNote.trim()) return;
    const note: TimestampedNote = {
      id: Math.random().toString(36).slice(2, 10),
      time: currentPlaybackTime,
      text: newTimestampNote.trim(),
      createdAt: new Date().toISOString(),
    };
    setTimestampedNotes((prev) => ({
      ...prev,
      [submissionId]: [...(prev[submissionId] || []), note],
    }));
    setNewTimestampNote("");
  }, [newTimestampNote, currentPlaybackTime]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // ─── Hire → Contract ─────────────────────────────────────
  const hireAndCreateContract = useCallback((sub: ReviewSubmission) => {
    updateStatus(sub.id, "hired");
    router.push({
      pathname: "/contract-wizard" as any,
      params: {
        actorName: sub.actorName,
        actorId: sub.actorId?.toString() || "",
        actorEmail: sub.actorEmail,
        projectTitle: castingTitle || "",
      },
    });
  }, [castingTitle, updateStatus]);

  // ─── Request Retake ───────────────────────────────────────
  const sendRetakeRequest = useCallback(() => {
    if (!retakeFeedback.trim() || !detailSubmission) return;
    Alert.alert(
      "Retake Requested",
      `Retake request sent to ${detailSubmission.actorName} with your feedback.`,
      [{ text: "OK" }]
    );
    setRetakeFeedback("");
    setShowRetakeModal(false);
  }, [retakeFeedback, detailSubmission]);

  // ─── Star Rating Component ───────────────────────────────
  const StarRating = useCallback(({ value, onChange, size = 20 }: { value: number; onChange?: (v: number) => void; size?: number }) => (
    <View style={st.starRow}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity key={star} onPress={() => onChange?.(star)} disabled={!onChange} style={st.starBtn}>
          <IconSymbol name={star <= value ? "star.fill" : "star"} size={size} color={star <= value ? "#FFD60A" : colors.border} />
        </TouchableOpacity>
      ))}
    </View>
  ), [colors]);

  const StatusBadge = useCallback(({ status }: { status: string }) => {
    const sc = STATUS_COLORS[status] || STATUS_COLORS.submitted;
    return (
      <View style={[st.statusBadge, { backgroundColor: sc.bg }]}>
        <Text style={[st.statusBadgeText, { color: sc.text }]}>{status}</Text>
      </View>
    );
  }, []);

  return (
    <ScreenContainer edges={["top", "left", "right"]} className="flex-1">
      {/* ─── Header ──────────────────────────────────────── */}
      <View style={st.header}>
        <TouchableOpacity onPress={() => router.back()} style={st.backBtn}>
          <IconSymbol name="chevron.left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[st.headerTitle, { color: colors.foreground }]}>Review Submissions</Text>
          {castingTitle && <Text style={[st.headerSubtitle, { color: colors.muted }]} numberOfLines={1}>{castingTitle}</Text>}
        </View>
        <View style={st.headerActions}>
          <TouchableOpacity
            onPress={() => {
              const rows = filteredSubmissions.map((s: any) => ({
                submissionId: s.id,
                actorName: s.actorName || "Unknown",
                actorEmail: s.actorEmail || "",
                status: s.status,
                actingRating: 0,
                lookRating: 0,
                voiceRating: 0,
                chemistryRating: 0,
                weightedAvg: 0,
                tags: activeTags[s.id] || [],
                producerNotes: "",
                timestampedNotesCount: timestampedNotes[s.id]?.length || 0,
                submittedAt: s.createdAt || "",
              }));
              const csv = generateReviewCSV(castingTitle || "Casting", rows);
              shareCSV(castingTitle || "Casting", csv);
            }}
            style={[st.exportBtn, { borderColor: colors.border }]}
          >
            <IconSymbol name="square.and.arrow.up" size={16} color={colors.foreground} />
            <Text style={[st.exportBtnText, { color: colors.foreground }]}>CSV</Text>
          </TouchableOpacity>
          {selectedIds.length >= 2 && (
            <TouchableOpacity onPress={startCompare} style={[st.compareBtn, { backgroundColor: colors.primary }]}>
              <IconSymbol name="rectangle.split.3x1" size={16} color="#fff" />
              <Text style={st.compareBtnText}>Compare ({selectedIds.length})</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ─── Tab Bar ─────────────────────────────────────── */}
      <View style={[st.tabBar, { borderBottomColor: colors.border }]}>
        {([
          { key: "grid" as const, label: "All", count: filteredSubmissions.length },
          { key: "detail" as const, label: "Detail", count: null },
          { key: "compare" as const, label: "Compare", count: compareIds.length || null },
        ]).map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={[st.tab, activeTab === tab.key && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          >
            <Text style={[st.tabLabel, { color: activeTab === tab.key ? colors.primary : colors.muted }]}>
              {tab.label}{tab.count !== null ? ` (${tab.count})` : ""}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ═══ GRID TAB ═══════════════════════════════════════ */}
      {activeTab === "grid" && (
        <View style={st.gridContainer}>
          <View style={st.filterBar}>
            <View style={[st.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <IconSymbol name="magnifyingglass" size={16} color={colors.muted} />
              <TextInput
                style={[st.searchInput, { color: colors.foreground }]}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search actors or tags..."
                placeholderTextColor={colors.muted}
              />
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.statusFilters}>
            {["all", "submitted", "reviewing", "shortlisted", "callback", "hired", "passed"].map((s) => (
              <TouchableOpacity
                key={s}
                onPress={() => setFilterStatus(s)}
                style={[st.statusFilterChip, {
                  backgroundColor: filterStatus === s ? colors.primary : colors.surface,
                  borderColor: filterStatus === s ? colors.primary : colors.border,
                }]}
              >
                <Text style={[st.statusFilterText, { color: filterStatus === s ? "#fff" : colors.muted }]}>
                  {s === "all" ? "All" : s}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={st.sortBar}>
            <Text style={[st.sortLabel, { color: colors.muted }]}>Sort:</Text>
            {(["newest", "rating", "name"] as const).map((s) => (
              <TouchableOpacity key={s} onPress={() => setSortBy(s)}>
                <Text style={[st.sortOptionText, { color: sortBy === s ? colors.primary : colors.muted, fontWeight: sortBy === s ? "700" : "400" }]}>
                  {s === "rating" ? "Weighted Avg" : s}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <FlatList
            data={filteredSubmissions}
            keyExtractor={(item) => item.id.toString()}
            numColumns={2}
            columnWrapperStyle={st.gridRow}
            contentContainerStyle={st.gridContent}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => openDetail(item.id)}
                onLongPress={() => toggleSelect(item.id)}
                style={[st.gridCard, {
                  backgroundColor: colors.surface,
                  borderColor: selectedIds.includes(item.id) ? colors.primary : colors.border,
                  borderWidth: selectedIds.includes(item.id) ? 2 : 1,
                }]}
              >
                <View style={[st.gridThumb, { backgroundColor: "#1a1a2e" }]}>
                  <IconSymbol name="play.circle.fill" size={28} color="rgba(255,255,255,0.6)" />
                  {selectedIds.includes(item.id) && (
                    <View style={[st.selectBadge, { backgroundColor: colors.primary }]}>
                      <IconSymbol name="checkmark" size={12} color="#fff" />
                    </View>
                  )}
                </View>
                <View style={st.gridCardInfo}>
                  <Text style={[st.gridActorName, { color: colors.foreground }]} numberOfLines={1}>{item.actorName}</Text>
                  <View style={st.gridMetaRow}>
                    <StatusBadge status={item.status} />
                    <View style={st.gridRatingRow}>
                      <IconSymbol name="star.fill" size={12} color="#FFD60A" />
                      <Text style={[st.gridRating, { color: colors.muted }]}>{formatWeightedAvg(item.rating)}</Text>
                    </View>
                  </View>
                  {/* Quick Tags */}
                  {(activeTags[item.id] || []).length > 0 && (
                    <View style={st.gridTagsRow}>
                      {(activeTags[item.id] || []).slice(0, 2).map((tag) => {
                        const t = QUICK_TAGS.find((qt) => qt.label === tag);
                        return (
                          <View key={tag} style={[st.miniTag, { backgroundColor: (t?.color || colors.muted) + "18" }]}>
                            <Text style={[st.miniTagText, { color: t?.color || colors.muted }]}>{tag}</Text>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
                <View style={st.gridActions}>
                  <TouchableOpacity onPress={() => updateStatus(item.id, "shortlisted")} style={[st.quickAction, { backgroundColor: "#FFD60A20" }]}>
                    <IconSymbol name="star.fill" size={14} color="#FFD60A" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => updateStatus(item.id, "rejected")} style={[st.quickAction, { backgroundColor: colors.error + "15" }]}>
                    <IconSymbol name="hand.thumbsdown.fill" size={14} color={colors.error} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={st.emptyState}>
                <IconSymbol name="tray.fill" size={40} color={colors.muted} />
                <Text style={[st.emptyText, { color: colors.muted }]}>No submissions found</Text>
              </View>
            }
          />
        </View>
      )}

      {/* ═══ DETAIL TAB ═════════════════════════════════════ */}
      {activeTab === "detail" && detailSubmission && (
        <ScrollView contentContainerStyle={st.detailContainer} showsVerticalScrollIndicator={false}>
          {/* Video Player */}
          <View style={[st.videoPlayer, { backgroundColor: "#000" }]}>
            <View style={st.videoPlaceholder}>
              <IconSymbol name="play.circle.fill" size={48} color="rgba(255,255,255,0.5)" />
              <Text style={st.videoPlaceholderText}>Self-Tape Video</Text>
            </View>
            <View style={st.playbackControls}>
              <TouchableOpacity style={st.playbackBtn}>
                <IconSymbol name="backward.fill" size={18} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={[st.playbackBtn, st.playPauseBtn]}>
                <IconSymbol name="play.fill" size={24} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={st.playbackBtn}>
                <IconSymbol name="forward.fill" size={18} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Playback Speed */}
            <TouchableOpacity
              onPress={() => setShowSpeedPicker(!showSpeedPicker)}
              style={st.speedBadge}
            >
              <Text style={st.speedBadgeText}>{playbackSpeed}x</Text>
            </TouchableOpacity>

            {showSpeedPicker && (
              <View style={st.speedPicker}>
                {PLAYBACK_SPEEDS.map((spd) => (
                  <TouchableOpacity
                    key={spd}
                    onPress={() => { setPlaybackSpeed(spd); setShowSpeedPicker(false); }}
                    style={[st.speedOption, playbackSpeed === spd && { backgroundColor: colors.primary + "30" }]}
                  >
                    <Text style={[st.speedOptionText, { color: playbackSpeed === spd ? colors.primary : "#fff" }]}>{spd}x</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <View style={st.videoTimeline}>
              <View style={[st.videoTimelineFill, { width: "35%", backgroundColor: colors.primary }]} />
            </View>
          </View>

          {/* Actor Profile Card */}
          <View style={[st.profileCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={st.profileHeader}>
              <View style={[st.profileAvatar, { backgroundColor: colors.primary + "20" }]}>
                <Text style={[st.profileInitial, { color: colors.primary }]}>
                  {detailSubmission.actorName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={st.profileInfo}>
                <Text style={[st.profileName, { color: colors.foreground }]}>{detailSubmission.actorName}</Text>
                <Text style={[st.profileEmail, { color: colors.muted }]}>{detailSubmission.actorEmail}</Text>
                <StatusBadge status={detailSubmission.status} />
              </View>
            </View>
            {detailSubmission.notes && (
              <View style={[st.notesSection, { borderTopColor: colors.border }]}>
                <Text style={[st.notesLabel, { color: colors.muted }]}>Actor's Notes</Text>
                <Text style={[st.notesText, { color: colors.foreground }]}>{detailSubmission.notes}</Text>
              </View>
            )}
          </View>

          {/* Quick Tags */}
          <View style={[st.tagsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[st.cardTitle, { color: colors.foreground }]}>Quick Tags</Text>
            <View style={st.tagsGrid}>
              {QUICK_TAGS.map((tag) => {
                const isActive = (activeTags[detailSubmission.id] || []).includes(tag.label);
                return (
                  <TouchableOpacity
                    key={tag.label}
                    onPress={() => toggleTag(detailSubmission.id, tag.label)}
                    style={[
                      st.tagChip,
                      { borderColor: isActive ? tag.color : colors.border },
                      isActive && { backgroundColor: tag.color + "15" },
                    ]}
                  >
                    <IconSymbol name={tag.icon as any} size={14} color={isActive ? tag.color : colors.muted} />
                    <Text style={[st.tagChipText, { color: isActive ? tag.color : colors.muted }]}>{tag.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Rating Rubric with Weighted Average */}
          <View style={[st.ratingCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={st.ratingHeader}>
              <Text style={[st.cardTitle, { color: colors.foreground }]}>Rating Rubric</Text>
              <View style={st.weightedAvgBadge}>
                <Text style={[st.weightedAvgLabel, { color: colors.muted }]}>Weighted</Text>
                <Text style={[st.weightedAvgValue, { color: colors.primary }]}>{formatWeightedAvg(currentRating)}</Text>
              </View>
            </View>

            {RATING_CATEGORIES.map((cat) => (
              <View key={cat.key} style={st.ratingRow}>
                <View style={st.ratingLabelRow}>
                  <IconSymbol name={cat.icon as any} size={16} color={colors.muted} />
                  <Text style={[st.ratingLabel, { color: colors.foreground }]}>{cat.label}</Text>
                  <Text style={[st.ratingWeight, { color: colors.muted }]}>{Math.round(cat.weight * 100)}%</Text>
                </View>
                <StarRating
                  value={currentRating[cat.key]}
                  onChange={(v) => setCurrentRating((prev) => ({ ...prev, [cat.key]: v }))}
                  size={22}
                />
              </View>
            ))}
          </View>

          {/* Timestamped Notes */}
          <View style={[st.tsNotesCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[st.cardTitle, { color: colors.foreground }]}>Timestamped Notes</Text>
            <Text style={[st.tsNotesDesc, { color: colors.muted }]}>Notes auto-save and are private to your team.</Text>

            {/* Existing notes */}
            {(timestampedNotes[detailSubmission.id] || []).map((note) => (
              <View key={note.id} style={[st.tsNoteItem, { borderColor: colors.border }]}>
                <View style={[st.tsTimeBadge, { backgroundColor: colors.primary + "15" }]}>
                  <Text style={[st.tsTimeText, { color: colors.primary }]}>{formatTime(note.time)}</Text>
                </View>
                <Text style={[st.tsNoteText, { color: colors.foreground }]}>{note.text}</Text>
              </View>
            ))}

            {/* Add note */}
            <View style={st.tsNoteInput}>
              <View style={[st.tsTimeBadge, { backgroundColor: colors.primary + "15" }]}>
                <Text style={[st.tsTimeText, { color: colors.primary }]}>{formatTime(currentPlaybackTime)}</Text>
              </View>
              <TextInput
                style={[st.tsInput, { borderColor: colors.border, color: colors.foreground }]}
                value={newTimestampNote}
                onChangeText={setNewTimestampNote}
                placeholder="Add note at current time..."
                placeholderTextColor={colors.muted}
                returnKeyType="done"
                onSubmitEditing={() => addTimestampedNote(detailSubmission.id)}
              />
              <TouchableOpacity
                onPress={() => addTimestampedNote(detailSubmission.id)}
                style={[st.tsAddBtn, { backgroundColor: colors.primary }]}
              >
                <IconSymbol name="plus" size={14} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Producer Notes (free-form) */}
          <View style={[st.notesCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[st.cardTitle, { color: colors.foreground }]}>Producer Notes</Text>
            <TextInput
              style={[st.notesInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
              value={producerNotes}
              onChangeText={setProducerNotes}
              placeholder="General notes about this actor..."
              placeholderTextColor={colors.muted}
              multiline
              textAlignVertical="top"
            />
          </View>

          {/* Action Buttons — Enhanced */}
          <View style={st.actionButtons}>
            <TouchableOpacity onPress={() => updateStatus(detailSubmission.id, "shortlisted")} style={[st.actionBtn, { backgroundColor: "#FFD60A" }]}>
              <IconSymbol name="star.fill" size={16} color="#000" />
              <Text style={[st.actionBtnText, { color: "#000" }]}>Shortlist</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => updateStatus(detailSubmission.id, "callback")} style={[st.actionBtn, { backgroundColor: colors.success }]}>
              <IconSymbol name="phone.fill" size={16} color="#fff" />
              <Text style={st.actionBtnText}>Callback</Text>
            </TouchableOpacity>
          </View>

          <View style={st.actionButtons}>
            <TouchableOpacity onPress={() => hireAndCreateContract(detailSubmission)} style={[st.actionBtn, { backgroundColor: colors.primary }]}>
              <IconSymbol name="checkmark.seal.fill" size={16} color="#fff" />
              <Text style={st.actionBtnText}>Hire + Contract</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowRetakeModal(true)} style={[st.actionBtn, { backgroundColor: "#8B5CF6" }]}>
              <IconSymbol name="arrow.counterclockwise" size={16} color="#fff" />
              <Text style={st.actionBtnText}>Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => updateStatus(detailSubmission.id, "rejected")} style={[st.actionBtn, { backgroundColor: colors.error }]}>
              <IconSymbol name="xmark" size={16} color="#fff" />
              <Text style={st.actionBtnText}>Pass</Text>
            </TouchableOpacity>
          </View>

          {/* Navigation */}
          <View style={st.navRow}>
            <TouchableOpacity
              onPress={() => {
                const idx = filteredSubmissions.findIndex((s) => s.id === detailId);
                if (idx > 0) setDetailId(filteredSubmissions[idx - 1].id);
              }}
              style={[st.navBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <IconSymbol name="chevron.left" size={18} color={colors.foreground} />
              <Text style={[st.navBtnText, { color: colors.foreground }]}>Previous</Text>
            </TouchableOpacity>
            <Text style={[st.navCounter, { color: colors.muted }]}>
              {filteredSubmissions.findIndex((s) => s.id === detailId) + 1} / {filteredSubmissions.length}
            </Text>
            <TouchableOpacity
              onPress={() => {
                const idx = filteredSubmissions.findIndex((s) => s.id === detailId);
                if (idx < filteredSubmissions.length - 1) setDetailId(filteredSubmissions[idx + 1].id);
              }}
              style={[st.navBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <Text style={[st.navBtnText, { color: colors.foreground }]}>Next</Text>
              <IconSymbol name="chevron.right" size={18} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          {/* Request Retake Modal */}
          <Modal visible={showRetakeModal} transparent animationType="slide">
            <View style={st.modalOverlay}>
              <View style={[st.modalContent, { backgroundColor: colors.background }]}>
                <View style={st.modalHeader}>
                  <Text style={[st.modalTitle, { color: colors.foreground }]}>Request Retake</Text>
                  <TouchableOpacity onPress={() => setShowRetakeModal(false)} style={st.modalClose}>
                    <IconSymbol name="xmark" size={20} color={colors.foreground} />
                  </TouchableOpacity>
                </View>
                <Text style={[st.modalDesc, { color: colors.muted }]}>
                  Send specific feedback to {detailSubmission.actorName} requesting a new self-tape.
                </Text>
                <TextInput
                  style={[st.retakeInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]}
                  value={retakeFeedback}
                  onChangeText={setRetakeFeedback}
                  placeholder="What should the actor improve or change? Be specific..."
                  placeholderTextColor={colors.muted}
                  multiline
                  textAlignVertical="top"
                />
                <View style={st.retakeActions}>
                  <TouchableOpacity onPress={() => setShowRetakeModal(false)} style={[st.retakeCancelBtn, { borderColor: colors.border }]}>
                    <Text style={[st.retakeCancelText, { color: colors.foreground }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={sendRetakeRequest}
                    style={[st.retakeSendBtn, { backgroundColor: "#8B5CF6" }, !retakeFeedback.trim() && { opacity: 0.5 }]}
                    disabled={!retakeFeedback.trim()}
                  >
                    <IconSymbol name="paperplane.fill" size={16} color="#fff" />
                    <Text style={st.retakeSendText}>Send Request</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </ScrollView>
      )}

      {activeTab === "detail" && !detailSubmission && (
        <View style={st.emptyState}>
          <IconSymbol name="person.fill" size={40} color={colors.muted} />
          <Text style={[st.emptyText, { color: colors.muted }]}>Select a submission from the grid to review</Text>
          <TouchableOpacity onPress={() => setActiveTab("grid")} style={[st.goBackBtn, { backgroundColor: colors.primary }]}>
            <Text style={st.goBackBtnText}>Go to Grid</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ═══ COMPARE TAB ════════════════════════════════════ */}
      {activeTab === "compare" && (
        <ScrollView contentContainerStyle={st.compareContainer} showsVerticalScrollIndicator={false}>
          {compareSubmissions.length < 2 ? (
            <View style={st.emptyState}>
              <IconSymbol name="rectangle.split.3x1" size={40} color={colors.muted} />
              <Text style={[st.emptyText, { color: colors.muted }]}>Select 2-3 submissions from the grid to compare</Text>
              <TouchableOpacity onPress={() => setActiveTab("grid")} style={[st.goBackBtn, { backgroundColor: colors.primary }]}>
                <Text style={st.goBackBtnText}>Select Submissions</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={st.compareVideos}>
                {compareSubmissions.map((sub) => (
                  <View key={sub.id} style={[st.compareVideoCard, { flex: 1 }]}>
                    <View style={[st.compareThumb, { backgroundColor: "#1a1a2e" }]}>
                      <IconSymbol name="play.circle.fill" size={24} color="rgba(255,255,255,0.5)" />
                    </View>
                    <Text style={[st.compareActorName, { color: colors.foreground }]} numberOfLines={1}>{sub.actorName}</Text>
                  </View>
                ))}
              </View>

              {/* Synced controls with speed */}
              <View style={st.syncControls}>
                <TouchableOpacity style={[st.syncBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <IconSymbol name="backward.fill" size={16} color={colors.foreground} />
                </TouchableOpacity>
                <TouchableOpacity style={[st.syncBtn, st.syncPlayBtn, { backgroundColor: colors.primary }]}>
                  <IconSymbol name="play.fill" size={20} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={[st.syncBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <IconSymbol name="forward.fill" size={16} color={colors.foreground} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    const idx = PLAYBACK_SPEEDS.indexOf(playbackSpeed);
                    setPlaybackSpeed(PLAYBACK_SPEEDS[(idx + 1) % PLAYBACK_SPEEDS.length]);
                  }}
                  style={[st.syncSpeedBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <Text style={[st.syncSpeedText, { color: colors.primary }]}>{playbackSpeed}x</Text>
                </TouchableOpacity>
              </View>

              {/* Comparison table with weighted avg */}
              <View style={[st.compareTable, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[st.compareTableTitle, { color: colors.foreground }]}>Side-by-Side Comparison</Text>

                <View style={[st.compareRow, { borderBottomColor: colors.border }]}>
                  <View style={st.compareLabel} />
                  {compareSubmissions.map((sub) => (
                    <View key={sub.id} style={st.compareCell}>
                      <Text style={[st.compareCellHeader, { color: colors.primary }]} numberOfLines={1}>
                        {sub.actorName.split(" ")[0]}
                      </Text>
                    </View>
                  ))}
                </View>

                {RATING_CATEGORIES.map((cat) => (
                  <View key={cat.key} style={[st.compareRow, { borderBottomColor: colors.border }]}>
                    <View style={st.compareLabel}>
                      <Text style={[st.compareLabelText, { color: colors.muted }]}>{cat.label} ({Math.round(cat.weight * 100)}%)</Text>
                    </View>
                    {compareSubmissions.map((sub) => (
                      <View key={sub.id} style={st.compareCell}>
                        <View style={st.miniStars}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <IconSymbol key={star} name={star <= sub.rating[cat.key] ? "star.fill" : "star"} size={12} color={star <= sub.rating[cat.key] ? "#FFD60A" : colors.border} />
                          ))}
                        </View>
                      </View>
                    ))}
                  </View>
                ))}

                <View style={[st.compareRow, { borderTopColor: colors.border, borderTopWidth: 1 }]}>
                  <View style={st.compareLabel}>
                    <Text style={[st.compareLabelText, { color: colors.foreground, fontWeight: "700" }]}>Weighted Avg</Text>
                  </View>
                  {compareSubmissions.map((sub) => (
                    <View key={sub.id} style={st.compareCell}>
                      <Text style={[st.compareAvg, { color: colors.primary }]}>{formatWeightedAvg(sub.rating)}</Text>
                    </View>
                  ))}
                </View>

                {/* Tags row */}
                <View style={[st.compareRow, { borderTopColor: colors.border, borderTopWidth: 1 }]}>
                  <View style={st.compareLabel}>
                    <Text style={[st.compareLabelText, { color: colors.muted }]}>Tags</Text>
                  </View>
                  {compareSubmissions.map((sub) => (
                    <View key={sub.id} style={st.compareCell}>
                      <Text style={[st.compareTagsText, { color: colors.muted }]} numberOfLines={2}>
                        {(activeTags[sub.id] || []).join(", ") || "—"}
                      </Text>
                    </View>
                  ))}
                </View>

                <View style={[st.compareRow, { borderTopColor: colors.border, borderTopWidth: 1 }]}>
                  <View style={st.compareLabel}>
                    <Text style={[st.compareLabelText, { color: colors.muted }]}>Status</Text>
                  </View>
                  {compareSubmissions.map((sub) => (
                    <View key={sub.id} style={st.compareCell}>
                      <StatusBadge status={sub.status} />
                    </View>
                  ))}
                </View>
              </View>

              {/* Quick actions with Hire→Contract */}
              <View style={st.compareActions}>
                {compareSubmissions.map((sub) => (
                  <View key={sub.id} style={[st.compareActionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[st.compareActionName, { color: colors.foreground }]} numberOfLines={1}>{sub.actorName}</Text>
                    <View style={st.compareActionBtns}>
                      <TouchableOpacity onPress={() => updateStatus(sub.id, "shortlisted")} style={[st.miniAction, { backgroundColor: "#FFD60A20" }]}>
                        <IconSymbol name="star.fill" size={14} color="#FFD60A" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => hireAndCreateContract(sub)} style={[st.miniAction, { backgroundColor: colors.primary + "20" }]}>
                        <IconSymbol name="checkmark.seal.fill" size={14} color={colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => updateStatus(sub.id, "rejected")} style={[st.miniAction, { backgroundColor: colors.error + "15" }]}>
                        <IconSymbol name="xmark" size={14} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}
        </ScrollView>
      )}
    </ScreenContainer>
  );
}

// ─── Styles ─────────────────────────────────────────────────
const st = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 10, gap: 10 },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "800" },
  headerSubtitle: { fontSize: 12, marginTop: 1 },
  headerActions: { flexDirection: "row", gap: 8 },
  compareBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  compareBtnText: { color: "#fff", fontSize: 12, fontWeight: "700" },

  tabBar: { flexDirection: "row", borderBottomWidth: 1, paddingHorizontal: 8 },
  tab: { flex: 1, alignItems: "center", paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabLabel: { fontSize: 12, fontWeight: "600" },

  gridContainer: { flex: 1 },
  filterBar: { paddingHorizontal: 16, paddingTop: 12 },
  searchBox: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  searchInput: { flex: 1, fontSize: 14 },
  statusFilters: { paddingHorizontal: 12, gap: 6, paddingVertical: 10 },
  statusFilterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1 },
  statusFilterText: { fontSize: 12, fontWeight: "600", textTransform: "capitalize" as const },
  sortBar: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingBottom: 8 },
  sortLabel: { fontSize: 11, fontWeight: "600" },
  sortOptionText: { fontSize: 12, textTransform: "capitalize" as const },
  gridRow: { gap: 10, paddingHorizontal: 16 },
  gridContent: { paddingBottom: 100, gap: 10 },
  gridCard: { flex: 1, borderRadius: 14, overflow: "hidden" },
  gridThumb: { height: 100, alignItems: "center", justifyContent: "center", position: "relative" as const },
  selectBadge: { position: "absolute" as const, top: 8, right: 8, width: 22, height: 22, borderRadius: 11, alignItems: "center" as const, justifyContent: "center" as const },
  gridCardInfo: { padding: 10, gap: 4 },
  gridActorName: { fontSize: 13, fontWeight: "700" },
  gridMetaRow: { flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "space-between" as const },
  gridRatingRow: { flexDirection: "row" as const, alignItems: "center" as const, gap: 4 },
  gridRating: { fontSize: 11, fontWeight: "600" },
  gridTagsRow: { flexDirection: "row" as const, gap: 4, flexWrap: "wrap" as const, marginTop: 2 },
  miniTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  miniTagText: { fontSize: 9, fontWeight: "700" },
  gridActions: { flexDirection: "row" as const, gap: 6, paddingHorizontal: 10, paddingBottom: 10 },
  quickAction: { width: 32, height: 32, borderRadius: 16, alignItems: "center" as const, justifyContent: "center" as const },

  statusBadge: { alignSelf: "flex-start" as const, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  statusBadgeText: { fontSize: 10, fontWeight: "700", textTransform: "capitalize" as const },

  detailContainer: { paddingHorizontal: 16, paddingBottom: 100, gap: 14 },
  videoPlayer: { borderRadius: 14, overflow: "hidden", height: VIDEO_H, position: "relative" as const },
  videoPlaceholder: { flex: 1, alignItems: "center" as const, justifyContent: "center" as const, gap: 6 },
  videoPlaceholderText: { color: "rgba(255,255,255,0.4)", fontSize: 13 },
  playbackControls: { position: "absolute" as const, bottom: 20, left: 0, right: 0, flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "center" as const, gap: 24 },
  playbackBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center" as const, justifyContent: "center" as const },
  playPauseBtn: { width: 52, height: 52, borderRadius: 26 },
  speedBadge: { position: "absolute" as const, top: 12, right: 12, backgroundColor: "rgba(0,0,0,0.6)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  speedBadgeText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  speedPicker: { position: "absolute" as const, top: 40, right: 12, backgroundColor: "rgba(0,0,0,0.85)", borderRadius: 10, padding: 4, gap: 2 },
  speedOption: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  speedOptionText: { fontSize: 13, fontWeight: "600" },
  videoTimeline: { position: "absolute" as const, bottom: 0, left: 0, right: 0, height: 3, backgroundColor: "rgba(255,255,255,0.2)" },
  videoTimelineFill: { height: "100%" as const },

  profileCard: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 12 },
  profileHeader: { flexDirection: "row" as const, gap: 12, alignItems: "center" as const },
  profileAvatar: { width: 48, height: 48, borderRadius: 24, alignItems: "center" as const, justifyContent: "center" as const },
  profileInitial: { fontSize: 20, fontWeight: "800" },
  profileInfo: { flex: 1, gap: 4 },
  profileName: { fontSize: 17, fontWeight: "700" },
  profileEmail: { fontSize: 12 },
  notesSection: { borderTopWidth: 1, paddingTop: 12 },
  notesLabel: { fontSize: 11, fontWeight: "600", marginBottom: 4 },
  notesText: { fontSize: 14, lineHeight: 20 },

  tagsCard: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 10 },
  cardTitle: { fontSize: 16, fontWeight: "700" },
  tagsGrid: { flexDirection: "row" as const, flexWrap: "wrap" as const, gap: 8 },
  tagChip: { flexDirection: "row" as const, alignItems: "center" as const, gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5 },
  tagChipText: { fontSize: 12, fontWeight: "600" },

  ratingCard: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 12 },
  ratingHeader: { flexDirection: "row" as const, justifyContent: "space-between" as const, alignItems: "center" as const },
  weightedAvgBadge: { alignItems: "flex-end" as const },
  weightedAvgLabel: { fontSize: 10, fontWeight: "600" },
  weightedAvgValue: { fontSize: 20, fontWeight: "800" },
  ratingRow: { flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "space-between" as const },
  ratingLabelRow: { flexDirection: "row" as const, alignItems: "center" as const, gap: 8 },
  ratingLabel: { fontSize: 14, fontWeight: "600" },
  ratingWeight: { fontSize: 10, fontWeight: "500" },
  starRow: { flexDirection: "row" as const, gap: 2 },
  starBtn: { padding: 2 },

  tsNotesCard: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 10 },
  tsNotesDesc: { fontSize: 12, lineHeight: 17 },
  tsNoteItem: { flexDirection: "row" as const, alignItems: "flex-start" as const, gap: 10, paddingVertical: 8, borderBottomWidth: 0.5 },
  tsTimeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, minWidth: 42, alignItems: "center" as const },
  tsTimeText: { fontSize: 11, fontWeight: "700", fontFamily: "monospace" },
  tsNoteText: { fontSize: 13, lineHeight: 19, flex: 1 },
  tsNoteInput: { flexDirection: "row" as const, alignItems: "center" as const, gap: 8, marginTop: 4 },
  tsInput: { flex: 1, borderBottomWidth: 1, paddingVertical: 6, fontSize: 13 },
  tsAddBtn: { width: 30, height: 30, borderRadius: 15, alignItems: "center" as const, justifyContent: "center" as const },

  notesCard: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 10 },
  notesInput: { borderRadius: 10, borderWidth: 1, padding: 12, fontSize: 14, minHeight: 80, lineHeight: 20 },

  actionButtons: { flexDirection: "row" as const, gap: 8 },
  actionBtn: { flex: 1, flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "center" as const, gap: 4, paddingVertical: 12, borderRadius: 12 },
  actionBtnText: { color: "#fff", fontSize: 12, fontWeight: "700" },

  navRow: { flexDirection: "row" as const, gap: 10, alignItems: "center" as const },
  navBtn: { flex: 1, flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "center" as const, gap: 6, paddingVertical: 12, borderRadius: 12, borderWidth: 1 },
  navBtnText: { fontSize: 14, fontWeight: "600" },
  navCounter: { fontSize: 13, fontWeight: "600" },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" as const },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40 },
  modalHeader: { flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "space-between" as const, marginBottom: 12 },
  modalTitle: { fontSize: 20, fontWeight: "800" },
  modalClose: { padding: 8 },
  modalDesc: { fontSize: 14, lineHeight: 20, marginBottom: 12 },
  retakeInput: { borderRadius: 12, borderWidth: 1, padding: 14, fontSize: 15, minHeight: 120, lineHeight: 22 },
  retakeActions: { flexDirection: "row" as const, gap: 12, marginTop: 16 },
  retakeCancelBtn: { flex: 1, alignItems: "center" as const, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5 },
  retakeCancelText: { fontSize: 15, fontWeight: "600" },
  retakeSendBtn: { flex: 2, flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "center" as const, gap: 8, paddingVertical: 14, borderRadius: 12 },
  retakeSendText: { color: "#fff", fontSize: 15, fontWeight: "700" },

  // Compare
  compareContainer: { paddingHorizontal: 16, paddingBottom: 100, gap: 16, paddingTop: 12 },
  compareVideos: { flexDirection: "row" as const, gap: 8 },
  compareVideoCard: { gap: 6 },
  compareThumb: { height: 80, borderRadius: 10, alignItems: "center" as const, justifyContent: "center" as const },
  compareActorName: { fontSize: 12, fontWeight: "700", textAlign: "center" as const },
  syncControls: { flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "center" as const, gap: 12 },
  syncBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: "center" as const, justifyContent: "center" as const },
  syncPlayBtn: { width: 48, height: 48, borderRadius: 24, borderWidth: 0 },
  syncSpeedBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, borderWidth: 1 },
  syncSpeedText: { fontSize: 13, fontWeight: "700" },

  compareTable: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 0 },
  compareTableTitle: { fontSize: 16, fontWeight: "700", marginBottom: 10 },
  compareRow: { flexDirection: "row" as const, alignItems: "center" as const, paddingVertical: 8, borderBottomWidth: 0.5 },
  compareLabel: { width: 80 },
  compareLabelText: { fontSize: 11, fontWeight: "600" },
  compareCell: { flex: 1, alignItems: "center" as const },
  compareCellHeader: { fontSize: 13, fontWeight: "700" },
  miniStars: { flexDirection: "row" as const, gap: 1 },
  compareAvg: { fontSize: 16, fontWeight: "800" },
  compareTagsText: { fontSize: 10, textAlign: "center" as const },

  compareActions: { flexDirection: "row" as const, gap: 8 },
  compareActionCard: { flex: 1, borderRadius: 12, borderWidth: 1, padding: 10, gap: 8, alignItems: "center" as const },
  compareActionName: { fontSize: 12, fontWeight: "700" },
  compareActionBtns: { flexDirection: "row" as const, gap: 8 },
  miniAction: { width: 32, height: 32, borderRadius: 16, alignItems: "center" as const, justifyContent: "center" as const },

  emptyState: { flex: 1, alignItems: "center" as const, justifyContent: "center" as const, paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 14, textAlign: "center" as const, paddingHorizontal: 40 },
  goBackBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, marginTop: 8 },
  goBackBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  exportBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  exportBtnText: { fontSize: 12, fontWeight: "600" },
});
