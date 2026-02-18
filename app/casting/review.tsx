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
import { Spacing, Radius, Typography } from "@/constants/design-tokens";

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

interface ReviewSubmission {
  id: number;
  actorName: string;
  actorEmail: string;
  status: string;
  videoUrl: string | null;
  notes: string;
  createdAt: string;
  rating: Rating;
  producerNotes: string;
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  submitted: { bg: "#DBEAFE", text: "#1D4ED8" },
  reviewed: { bg: "#E0E7FF", text: "#4338CA" },
  shortlisted: { bg: "#FEF3C7", text: "#B45309" },
  callback: { bg: "#D1FAE5", text: "#065F46" },
  hired: { bg: "#CFFAFE", text: "#0E7490" },
  passed: { bg: "#FEE2E2", text: "#991B1B" },
};

const RATING_CATEGORIES: { key: RatingCategory; label: string; icon: string }[] = [
  { key: "acting", label: "Acting", icon: "theatermasks.fill" },
  { key: "look", label: "Look", icon: "person.fill" },
  { key: "voice", label: "Voice", icon: "mic.fill" },
  { key: "chemistry", label: "Chemistry", icon: "sparkles" },
];

// ─── Component ──────────────────────────────────────────────
export default function ProducerReviewScreen() {
  const { castingId } = useLocalSearchParams<{ castingId: string }>();
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
      status: s.status || "submitted",
      videoUrl: s.videoUrl || null,
      notes: s.notes || "",
      createdAt: s.createdAt || new Date().toISOString(),
      rating: s.rating || { acting: 0, look: 0, voice: 0, chemistry: 0 },
      producerNotes: s.producerNotes || "",
    }));
  }, [submissionsQuery.data]);

  // Filtered & sorted
  const filteredSubmissions = useMemo(() => {
    let result = submissions;
    if (filterStatus !== "all") {
      result = result.filter((s) => s.status === filterStatus);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((s) => s.actorName.toLowerCase().includes(q) || s.actorEmail.toLowerCase().includes(q));
    }
    switch (sortBy) {
      case "rating":
        result = [...result].sort((a, b) => {
          const avgA = Object.values(a.rating).reduce((sum, v) => sum + v, 0) / 4;
          const avgB = Object.values(b.rating).reduce((sum, v) => sum + v, 0) / 4;
          return avgB - avgA;
        });
        break;
      case "name":
        result = [...result].sort((a, b) => a.actorName.localeCompare(b.actorName));
        break;
      default:
        result = [...result].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return result;
  }, [submissions, filterStatus, searchQuery, sortBy]);

  const detailSubmission = useMemo(() => {
    return submissions.find((s) => s.id === detailId);
  }, [submissions, detailId]);

  const compareSubmissions = useMemo(() => {
    return submissions.filter((s) => compareIds.includes(s.id));
  }, [submissions, compareIds]);

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
    updateStatusMutation.mutate({
      submissionId,
      status: status as any,
    });
  }, [updateStatusMutation]);

  const avgRating = useCallback((rating: Rating) => {
    const vals = Object.values(rating);
    const sum = vals.reduce((a, b) => a + b, 0);
    return vals.some((v) => v > 0) ? (sum / vals.filter((v) => v > 0).length).toFixed(1) : "—";
  }, []);

  // ─── Star Rating Component ───────────────────────────────
  const StarRating = useCallback(({ value, onChange, size = 20 }: { value: number; onChange?: (v: number) => void; size?: number }) => (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => onChange?.(star)}
          disabled={!onChange}
          style={styles.starBtn}
        >
          <IconSymbol
            name={star <= value ? "star.fill" : "star"}
            size={size}
            color={star <= value ? "#FFD60A" : colors.border}
          />
        </TouchableOpacity>
      ))}
    </View>
  ), [colors]);

  // ─── Status Badge ─────────────────────────────────────────
  const StatusBadge = useCallback(({ status }: { status: string }) => {
    const sc = STATUS_COLORS[status] || STATUS_COLORS.submitted;
    return (
      <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
        <Text style={[styles.statusBadgeText, { color: sc.text }]}>{status}</Text>
      </View>
    );
  }, []);

  return (
    <ScreenContainer edges={["top", "left", "right"]} className="flex-1">
      {/* ─── Header ──────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <IconSymbol name="chevron.left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Review Submissions</Text>
        <View style={styles.headerActions}>
          {selectedIds.length >= 2 && (
            <TouchableOpacity onPress={startCompare} style={[styles.compareBtn, { backgroundColor: colors.primary }]}>
              <IconSymbol name="rectangle.split.3x1" size={16} color="#fff" />
              <Text style={styles.compareBtnText}>Compare ({selectedIds.length})</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ─── Tab Bar ─────────────────────────────────────── */}
      <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
        {[
          { key: "grid" as const, label: "All Submissions", count: filteredSubmissions.length },
          { key: "detail" as const, label: "Detail View", count: null },
          { key: "compare" as const, label: "Compare", count: compareIds.length || null },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={[styles.tab, activeTab === tab.key && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          >
            <Text style={[styles.tabLabel, { color: activeTab === tab.key ? colors.primary : colors.muted }]}>
              {tab.label}{tab.count !== null ? ` (${tab.count})` : ""}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ─── GRID TAB ────────────────────────────────────── */}
      {activeTab === "grid" && (
        <View style={styles.gridContainer}>
          {/* Search & Filter */}
          <View style={styles.filterBar}>
            <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <IconSymbol name="magnifyingglass" size={16} color={colors.muted} />
              <TextInput
                style={[styles.searchInput, { color: colors.foreground }]}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search actors..."
                placeholderTextColor={colors.muted}
              />
            </View>
          </View>

          {/* Status filters */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statusFilters}>
            {["all", "submitted", "reviewed", "shortlisted", "callback", "hired", "passed"].map((s) => (
              <TouchableOpacity
                key={s}
                onPress={() => setFilterStatus(s)}
                style={[styles.statusFilterChip, {
                  backgroundColor: filterStatus === s ? colors.primary : colors.surface,
                  borderColor: filterStatus === s ? colors.primary : colors.border,
                }]}
              >
                <Text style={[styles.statusFilterText, { color: filterStatus === s ? "#fff" : colors.foreground, textTransform: "capitalize" }]}>
                  {s === "all" ? "All" : s}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Sort */}
          <View style={styles.sortBar}>
            <Text style={[styles.sortLabel, { color: colors.muted }]}>Sort by:</Text>
            {(["newest", "rating", "name"] as const).map((s) => (
              <TouchableOpacity key={s} onPress={() => setSortBy(s)} style={styles.sortOption}>
                <Text style={[styles.sortOptionText, { color: sortBy === s ? colors.primary : colors.muted, fontWeight: sortBy === s ? "700" : "400", textTransform: "capitalize" }]}>
                  {s}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Submissions Grid */}
          <FlatList
            data={filteredSubmissions}
            keyExtractor={(item) => item.id.toString()}
            numColumns={2}
            columnWrapperStyle={styles.gridRow}
            contentContainerStyle={styles.gridContent}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => openDetail(item.id)}
                onLongPress={() => toggleSelect(item.id)}
                style={[styles.gridCard, {
                  backgroundColor: colors.surface,
                  borderColor: selectedIds.includes(item.id) ? colors.primary : colors.border,
                  borderWidth: selectedIds.includes(item.id) ? 2 : 1,
                }]}
              >
                {/* Video thumbnail */}
                <View style={[styles.gridThumb, { backgroundColor: "#1a1a2e" }]}>
                  <IconSymbol name="play.circle.fill" size={28} color="rgba(255,255,255,0.6)" />
                  {selectedIds.includes(item.id) && (
                    <View style={[styles.selectBadge, { backgroundColor: colors.primary }]}>
                      <IconSymbol name="checkmark" size={12} color="#fff" />
                    </View>
                  )}
                </View>

                {/* Actor info */}
                <View style={styles.gridCardInfo}>
                  <Text style={[styles.gridActorName, { color: colors.foreground }]} numberOfLines={1}>
                    {item.actorName}
                  </Text>
                  <StatusBadge status={item.status} />
                  <View style={styles.gridRatingRow}>
                    <IconSymbol name="star.fill" size={12} color="#FFD60A" />
                    <Text style={[styles.gridRating, { color: colors.muted }]}>{avgRating(item.rating)}</Text>
                  </View>
                </View>

                {/* Quick actions */}
                <View style={styles.gridActions}>
                  <TouchableOpacity
                    onPress={() => updateStatus(item.id, "shortlisted")}
                    style={[styles.quickAction, { backgroundColor: "#FFD60A20" }]}
                  >
                    <IconSymbol name="star.fill" size={14} color="#FFD60A" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => updateStatus(item.id, "passed")}
                    style={[styles.quickAction, { backgroundColor: colors.error + "15" }]}
                  >
                    <IconSymbol name="hand.thumbsdown.fill" size={14} color={colors.error} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <IconSymbol name="tray.fill" size={40} color={colors.muted} />
                <Text style={[styles.emptyText, { color: colors.muted }]}>No submissions found</Text>
              </View>
            }
          />
        </View>
      )}

      {/* ─── DETAIL TAB ──────────────────────────────────── */}
      {activeTab === "detail" && detailSubmission && (
        <ScrollView contentContainerStyle={styles.detailContainer} showsVerticalScrollIndicator={false}>
          {/* Video Player */}
          <View style={[styles.videoPlayer, { backgroundColor: "#000" }]}>
            <View style={styles.videoPlaceholder}>
              <IconSymbol name="play.circle.fill" size={48} color="rgba(255,255,255,0.5)" />
              <Text style={styles.videoPlaceholderText}>Self-Tape Video</Text>
            </View>
            {/* Playback controls */}
            <View style={styles.playbackControls}>
              <TouchableOpacity style={styles.playbackBtn}>
                <IconSymbol name="backward.fill" size={18} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.playbackBtn, styles.playPauseBtn]}>
                <IconSymbol name="play.fill" size={24} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.playbackBtn}>
                <IconSymbol name="forward.fill" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
            {/* Timeline */}
            <View style={styles.videoTimeline}>
              <View style={[styles.videoTimelineFill, { width: "35%", backgroundColor: colors.primary }]} />
            </View>
          </View>

          {/* Actor Profile Card */}
          <View style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.profileHeader}>
              <View style={[styles.profileAvatar, { backgroundColor: colors.primary + "20" }]}>
                <Text style={[styles.profileInitial, { color: colors.primary }]}>
                  {detailSubmission.actorName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={[styles.profileName, { color: colors.foreground }]}>{detailSubmission.actorName}</Text>
                <Text style={[styles.profileEmail, { color: colors.muted }]}>{detailSubmission.actorEmail}</Text>
                <StatusBadge status={detailSubmission.status} />
              </View>
            </View>

            {detailSubmission.notes && (
              <View style={[styles.notesSection, { borderTopColor: colors.border }]}>
                <Text style={[styles.notesLabel, { color: colors.muted }]}>Actor's Notes</Text>
                <Text style={[styles.notesText, { color: colors.foreground }]}>{detailSubmission.notes}</Text>
              </View>
            )}
          </View>

          {/* Rating Rubric */}
          <View style={[styles.ratingCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.ratingHeader}>
              <Text style={[styles.ratingTitle, { color: colors.foreground }]}>Rating Rubric</Text>
              <Text style={[styles.ratingAvg, { color: colors.primary }]}>Avg: {avgRating(detailSubmission.rating)}</Text>
            </View>

            {RATING_CATEGORIES.map((cat) => (
              <View key={cat.key} style={styles.ratingRow}>
                <View style={styles.ratingLabelRow}>
                  <IconSymbol name={cat.icon as any} size={16} color={colors.muted} />
                  <Text style={[styles.ratingLabel, { color: colors.foreground }]}>{cat.label}</Text>
                </View>
                <StarRating
                  value={currentRating[cat.key]}
                  onChange={(v) => setCurrentRating((prev) => ({ ...prev, [cat.key]: v }))}
                  size={22}
                />
              </View>
            ))}
          </View>

          {/* Producer Notes */}
          <View style={[styles.notesCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.notesCardTitle, { color: colors.foreground }]}>Producer Notes</Text>
            <TextInput
              style={[styles.notesInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
              value={producerNotes}
              onChangeText={setProducerNotes}
              placeholder="Add notes about this actor..."
              placeholderTextColor={colors.muted}
              multiline
              textAlignVertical="top"
            />
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              onPress={() => updateStatus(detailSubmission.id, "shortlisted")}
              style={[styles.actionBtn, { backgroundColor: "#FFD60A" }]}
            >
              <IconSymbol name="star.fill" size={18} color="#000" />
              <Text style={[styles.actionBtnText, { color: "#000" }]}>Shortlist</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => updateStatus(detailSubmission.id, "callback")}
              style={[styles.actionBtn, { backgroundColor: colors.success }]}
            >
              <IconSymbol name="phone.fill" size={18} color="#fff" />
              <Text style={styles.actionBtnText}>Callback</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => updateStatus(detailSubmission.id, "hired")}
              style={[styles.actionBtn, { backgroundColor: colors.primary }]}
            >
              <IconSymbol name="checkmark.seal.fill" size={18} color="#fff" />
              <Text style={styles.actionBtnText}>Hire</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => updateStatus(detailSubmission.id, "passed")}
              style={[styles.actionBtn, { backgroundColor: colors.error }]}
            >
              <IconSymbol name="xmark" size={18} color="#fff" />
              <Text style={styles.actionBtnText}>Pass</Text>
            </TouchableOpacity>
          </View>

          {/* Navigation between submissions */}
          <View style={styles.navRow}>
            <TouchableOpacity
              onPress={() => {
                const idx = filteredSubmissions.findIndex((s) => s.id === detailId);
                if (idx > 0) setDetailId(filteredSubmissions[idx - 1].id);
              }}
              style={[styles.navBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <IconSymbol name="chevron.left" size={18} color={colors.foreground} />
              <Text style={[styles.navBtnText, { color: colors.foreground }]}>Previous</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                const idx = filteredSubmissions.findIndex((s) => s.id === detailId);
                if (idx < filteredSubmissions.length - 1) setDetailId(filteredSubmissions[idx + 1].id);
              }}
              style={[styles.navBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <Text style={[styles.navBtnText, { color: colors.foreground }]}>Next</Text>
              <IconSymbol name="chevron.right" size={18} color={colors.foreground} />
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {activeTab === "detail" && !detailSubmission && (
        <View style={styles.emptyState}>
          <IconSymbol name="person.fill" size={40} color={colors.muted} />
          <Text style={[styles.emptyText, { color: colors.muted }]}>Select a submission from the grid to review</Text>
          <TouchableOpacity onPress={() => setActiveTab("grid")} style={[styles.goBackBtn, { backgroundColor: colors.primary }]}>
            <Text style={styles.goBackBtnText}>Go to Grid</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ─── COMPARE TAB ─────────────────────────────────── */}
      {activeTab === "compare" && (
        <ScrollView contentContainerStyle={styles.compareContainer} showsVerticalScrollIndicator={false}>
          {compareSubmissions.length < 2 ? (
            <View style={styles.emptyState}>
              <IconSymbol name="rectangle.split.3x1" size={40} color={colors.muted} />
              <Text style={[styles.emptyText, { color: colors.muted }]}>Select 2-3 submissions from the grid to compare side-by-side</Text>
              <TouchableOpacity onPress={() => setActiveTab("grid")} style={[styles.goBackBtn, { backgroundColor: colors.primary }]}>
                <Text style={styles.goBackBtnText}>Select Submissions</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Synced video players */}
              <View style={styles.compareVideos}>
                {compareSubmissions.map((sub) => (
                  <View key={sub.id} style={[styles.compareVideoCard, { flex: 1 }]}>
                    <View style={[styles.compareThumb, { backgroundColor: "#1a1a2e" }]}>
                      <IconSymbol name="play.circle.fill" size={24} color="rgba(255,255,255,0.5)" />
                    </View>
                    <Text style={[styles.compareActorName, { color: colors.foreground }]} numberOfLines={1}>
                      {sub.actorName}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Synced playback controls */}
              <View style={styles.syncControls}>
                <TouchableOpacity style={[styles.syncBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <IconSymbol name="backward.fill" size={16} color={colors.foreground} />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.syncBtn, styles.syncPlayBtn, { backgroundColor: colors.primary }]}>
                  <IconSymbol name="play.fill" size={20} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.syncBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <IconSymbol name="forward.fill" size={16} color={colors.foreground} />
                </TouchableOpacity>
              </View>

              {/* Comparison table */}
              <View style={[styles.compareTable, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.compareTableTitle, { color: colors.foreground }]}>Side-by-Side Comparison</Text>

                {/* Header row */}
                <View style={[styles.compareRow, { borderBottomColor: colors.border }]}>
                  <View style={styles.compareLabel} />
                  {compareSubmissions.map((sub) => (
                    <View key={sub.id} style={styles.compareCell}>
                      <Text style={[styles.compareCellHeader, { color: colors.primary }]} numberOfLines={1}>
                        {sub.actorName.split(" ")[0]}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Rating rows */}
                {RATING_CATEGORIES.map((cat) => (
                  <View key={cat.key} style={[styles.compareRow, { borderBottomColor: colors.border }]}>
                    <View style={styles.compareLabel}>
                      <Text style={[styles.compareLabelText, { color: colors.muted }]}>{cat.label}</Text>
                    </View>
                    {compareSubmissions.map((sub) => (
                      <View key={sub.id} style={styles.compareCell}>
                        <View style={styles.miniStars}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <IconSymbol
                              key={star}
                              name={star <= sub.rating[cat.key] ? "star.fill" : "star"}
                              size={12}
                              color={star <= sub.rating[cat.key] ? "#FFD60A" : colors.border}
                            />
                          ))}
                        </View>
                      </View>
                    ))}
                  </View>
                ))}

                {/* Average row */}
                <View style={styles.compareRow}>
                  <View style={styles.compareLabel}>
                    <Text style={[styles.compareLabelText, { color: colors.foreground, fontWeight: "700" }]}>Average</Text>
                  </View>
                  {compareSubmissions.map((sub) => (
                    <View key={sub.id} style={styles.compareCell}>
                      <Text style={[styles.compareAvg, { color: colors.primary }]}>{avgRating(sub.rating)}</Text>
                    </View>
                  ))}
                </View>

                {/* Status row */}
                <View style={[styles.compareRow, { borderTopColor: colors.border, borderTopWidth: 1 }]}>
                  <View style={styles.compareLabel}>
                    <Text style={[styles.compareLabelText, { color: colors.muted }]}>Status</Text>
                  </View>
                  {compareSubmissions.map((sub) => (
                    <View key={sub.id} style={styles.compareCell}>
                      <StatusBadge status={sub.status} />
                    </View>
                  ))}
                </View>
              </View>

              {/* Quick actions for each */}
              <View style={styles.compareActions}>
                {compareSubmissions.map((sub) => (
                  <View key={sub.id} style={[styles.compareActionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.compareActionName, { color: colors.foreground }]} numberOfLines={1}>{sub.actorName}</Text>
                    <View style={styles.compareActionBtns}>
                      <TouchableOpacity
                        onPress={() => updateStatus(sub.id, "shortlisted")}
                        style={[styles.miniAction, { backgroundColor: "#FFD60A20" }]}
                      >
                        <IconSymbol name="star.fill" size={14} color="#FFD60A" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => updateStatus(sub.id, "hired")}
                        style={[styles.miniAction, { backgroundColor: colors.primary + "20" }]}
                      >
                        <IconSymbol name="checkmark" size={14} color={colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => updateStatus(sub.id, "passed")}
                        style={[styles.miniAction, { backgroundColor: colors.error + "15" }]}
                      >
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
const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 10 },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "800" },
  headerActions: { flexDirection: "row", gap: 8 },
  compareBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  compareBtnText: { color: "#fff", fontSize: 12, fontWeight: "700" },

  tabBar: { flexDirection: "row", borderBottomWidth: 1, paddingHorizontal: 8 },
  tab: { flex: 1, alignItems: "center", paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabLabel: { fontSize: 12, fontWeight: "600" },

  // Grid
  gridContainer: { flex: 1 },
  filterBar: { paddingHorizontal: 16, paddingTop: 12 },
  searchBox: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  searchInput: { flex: 1, fontSize: 14 },
  statusFilters: { paddingHorizontal: 12, gap: 6, paddingVertical: 10 },
  statusFilterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1 },
  statusFilterText: { fontSize: 12, fontWeight: "600" },
  sortBar: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingBottom: 8 },
  sortLabel: { fontSize: 11, fontWeight: "600" },
  sortOption: { paddingVertical: 2 },
  sortOptionText: { fontSize: 12 },
  gridRow: { gap: 10, paddingHorizontal: 16 },
  gridContent: { paddingBottom: 100, gap: 10 },
  gridCard: { flex: 1, borderRadius: 14, overflow: "hidden" },
  gridThumb: { height: 100, alignItems: "center", justifyContent: "center", position: "relative" },
  selectBadge: { position: "absolute", top: 8, right: 8, width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  gridCardInfo: { padding: 10, gap: 4 },
  gridActorName: { fontSize: 13, fontWeight: "700" },
  gridRatingRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  gridRating: { fontSize: 11, fontWeight: "600" },
  gridActions: { flexDirection: "row", gap: 6, paddingHorizontal: 10, paddingBottom: 10 },
  quickAction: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },

  statusBadge: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  statusBadgeText: { fontSize: 10, fontWeight: "700", textTransform: "capitalize" },

  // Detail
  detailContainer: { paddingHorizontal: 16, paddingBottom: 100, gap: 16 },
  videoPlayer: { borderRadius: 14, overflow: "hidden", height: VIDEO_H, position: "relative" },
  videoPlaceholder: { flex: 1, alignItems: "center", justifyContent: "center", gap: 6 },
  videoPlaceholderText: { color: "rgba(255,255,255,0.4)", fontSize: 13 },
  playbackControls: { position: "absolute", bottom: 20, left: 0, right: 0, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 24 },
  playbackBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center" },
  playPauseBtn: { width: 52, height: 52, borderRadius: 26 },
  videoTimeline: { position: "absolute", bottom: 0, left: 0, right: 0, height: 3, backgroundColor: "rgba(255,255,255,0.2)" },
  videoTimelineFill: { height: "100%" },

  profileCard: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 12 },
  profileHeader: { flexDirection: "row", gap: 12, alignItems: "center" },
  profileAvatar: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  profileInitial: { fontSize: 20, fontWeight: "800" },
  profileInfo: { flex: 1, gap: 4 },
  profileName: { fontSize: 17, fontWeight: "700" },
  profileEmail: { fontSize: 12 },
  notesSection: { borderTopWidth: 1, paddingTop: 12 },
  notesLabel: { fontSize: 11, fontWeight: "600", marginBottom: 4 },
  notesText: { fontSize: 14, lineHeight: 20 },

  ratingCard: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 14 },
  ratingHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  ratingTitle: { fontSize: 16, fontWeight: "700" },
  ratingAvg: { fontSize: 16, fontWeight: "800" },
  ratingRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  ratingLabelRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  ratingLabel: { fontSize: 14, fontWeight: "600" },
  starRow: { flexDirection: "row", gap: 2 },
  starBtn: { padding: 2 },

  notesCard: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 10 },
  notesCardTitle: { fontSize: 16, fontWeight: "700" },
  notesInput: { borderRadius: 10, borderWidth: 1, padding: 12, fontSize: 14, minHeight: 80, lineHeight: 20 },

  actionButtons: { flexDirection: "row", gap: 8 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 12, borderRadius: 12 },
  actionBtnText: { color: "#fff", fontSize: 12, fontWeight: "700" },

  navRow: { flexDirection: "row", gap: 10 },
  navBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12, borderRadius: 12, borderWidth: 1 },
  navBtnText: { fontSize: 14, fontWeight: "600" },

  // Compare
  compareContainer: { paddingHorizontal: 16, paddingBottom: 100, gap: 16, paddingTop: 12 },
  compareVideos: { flexDirection: "row", gap: 8 },
  compareVideoCard: { gap: 6 },
  compareThumb: { height: 80, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  compareActorName: { fontSize: 12, fontWeight: "700", textAlign: "center" },
  syncControls: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 16 },
  syncBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  syncPlayBtn: { width: 48, height: 48, borderRadius: 24, borderWidth: 0 },

  compareTable: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 0 },
  compareTableTitle: { fontSize: 16, fontWeight: "700", marginBottom: 10 },
  compareRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8, borderBottomWidth: 0.5 },
  compareLabel: { width: 70 },
  compareLabelText: { fontSize: 12, fontWeight: "600" },
  compareCell: { flex: 1, alignItems: "center" },
  compareCellHeader: { fontSize: 13, fontWeight: "700" },
  miniStars: { flexDirection: "row", gap: 1 },
  compareAvg: { fontSize: 16, fontWeight: "800" },

  compareActions: { flexDirection: "row", gap: 8 },
  compareActionCard: { flex: 1, borderRadius: 12, borderWidth: 1, padding: 10, gap: 8, alignItems: "center" },
  compareActionName: { fontSize: 12, fontWeight: "700" },
  compareActionBtns: { flexDirection: "row", gap: 8 },
  miniAction: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },

  // Empty state
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 14, textAlign: "center", paddingHorizontal: 40 },
  goBackBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, marginTop: 8 },
  goBackBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
});
