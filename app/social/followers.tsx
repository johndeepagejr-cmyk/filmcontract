import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, FlatList } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

export default function FollowersScreen() {
  const colors = useColors();
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const id = userId ? parseInt(userId) : 0;

  const { data: followers, isLoading } = trpc.social.getFollowers.useQuery({ userId: id });
  const { data: isFollowing, refetch: refetchFollowing } = trpc.social.isFollowing.useQuery({ userId: id });
  const followMutation = trpc.social.follow.useMutation();
  const unfollowMutation = trpc.social.unfollow.useMutation();

  const handleFollowToggle = async () => {
    try {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      if (isFollowing) {
        await unfollowMutation.mutateAsync({ userId: id });
      } else {
        await followMutation.mutateAsync({ userId: id });
      }

      await refetchFollowing();
    } catch (error) {
      console.error("Failed to toggle follow:", error);
    }
  };

  if (isLoading) {
    return (
      <ScreenContainer className="p-6">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-0">
      <ScrollView className="flex-1">
        <View className="p-6 gap-4">
          <View className="gap-2">
            <Text className="text-2xl font-bold text-foreground">Followers</Text>
            <Text className="text-muted">
              {followers?.length || 0} follower{followers?.length !== 1 ? "s" : ""}
            </Text>
          </View>

          {followers && followers.length > 0 ? (
            <View className="gap-3">
              {followers.map((follower: any) => (
                <View
                  key={follower.id}
                  className="bg-surface rounded-xl p-4 flex-row items-center justify-between"
                >
                  <TouchableOpacity
                    className="flex-1"
                    onPress={() => router.push(`/profile/${follower.id}`)}
                  >
                    <Text className="text-base font-semibold text-foreground">
                      {follower.name || "Unknown"}
                    </Text>
                    <Text className="text-sm text-muted mt-1">
                      {follower.userRole === "producer" ? "🎬 Producer" : "🎭 Actor"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleFollowToggle}
                    className={`px-4 py-2 rounded-lg ${
                      isFollowing ? "bg-muted" : "bg-primary"
                    }`}
                  >
                    <Text className={`text-sm font-semibold ${
                      isFollowing ? "text-foreground" : "text-white"
                    }`}>
                      {isFollowing ? "Following" : "Follow"}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <View className="flex-1 items-center justify-center gap-4">
              <Text className="text-lg text-muted">No followers yet</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
