import { ScrollView, Text, View, ActivityIndicator, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { Stack, router } from "expo-router";
import { useColors } from "@/hooks/use-colors";

export default function ProducersDirectoryScreen() {
  const colors = useColors();
  const { data: producers, isLoading } = trpc.reputation.getAllProducers.useQuery();

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
        <Stack.Screen options={{ title: "Producer Directory" }} />
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Stack.Screen
        options={{
          title: "Producer Directory",
        }}
      />
      <ScrollView className="flex-1">
        <View className="p-6 gap-4">
          <View className="gap-2">
            <Text className="text-2xl font-bold text-foreground">Find Producers</Text>
            <Text className="text-muted">
              Browse producer profiles and reputation to find the right fit for your project
            </Text>
          </View>

          {producers && producers.length > 0 ? (
            <View className="gap-4">
              {producers.map((producer) => (
                <TouchableOpacity
                  key={producer.producerId}
                  onPress={() => router.push(`/producer/${producer.producerId}`)}
                  className="bg-surface rounded-xl p-4 gap-3"
                  style={{ opacity: 1 }}
                  activeOpacity={0.7}
                >
                  <View className="flex-row items-center gap-3">
                    <View className="w-16 h-16 rounded-full bg-primary items-center justify-center">
                      <Text className="text-2xl font-bold text-background">
                        {producer.producerName.charAt(0).toUpperCase()}
                      </Text>
                    </View>

                    <View className="flex-1 gap-1">
                      <Text className="text-lg font-semibold text-foreground">
                        {producer.producerName}
                      </Text>
                      <View className="flex-row items-center gap-2">
                        <Text className="text-warning">
                          {renderStars(producer.averageRating)}
                        </Text>
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

                    <View className="flex-1">
                      <Text className="text-sm text-muted">On-Time Pay</Text>
                      <Text className="text-lg font-semibold text-success">
                        {producer.onTimePaymentRate}%
                      </Text>
                    </View>
                  </View>

                  {producer.totalReviews > 0 && (
                    <View className="pt-2 border-t border-border">
                      <Text className="text-sm text-primary">
                        {producer.wouldWorkAgainRate}% would work with this producer again
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View className="bg-surface rounded-xl p-6 items-center">
              <Text className="text-muted text-center">
                No producers found. Be the first to create contracts!
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
