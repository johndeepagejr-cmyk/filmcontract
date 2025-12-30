import { ScrollView, Text, View, ActivityIndicator, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { Stack, router } from "expo-router";
import { useColors } from "@/hooks/use-colors";

export default function ActorsDirectoryScreen() {
  const colors = useColors();
  const { data: actors, isLoading } = trpc.actorReputation.getAllActors.useQuery();

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
        <Stack.Screen options={{ title: "Actor Directory" }} />
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Stack.Screen
        options={{
          title: "Actor Directory",
        }}
      />
      <ScrollView className="flex-1">
        <View className="p-6 gap-4">
          <View className="gap-2">
            <Text className="text-2xl font-bold text-foreground">Find Actors</Text>
            <Text className="text-muted">
              Browse actor profiles and reputation to find the perfect talent for your project
            </Text>
          </View>

          {actors && actors.length > 0 ? (
            <View className="gap-4">
              {actors.map((actor) => (
                <TouchableOpacity
                  key={actor.actorId}
                  onPress={() => router.push(`/actor/${actor.actorId}`)}
                  className="bg-surface rounded-xl p-4 gap-3"
                  style={{ opacity: 1 }}
                  activeOpacity={0.7}
                >
                  <View className="flex-row items-center gap-3">
                    <View className="w-16 h-16 rounded-full bg-success items-center justify-center">
                      <Text className="text-2xl font-bold text-background">
                        {actor.actorName.charAt(0).toUpperCase()}
                      </Text>
                    </View>

                    <View className="flex-1 gap-1">
                      <Text className="text-lg font-semibold text-foreground">
                        {actor.actorName}
                      </Text>
                      <View className="flex-row items-center gap-2">
                        <Text className="text-warning">
                          {renderStars(actor.averageRating)}
                        </Text>
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

                    <View className="flex-1">
                      <Text className="text-sm text-muted">Professionalism</Text>
                      <Text className="text-lg font-semibold text-warning">
                        {actor.professionalismRating.toFixed(1)}
                      </Text>
                    </View>
                  </View>

                  {actor.totalReviews > 0 && (
                    <View className="pt-2 border-t border-border">
                      <Text className="text-sm text-primary">
                        {actor.wouldHireAgainRate}% of producers would hire this actor again
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View className="bg-surface rounded-xl p-6 items-center">
              <Text className="text-muted text-center">
                No actors found. Actors will appear here once they join!
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
