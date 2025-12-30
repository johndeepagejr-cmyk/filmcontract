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

export default function ReviewActorScreen() {
  const { contractId } = useLocalSearchParams<{ contractId: string }>();
  const contractIdNum = parseInt(contractId || "0", 10);
  const colors = useColors();

  const [rating, setRating] = useState(0);
  const [professionalismRating, setProfessionalismRating] = useState(0);
  const [reliabilityRating, setReliabilityRating] = useState(0);
  const [review, setReview] = useState("");
  const [wouldHireAgain, setWouldHireAgain] = useState(false);

  const { data: contract, isLoading: contractLoading } = trpc.contracts.getById.useQuery(
    { id: contractIdNum },
    { enabled: !!contractIdNum }
  );

  const submitReviewMutation = trpc.actorReputation.submitReview.useMutation({
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
    if (rating === 0 || professionalismRating === 0 || reliabilityRating === 0) {
      Alert.alert("Ratings Required", "Please provide all star ratings");
      return;
    }

    if (!contract) return;

    submitReviewMutation.mutate({
      actorId: contract.actorId,
      contractId: contractIdNum,
      rating,
      review: review.trim() || undefined,
      professionalismRating,
      reliabilityRating,
      wouldHireAgain,
    });
  };

  if (contractLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <Stack.Screen options={{ title: "Review Actor" }} />
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

  const renderStarButton = (starNumber: number, currentValue: number, setValue: (v: number) => void) => {
    const isFilled = starNumber <= currentValue;
    return (
      <TouchableOpacity
        key={starNumber}
        onPress={() => setValue(starNumber)}
        style={{ opacity: 1 }}
        activeOpacity={0.7}
      >
        <Text className="text-5xl" style={{ color: isFilled ? colors.warning : colors.muted }}>
          {isFilled ? "★" : "☆"}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenContainer>
      <Stack.Screen
        options={{
          title: "Review Actor",
        }}
      />
      <ScrollView className="flex-1">
        <View className="p-6 gap-6">
          <View className="gap-2">
            <Text className="text-2xl font-bold text-foreground">Rate Your Experience</Text>
            <Text className="text-muted">
              Help other producers by sharing your experience working with {contract.actor?.name || "this actor"} on "{contract.projectTitle}"
            </Text>
          </View>

          {/* Overall Rating */}
          <View className="bg-surface rounded-xl p-6 gap-4">
            <Text className="font-semibold text-foreground">Overall Rating *</Text>
            <View className="flex-row justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => renderStarButton(star, rating, setRating))}
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

          {/* Professionalism Rating */}
          <View className="bg-surface rounded-xl p-6 gap-4">
            <Text className="font-semibold text-foreground">Professionalism *</Text>
            <Text className="text-sm text-muted">
              How professional was the actor on set and in communications?
            </Text>
            <View className="flex-row justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => renderStarButton(star, professionalismRating, setProfessionalismRating))}
            </View>
          </View>

          {/* Reliability Rating */}
          <View className="bg-surface rounded-xl p-6 gap-4">
            <Text className="font-semibold text-foreground">Reliability *</Text>
            <Text className="text-sm text-muted">
              Did the actor show up on time and meet all commitments?
            </Text>
            <View className="flex-row justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => renderStarButton(star, reliabilityRating, setReliabilityRating))}
            </View>
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

          {/* Would Hire Again */}
          <View className="bg-surface rounded-xl p-6 gap-4">
            <Text className="font-semibold text-foreground">Quick Question</Text>

            <TouchableOpacity
              onPress={() => setWouldHireAgain(!wouldHireAgain)}
              className="flex-row items-center gap-3 p-4 bg-background rounded-lg"
              style={{ opacity: 1 }}
              activeOpacity={0.7}
            >
              <View
                className="w-6 h-6 rounded items-center justify-center"
                style={{
                  backgroundColor: wouldHireAgain ? colors.success : colors.background,
                  borderWidth: 2,
                  borderColor: wouldHireAgain ? colors.success : colors.border,
                }}
              >
                {wouldHireAgain && <Text className="text-background font-bold">✓</Text>}
              </View>
              <Text className="flex-1 text-foreground">
                Would you hire this actor again?
              </Text>
            </TouchableOpacity>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={submitReviewMutation.isPending}
            className="bg-primary rounded-full p-4 items-center"
            style={{
              opacity: submitReviewMutation.isPending ? 0.5 : 1,
            }}
            activeOpacity={0.8}
          >
            {submitReviewMutation.isPending ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text className="text-background font-semibold text-lg">Submit Review</Text>
            )}
          </TouchableOpacity>

          <Text className="text-xs text-muted text-center">
            Your review will be publicly visible on the actor's profile
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
