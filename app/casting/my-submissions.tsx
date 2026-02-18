import { FlatList, Text, View, TouchableOpacity, ActivityIndicator, RefreshControl, StyleSheet, Alert } from "react-native";
import { useState, useCallback, useMemo } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { router } from "expo-router";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Typography, Spacing, Radius } from "@/constants/design-tokens";

type StatusFilter = "all" | "submitted" | "reviewing" | "shortlisted" | "rejected" | "hired";

const STATUS_CONFIG: Record<string, { label: string; icon: string; colorKey: string }> = {
  submitted: { label: "Submitted", icon: "clock.fill", colorKey: "muted" },
  reviewing: { label: "Under Review", icon: "eye.fill", colorKey: "warning" },
  shortlisted: { label: "Shortlisted", icon: "star.fill", colorKey: "success" },
  rejected: { label: "Passed", icon: "xmark.circle.fill", colorKey: "error" },
  hired: { label: "Hired!", icon: "checkmark.seal.fill", colorKey: "primary" },
};

export default function MySubmissionsScreen() {
  const colors = useColors();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<StatusFilter>("all");

  const { data: submissions, isLoading, refetch } = trpc.casting.mySubmissions.useQuery();
  const withdrawMutation = trpc.casting.withdrawSubmission.useMutation({
    onSuccess: () => {
      refetch();
      Alert.alert("Withdrawn", "Your submission has been withdrawn.");
    },
    onError: (err) => Alert.alert("Error", err.message),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const filtered = useMemo(() => {
    if (!submissions) return [];
    if (filter === "all") return submissions;
    return submissions.filter((s: any) => s.status === filter);
  }, [submissions, filter]);

  const statusCounts = useMemo(() => {
    if (!submissions) return {};
    const counts: Record<string, number> = { all: submissions.length };
    submissions.forEach((s: any) => {
      counts[s.status] = (counts[s.status] || 0) + 1;
    });
    return counts;
  }, [submissions]);

  const getStatusColor = (status: string) => {
    const key = STATUS_CONFIG[status]?.colorKey || "muted";
    return (colors as any)[key] || colors.muted;
  };

  const getDaysAgo = (date: string | Date) => {
    const diff = Date.now() - new Date(date).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    return `${days}d ago`;
  };

  const handleWithdraw = (id: number) => {
    Alert.alert("Withdraw Submission", "Are you sure? This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Withdraw", style: "destructive", onPress: () => withdrawMutation.mutate({ submissionId: id }) },
    ]);
  };

  const filters: { key: StatusFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "submitted", label: "Pending" },
    { key: "reviewing", label: "Reviewing" },
    { key: "shortlisted", label: "Shortlisted" },
    { key: "hired", label: "Hired" },
    { key: "rejected", label: "Passed" },
  ];

  const renderSubmission = ({ item }: { item: any }) => {
    const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.submitted;
    const statusColor = getStatusColor(item.status);
    const canWithdraw = item.status === "submitted";

    return (
      <TouchableOpacity
        onPress={() => router.push(`/casting/${item.castingCallId}` as any)}
        style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
        activeOpacity={0.7}
      >
        {/* Status indicator stripe */}
        <View style={[styles.statusStripe, { backgroundColor: statusColor }]} />

        <View style={styles.cardBody}>
          {/* Header row */}
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]} numberOfLines={2}>
                {item.castingTitle || "Casting Call"}
              </Text>
              <Text style={[styles.cardProducer, { color: colors.muted }]} numberOfLines={1}>
                {item.producerName || "Production Company"}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + "18" }]}>
              <IconSymbol name={cfg.icon as any} size={12} color={statusColor} />
              <Text style={[styles.statusText, { color: statusColor }]}>{cfg.label}</Text>
            </View>
          </View>

          {/* Meta row */}
          <View style={styles.metaRow}>
            <Text style={[styles.metaText, { color: colors.muted }]}>
              Applied {getDaysAgo(item.createdAt)}
            </Text>
            {item.castingBudget && (
              <Text style={[styles.metaText, { color: colors.success }]}>
                ${parseFloat(item.castingBudget).toLocaleString()}
              </Text>
            )}
            {item.castingDeadline && (
              <Text style={[styles.metaText, { color: colors.warning }]}>
                Due {new Date(item.castingDeadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </Text>
            )}
          </View>

          {/* Notes preview */}
          {item.notes && (
            <Text style={[styles.notesPreview, { color: colors.muted }]} numberOfLines={1}>
              {item.notes.split("\n")[0]}
            </Text>
          )}

          {/* Actions */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              onPress={() => router.push(`/casting/${item.castingCallId}` as any)}
              style={[styles.actionBtn, { backgroundColor: colors.primary + "12" }]}
              activeOpacity={0.7}
            >
              <Text style={[styles.actionBtnText, { color: colors.primary }]}>View Casting</Text>
            </TouchableOpacity>
            {item.videoUrl && (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}
                activeOpacity={0.7}
              >
                <IconSymbol name="film" size={14} color={colors.muted} />
                <Text style={[styles.actionBtnText, { color: colors.muted }]}>Self-Tape</Text>
              </TouchableOpacity>
            )}
            {canWithdraw && (
              <TouchableOpacity
                onPress={() => handleWithdraw(item.id)}
                style={[styles.actionBtn, { backgroundColor: colors.error + "10" }]}
                activeOpacity={0.7}
              >
                <Text style={[styles.actionBtnText, { color: colors.error }]}>Withdraw</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <IconSymbol name="arrow.left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.screenTitle, { color: colors.foreground }]}>My Submissions</Text>
        <Text style={[styles.countBadge, { color: colors.muted }]}>
          {submissions?.length || 0}
        </Text>
      </View>

      {/* Summary Stats */}
      {submissions && submissions.length > 0 && (
        <View style={styles.statsRow}>
          {[
            { key: "submitted", label: "Pending", color: colors.muted },
            { key: "reviewing", label: "Reviewing", color: colors.warning },
            { key: "shortlisted", label: "Shortlisted", color: colors.success },
            { key: "hired", label: "Hired", color: colors.primary },
          ].map((s) => (
            <View key={s.key} style={[styles.statChip, { backgroundColor: s.color + "12" }]}>
              <Text style={[styles.statNum, { color: s.color }]}>{statusCounts[s.key] || 0}</Text>
              <Text style={[styles.statLabel, { color: s.color }]}>{s.label}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Filter chips */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={filters}
        renderItem={({ item: f }) => (
          <TouchableOpacity
            onPress={() => setFilter(f.key)}
            style={[
              styles.filterChip,
              {
                backgroundColor: filter === f.key ? colors.primary : colors.surface,
                borderColor: filter === f.key ? colors.primary : colors.border,
              },
            ]}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterText, { color: filter === f.key ? "#fff" : colors.foreground }]}>
              {f.label}
              {statusCounts[f.key] !== undefined ? ` (${statusCounts[f.key]})` : ""}
            </Text>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.filterRow}
      />

      {/* Submissions list */}
      <FlatList
        data={isLoading ? [] : filtered}
        renderItem={renderSubmission}
        keyExtractor={(item: any) => item.id.toString()}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <View style={[styles.emptyContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                {filter !== "all" ? "No Submissions Found" : "No Submissions Yet"}
              </Text>
              <Text style={[styles.emptyMessage, { color: colors.muted }]}>
                {filter !== "all"
                  ? "Try a different filter"
                  : "Browse casting calls and submit your self-tape to get started!"}
              </Text>
              {filter === "all" && (
                <TouchableOpacity
                  onPress={() => router.push("/casting" as any)}
                  style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
                  activeOpacity={0.8}
                >
                  <Text style={styles.emptyBtnText}>Browse Castings</Text>
                </TouchableOpacity>
              )}
            </View>
          )
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  backBtn: { padding: 4 },
  screenTitle: { fontSize: 22, fontWeight: "800", flex: 1 },
  countBadge: { fontSize: 15, fontWeight: "600" },
  statsRow: { flexDirection: "row", paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  statChip: { flex: 1, paddingVertical: 10, borderRadius: Radius.md, alignItems: "center", gap: 2 },
  statNum: { fontSize: 20, fontWeight: "800" },
  statLabel: { fontSize: 10, fontWeight: "600", textTransform: "uppercase" },
  filterRow: { paddingHorizontal: 16, gap: 8, paddingBottom: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  filterText: { fontSize: 13, fontWeight: "600" },
  listContent: { paddingHorizontal: 16, paddingBottom: 100, gap: 10 },
  card: { borderRadius: Radius.lg, borderWidth: 1, overflow: "hidden", flexDirection: "row" },
  statusStripe: { width: 4 },
  cardBody: { flex: 1, padding: 14, gap: 8 },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  cardTitle: { fontSize: 16, fontWeight: "700", lineHeight: 21 },
  cardProducer: { fontSize: 13, marginTop: 1 },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: "700" },
  metaRow: { flexDirection: "row", gap: 12, flexWrap: "wrap" },
  metaText: { fontSize: 12, fontWeight: "500" },
  notesPreview: { fontSize: 12, fontStyle: "italic" },
  actionsRow: { flexDirection: "row", gap: 8, marginTop: 2 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  actionBtnText: { fontSize: 12, fontWeight: "600" },
  loadingContainer: { paddingTop: 60, alignItems: "center" },
  emptyContainer: { borderRadius: Radius.lg, padding: 32, alignItems: "center", gap: 10, borderWidth: 1, marginTop: 20 },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  emptyMessage: { fontSize: 14, textAlign: "center", maxWidth: 260 },
  emptyBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, marginTop: 8 },
  emptyBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
