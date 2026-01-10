import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

export default function ActivityFeedScreen() {
  const colors = useColors();
  const { data: feed, isLoading, refetch } = trpc.social.getActivityFeed.useQuery();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
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
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <View className="p-6 gap-4">
          <View className="gap-2">
            <Text className="text-2xl font-bold text-foreground">Activity Feed</Text>
            <Text className="text-muted">
              See what people you follow are up to
            </Text>
          </View>

          {feed && feed.length > 0 ? (
            <View className="gap-3">
              {feed.map((activity: any, index: number) => (
                <TouchableOpacity
                  key={`${activity.type}-${activity.id}-${index}`}
                  className="bg-surface rounded-xl p-4 gap-2"
                  activeOpacity={0.7}
                  onPress={() => {
                    if (Platform.OS !== "web") {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                  }}
                >
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-foreground">
                        {activity.userName || "Unknown User"}
                      </Text>
                      <Text className="text-sm text-muted mt-1">
                        {activity.action}
                      </Text>
                    </View>
                    <View className="bg-primary px-3 py-1 rounded-full">
                      <Text className="text-xs font-bold text-white">
                        {activity.type === "contract" ? "📋" : "⭐"}
                      </Text>
                    </View>
                  </View>

                  <View className="mt-2 bg-background rounded-lg p-3">
                    <Text className="text-sm text-foreground font-medium">
                      {activity.description}
                    </Text>
                  </View>

                  <Text className="text-xs text-muted mt-2">
                    {new Date(activity.createdAt).toLocaleDateString()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View className="flex-1 items-center justify-center gap-4">
              <Text className="text-lg text-muted">No activity yet</Text>
              <Text className="text-sm text-muted text-center">
                Follow people to see their activity here
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
