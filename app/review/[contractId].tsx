import { useState } from "react";
import {
  ScrollView,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { Stack, useLocalSearchParams, router } from "expo-router";
import { useColors } from "@/hooks/use-colors";

export default function ReviewContractScreen() {
  const { contractId } = useLocalSearchParams<{ contractId: string }>();
  const contractIdNum = parseInt(contractId || "0", 10);
  const colors = useColors();

  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [paymentOnTime, setPaymentOnTime] = useState(false);
  const [wouldWorkAgain, setWouldWorkAgain] = useState(false);

  const { data: contract, isLoading: contractLoading } = trpc.contracts.getById.useQuery(
    { id: contractIdNum },
    { enabled: !!contractIdNum }
  );

  const submitReviewMutation = trpc.reputation.submitReview.useMutation({
    onSuccess: () => {
      Alert.alert("Success", "Your review has been submitted!", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    },
    onError: (error) => {
      Alert.alert("Error", error.message);
    },
  });

  const handleSubmit = () => {
    if (rating === 0) {
      Alert.alert("Rating Required", "Please select a star rating");
      return;
    }

    if (!contract) return;

    submitReviewMutation.mutate({
      producerId: contract.producerId,
      contractId: contractIdNum,
      rating,
      review: review.trim() || undefined,
      paymentOnTime,
      wouldWorkAgain,
    });
  };

  if (contractLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <Stack.Screen options={{ title: "Review Producer" }} />
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  if (!contract) {
    return (
      <ScreenContainer className="p-6">
        <Stack.Screen options={{ title: "Contract Not Found" }} />
        <Text className="text-lg text-muted text-center">Contract not found</Text>
      </ScreenContainer>
    );
  }

  const renderStarButton = (starNumber: number) => {
    const isFilled = starNumber <= rating;
    return (
      <TouchableOpacity
        key={starNumber}
        onPress={() => setRating(starNumber)}
        activeOpacity={0.7}
        style={{ padding: 4 }}
      >
        <Text style={{ fontSize: 40, color: isFilled ? colors.warning : colors.muted }}>
          {isFilled ? "★" : "☆"}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenContainer>
      <Stack.Screen
        options={{
          title: "Review Producer",
        }}
      />
      <ScrollView className="flex-1">
        <View className="p-6 gap-6">
          <View className="gap-2">
            <Text className="text-2xl font-bold text-foreground">Rate Your Experience</Text>
            <Text className="text-muted">
              Help other actors by sharing your experience working with this producer on "
              {contract.projectTitle}"
            </Text>
          </View>

          {/* Star Rating */}
          <View className="bg-surface rounded-xl p-6 gap-4">
            <Text className="font-semibold text-foreground">Overall Rating *</Text>
            <View className="flex-row justify-center gap-2">
              {[1, 2, 3, 4, 5].map(renderStarButton)}
            </View>
            {rating > 0 && (
              <Text className="text-center text-muted">
                {rating === 1 && "Poor"}
                {rating === 2 && "Fair"}
                {rating === 3 && "Good"}
                {rating === 4 && "Very Good"}
                {rating === 5 && "Excellent"}
              </Text>
            )}
          </View>

          {/* Written Review */}
          <View className="bg-surface rounded-xl p-6 gap-4">
            <Text className="font-semibold text-foreground">Your Review (Optional)</Text>
            <TextInput
              value={review}
              onChangeText={setReview}
              placeholder="Share details about your experience..."
              placeholderTextColor={colors.muted}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              className="bg-background rounded-lg p-4 text-foreground"
              style={{
                minHeight: 120,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            />
          </View>

          {/* Quick Questions */}
          <View className="bg-surface rounded-xl p-6 gap-4">
            <Text className="font-semibold text-foreground">Quick Questions</Text>

            <TouchableOpacity
              onPress={() => setPaymentOnTime(!paymentOnTime)}
              activeOpacity={0.7}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                padding: 16,
                backgroundColor: colors.background,
                borderRadius: 8,
              }}
            >
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 4,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: paymentOnTime ? colors.success : colors.background,
                  borderWidth: 2,
                  borderColor: paymentOnTime ? colors.success : colors.border,
                }}
              >
                {paymentOnTime && <Text style={{ color: colors.background, fontWeight: "bold" }}>✓</Text>}
              </View>
              <Text style={{ flex: 1, color: colors.foreground }}>Was payment made on time?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setWouldWorkAgain(!wouldWorkAgain)}
              activeOpacity={0.7}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                padding: 16,
                backgroundColor: colors.background,
                borderRadius: 8,
              }}
            >
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 4,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: wouldWorkAgain ? colors.success : colors.background,
                  borderWidth: 2,
                  borderColor: wouldWorkAgain ? colors.success : colors.border,
                }}
              >
                {wouldWorkAgain && <Text style={{ color: colors.background, fontWeight: "bold" }}>✓</Text>}
              </View>
              <Text style={{ flex: 1, color: colors.foreground }}>
                Would you work with this producer again?
              </Text>
            </TouchableOpacity>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={submitReviewMutation.isPending}
            activeOpacity={0.8}
            style={{
              backgroundColor: colors.primary,
              borderRadius: 9999,
              padding: 16,
              alignItems: "center",
              opacity: submitReviewMutation.isPending ? 0.5 : 1,
            }}
          >
            {submitReviewMutation.isPending ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text style={{ color: colors.background, fontWeight: "600", fontSize: 18 }}>Submit Review</Text>
            )}
          </TouchableOpacity>

          <Text className="text-xs text-muted text-center">
            Your review will be publicly visible on the producer's profile
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
