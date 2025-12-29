import { View, Text, TouchableOpacity, ActivityIndicator, Platform, Alert } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { router } from "expo-router";

export function RoleSelectionScreen() {
  const [loading, setLoading] = useState(false);
  const { refresh } = useAuth();
  const updateRoleMutation = trpc.user.updateRole.useMutation();

  const handleRoleSelect = async (role: "producer" | "actor") => {
    try {
      setLoading(true);
      console.log("[RoleSelection] Starting role selection:", role);
      
      const result = await updateRoleMutation.mutateAsync({ userRole: role });
      console.log("[RoleSelection] Update role mutation result:", result);
      
      // Wait a bit for the database to update
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log("[RoleSelection] Role selection complete");
      
      // Force a full page reload to ensure fresh user data is loaded
      // This is the most reliable method for mobile browsers
      if (typeof window !== 'undefined') {
        console.log("[RoleSelection] Reloading page...");
        window.location.reload();
      }
    } catch (error) {
      console.error("[RoleSelection] Role selection error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      if (Platform.OS === "web") {
        alert(`Failed to set role: ${errorMessage}. Please try again.`);
      } else {
        Alert.alert("Error", `Failed to set role: ${errorMessage}. Please try again.`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer className="p-6 justify-center">
      <View className="flex-1 justify-center items-center gap-8">
        {/* Title */}
        <View className="items-center gap-2">
          <Text className="text-3xl font-bold text-foreground">Choose Your Role</Text>
          <Text className="text-base text-muted text-center max-w-sm">
            Select your primary role in the film industry
          </Text>
        </View>

        {/* Role Buttons */}
        <View className="w-full max-w-sm gap-4">
          <TouchableOpacity
            onPress={() => {
              console.log("[RoleSelection] Producer button clicked!");
              handleRoleSelect("producer");
            }}
            disabled={loading}
            className="bg-surface border-2 border-primary px-6 py-6 rounded-xl items-center active:opacity-70"
          >
            <Text className="text-2xl mb-2">🎬</Text>
            <Text className="text-xl font-bold text-foreground">Producer</Text>
            <Text className="text-sm text-muted text-center mt-2">
              Create and manage contracts with actors
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              console.log("[RoleSelection] Actor button clicked!");
              handleRoleSelect("actor");
            }}
            disabled={loading}
            className="bg-surface border-2 border-primary px-6 py-6 rounded-xl items-center active:opacity-70"
          >
            <Text className="text-2xl mb-2">🎭</Text>
            <Text className="text-xl font-bold text-foreground">Actor</Text>
            <Text className="text-sm text-muted text-center mt-2">
              View and track your contracts with producers
            </Text>
          </TouchableOpacity>
        </View>

        {loading && (
          <View className="absolute inset-0 bg-background/80 items-center justify-center">
            <ActivityIndicator size="large" color="#1E40AF" />
          </View>
        )}
      </View>
    </ScreenContainer>
  );
}
