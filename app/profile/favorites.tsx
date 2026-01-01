import { Text, View, ScrollView, TouchableOpacity, ActivityIndicator, Platform } from "react-native";
import { Image } from "expo-image";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { Stack, router } from "expo-router";
import { useColors } from "@/hooks/use-colors";
import { useState } from "react";
import * as Haptics from "expo-haptics";

export default function FavoritesScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<"actors" | "producers">("actors");
  
  const { data: favorites, isLoading } = trpc.favorites.list.useQuery();
  const { data: actors } = trpc.actorReputation.getAllActors.useQuery();
  const { data: producers } = trpc.reputation.getAllProducers.useQuery();
  const { data: producerProfiles } = trpc.producers.getAllProducers.useQuery();
  const removeFavorite = trpc.favorites.remove.useMutation();
  const utils = trpc.useUtils();

  const favoritedActors = favorites
    ?.filter((f) => f.type === "actor")
    .map((f) => actors?.find((a) => a.actorId === f.favoritedUserId))
    .filter(Boolean);

  const favoritedProducers = favorites
    ?.filter((f) => f.type === "producer")
    .map((f) => {
      const producer = producers?.find((p) => p.producerId === f.favoritedUserId);
      const profile = producerProfiles?.find((p) => p.userId === f.favoritedUserId);
      return producer ? { ...producer, profile } : null;
    })
    .filter(Boolean);

  const handleRemoveFavorite = async (userId: number) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await removeFavorite.mutateAsync({ favoritedUserId: userId });
    utils.favorites.list.invalidate();
  };

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const stars = [];

    for (let i = 0; i < fullStars; i++) {
      stars.push("★");
    }
    if (hasHalfStar) {
      stars.push("½");
    }
    while (stars.length < 5) {
      stars.push("☆");
    }

    return stars.join("");
  };

  if (isLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <Stack.Screen
          options={{
            title: "Favorites",
            headerShown: true,
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.foreground,
            headerShadowVisible: false,
          }}
        />
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Stack.Screen
        options={{
          title: "Favorites",
          headerShown: true,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.foreground,
          headerShadowVisible: false,
        }}
      />
      <ScrollView className="flex-1">
        <View className="p-6 gap-4">
          <View className="gap-2">
            <Text className="text-2xl font-bold text-foreground">My Favorites</Text>
            <Text className="text-muted">
              Quick access to your bookmarked talent and producers
            </Text>
          </View>

          {/* Tab Selector */}
          <View className="flex-row gap-2 bg-surface rounded-xl p-1">
            <TouchableOpacity
              onPress={() => setActiveTab("actors")}
              className={`flex-1 py-3 rounded-lg items-center ${
                activeTab === "actors" ? "bg-primary" : ""
              }`}
              activeOpacity={0.7}
            >
              <Text
                className={`font-semibold ${
                  activeTab === "actors" ? "text-white" : "text-muted"
                }`}
              >
                Actors ({favoritedActors?.length || 0})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveTab("producers")}
              className={`flex-1 py-3 rounded-lg items-center ${
                activeTab === "producers" ? "bg-primary" : ""
              }`}
              activeOpacity={0.7}
            >
              <Text
                className={`font-semibold ${
                  activeTab === "producers" ? "text-white" : "text-muted"
                }`}
              >
                Producers ({favoritedProducers?.length || 0})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Actors Tab */}
          {activeTab === "actors" && (
            <View className="gap-4">
              {favoritedActors && favoritedActors.length > 0 ? (
                favoritedActors.map((actor) => (
                  <TouchableOpacity
                    key={actor.actorId}
                    onPress={() => router.push(`/actor/${actor.actorId}`)}
                    className="bg-surface rounded-xl p-4 gap-3"
                    activeOpacity={0.7}
                  >
                    <View className="flex-row items-center gap-3">
                      {actor.profilePhotoUrl ? (
                        <Image
                          source={{ uri: actor.profilePhotoUrl }}
                          className="w-16 h-16 rounded-full"
                          style={{ backgroundColor: "#E5E7EB" }}
                        />
                      ) : (
                        <View className="w-16 h-16 rounded-full bg-success items-center justify-center">
                          <Text className="text-2xl font-bold text-background">
                            {actor.actorName.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}

                      <View className="flex-1 gap-1">
                        <View className="flex-row items-center justify-between">
                          <Text className="text-lg font-semibold text-foreground">
                            {actor.actorName}
                          </Text>
                          <TouchableOpacity
                            onPress={(e) => {
                              e.stopPropagation();
                              handleRemoveFavorite(actor.actorId);
                            }}
                            className="active:opacity-70 p-2"
                          >
                            <Text className="text-2xl">❤️</Text>
                          </TouchableOpacity>
                        </View>
                        {actor.location && (
                          <Text className="text-sm text-muted">📍 {actor.location}</Text>
                        )}
                        <View className="flex-row items-center gap-2">
                          <Text className="text-warning">{renderStars(actor.averageRating)}</Text>
                          <Text className="text-sm text-muted">
                            {actor.averageRating.toFixed(1)}
                          </Text>
                          <Text className="text-sm text-muted">
                            ({actor.totalReviews} review{actor.totalReviews !== 1 ? "s" : ""})
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View className="flex-row gap-4">
                      <View className="flex-1">
                        <Text className="text-sm text-muted">Contracts</Text>
                        <Text className="text-lg font-semibold text-foreground">
                          {actor.totalContracts}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-sm text-muted">Completion</Text>
                        <Text className="text-lg font-semibold text-success">
                          {actor.completionRate}%
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <View className="bg-surface rounded-xl p-8 items-center gap-2">
                  <Text className="text-4xl">🤍</Text>
                  <Text className="text-lg font-semibold text-foreground">No favorite actors yet</Text>
                  <Text className="text-sm text-muted text-center">
                    Browse the actors directory and tap the heart icon to save your favorites
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Producers Tab */}
          {activeTab === "producers" && (
            <View className="gap-4">
              {favoritedProducers && favoritedProducers.length > 0 ? (
                favoritedProducers.map((producer) => (
                  <TouchableOpacity
                    key={producer.producerId}
                    onPress={() => router.push(`/producer/${producer.producerId}`)}
                    className="bg-surface rounded-xl p-4 gap-3"
                    activeOpacity={0.7}
                  >
                    <View className="flex-row items-center gap-3">
                      {producer.profile?.profilePhotoUrl ? (
                        <Image
                          source={{ uri: producer.profile.profilePhotoUrl }}
                          className="w-16 h-16 rounded-full"
                          style={{ backgroundColor: "#E5E7EB" }}
                        />
                      ) : (
                        <View className="w-16 h-16 rounded-full bg-primary items-center justify-center">
                          <Text className="text-2xl font-bold text-background">
                            {producer.producerName.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}

                      <View className="flex-1 gap-1">
                        <View className="flex-row items-center justify-between">
                          <Text className="text-lg font-semibold text-foreground">
                            {producer.profile?.companyName || producer.producerName}
                          </Text>
                          <TouchableOpacity
                            onPress={(e) => {
                              e.stopPropagation();
                              handleRemoveFavorite(producer.producerId);
                            }}
                            className="active:opacity-70 p-2"
                          >
                            <Text className="text-2xl">❤️</Text>
                          </TouchableOpacity>
                        </View>
                        {producer.profile?.location && (
                          <Text className="text-sm text-muted">📍 {producer.profile.location}</Text>
                        )}
                        <View className="flex-row items-center gap-2">
                          <Text className="text-warning">{renderStars(producer.averageRating)}</Text>
                          <Text className="text-sm text-muted">
                            {producer.averageRating.toFixed(1)}
                          </Text>
                          <Text className="text-sm text-muted">
                            ({producer.totalReviews} review{producer.totalReviews !== 1 ? "s" : ""})
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View className="flex-row gap-4">
                      <View className="flex-1">
                        <Text className="text-sm text-muted">Contracts</Text>
                        <Text className="text-lg font-semibold text-foreground">
                          {producer.totalContracts}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-sm text-muted">Completion</Text>
                        <Text className="text-lg font-semibold text-success">
                          {producer.completionRate}%
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <View className="bg-surface rounded-xl p-8 items-center gap-2">
                  <Text className="text-4xl">🤍</Text>
                  <Text className="text-lg font-semibold text-foreground">No favorite producers yet</Text>
                  <Text className="text-sm text-muted text-center">
                    Browse the producers directory and tap the heart icon to save your favorites
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
