import { useState, useCallback } from "react";
import {
  View, Text, FlatList, Pressable, Alert, Platform,
  RefreshControl, ActivityIndicator, TextInput, StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { Typography, Spacing, Radius, Shadows } from "@/constants/design-tokens";

// ─── Status Config ──────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  pending:   { label: "Pending",   color: "#B45309", bg: "#FEF3C7", icon: "clock" },
  funded:    { label: "In Escrow", color: "#065F46", bg: "#D1FAE5", icon: "lock.fill" },
  released:  { label: "Released",  color: "#0E7490", bg: "#CFFAFE", icon: "checkmark.circle.fill" },
  disputed:  { label: "Disputed",  color: "#991B1B", bg: "#FEE2E2", icon: "exclamationmark.triangle" },
  resolved:  { label: "Resolved",  color: "#7C3AED", bg: "#F3E8FF", icon: "checkmark.circle.fill" },
  refunded:  { label: "Refunded",  color: "#6B7280", bg: "#E5E7EB", icon: "arrow.counterclockwise" },
  cancelled: { label: "Cancelled", color: "#6B7280", bg: "#E5E7EB", icon: "xmark.circle.fill" },
};

type FilterType = "all" | "pending" | "funded" | "released" | "disputed";

export default function PaymentsDashboard() {
  const router = useRouter();
  const colors = useColors();
  const [filter, setFilter] = useState<FilterType>("all");
  const [disputeReason, setDisputeReason] = useState("");
  const [showDisputeFor, setShowDisputeFor] = useState<number | null>(null);

  // Queries
  const earningsQuery = trpc.escrow.getEarningsSummary.useQuery();
  const historyQuery = trpc.escrow.getHistory.useQuery({});
  const utils = trpc.useUtils();

  // Mutations
  const fundMutation = trpc.escrow.fund.useMutation({
    onSuccess: () => { utils.escrow.getHistory.invalidate(); utils.escrow.getEarningsSummary.invalidate(); },
  });
  const releaseMutation = trpc.escrow.release.useMutation({
    onSuccess: () => { utils.escrow.getHistory.invalidate(); utils.escrow.getEarningsSummary.invalidate(); },
  });
  const disputeMutation = trpc.escrow.dispute.useMutation({
    onSuccess: () => { utils.escrow.getHistory.invalidate(); setShowDisputeFor(null); setDisputeReason(""); },
  });
  const cancelMutation = trpc.escrow.cancel.useMutation({
    onSuccess: () => { utils.escrow.getHistory.invalidate(); utils.escrow.getEarningsSummary.invalidate(); },
  });

  const isRefreshing = earningsQuery.isRefetching || historyQuery.isRefetching;

  const onRefresh = useCallback(() => {
    earningsQuery.refetch();
    historyQuery.refetch();
  }, []);

  const earnings = earningsQuery.data;
  const history = historyQuery.data || [];
  const filteredHistory = filter === "all" ? history : history.filter((e: any) => e.status === filter);

  // ─── Actions ────────────────────────────────────────────────

  const confirmAction = (title: string, message: string, onConfirm: () => void) => {
    if (Platform.OS === "web") {
      if (confirm(`${title}\n\n${message}`)) onConfirm();
    } else {
      Alert.alert(title, message, [
        { text: "Cancel", style: "cancel" },
        { text: "Confirm", style: "destructive", onPress: onConfirm },
      ]);
    }
  };

  const handleFund = (escrowId: number, amount: string) => {
    confirmAction("Fund Escrow", `Deposit $${amount} into escrow?`, () => {
      fundMutation.mutate({ escrowId });
    });
  };

  const handleRelease = (escrowId: number, amount: string) => {
    confirmAction("Release Payment", `Release $${amount} to the actor?`, () => {
      releaseMutation.mutate({ escrowId });
    });
  };

  const handleDispute = (escrowId: number) => {
    if (disputeReason.length < 10) {
      const msg = "Please provide a detailed reason (at least 10 characters)";
      Platform.OS === "web" ? alert(msg) : Alert.alert("Error", msg);
      return;
    }
    disputeMutation.mutate({ escrowId, reason: disputeReason });
  };

  const handleCancel = (escrowId: number) => {
    confirmAction("Cancel Escrow", "This will cancel the pending escrow. Continue?", () => {
      cancelMutation.mutate({ escrowId });
    });
  };

  // ─── Render ─────────────────────────────────────────────────

  const renderEarningsCard = () => {
    if (!earnings) return null;
    return (
      <View style={[s.earningsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[Typography.h2, { color: colors.foreground, marginBottom: Spacing.lg }]}>
          Earnings Overview
        </Text>
        <View style={s.earningsGrid}>
          <View style={s.earningsItem}>
            <Text style={[Typography.caption, { color: colors.muted }]}>Available</Text>
            <Text style={[Typography.displaySm, { color: "#22C55E" }]}>${earnings.available}</Text>
          </View>
          <View style={s.earningsItem}>
            <Text style={[Typography.caption, { color: colors.muted }]}>Released</Text>
            <Text style={[Typography.displaySm, { color: colors.foreground }]}>${earnings.released}</Text>
          </View>
          <View style={s.earningsItem}>
            <Text style={[Typography.caption, { color: colors.muted }]}>Pending</Text>
            <Text style={[Typography.displaySm, { color: "#B45309" }]}>${earnings.pending}</Text>
          </View>
          <View style={s.earningsItem}>
            <Text style={[Typography.caption, { color: colors.muted }]}>Disputed</Text>
            <Text style={[Typography.displaySm, { color: "#991B1B" }]}>${earnings.disputed}</Text>
          </View>
        </View>
        <View style={[s.totalRow, { borderTopColor: colors.border }]}>
          <Text style={[Typography.labelLg, { color: colors.muted }]}>Total Lifetime</Text>
          <Text style={[Typography.h1, { color: colors.foreground }]}>${earnings.total}</Text>
        </View>
      </View>
    );
  };

  const renderFilters = () => {
    const filters: { key: FilterType; label: string }[] = [
      { key: "all", label: "All" },
      { key: "pending", label: "Pending" },
      { key: "funded", label: "In Escrow" },
      { key: "released", label: "Released" },
      { key: "disputed", label: "Disputed" },
    ];
    return (
      <View style={s.filterRow}>
        {filters.map((f) => (
          <Pressable
            key={f.key}
            onPress={() => setFilter(f.key)}
            style={({ pressed }) => [
              s.filterChip,
              { borderColor: filter === f.key ? colors.primary : colors.border,
                backgroundColor: filter === f.key ? colors.primary + "15" : colors.surface },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text style={[Typography.labelSm, { color: filter === f.key ? colors.primary : colors.muted }]}>
              {f.label}
            </Text>
          </Pressable>
        ))}
      </View>
    );
  };

  const renderEscrowItem = ({ item }: { item: any }) => {
    const config = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
    const isIncoming = item.isIncoming;

    return (
      <View style={[s.escrowCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {/* Header */}
        <View style={s.escrowHeader}>
          <View style={s.escrowHeaderLeft}>
            <View style={[s.statusBadge, { backgroundColor: config.bg }]}>
              <IconSymbol name={config.icon} size={12} color={config.color} />
              <Text style={[Typography.labelSm, { color: config.color, marginLeft: 4 }]}>{config.label}</Text>
            </View>
            {isIncoming ? (
              <Text style={[Typography.caption, { color: "#22C55E" }]}>Incoming</Text>
            ) : (
              <Text style={[Typography.caption, { color: colors.muted }]}>Outgoing</Text>
            )}
          </View>
          <Text style={[Typography.h1, { color: colors.foreground }]}>${item.amount}</Text>
        </View>

        {/* Details */}
        <Text style={[Typography.bodyMd, { color: colors.foreground, marginTop: Spacing.sm }]} numberOfLines={1}>
          {item.projectTitle}
        </Text>
        <Text style={[Typography.bodySm, { color: colors.muted, marginTop: Spacing.xs }]}>
          {isIncoming ? "From" : "To"}: {item.otherPartyName}
        </Text>
        <Text style={[Typography.caption, { color: colors.muted, marginTop: Spacing.xs }]}>
          {new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          {item.milestoneNumber > 1 ? ` · Milestone ${item.milestoneNumber}` : ""}
        </Text>

        {/* Dispute input */}
        {showDisputeFor === item.id && (
          <View style={[s.disputeInput, { borderColor: colors.border }]}>
            <TextInput
              style={[Typography.bodySm, s.disputeTextInput, { color: colors.foreground, borderColor: colors.border }]}
              placeholder="Describe the issue (min 10 chars)..."
              placeholderTextColor={colors.muted}
              value={disputeReason}
              onChangeText={setDisputeReason}
              multiline
              returnKeyType="done"
            />
            <View style={s.disputeActions}>
              <Pressable
                onPress={() => { setShowDisputeFor(null); setDisputeReason(""); }}
                style={({ pressed }) => [s.disputeCancel, pressed && { opacity: 0.7 }]}
              >
                <Text style={[Typography.labelSm, { color: colors.muted }]}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={() => handleDispute(item.id)}
                style={({ pressed }) => [s.disputeSubmit, { backgroundColor: "#EF4444" }, pressed && { opacity: 0.7 }]}
              >
                <Text style={[Typography.labelSm, { color: "#FFF" }]}>Submit Dispute</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Action buttons */}
        <View style={s.actionRow}>
          {item.status === "pending" && !isIncoming && (
            <>
              <Pressable
                onPress={() => handleFund(item.id, item.amount)}
                style={({ pressed }) => [s.actionBtn, s.actionBtnPrimary, pressed && { opacity: 0.8 }]}
              >
                <IconSymbol name="lock.fill" size={14} color="#FFF" />
                <Text style={[Typography.labelSm, { color: "#FFF", marginLeft: 4 }]}>Fund Escrow</Text>
              </Pressable>
              <Pressable
                onPress={() => handleCancel(item.id)}
                style={({ pressed }) => [s.actionBtn, { borderColor: colors.border, borderWidth: 1 }, pressed && { opacity: 0.7 }]}
              >
                <Text style={[Typography.labelSm, { color: colors.muted }]}>Cancel</Text>
              </Pressable>
            </>
          )}
          {item.status === "funded" && !isIncoming && (
            <>
              <Pressable
                onPress={() => handleRelease(item.id, item.amount)}
                style={({ pressed }) => [s.actionBtn, { backgroundColor: "#22C55E" }, pressed && { opacity: 0.8 }]}
              >
                <IconSymbol name="lock.open.fill" size={14} color="#FFF" />
                <Text style={[Typography.labelSm, { color: "#FFF", marginLeft: 4 }]}>Release</Text>
              </Pressable>
              <Pressable
                onPress={() => setShowDisputeFor(item.id)}
                style={({ pressed }) => [s.actionBtn, { borderColor: "#EF4444", borderWidth: 1 }, pressed && { opacity: 0.7 }]}
              >
                <Text style={[Typography.labelSm, { color: "#EF4444" }]}>Dispute</Text>
              </Pressable>
            </>
          )}
          {item.status === "funded" && isIncoming && (
            <Pressable
              onPress={() => setShowDisputeFor(item.id)}
              style={({ pressed }) => [s.actionBtn, { borderColor: "#EF4444", borderWidth: 1 }, pressed && { opacity: 0.7 }]}
            >
              <Text style={[Typography.labelSm, { color: "#EF4444" }]}>Raise Dispute</Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  };

  const renderHeader = () => (
    <View>
      {/* Title */}
      <View style={s.titleRow}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [pressed && { opacity: 0.6 }]}>
          <IconSymbol name="chevron.left" size={24} color={colors.primary} />
        </Pressable>
        <Text style={[Typography.displaySm, { color: colors.foreground, flex: 1, marginLeft: Spacing.sm }]}>
          Payments
        </Text>
      </View>

      {/* Earnings Card */}
      {renderEarningsCard()}

      {/* Filters */}
      <Text style={[Typography.h2, { color: colors.foreground, marginTop: Spacing.xxl, marginBottom: Spacing.md }]}>
        Payment History
      </Text>
      {renderFilters()}
    </View>
  );

  const renderEmpty = () => (
    <View style={s.emptyState}>
      <IconSymbol name="banknote.fill" size={48} color={colors.muted} />
      <Text style={[Typography.bodyMd, { color: colors.muted, marginTop: Spacing.md, textAlign: "center" }]}>
        {filter === "all" ? "No payments yet" : `No ${filter} payments`}
      </Text>
    </View>
  );

  if (earningsQuery.isLoading || historyQuery.isLoading) {
    return (
      <ScreenContainer className="p-6">
        <View style={s.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[Typography.bodyMd, { color: colors.muted, marginTop: Spacing.md }]}>Loading payments...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <FlatList
        data={filteredHistory}
        keyExtractor={(item: any) => item.id.toString()}
        renderItem={renderEscrowItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
      />
    </ScreenContainer>
  );
}

// ─── Styles ─────────────────────────────────────────────────

const s = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  titleRow: { flexDirection: "row", alignItems: "center", marginBottom: Spacing.xxl },
  earningsCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    ...Shadows.md,
  },
  earningsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  earningsItem: {
    width: "47%",
    gap: Spacing.xs,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  filterRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
    flexWrap: "wrap",
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  escrowCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  escrowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  escrowHeaderLeft: {
    gap: Spacing.xs,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    alignSelf: "flex-start",
  },
  actionRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
  },
  actionBtnPrimary: {
    backgroundColor: "#0a7ea4",
  },
  disputeInput: {
    marginTop: Spacing.md,
    borderTopWidth: 1,
    paddingTop: Spacing.md,
  },
  disputeTextInput: {
    borderWidth: 1,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    minHeight: 60,
    textAlignVertical: "top",
  },
  disputeActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  disputeCancel: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  disputeSubmit: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing.section,
  },
});
