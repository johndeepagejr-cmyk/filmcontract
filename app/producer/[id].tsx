import { ScrollView, Text, View, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { Stack, useLocalSearchParams } from "expo-router";
import { useColors } from "@/hooks/use-colors";

export default function ProducerProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const producerId = parseInt(id || "0", 10);
  const colors = useColors();

  const { data: reputation, isLoading: reputationLoading } =
    trpc.reputation.getProducerReputation.useQuery(
      { producerId },
      { enabled: !!producerId }
    );

  const { data: reviews, isLoading: reviewsLoading } =
    trpc.reputation.getProducerReviews.useQuery(
      { producerId },
      { enabled: !!producerId }
    );

  if (reputationLoading || reviewsLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <Stack.Screen options={{ title: "Producer Profile" }} />
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  if (!reputation) {
    return (
      <ScreenContainer className="p-6">
        <Stack.Screen options={{ title: "Producer Not Found" }} />
        <Text className="text-lg text-muted text-center">Producer not found</Text>
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
          title: reputation.producerName,
        }}
      />
      <ScrollView className="flex-1">
        <View className="p-6 gap-6">
          {/* Header */}
          <View className="items-center gap-2">
            <View className="w-24 h-24 rounded-full bg-primary items-center justify-center">
              <Text className="text-4xl font-bold text-background">
                {reputation.producerName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text className="text-2xl font-bold text-foreground">
              {reputation.producerName}
            </Text>
            <Text className="text-sm text-muted">
              Member since {formatDate(reputation.joinedDate)}
            </Text>
          </View>

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
                <Text className="text-3xl font-bold text-success">
                  {reputation.onTimePaymentRate}%
                </Text>
                <Text className="text-sm text-muted">On-Time Payments</Text>
              </View>
            </View>

            <View className="bg-surface rounded-xl p-4 gap-2">
              <Text className="text-3xl font-bold text-primary">
                {reputation.wouldWorkAgainRate}%
              </Text>
              <Text className="text-sm text-muted">
                of actors would work with this producer again
              </Text>
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
                        {review.actorName}
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
                    <View className="flex-row items-center gap-2">
                      <Text className={review.paymentOnTime ? "text-success" : "text-error"}>
                        {review.paymentOnTime ? "✓" : "✗"}
                      </Text>
                      <Text className="text-sm text-muted">Payment on time</Text>
                    </View>

                    <View className="flex-row items-center gap-2">
                      <Text className={review.wouldWorkAgain ? "text-success" : "text-error"}>
                        {review.wouldWorkAgain ? "✓" : "✗"}
                      </Text>
                      <Text className="text-sm text-muted">Would work again</Text>
                    </View>
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
                No reviews yet for this producer
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
