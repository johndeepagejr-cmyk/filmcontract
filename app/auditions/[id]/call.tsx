import { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { WebView } from "react-native-webview";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { IconSymbol } from "@/components/ui/icon-symbol";
import * as ScreenOrientation from "expo-screen-orientation";
import { useKeepAwake } from "expo-keep-awake";

export default function VideoCallScreen() {
  const colors = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const auditionId = parseInt(id || "0");

  const [isJoining, setIsJoining] = useState(false);
  const [roomUrl, setRoomUrl] = useState<string | null>(null);
  const [callStarted, setCallStarted] = useState(false);

  // Keep screen awake during call
  useKeepAwake();

  const { data: audition, isLoading } = trpc.videoAudition.getAudition.useQuery(
    { auditionId },
    { enabled: !!auditionId }
  );

  const joinMutation = trpc.videoAudition.joinAudition.useMutation({
    onSuccess: (data) => {
      setRoomUrl(data.roomUrl);
      setCallStarted(true);
    },
    onError: (error) => {
      Alert.alert("Error", error.message);
      setIsJoining(false);
    },
  });

  const leaveMutation = trpc.videoAudition.leaveAudition.useMutation();
  const endMutation = trpc.videoAudition.endAudition.useMutation();

  useEffect(() => {
    // Allow landscape orientation for video call
    ScreenOrientation.unlockAsync();

    return () => {
      // Lock back to portrait when leaving
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      
      // Record leaving the call
      if (callStarted) {
        leaveMutation.mutate({ auditionId });
      }
    };
  }, [callStarted]);

  const handleJoinCall = async () => {
    setIsJoining(true);
    joinMutation.mutate({ auditionId });
  };

  const handleEndCall = () => {
    Alert.alert(
      "End Audition",
      "Are you sure you want to end this audition?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "End",
          style: "destructive",
          onPress: () => {
            leaveMutation.mutate({ auditionId });
            if (audition?.producerId === audition?.actor?.id) {
              // Producer ending call
              endMutation.mutate({ auditionId });
            }
            router.back();
          },
        },
      ]
    );
  };

  const handleLeaveCall = () => {
    Alert.alert(
      "Leave Call",
      "Are you sure you want to leave this audition?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Leave",
          onPress: () => {
            leaveMutation.mutate({ auditionId });
            router.back();
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <ScreenContainer edges={["top", "bottom", "left", "right"]}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: 16, color: colors.muted }}>Loading audition...</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!audition) {
    return (
      <ScreenContainer edges={["top", "bottom", "left", "right"]}>
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

  // Pre-call lobby
  if (!callStarted) {
    return (
      <ScreenContainer edges={["top", "bottom", "left", "right"]}>
        <View style={{ flex: 1, padding: 20 }}>
          {/* Header */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ flexDirection: "row", alignItems: "center", marginBottom: 24 }}
          >
            <IconSymbol name="chevron.left" size={24} color={colors.primary} />
            <Text style={{ color: colors.primary, fontSize: 16, marginLeft: 4 }}>Back</Text>
          </TouchableOpacity>

          {/* Audition Info */}
          <View style={{ alignItems: "center", flex: 1, justifyContent: "center" }}>
            <View
              style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                backgroundColor: colors.primary + "20",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 24,
              }}
            >
              <IconSymbol name="video.fill" size={48} color={colors.primary} />
            </View>

            <Text style={{ fontSize: 24, fontWeight: "bold", color: colors.foreground, textAlign: "center" }}>
              {audition.project?.title || "Video Audition"}
            </Text>

            {audition.role && (
              <Text style={{ fontSize: 16, color: colors.muted, marginTop: 8 }}>
                Role: {audition.role.roleName}
              </Text>
            )}

            <Text style={{ fontSize: 14, color: colors.muted, marginTop: 16 }}>
              With: {audition.producer?.name || audition.actor?.name || "Participant"}
            </Text>

            <Text style={{ fontSize: 14, color: colors.muted, marginTop: 4 }}>
              Duration: {audition.durationMinutes} minutes
            </Text>

            {audition.recordingEnabled && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: colors.error + "20",
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 20,
                  marginTop: 16,
                }}
              >
                <IconSymbol name="record.circle" size={16} color={colors.error} />
                <Text style={{ color: colors.error, marginLeft: 8, fontWeight: "500" }}>
                  This call will be recorded
                </Text>
              </View>
            )}

            {/* Tips */}
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 16,
                padding: 16,
                marginTop: 32,
                width: "100%",
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 8 }}>
                Before you join:
              </Text>
              <Text style={{ fontSize: 13, color: colors.muted, lineHeight: 20 }}>
                • Find a quiet, well-lit space{"\n"}
                • Check your camera and microphone{"\n"}
                • Have your script ready if needed{"\n"}
                • Close other apps for best performance
              </Text>
            </View>
          </View>

          {/* Join Button */}
          <TouchableOpacity
            onPress={handleJoinCall}
            disabled={isJoining}
            style={{
              backgroundColor: colors.success,
              borderRadius: 16,
              paddingVertical: 18,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              opacity: isJoining ? 0.7 : 1,
            }}
          >
            {isJoining ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <IconSymbol name="video.fill" size={24} color="#fff" />
                <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 18, marginLeft: 12 }}>
                  Join Audition
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  // In-call view with Daily.co WebView
  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      {roomUrl && (
        <WebView
          source={{ uri: roomUrl }}
          style={{ flex: 1 }}
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState
          renderLoading={() => (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#000" }}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={{ color: "#fff", marginTop: 16 }}>Connecting to call...</Text>
            </View>
          )}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.warn("WebView error: ", nativeEvent);
            Alert.alert("Connection Error", "Failed to connect to the video call. Please try again.");
          }}
          // Grant camera and microphone permissions
          mediaCapturePermissionGrantType="grant"
        />
      )}

      {/* Floating controls */}
      <View
        style={{
          position: "absolute",
          bottom: Platform.OS === "ios" ? 40 : 20,
          left: 0,
          right: 0,
          flexDirection: "row",
          justifyContent: "center",
          gap: 20,
        }}
      >
        <TouchableOpacity
          onPress={handleLeaveCall}
          style={{
            backgroundColor: colors.surface,
            width: 56,
            height: 56,
            borderRadius: 28,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconSymbol name="phone.down.fill" size={28} color={colors.foreground} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleEndCall}
          style={{
            backgroundColor: colors.error,
            width: 56,
            height: 56,
            borderRadius: 28,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconSymbol name="xmark" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
