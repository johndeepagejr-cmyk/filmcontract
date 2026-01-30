import { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { format } from "date-fns";

export default function InvitationResponseScreen() {
  const colors = useColors();
  const router = useRouter();
  const { id, action } = useLocalSearchParams<{ id: string; action?: string }>();
  const invitationId = parseInt(id || "0");

  const [isResponding, setIsResponding] = useState(false);

  const { data: invitations, isLoading } = trpc.videoAudition.getMyInvitations.useQuery();

  const respondMutation = trpc.videoAudition.respondToInvitation.useMutation({
    onSuccess: (_, variables) => {
      const message = variables.response === "accepted" 
        ? "You've accepted the audition invitation! You'll receive a notification when it's time to join."
        : "You've declined the audition invitation.";
      Alert.alert(
        variables.response === "accepted" ? "Accepted! 🎬" : "Declined",
        message,
        [{ text: "OK", onPress: () => router.replace("/auditions") }]
      );
    },
    onError: (error) => {
      Alert.alert("Error", error.message);
      setIsResponding(false);
    },
  });

  // Find the specific invitation
  const invitationData = invitations?.find((inv) => inv.invitation.id === invitationId);

  useEffect(() => {
    // Auto-respond if action is provided in URL
    if (action && invitationData && !isResponding) {
      if (action === "accept" || action === "decline") {
        // Don't auto-respond, let user confirm
      }
    }
  }, [action, invitationData]);

  const handleRespond = (response: "accepted" | "declined") => {
    setIsResponding(true);
    respondMutation.mutate({
      invitationId,
      response,
    });
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

  if (!invitationData) {
    return (
      <ScreenContainer className="flex-1">
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
          <IconSymbol name="exclamationmark.triangle" size={64} color={colors.error} />
          <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground, marginTop: 16, textAlign: "center" }}>
            Invitation not found or already responded
          </Text>
          <TouchableOpacity
            onPress={() => router.replace("/auditions")}
            style={{
              backgroundColor: colors.primary,
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 12,
              marginTop: 24,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "600" }}>View All Auditions</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  const { invitation, audition, project, producer } = invitationData;

  return (
    <ScreenContainer className="flex-1">
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 24 }}>
          <TouchableOpacity onPress={() => router.back()}>
            <IconSymbol name="chevron.left" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={{ fontSize: 24, fontWeight: "bold", color: colors.foreground, marginLeft: 12 }}>
            Audition Invitation
          </Text>
        </View>

        {/* Invitation Card */}
        <View
          style={{
            backgroundColor: colors.primary + "10",
            borderRadius: 20,
            padding: 24,
            marginBottom: 20,
            borderWidth: 2,
            borderColor: colors.primary,
          }}
        >
          <View style={{ alignItems: "center", marginBottom: 20 }}>
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: colors.primary + "20",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <IconSymbol name="video.fill" size={40} color={colors.primary} />
            </View>
            <Text style={{ fontSize: 14, color: colors.primary, fontWeight: "600", marginBottom: 4 }}>
              You're Invited!
            </Text>
            <Text style={{ fontSize: 24, fontWeight: "bold", color: colors.foreground, textAlign: "center" }}>
              {project?.title || "Video Audition"}
            </Text>
          </View>

          <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 4 }}>From</Text>
              <Text style={{ fontSize: 16, color: colors.foreground, fontWeight: "500" }}>
                {producer?.name || "Producer"}
              </Text>
            </View>
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 4 }}>When</Text>
              <Text style={{ fontSize: 16, color: colors.foreground, fontWeight: "500" }}>
                {format(new Date(audition.scheduledAt), "EEEE, MMMM d, yyyy")}
              </Text>
              <Text style={{ fontSize: 14, color: colors.muted }}>
                {format(new Date(audition.scheduledAt), "h:mm a")} ({audition.durationMinutes} minutes)
              </Text>
            </View>
            {audition.recordingEnabled && (
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <IconSymbol name="record.circle" size={16} color={colors.error} />
                <Text style={{ fontSize: 14, color: colors.error, marginLeft: 8 }}>
                  This audition will be recorded
                </Text>
              </View>
            )}
          </View>

          {invitation.message && (
            <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16 }}>
              <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 8 }}>Message from producer</Text>
              <Text style={{ fontSize: 15, color: colors.foreground, fontStyle: "italic", lineHeight: 22 }}>
                "{invitation.message}"
              </Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={{ gap: 12 }}>
          <TouchableOpacity
            onPress={() => handleRespond("accepted")}
            disabled={isResponding}
            style={{
              backgroundColor: colors.success,
              borderRadius: 16,
              paddingVertical: 18,
              alignItems: "center",
              opacity: isResponding ? 0.6 : 1,
            }}
          >
            {isResponding && respondMutation.variables?.response === "accepted" ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 18 }}>
                Accept Invitation
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleRespond("declined")}
            disabled={isResponding}
            style={{
              backgroundColor: colors.error + "10",
              borderRadius: 16,
              paddingVertical: 18,
              alignItems: "center",
              borderWidth: 1,
              borderColor: colors.error,
              opacity: isResponding ? 0.6 : 1,
            }}
          >
            {isResponding && respondMutation.variables?.response === "declined" ? (
              <ActivityIndicator color={colors.error} />
            ) : (
              <Text style={{ color: colors.error, fontWeight: "bold", fontSize: 18 }}>
                Decline
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Info */}
        <View style={{ marginTop: 24, padding: 16 }}>
          <Text style={{ fontSize: 13, color: colors.muted, textAlign: "center", lineHeight: 20 }}>
            By accepting, you agree to join the video call at the scheduled time.{"\n"}
            You'll receive a notification 15 minutes before the audition.
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
