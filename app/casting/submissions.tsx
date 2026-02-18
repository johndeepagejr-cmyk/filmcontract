import { FlatList, Text, View, TouchableOpacity, ActivityIndicator, RefreshControl, StyleSheet, Alert, ScrollView } from "react-native";
import { useState, useCallback, useMemo } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { router, useLocalSearchParams } from "expo-router";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Radius } from "@/constants/design-tokens";

type PipelineStatus = "submitted" | "reviewing" | "shortlisted" | "rejected" | "hired";

const PIPELINE_COLUMNS: { key: PipelineStatus; label: string; icon: string; colorKey: string }[] = [
  { key: "submitted", label: "New", icon: "tray.fill", colorKey: "muted" },
  { key: "reviewing", label: "Reviewing", icon: "eye.fill", colorKey: "warning" },
  { key: "shortlisted", label: "Shortlisted", icon: "star.fill", colorKey: "success" },
  { key: "hired", label: "Hired", icon: "checkmark.seal.fill", colorKey: "primary" },
  { key: "rejected", label: "Passed", icon: "xmark.circle.fill", colorKey: "error" },
];

export default function SubmissionsPipelineScreen() {
  const { castingId, title: castingTitle } = useLocalSearchParams<{ castingId: string; title?: string }>();
  const colors = useColors();
  const [refreshing, setRefreshing] = useState(false);
  const [activeColumn, setActiveColumn] = useState<PipelineStatus | "all">("all");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const numericId = parseInt(castingId || "0", 10);

  const { data: submissions, isLoading, refetch } = trpc.casting.getSubmissions.useQuery(
    { castingCallId: numericId },
    { enabled: numericId > 0 }
  );

  const updateStatusMutation = trpc.casting.updateSubmissionStatus.useMutation({
    onSuccess: () => refetch(),
    onError: (err) => Alert.alert("Error", err.message),
  });

  const bulkUpdateMutation = trpc.casting.bulkUpdateStatus.useMutation({
    onSuccess: () => {
      refetch();
      setSelectedIds([]);
      Alert.alert("Updated", "Submissions have been updated.");
    },
    onError: (err) => Alert.alert("Error", err.message),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const grouped = useMemo(() => {
    if (!submissions) return {};
    const groups: Record<string, any[]> = {};
    PIPELINE_COLUMNS.forEach((col) => { groups[col.key] = []; });
    submissions.forEach((s: any) => {
      if (groups[s.status]) groups[s.status].push(s);
      else groups.submitted.push(s);
    });
    return groups;
  }, [submissions]);

  const filteredSubmissions = useMemo(() => {
    if (!submissions) return [];
    if (activeColumn === "all") return submissions;
    return submissions.filter((s: any) => s.status === activeColumn);
  }, [submissions, activeColumn]);

  const getStatusColor = (status: string) => {
    const col = PIPELINE_COLUMNS.find((c) => c.key === status);
    return (colors as any)[col?.colorKey || "muted"] || colors.muted;
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleMoveStatus = (submissionId: number, newStatus: PipelineStatus) => {
    updateStatusMutation.mutate({ submissionId, status: newStatus });
  };

  const handleBulkAction = (status: PipelineStatus) => {
    if (selectedIds.length === 0) return;
    Alert.alert(
      `Move ${selectedIds.length} to ${PIPELINE_COLUMNS.find((c) => c.key === status)?.label}?`,
      "This will update all selected submissions.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Confirm", onPress: () => bulkUpdateMutation.mutate({ submissionIds: selectedIds, status }) },
      ]
    );
  };

  const getDaysAgo = (date: string | Date) => {
    const diff = Date.now() - new Date(date).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    return `${days}d ago`;
  };

  const renderSubmission = ({ item }: { item: any }) => {
    const statusColor = getStatusColor(item.status);
    const isSelected = selectedIds.includes(item.id);
    const col = PIPELINE_COLUMNS.find((c) => c.key === item.status);

    return (
      <TouchableOpacity
        onLongPress={() => toggleSelect(item.id)}
        onPress={() => {
          if (selectedIds.length > 0) {
            toggleSelect(item.id);
          }
        }}
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: isSelected ? colors.primary : colors.border,
            borderWidth: isSelected ? 2 : 1,
          },
        ]}
        activeOpacity={0.7}
      >
        {/* Actor info */}
        <View style={styles.cardHeader}>
          <View style={[styles.avatar, { backgroundColor: statusColor + "20" }]}>
            <Text style={[styles.avatarText, { color: statusColor }]}>
              {(item.actorName || "A").charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardName, { color: colors.foreground }]}>{item.actorName || "Actor"}</Text>
            <Text style={[styles.cardEmail, { color: colors.muted }]} numberOfLines={1}>
              {item.actorEmail || "No email"}
            </Text>
          </View>
          {isSelected && (
            <View style={[styles.checkCircle, { backgroundColor: colors.primary }]}>
              <IconSymbol name="checkmark" size={12} color="#fff" />
            </View>
          )}
        </View>

        {/* Status + date */}
        <View style={styles.cardMeta}>
          <View style={[styles.statusPill, { backgroundColor: statusColor + "15" }]}>
            <IconSymbol name={col?.icon as any || "circle.fill"} size={10} color={statusColor} />
            <Text style={[styles.statusPillText, { color: statusColor }]}>{col?.label || item.status}</Text>
          </View>
          <Text style={[styles.dateText, { color: colors.muted }]}>{getDaysAgo(item.createdAt)}</Text>
        </View>

        {/* Notes */}
        {item.notes && (
          <Text style={[styles.notes, { color: colors.muted }]} numberOfLines={2}>
            {item.notes}
          </Text>
        )}

        {/* Video indicator */}
        {item.videoUrl && (
          <View style={[styles.videoIndicator, { backgroundColor: colors.primary + "10" }]}>
            <IconSymbol name="film" size={14} color={colors.primary} />
            <Text style={[styles.videoText, { color: colors.primary }]}>Self-tape attached</Text>
          </View>
        )}

        {/* Quick actions */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickActions}>
          {PIPELINE_COLUMNS.filter((c) => c.key !== item.status).map((col) => (
            <TouchableOpacity
              key={col.key}
              onPress={() => handleMoveStatus(item.id, col.key)}
              style={[styles.quickActionBtn, { backgroundColor: getStatusColor(col.key) + "10" }]}
              activeOpacity={0.7}
            >
              <Text style={[styles.quickActionText, { color: getStatusColor(col.key) }]}>
                {col.key === "hired" ? "Hire" : col.key === "rejected" ? "Pass" : col.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
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
        <View style={{ flex: 1 }}>
          <Text style={[styles.screenTitle, { color: colors.foreground }]}>Submissions</Text>
          {castingTitle && (
            <Text style={[styles.castingName, { color: colors.muted }]} numberOfLines={1}>
              {castingTitle}
            </Text>
          )}
        </View>
        <Text style={[styles.totalCount, { color: colors.muted }]}>
          {submissions?.length || 0} total
        </Text>
      </View>

      {/* Pipeline summary bar */}
      {submissions && submissions.length > 0 && (
        <View style={styles.pipelineBar}>
          {PIPELINE_COLUMNS.map((col) => {
            const count = grouped[col.key]?.length || 0;
            const color = getStatusColor(col.key);
            return (
              <TouchableOpacity
                key={col.key}
                onPress={() => setActiveColumn(activeColumn === col.key ? "all" : col.key)}
                style={[
                  styles.pipelineItem,
                  {
                    backgroundColor: activeColumn === col.key ? color + "18" : "transparent",
                    borderColor: activeColumn === col.key ? color : "transparent",
                  },
                ]}
                activeOpacity={0.7}
              >
                <Text style={[styles.pipelineCount, { color }]}>{count}</Text>
                <Text style={[styles.pipelineLabel, { color: colors.muted }]}>{col.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Bulk actions bar */}
      {selectedIds.length > 0 && (
        <View style={[styles.bulkBar, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
          <Text style={[styles.bulkText, { color: colors.primary }]}>
            {selectedIds.length} selected
          </Text>
          <View style={styles.bulkActions}>
            <TouchableOpacity
              onPress={() => handleBulkAction("shortlisted")}
              style={[styles.bulkBtn, { backgroundColor: colors.success + "15" }]}
              activeOpacity={0.7}
            >
              <Text style={[styles.bulkBtnText, { color: colors.success }]}>Shortlist</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleBulkAction("rejected")}
              style={[styles.bulkBtn, { backgroundColor: colors.error + "15" }]}
              activeOpacity={0.7}
            >
              <Text style={[styles.bulkBtnText, { color: colors.error }]}>Pass</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setSelectedIds([])}
              style={styles.bulkClear}
              activeOpacity={0.7}
            >
              <Text style={[styles.bulkBtnText, { color: colors.muted }]}>Clear</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Submissions list */}
      <FlatList
        data={isLoading ? [] : filteredSubmissions}
        renderItem={renderSubmission}
        keyExtractor={(item: any) => item.id.toString()}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <View style={[styles.emptyContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={styles.emptyIcon}>📬</Text>
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Submissions Yet</Text>
              <Text style={[styles.emptyMessage, { color: colors.muted }]}>
                Submissions will appear here as actors apply to your casting call.
              </Text>
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
  screenTitle: { fontSize: 22, fontWeight: "800" },
  castingName: { fontSize: 13, marginTop: 1 },
  totalCount: { fontSize: 13, fontWeight: "600" },
  pipelineBar: { flexDirection: "row", paddingHorizontal: 12, gap: 4, marginBottom: 8 },
  pipelineItem: { flex: 1, alignItems: "center", paddingVertical: 10, borderRadius: Radius.md, borderWidth: 1 },
  pipelineCount: { fontSize: 20, fontWeight: "800" },
  pipelineLabel: { fontSize: 9, fontWeight: "600", textTransform: "uppercase", marginTop: 1 },
  bulkBar: { flexDirection: "row", alignItems: "center", marginHorizontal: 16, padding: 10, borderRadius: Radius.md, borderWidth: 1, marginBottom: 8, gap: 8 },
  bulkText: { fontSize: 13, fontWeight: "700", flex: 1 },
  bulkActions: { flexDirection: "row", gap: 6 },
  bulkBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  bulkBtnText: { fontSize: 12, fontWeight: "700" },
  bulkClear: { paddingHorizontal: 8, paddingVertical: 6 },
  listContent: { paddingHorizontal: 16, paddingBottom: 100, gap: 10 },
  card: { borderRadius: Radius.lg, padding: 14, gap: 8 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 16, fontWeight: "800" },
  cardName: { fontSize: 15, fontWeight: "700" },
  cardEmail: { fontSize: 12 },
  checkCircle: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: 8 },
  statusPill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  statusPillText: { fontSize: 11, fontWeight: "700" },
  dateText: { fontSize: 11 },
  notes: { fontSize: 12, lineHeight: 17 },
  videoIndicator: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, alignSelf: "flex-start" },
  videoText: { fontSize: 12, fontWeight: "600" },
  quickActions: { gap: 6, paddingTop: 2 },
  quickActionBtn: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10 },
  quickActionText: { fontSize: 11, fontWeight: "700" },
  loadingContainer: { paddingTop: 60, alignItems: "center" },
  emptyContainer: { borderRadius: Radius.lg, padding: 32, alignItems: "center", gap: 10, borderWidth: 1, marginTop: 20 },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  emptyMessage: { fontSize: 14, textAlign: "center", maxWidth: 260 },
});
