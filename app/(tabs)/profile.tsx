import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { router } from "expo-router";

export default function ProfileScreen() {
  const { user, isAuthenticated, logout, loading: authLoading } = useAuth();

  const { data: contracts, isLoading: contractsLoading } = trpc.contracts.list.useQuery(
    undefined,
    {
      enabled: isAuthenticated && !!user?.userRole,
    }
  );

  const handleLogout = async () => {
    await logout();
    router.replace("/");
  };

  if (!isAuthenticated && !authLoading) {
    return (
      <ScreenContainer className="p-6 items-center justify-center">
        <Text className="text-lg text-muted text-center">Please sign in to view your profile</Text>
      </ScreenContainer>
    );
  }

  if (authLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color="#1E40AF" />
      </ScreenContainer>
    );
  }

  const activeContracts = contracts?.filter((c) => c.status === "active").length || 0;
  const totalContracts = contracts?.length || 0;

  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 gap-6">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">Profile</Text>
            <Text className="text-base text-muted">Your account information</Text>
          </View>

          {/* User Info Card */}
          <View className="bg-surface rounded-2xl p-6 gap-4">
            <View className="gap-1">
              <Text className="text-sm font-medium text-muted">Name</Text>
              <Text className="text-lg font-semibold text-foreground">
                {user?.name || "Not set"}
              </Text>
            </View>

            <View className="h-px bg-border" />

            <View className="gap-1">
              <Text className="text-sm font-medium text-muted">Email</Text>
              <Text className="text-lg font-semibold text-foreground">
                {user?.email || "Not set"}
              </Text>
            </View>

            <View className="h-px bg-border" />

            <View className="gap-1">
              <Text className="text-sm font-medium text-muted">Role</Text>
              <View className="flex-row items-center gap-2">
                <Text className="text-2xl">{user?.userRole === "producer" ? "🎬" : "🎭"}</Text>
                <Text className="text-lg font-semibold text-foreground capitalize">
                  {user?.userRole || "Not set"}
                </Text>
              </View>
            </View>
          </View>

          {/* Statistics Card */}
          <View className="bg-surface rounded-2xl p-6 gap-4">
            <Text className="text-lg font-bold text-foreground">Contract Statistics</Text>

            {contractsLoading ? (
              <ActivityIndicator size="small" color="#1E40AF" />
            ) : (
              <>
                <View className="flex-row justify-between items-center">
                  <Text className="text-sm text-muted">Total Contracts</Text>
                  <Text className="text-2xl font-bold text-foreground">{totalContracts}</Text>
                </View>

                <View className="h-px bg-border" />

                <View className="flex-row justify-between items-center">
                  <Text className="text-sm text-muted">Active Contracts</Text>
                  <Text className="text-2xl font-bold text-success">{activeContracts}</Text>
                </View>
              </>
            )}
          </View>

          {/* Logout Button */}
          <TouchableOpacity
            onPress={handleLogout}
            className="bg-error px-6 py-4 rounded-xl items-center active:opacity-80 mt-4"
          >
            <Text className="text-white text-lg font-semibold">Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
