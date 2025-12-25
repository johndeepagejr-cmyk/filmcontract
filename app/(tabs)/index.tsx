import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { LoginScreen } from "@/components/auth/login-screen";
import { RoleSelectionScreen } from "@/components/auth/role-selection-screen";
import { trpc } from "@/lib/trpc";
import { router } from "expo-router";
import { useState } from "react";

export default function HomeScreen() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: contracts,
    isLoading: contractsLoading,
    refetch,
  } = trpc.contracts.list.useQuery(undefined, {
    enabled: isAuthenticated && !!user?.userRole,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Show login screen if not authenticated
  if (!isAuthenticated && !authLoading) {
    return <LoginScreen />;
  }

  // Show role selection if user hasn't selected a role yet
  if (isAuthenticated && user && !user.userRole && !authLoading) {
    return <RoleSelectionScreen />;
  }

  // Show loading while checking auth
  if (authLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color="#1E40AF" />
      </ScreenContainer>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-success";
      case "pending":
        return "bg-warning";
      case "completed":
        return "bg-primary";
      case "draft":
        return "bg-muted";
      case "cancelled":
        return "bg-error";
      default:
        return "bg-muted";
    }
  };

  const formatDate = (date: string | Date | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <ScreenContainer className="p-6">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View className="flex-1 gap-6">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">Contracts</Text>
            <Text className="text-base text-muted">
              {user?.userRole === "producer"
                ? "Manage your contracts with actors"
                : "View your contracts with producers"}
            </Text>
          </View>

          {/* Contracts List */}
          {contractsLoading ? (
            <View className="flex-1 items-center justify-center py-12">
              <ActivityIndicator size="large" color="#1E40AF" />
            </View>
          ) : contracts && contracts.length > 0 ? (
            <View className="gap-4">
              {contracts.map((contract) => (
                <TouchableOpacity
                  key={contract.id}
                  onPress={() => router.push(`/contract/${contract.id}`)}
                  className="bg-surface rounded-2xl p-4 border border-border active:opacity-70"
                >
                  {/* Project Title */}
                  <Text className="text-lg font-bold text-foreground mb-2">
                    {contract.projectTitle}
                  </Text>

                  {/* Parties */}
                  <Text className="text-sm text-muted mb-3">
                    {contract.producerName} → {contract.actorName}
                  </Text>

                  {/* Status and Date */}
                  <View className="flex-row items-center justify-between">
                    <View
                      className={`${getStatusColor(contract.status)} px-3 py-1 rounded-full`}
                    >
                      <Text className="text-xs font-semibold text-white capitalize">
                        {contract.status}
                      </Text>
                    </View>
                    <Text className="text-xs text-muted">
                      {formatDate(contract.createdAt)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View className="flex-1 items-center justify-center py-12">
              <Text className="text-lg text-muted text-center">No contracts yet</Text>
              <Text className="text-sm text-muted text-center mt-2">
                {user?.userRole === "producer"
                  ? "Create your first contract using the + tab"
                  : "Contracts will appear here when producers create them"}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
