import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator, RefreshControl, StyleSheet, FlatList } from "react-native";
import { useState, useCallback } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { router } from "expo-router";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { OnboardingOverlay } from "@/components/onboarding/OnboardingTooltip";

const STATUS_ORDER = ["pending", "active", "draft", "completed", "cancelled"];

export default function ContractsScreen() {
  const { user, isAuthenticated } = useAuth();
  const colors = useColors();
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  const { data: contracts, isLoading, refetch } = trpc.contracts.list.useQuery(
    undefined,
    { enabled: isAuthenticated && !!user?.userRole }
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const isProducer = user?.userRole === "producer";

  const filteredContracts = contracts
    ? filterStatus
      ? contracts.filter((c: any) => c.status === filterStatus)
      : contracts
    : [];

  const sortedContracts = [...filteredContracts].sort((a: any, b: any) => {
    return STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status);
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return colors.success;
      case "pending": return colors.warning;
      case "completed": return colors.primary;
      case "cancelled": return colors.error;
      default: return colors.muted;
    }
  };

  const statusCounts = contracts ? {
    all: contracts.length,
    pending: contracts.filter((c: any) => c.status === "pending").length,
    active: contracts.filter((c: any) => c.status === "active").length,
    draft: contracts.filter((c: any) => c.status === "draft").length,
    completed: contracts.filter((c: any) => c.status === "completed").length,
  } : { all: 0, pending: 0, active: 0, draft: 0, completed: 0 };

  const renderContract = ({ item }: { item: any }) => (
    <TouchableOpacity
      onPress={() => router.push(`/contract/${item.id}` as any)}
      style={[styles.contractCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.projectTitle, { color: colors.foreground }]} numberOfLines={1}>
            {item.projectTitle}
          </Text>
          <Text style={[styles.partyName, { color: colors.muted }]} numberOfLines={1}>
            {isProducer ? `Actor: ${item.actorName || "TBD"}` : `Producer: ${item.producerName || "Unknown"}`}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + "18" }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>
      </View>
      <View style={styles.cardFooter}>
        {item.paymentAmount && (
          <Text style={[styles.amount, { color: colors.foreground }]}>
            ${parseFloat(item.paymentAmount).toLocaleString()}
          </Text>
        )}
        {item.startDate && (
          <Text style={[styles.date, { color: colors.muted }]}>
            {new Date(item.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.titleRow}>
        <Text style={[styles.screenTitle, { color: colors.foreground }]}>Contracts</Text>
        {isProducer && (
          <TouchableOpacity
            onPress={() => router.push("/create-contract" as any)}
            style={[styles.createButton, { backgroundColor: colors.primary }]}
            activeOpacity={0.8}
          >
            <IconSymbol name="plus" size={18} color="#fff" />
            <Text style={styles.createButtonText}>New</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter chips */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={[
          { key: null, label: "All", count: statusCounts.all },
          { key: "pending", label: "Pending", count: statusCounts.pending },
          { key: "active", label: "Active", count: statusCounts.active },
          { key: "draft", label: "Draft", count: statusCounts.draft },
          { key: "completed", label: "Done", count: statusCounts.completed },
        ]}
        renderItem={({ item: chip }) => (
          <TouchableOpacity
            onPress={() => setFilterStatus(chip.key)}
            style={[
              styles.filterChip,
              {
                backgroundColor: filterStatus === chip.key ? colors.primary : colors.surface,
                borderColor: filterStatus === chip.key ? colors.primary : colors.border,
              },
            ]}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterChipText,
                { color: filterStatus === chip.key ? "#fff" : colors.foreground },
              ]}
            >
              {chip.label} {chip.count > 0 ? `(${chip.count})` : ""}
            </Text>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.label}
        contentContainerStyle={styles.filterRow}
      />
    </View>
  );

  const renderEmpty = () => (
    <View style={[styles.emptyContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={styles.emptyIcon}>📄</Text>
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Contracts</Text>
      <Text style={[styles.emptyMessage, { color: colors.muted }]}>
        {filterStatus
          ? `No ${filterStatus} contracts found`
          : isProducer
          ? "Create your first contract to get started"
          : "Contracts from producers will appear here"}
      </Text>
      {isProducer && !filterStatus && (
        <TouchableOpacity
          onPress={() => router.push("/create-contract" as any)}
          style={[styles.emptyButton, { backgroundColor: colors.primary }]}
          activeOpacity={0.8}
        >
          <Text style={styles.emptyButtonText}>Create Contract</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (!isAuthenticated || !user?.userRole) return null;

  return (
    <ScreenContainer>
      <FlatList
        data={isLoading ? [] : sortedContracts}
        renderItem={renderContract}
        keyExtractor={(item: any) => item.id.toString()}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : renderEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      />
      {/* Onboarding: actor_contracts / producer_contracts step */}
      <OnboardingOverlay screen="contracts" />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerContainer: { paddingHorizontal: 16, paddingTop: 8, gap: 12 },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  screenTitle: { fontSize: 28, fontWeight: "800" },
  createButton: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  createButtonText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  filterRow: { gap: 8, paddingBottom: 4 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  filterChipText: { fontSize: 13, fontWeight: "600" },
  listContent: { paddingBottom: 100, gap: 10, paddingHorizontal: 16 },
  contractCard: { borderRadius: 14, padding: 16, borderWidth: 1, gap: 10 },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  projectTitle: { fontSize: 16, fontWeight: "700" },
  partyName: { fontSize: 13, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: "600" },
  cardFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  amount: { fontSize: 15, fontWeight: "700" },
  date: { fontSize: 12 },
  loadingContainer: { paddingTop: 60, alignItems: "center" },
  emptyContainer: { borderRadius: 16, padding: 32, alignItems: "center", gap: 10, borderWidth: 1, marginTop: 20 },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  emptyMessage: { fontSize: 14, textAlign: "center", maxWidth: 260 },
  emptyButton: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, marginTop: 8 },
  emptyButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
