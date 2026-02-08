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
                  className="bg-primary px-5 py-4 rounded-xl flex-row items-center gap-3 active:opacity-80"
                >
                  <Text className="text-2xl">📝</Text>
                  <View className="flex-1">
                    <Text className="text-white text-base font-semibold">Create New Contract</Text>
                    <Text className="text-white/70 text-sm">Draft a contract with an actor</Text>
                  </View>
                  <Text className="text-white text-xl">›</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={() => router.push("/messages" as any)}
                className="bg-surface px-5 py-4 rounded-xl flex-row items-center gap-3 active:opacity-80 border border-border"
              >
                <Text className="text-2xl">💬</Text>
                <View className="flex-1">
                  <Text className="text-foreground text-base font-semibold">Messages</Text>
                  <Text className="text-muted text-sm">
                    {unreadMessages > 0 ? `${unreadMessages} unread message${unreadMessages > 1 ? "s" : ""}` : "Chat with actors and producers"}
                  </Text>
                </View>
                {unreadMessages > 0 && (
                  <View className="bg-error px-2 py-1 rounded-full min-w-[24px] items-center">
                    <Text className="text-white text-xs font-bold">{unreadMessages}</Text>
                  </View>
                )}
                <Text className="text-muted text-xl">›</Text>
              </TouchableOpacity>

              {isProducer && (
                <TouchableOpacity
                  onPress={() => router.push("/templates" as any)}
                  className="bg-surface px-5 py-4 rounded-xl flex-row items-center gap-3 active:opacity-80 border border-border"
                >
                  <Text className="text-2xl">📋</Text>
                  <View className="flex-1">
                    <Text className="text-foreground text-base font-semibold">Contract Templates</Text>
                    <Text className="text-muted text-sm">Use pre-built contract templates</Text>
                  </View>
                  <Text className="text-muted text-xl">›</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={() => {
                  if (isProducer) {
                    // Navigate to actors tab
                    router.push("/(tabs)/actors" as any);
                  } else {
                    // Navigate to producers tab
                    router.push("/(tabs)/producers" as any);
                  }
                }}
                className="bg-surface px-5 py-4 rounded-xl flex-row items-center gap-3 active:opacity-80 border border-border"
              >
                <Text className="text-2xl">{isProducer ? "🎭" : "🎬"}</Text>
                <View className="flex-1">
                  <Text className="text-foreground text-base font-semibold">
                    {isProducer ? "Browse Actors" : "Browse Producers"}
                  </Text>
                  <Text className="text-muted text-sm">
                    {isProducer ? "Find talent for your projects" : "Discover producers and opportunities"}
                  </Text>
                </View>
                <Text className="text-muted text-xl">›</Text>
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
                  className="active:opacity-70"
                >
                  <Text className="text-sm text-primary font-semibold">View All →</Text>
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
                    className="bg-surface rounded-xl p-4 border border-border active:opacity-80"
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
                    className="bg-primary px-5 py-3 rounded-full mt-2 active:opacity-80"
                  >
                    <Text className="text-white font-semibold">Create Contract</Text>
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
});
