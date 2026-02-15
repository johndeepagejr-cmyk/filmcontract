import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator, RefreshControl, StyleSheet, Platform } from "react-native";
import { useState, useCallback } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { LoginScreen } from "@/components/auth/login-screen";
import { RoleSelectionScreen } from "@/components/auth/role-selection-screen";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { router } from "expo-router";
import { useColors } from "@/hooks/use-colors";
import { AppFooter } from "@/components/app-footer";

export default function HomeScreen() {
  const { user, isAuthenticated, loading: authLoading, refresh } = useAuth();
  const colors = useColors();
  const [refreshing, setRefreshing] = useState(false);

  const { data: contracts, isLoading: contractsLoading, refetch: refetchContracts } = trpc.contracts.list.useQuery(
    undefined,
    { enabled: isAuthenticated && !!user?.userRole }
  );

  const { data: unreadCount } = trpc.messaging.getUnreadCount.useQuery(
    undefined,
    { enabled: isAuthenticated && !!user?.userRole }
  );

  const { data: currentSub } = trpc.subscription.getCurrent.useQuery(
    undefined,
    { enabled: isAuthenticated && !!user?.userRole }
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    await refetchContracts();
    setRefreshing(false);
  }, [refresh, refetchContracts]);

  // Show loading spinner while auth is being checked
  if (authLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-base text-muted mt-4">Loading...</Text>
      </ScreenContainer>
    );
  }

  // Show login screen if not authenticated
  if (!isAuthenticated || !user) {
    return <LoginScreen />;
  }

  // Show role selection if user hasn't picked a role yet
  if (!user.userRole) {
    return <RoleSelectionScreen />;
  }

  // Calculate contract stats
  const activeContracts = contracts?.filter((c: any) => c.status === "active") || [];
  const pendingContracts = contracts?.filter((c: any) => c.status === "pending") || [];
  const draftContracts = contracts?.filter((c: any) => c.status === "draft") || [];
  const completedContracts = contracts?.filter((c: any) => c.status === "completed") || [];
  const totalContracts = contracts?.length || 0;
  const unreadMessages = unreadCount?.count || 0;

  const isProducer = user.userRole === "producer";

  return (
    <ScreenContainer className="p-4">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <View className="flex-1 gap-5">
          {/* Greeting */}
          <View className="gap-1 pt-2">
            <Text className="text-3xl font-bold text-foreground">
              {getGreeting()}, {user.name?.split(" ")[0] || "there"}
            </Text>
            <Text className="text-base text-muted">
              {isProducer ? "Manage your contracts and find talent" : "Track your contracts and opportunities"}
            </Text>
          </View>

          {/* Upgrade Banner for Free Users */}
          {currentSub && currentSub.plan === "free" && (
            <TouchableOpacity
              onPress={() => router.push("/subscription")}
              style={{
                backgroundColor: colors.primary,
                borderRadius: 16,
                padding: 16,
                flexDirection: "row",
                alignItems: "center",
              }}
              activeOpacity={0.8}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
                  Upgrade to Pro
                </Text>
                <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, marginTop: 2 }}>
                  Unlimited contracts, templates, PDF export & more — $4.99/mo
                </Text>
              </View>
              <Text style={{ color: "#fff", fontSize: 24 }}>›</Text>
            </TouchableOpacity>
          )}

          {/* Contract Usage for Free Users */}
          {currentSub && currentSub.plan === "free" && (
            <View className="bg-surface rounded-2xl p-4 border border-border">
              <Text className="text-sm text-muted">Monthly Contracts</Text>
              <Text className="text-lg font-bold text-foreground">
                {currentSub.contractsUsedThisMonth} / {currentSub.limits.contractsPerMonth} used
              </Text>
            </View>
          )}

          {/* Stats Overview */}
          <View className="flex-row gap-3">
            <View className="flex-1 bg-surface rounded-2xl p-4 border border-border">
              <Text className="text-sm text-muted">Total</Text>
              <Text className="text-3xl font-bold text-foreground">{totalContracts}</Text>
              <Text className="text-xs text-muted">Contracts</Text>
            </View>
            <View className="flex-1 bg-surface rounded-2xl p-4 border border-border">
              <Text className="text-sm text-muted">Active</Text>
              <Text className="text-3xl font-bold text-success">{activeContracts.length}</Text>
              <Text className="text-xs text-muted">In Progress</Text>
            </View>
            <View className="flex-1 bg-surface rounded-2xl p-4 border border-border">
              <Text className="text-sm text-muted">Pending</Text>
              <Text className="text-3xl font-bold text-warning">{pendingContracts.length}</Text>
              <Text className="text-xs text-muted">Awaiting</Text>
            </View>
          </View>

          {/* Quick Actions */}
          <View className="gap-3">
            <Text className="text-lg font-bold text-foreground">Quick Actions</Text>
            <View className="gap-2">
              {isProducer && (
                <TouchableOpacity
                  onPress={() => router.push("/create-contract" as any)}
                  style={[styles.quickActionBtn, { backgroundColor: colors.primary }]}
                >
                  <Text style={styles.quickActionIcon}>📝</Text>
                  <View style={styles.quickActionContent}>
                    <Text style={[styles.quickActionTitle, { color: "#fff" }]}>Create New Contract</Text>
                    <Text style={[styles.quickActionSub, { color: "rgba(255,255,255,0.7)" }]}>Draft a contract with an actor</Text>
                  </View>
                  <Text style={{ color: "#fff", fontSize: 20 }}>›</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={() => router.push("/messages" as any)}
                style={[styles.quickActionBtn, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}
              >
                <Text style={styles.quickActionIcon}>💬</Text>
                <View style={styles.quickActionContent}>
                  <Text style={[styles.quickActionTitle, { color: colors.foreground }]}>Messages</Text>
                  <Text style={[styles.quickActionSub, { color: colors.muted }]}>
                    {unreadMessages > 0 ? `${unreadMessages} unread message${unreadMessages > 1 ? "s" : ""}` : "Chat with actors and producers"}
                  </Text>
                </View>
                {unreadMessages > 0 && (
                  <View style={[styles.unreadBadge, { backgroundColor: colors.error }]}>
                    <Text style={styles.unreadText}>{unreadMessages}</Text>
                  </View>
                )}
                <Text style={{ color: colors.muted, fontSize: 20 }}>›</Text>
              </TouchableOpacity>

              {isProducer && (
                <TouchableOpacity
                  onPress={() => router.push("/templates" as any)}
                  style={[styles.quickActionBtn, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}
                >
                  <Text style={styles.quickActionIcon}>📋</Text>
                  <View style={styles.quickActionContent}>
                    <Text style={[styles.quickActionTitle, { color: colors.foreground }]}>Contract Templates</Text>
                    <Text style={[styles.quickActionSub, { color: colors.muted }]}>Use pre-built contract templates</Text>
                  </View>
                  <Text style={{ color: colors.muted, fontSize: 20 }}>›</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={() => {
                  if (isProducer) {
                    router.push("/(tabs)/actors" as any);
                  } else {
                    router.push("/(tabs)/producers" as any);
                  }
                }}
                style={[styles.quickActionBtn, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}
              >
                <Text style={styles.quickActionIcon}>{isProducer ? "🎭" : "🎬"}</Text>
                <View style={styles.quickActionContent}>
                  <Text style={[styles.quickActionTitle, { color: colors.foreground }]}>
                    {isProducer ? "Browse Actors" : "Browse Producers"}
                  </Text>
                  <Text style={[styles.quickActionSub, { color: colors.muted }]}>
                    {isProducer ? "Find talent for your projects" : "Discover producers and opportunities"}
                  </Text>
                </View>
                <Text style={{ color: colors.muted, fontSize: 20 }}>›</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Recent Contracts */}
          <View className="gap-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-bold text-foreground">Recent Contracts</Text>
              {totalContracts > 0 && (
                <TouchableOpacity
                  onPress={() => router.push("/(tabs)/analytics-old" as any)}
                  style={{ opacity: 1 }}
                >
                  <Text style={{ fontSize: 14, color: colors.primary, fontWeight: "600" }}>View All →</Text>
                </TouchableOpacity>
              )}
            </View>

            {contractsLoading ? (
              <View className="bg-surface rounded-2xl p-8 items-center border border-border">
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : contracts && contracts.length > 0 ? (
              <View className="gap-2">
                {contracts.slice(0, 5).map((contract: any) => (
                  <TouchableOpacity
                    key={contract.id}
                    onPress={() => router.push(`/contract/${contract.id}` as any)}
                    style={[styles.contractCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  >
                    <View className="flex-row items-start justify-between gap-2">
                      <View className="flex-1 gap-1">
                        <Text className="text-base font-semibold text-foreground" numberOfLines={1}>
                          {contract.projectTitle}
                        </Text>
                        <Text className="text-sm text-muted" numberOfLines={1}>
                          {isProducer
                            ? `Actor: ${contract.actorName || "Unknown"}`
                            : `Producer: ${contract.producerName || "Unknown"}`}
                        </Text>
                        {contract.paymentAmount && (
                          <Text className="text-sm text-foreground font-medium">
                            ${parseFloat(contract.paymentAmount).toLocaleString()}
                          </Text>
                        )}
                      </View>
                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor:
                              contract.status === "active"
                                ? colors.success + "20"
                                : contract.status === "pending"
                                ? colors.warning + "20"
                                : contract.status === "completed"
                                ? colors.primary + "20"
                                : contract.status === "cancelled"
                                ? colors.error + "20"
                                : colors.muted + "20",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            {
                              color:
                                contract.status === "active"
                                  ? colors.success
                                  : contract.status === "pending"
                                  ? colors.warning
                                  : contract.status === "completed"
                                  ? colors.primary
                                  : contract.status === "cancelled"
                                  ? colors.error
                                  : colors.muted,
                            },
                          ]}
                        >
                          {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View className="bg-surface rounded-2xl p-8 items-center gap-3 border border-border">
                <Text className="text-4xl">📄</Text>
                <Text className="text-base font-semibold text-foreground">No Contracts Yet</Text>
                <Text className="text-sm text-muted text-center">
                  {isProducer
                    ? "Create your first contract to get started"
                    : "Contracts from producers will appear here"}
                </Text>
                {isProducer && (
                  <TouchableOpacity
                    onPress={() => router.push("/create-contract" as any)}
                    style={[styles.createBtn, { backgroundColor: colors.primary }]}
                  >
                    <Text style={styles.createBtnText}>Create Contract</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {/* Footer */}
          <AppFooter />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const styles = StyleSheet.create({
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  quickActionBtn: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
  },
  quickActionIcon: {
    fontSize: 24,
  },
  quickActionContent: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  quickActionSub: {
    fontSize: 14,
  },
  unreadBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    minWidth: 24,
    alignItems: "center" as const,
  },
  unreadText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  contractCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  createBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
    marginTop: 8,
  },
  createBtnText: {
    color: "#fff",
    fontWeight: "600",
  },
});
