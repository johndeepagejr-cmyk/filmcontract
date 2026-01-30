import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { format, isPast, isFuture, differenceInMinutes } from "date-fns";

export default function AuditionDetailsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const auditionId = parseInt(id || "0");

  const [showFeedback, setShowFeedback] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");

  const { data: audition, isLoading, refetch } = trpc.videoAudition.getAudition.useQuery(
    { auditionId },
    { enabled: !!auditionId }
  );

  const cancelMutation = trpc.videoAudition.cancelAudition.useMutation({
    onSuccess: () => {
      Alert.alert("Cancelled", "The audition has been cancelled.");
      refetch();
    },
    onError: (error) => {
      Alert.alert("Error", error.message);
    },
  });

  const endMutation = trpc.videoAudition.endAudition.useMutation({
    onSuccess: () => {
      Alert.alert("Completed", "The audition has been marked as complete.");
      setShowFeedback(false);
      refetch();
    },
    onError: (error) => {
      Alert.alert("Error", error.message);
    },
  });

  const handleCancel = () => {
    Alert.alert(
      "Cancel Audition",
      "Are you sure you want to cancel this audition?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: () => cancelMutation.mutate({ auditionId }),
        },
      ]
    );
  };

  const handleEndWithFeedback = () => {
    endMutation.mutate({
      auditionId,
      rating: rating > 0 ? rating : undefined,
      feedback: feedback || undefined,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return colors.primary;
      case "in_progress":
        return colors.success;
      case "completed":
        return colors.muted;
      case "cancelled":
      case "no_show":
        return colors.error;
      default:
        return colors.muted;
    }
  };

  const formatAuditionDate = (date: Date) => {
    return format(new Date(date), "EEEE, MMMM d, yyyy 'at' h:mm a");
  };

  if (isLoading) {
    return (
      <ScreenContainer className="flex-1">
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  if (!audition) {
    return (
      <ScreenContainer className="flex-1">
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
          <IconSymbol name="exclamationmark.triangle" size={64} color={colors.error} />
          <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground, marginTop: 16 }}>
            Audition not found
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              backgroundColor: colors.primary,
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 12,
              marginTop: 24,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "600" }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  const isUpcoming = audition.status === "scheduled" && isFuture(new Date(audition.scheduledAt));
  const canJoin = (audition.status === "scheduled" || audition.status === "in_progress") && 
    differenceInMinutes(new Date(audition.scheduledAt), new Date()) <= 15; // Can join 15 min before
  const isProducer = audition.producer?.id === audition.producerId;

  return (
    <ScreenContainer className="flex-1">
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 24 }}>
          <TouchableOpacity onPress={() => router.back()}>
            <IconSymbol name="chevron.left" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={{ fontSize: 24, fontWeight: "bold", color: colors.foreground, marginLeft: 12, flex: 1 }}>
            Audition Details
          </Text>
          <View
            style={{
              backgroundColor: getStatusColor(audition.status) + "20",
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 12,
            }}
          >
            <Text style={{ color: getStatusColor(audition.status), fontWeight: "600", textTransform: "capitalize" }}>
              {audition.status.replace("_", " ")}
            </Text>
          </View>
        </View>

        {/* Project Info */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 20,
            marginBottom: 16,
          }}
        >
          <Text style={{ fontSize: 22, fontWeight: "bold", color: colors.foreground, marginBottom: 8 }}>
            {audition.project?.title || "Untitled Project"}
          </Text>
          {audition.role && (
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
              <Text style={{ fontSize: 14, color: colors.muted }}>Role: </Text>
              <Text style={{ fontSize: 14, color: colors.foreground, fontWeight: "500" }}>
                {audition.role.roleName}
              </Text>
            </View>
          )}
        </View>

        {/* Schedule Info */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 20,
            marginBottom: 16,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground, marginBottom: 12 }}>
            Schedule
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
            <IconSymbol name="clock" size={20} color={colors.primary} />
            <Text style={{ fontSize: 15, color: colors.foreground, marginLeft: 12 }}>
              {formatAuditionDate(audition.scheduledAt)}
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <IconSymbol name="timer" size={20} color={colors.primary} />
            <Text style={{ fontSize: 15, color: colors.foreground, marginLeft: 12 }}>
              {audition.durationMinutes} minutes
            </Text>
          </View>
          {audition.recordingEnabled && (
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}>
              <IconSymbol name="record.circle" size={20} color={colors.error} />
              <Text style={{ fontSize: 15, color: colors.error, marginLeft: 12 }}>
                Recording enabled
              </Text>
            </View>
          )}
        </View>

        {/* Participants */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 20,
            marginBottom: 16,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground, marginBottom: 12 }}>
            Participants
          </Text>
          <View style={{ marginBottom: 12 }}>
            <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 4 }}>Producer</Text>
            <Text style={{ fontSize: 15, color: colors.foreground, fontWeight: "500" }}>
              {audition.producer?.name || "Unknown"}
            </Text>
          </View>
          <View>
            <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 4 }}>Actor</Text>
            <Text style={{ fontSize: 15, color: colors.foreground, fontWeight: "500" }}>
              {audition.actor?.name || "Unknown"}
            </Text>
          </View>
        </View>

        {/* Notes */}
        {audition.notes && (
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 16,
              padding: 20,
              marginBottom: 16,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground, marginBottom: 8 }}>
              Notes
            </Text>
            <Text style={{ fontSize: 14, color: colors.muted, lineHeight: 20 }}>
              {audition.notes}
            </Text>
          </View>
        )}

        {/* Feedback (if completed) */}
        {audition.status === "completed" && (audition.rating || audition.feedback) && (
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 16,
              padding: 20,
              marginBottom: 16,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground, marginBottom: 12 }}>
              Producer Feedback
            </Text>
            {audition.rating && (
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                <Text style={{ fontSize: 14, color: colors.muted }}>Rating: </Text>
                <View style={{ flexDirection: "row" }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Text
                      key={star}
                      style={{
                        fontSize: 18,
                        color: star <= audition.rating! ? colors.warning : colors.border,
                      }}
                    >
                      ★
                    </Text>
                  ))}
                </View>
              </View>
            )}
            {audition.feedback && (
              <Text style={{ fontSize: 14, color: colors.foreground, lineHeight: 20 }}>
                {audition.feedback}
              </Text>
            )}
          </View>
        )}

        {/* Recording Link */}
        {audition.recordingUrl && (
          <TouchableOpacity
            onPress={() => router.push(`/auditions/${auditionId}/recording`)}
            style={{
              backgroundColor: colors.primary + "10",
              borderRadius: 16,
              padding: 20,
              marginBottom: 16,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <IconSymbol name="video.fill" size={24} color={colors.primary} />
              <Text style={{ fontSize: 16, fontWeight: "600", color: colors.primary, marginLeft: 12 }}>
                View Recording
              </Text>
            </View>
            <IconSymbol name="chevron.right" size={20} color={colors.primary} />
          </TouchableOpacity>
        )}

        {/* Feedback Form (for producer after call) */}
        {showFeedback && (
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 16,
              padding: 20,
              marginBottom: 16,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground, marginBottom: 16 }}>
              Rate This Audition
            </Text>
            
            <View style={{ flexDirection: "row", justifyContent: "center", marginBottom: 16 }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setRating(star)}
                  style={{ padding: 8 }}
                >
                  <Text
                    style={{
                      fontSize: 32,
                      color: star <= rating ? colors.warning : colors.border,
                    }}
                  >
                    ★
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              value={feedback}
              onChangeText={setFeedback}
              placeholder="Add feedback (optional)..."
              placeholderTextColor={colors.muted}
              multiline
              numberOfLines={4}
              style={{
                backgroundColor: colors.background,
                borderRadius: 12,
                padding: 16,
                color: colors.foreground,
                borderWidth: 1,
                borderColor: colors.border,
                minHeight: 100,
                textAlignVertical: "top",
                marginBottom: 16,
              }}
            />

            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                onPress={() => setShowFeedback(false)}
                style={{
                  flex: 1,
                  backgroundColor: colors.background,
                  borderRadius: 12,
                  paddingVertical: 14,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text style={{ color: colors.foreground, fontWeight: "600" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleEndWithFeedback}
                disabled={endMutation.isPending}
                style={{
                  flex: 1,
                  backgroundColor: colors.primary,
                  borderRadius: 12,
                  paddingVertical: 14,
                  alignItems: "center",
                  opacity: endMutation.isPending ? 0.6 : 1,
                }}
              >
                {endMutation.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ color: "#fff", fontWeight: "600" }}>Submit</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={{ gap: 12, marginBottom: 40 }}>
          {canJoin && (
            <TouchableOpacity
              onPress={() => router.push(`/auditions/${auditionId}/call`)}
              style={{
                backgroundColor: colors.success,
                borderRadius: 16,
                paddingVertical: 18,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
              }}
            >
              <IconSymbol name="video.fill" size={24} color="#fff" />
              <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 18, marginLeft: 12 }}>
                Join Audition
              </Text>
            </TouchableOpacity>
          )}

          {isUpcoming && audition.status === "scheduled" && (
            <TouchableOpacity
              onPress={handleCancel}
              disabled={cancelMutation.isPending}
              style={{
                backgroundColor: colors.error + "10",
                borderRadius: 16,
                paddingVertical: 16,
                alignItems: "center",
                borderWidth: 1,
                borderColor: colors.error,
              }}
            >
              {cancelMutation.isPending ? (
                <ActivityIndicator color={colors.error} />
              ) : (
                <Text style={{ color: colors.error, fontWeight: "600", fontSize: 16 }}>
                  Cancel Audition
                </Text>
              )}
            </TouchableOpacity>
          )}

          {audition.status === "in_progress" && isProducer && !showFeedback && (
            <TouchableOpacity
              onPress={() => setShowFeedback(true)}
              style={{
                backgroundColor: colors.primary,
                borderRadius: 16,
                paddingVertical: 16,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "600", fontSize: 16 }}>
                End & Rate Audition
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
