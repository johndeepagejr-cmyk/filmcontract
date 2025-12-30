import { ScrollView, Text, View, ActivityIndicator, TouchableOpacity, Linking } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { Stack, useLocalSearchParams, router } from "expo-router";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";

export default function ActorProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const actorId = parseInt(id || "0", 10);
  const colors = useColors();
  const { user } = useAuth();
  const isProducer = user?.userRole === "producer";

  const { data: reputation, isLoading: reputationLoading } =
    trpc.actorReputation.getActorReputation.useQuery(
      { actorId },
      { enabled: !!actorId }
    );

  const { data: reviews, isLoading: reviewsLoading } =
    trpc.actorReputation.getActorReviews.useQuery(
      { actorId },
      { enabled: !!actorId }
    );

  if (reputationLoading || reviewsLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <Stack.Screen options={{ title: "Actor Profile" }} />
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  if (!reputation) {
    return (
      <ScreenContainer className="p-6">
        <Stack.Screen options={{ title: "Actor Not Found" }} />
        <Text className="text-lg text-muted text-center">Actor not found</Text>
      </ScreenContainer>
    );
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
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

  return (
    <ScreenContainer>
      <Stack.Screen
        options={{
          title: reputation.actorName,
        }}
      />
      <ScrollView className="flex-1">
        <View className="p-6 gap-6">
          {/* Header */}
          <View className="items-center gap-2">
            <View className="w-24 h-24 rounded-full bg-success items-center justify-center">
              <Text className="text-4xl font-bold text-background">
                {reputation.actorName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text className="text-2xl font-bold text-foreground">
              {reputation.actorName}
            </Text>
            <Text className="text-sm text-muted">
              Member since {formatDate(reputation.joinedDate)}
            </Text>
            {reputation.actorEmail && (
              <TouchableOpacity
                onPress={() => Linking.openURL(`mailto:${reputation.actorEmail}`)}
                className="mt-2"
                style={{ opacity: 1 }}
                activeOpacity={0.7}
              >
                <Text className="text-primary text-sm">{reputation.actorEmail}</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Hire Button for Producers */}
          {isProducer && (
            <TouchableOpacity
              onPress={() => router.push(`/create?actorEmail=${encodeURIComponent(reputation.actorEmail || '')}`)}
              className="bg-primary px-8 py-4 rounded-full items-center active:opacity-80"
              style={{ opacity: 1 }}
            >
              <Text className="text-background text-lg font-semibold">💼 Hire This Actor</Text>
            </TouchableOpacity>
          )}

          {/* Rating Overview */}
          <View className="bg-surface rounded-2xl p-6 gap-4">
            <View className="items-center gap-2">
              <Text className="text-5xl font-bold text-foreground">
                {reputation.averageRating.toFixed(1)}
              </Text>
              <Text className="text-2xl text-warning">
                {renderStars(reputation.averageRating)}
              </Text>
              <Text className="text-sm text-muted">
                Based on {reputation.totalReviews} review{reputation.totalReviews !== 1 ? "s" : ""}
              </Text>
            </View>
          </View>

          {/* Stats Grid */}
          <View className="gap-4">
            <Text className="text-lg font-semibold text-foreground">Reputation Stats</Text>

            <View className="flex-row gap-4">
              <View className="flex-1 bg-surface rounded-xl p-4 gap-2">
                <Text className="text-3xl font-bold text-foreground">
                  {reputation.totalContracts}
                </Text>
                <Text className="text-sm text-muted">Total Contracts</Text>
              </View>

              <View className="flex-1 bg-surface rounded-xl p-4 gap-2">
                <Text className="text-3xl font-bold text-success">
                  {reputation.completedContracts}
                </Text>
                <Text className="text-sm text-muted">Completed</Text>
              </View>
            </View>

            <View className="flex-row gap-4">
              <View className="flex-1 bg-surface rounded-xl p-4 gap-2">
                <Text className="text-3xl font-bold text-foreground">
                  {reputation.completionRate}%
                </Text>
                <Text className="text-sm text-muted">Completion Rate</Text>
              </View>

              <View className="flex-1 bg-surface rounded-xl p-4 gap-2">
                <Text className="text-3xl font-bold text-warning">
                  {reputation.professionalismRating.toFixed(1)}
                </Text>
                <Text className="text-sm text-muted">Professionalism</Text>
              </View>
            </View>

            <View className="flex-row gap-4">
              <View className="flex-1 bg-surface rounded-xl p-4 gap-2">
                <Text className="text-3xl font-bold text-warning">
                  {reputation.reliabilityRating.toFixed(1)}
                </Text>
                <Text className="text-sm text-muted">Reliability</Text>
              </View>

              <View className="flex-1 bg-surface rounded-xl p-4 gap-2">
                <Text className="text-3xl font-bold text-primary">
                  {reputation.wouldHireAgainRate}%
                </Text>
                <Text className="text-sm text-muted">Would Hire Again</Text>
              </View>
            </View>
          </View>

          {/* Reviews */}
          {reviews && reviews.length > 0 && (
            <View className="gap-4">
              <Text className="text-lg font-semibold text-foreground">Reviews</Text>

              {reviews.map((review) => (
                <View key={review.id} className="bg-surface rounded-xl p-4 gap-3">
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1 gap-1">
                      <Text className="font-semibold text-foreground">
                        {review.producerName}
                      </Text>
                      <Text className="text-sm text-muted">{review.projectTitle}</Text>
                    </View>
                    <Text className="text-lg text-warning">
                      {renderStars(review.rating)}
                    </Text>
                  </View>

                  {review.review && (
                    <Text className="text-foreground leading-relaxed">{review.review}</Text>
                  )}

                  <View className="flex-row gap-4">
                    <View className="flex-1">
                      <Text className="text-xs text-muted">Professionalism</Text>
                      <Text className="text-warning">
                        {renderStars(review.professionalismRating)}
                      </Text>
                    </View>

                    <View className="flex-1">
                      <Text className="text-xs text-muted">Reliability</Text>
                      <Text className="text-warning">
                        {renderStars(review.reliabilityRating)}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row items-center gap-2 pt-2">
                    <Text className={review.wouldHireAgain ? "text-success" : "text-error"}>
                      {review.wouldHireAgain ? "✓" : "✗"}
                    </Text>
                    <Text className="text-sm text-muted">
                      {review.wouldHireAgain ? "Would hire again" : "Would not hire again"}
                    </Text>
                  </View>

                  <Text className="text-xs text-muted">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {reviews && reviews.length === 0 && (
            <View className="bg-surface rounded-xl p-6 items-center">
              <Text className="text-muted text-center">
                No reviews yet for this actor
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
