import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Video, ResizeMode, AVPlaybackStatus } from "expo-av";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import * as Haptics from "expo-haptics";

export default function EditScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user } = useAuth();
  const { videoUri, duration } = useLocalSearchParams<{
    videoUri: string;
    duration: string;
  }>();

  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(parseInt(duration || "0"));

  // Edit state
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(parseInt(duration || "0"));
  const [slateEnabled, setSlateEnabled] = useState(true);
  const [projectTitle, setProjectTitle] = useState("");
  const [characterName, setCharacterName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [actorNotes, setActorNotes] = useState("");

  // Upload state
  const [isUploading, setIsUploading] = useState(false);

  const createMutation = trpc.selfTape.createSelfTape.useMutation({
    onSuccess: (data) => {
      Alert.alert(
        "Self-Tape Created!",
        "Your self-tape has been saved as a draft. Would you like to submit it now?",
        [
          {
            text: "Keep as Draft",
            style: "cancel",
            onPress: () => router.replace("/self-tapes"),
          },
          {
            text: "Submit Now",
            onPress: () => {
              router.replace({
                pathname: "/self-tapes/[id]",
                params: { id: data.id.toString() },
              });
            },
          },
        ]
      );
    },
    onError: (error) => {
      Alert.alert("Error", error.message);
      setIsUploading(false);
    },
  });

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handlePlayPause = async () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      await videoRef.current.pauseAsync();
    } else {
      await videoRef.current.playAsync();
    }
    setIsPlaying(!isPlaying);
  };

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setCurrentTime(status.positionMillis / 1000);
      if (status.durationMillis) {
        setVideoDuration(status.durationMillis / 1000);
        if (trimEnd === 0) {
          setTrimEnd(status.durationMillis / 1000);
        }
      }
      setIsPlaying(status.isPlaying);
    }
  };

  const handleSeek = async (position: number) => {
    if (!videoRef.current) return;
    await videoRef.current.setPositionAsync(position * 1000);
  };

  const handleSetTrimStart = () => {
    setTrimStart(currentTime);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleSetTrimEnd = () => {
    setTrimEnd(currentTime);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleSave = async () => {
    if (!projectTitle.trim()) {
      Alert.alert("Missing Information", "Please enter a project title");
      return;
    }

    if (!videoUri) {
      Alert.alert("Error", "No video to save");
      return;
    }

    setIsUploading(true);

    // In production, upload video to S3 here
    // For now, use the local URI
    const slateText = slateEnabled
      ? `${user?.name || "Actor"}\n${characterName || projectTitle}`
      : undefined;

    createMutation.mutate({
      projectTitle: projectTitle.trim(),
      roleDescription: roleDescription.trim() || undefined,
      characterName: characterName.trim() || undefined,
      videoUrl: videoUri, // In production, this would be the S3 URL
      durationSeconds: Math.floor(trimEnd - trimStart),
      slateText,
      slateEnabled,
      trimStart: Math.floor(trimStart),
      trimEnd: Math.floor(trimEnd),
      actorNotes: actorNotes.trim() || undefined,
    });
  };

  return (
    <ScreenContainer className="flex-1">
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground }}>
          Edit Self-Tape
        </Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={isUploading}
          style={{ opacity: isUploading ? 0.5 : 1 }}
        >
          {isUploading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={{ fontSize: 16, fontWeight: "600", color: colors.primary }}>
              Save
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        {/* Video Preview */}
        <View
          style={{
            backgroundColor: "#000",
            borderRadius: 12,
            overflow: "hidden",
            marginBottom: 16,
          }}
        >
          <Video
            ref={videoRef}
            source={{ uri: videoUri || "" }}
            style={{ width: "100%", aspectRatio: 9 / 16 }}
            resizeMode={ResizeMode.CONTAIN}
            onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
            shouldPlay={false}
          />

          {/* Slate Overlay Preview */}
          {slateEnabled && (
            <View style={styles.slateOverlay}>
              <Text style={styles.slateText}>
                {user?.name || "Actor Name"}
              </Text>
              <Text style={styles.slateSubtext}>
                {characterName || projectTitle || "Role / Project"}
              </Text>
            </View>
          )}

          {/* Play/Pause Button */}
          <TouchableOpacity
            onPress={handlePlayPause}
            style={styles.playButton}
          >
            <IconSymbol
              name={isPlaying ? "pause.fill" : "play.fill"}
              size={32}
              color="#fff"
            />
          </TouchableOpacity>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View
              style={[
                styles.progressBar,
                { width: `${(currentTime / videoDuration) * 100}%` },
              ]}
            />
            {/* Trim markers */}
            <View
              style={[
                styles.trimMarker,
                { left: `${(trimStart / videoDuration) * 100}%` },
              ]}
            />
            <View
              style={[
                styles.trimMarker,
                { left: `${(trimEnd / videoDuration) * 100}%` },
              ]}
            />
          </View>
        </View>

        {/* Trim Controls */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: colors.foreground,
              marginBottom: 12,
            }}
          >
            Trim Video
          </Text>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <TouchableOpacity
              onPress={handleSetTrimStart}
              style={{
                flex: 1,
                backgroundColor: colors.background,
                padding: 12,
                borderRadius: 8,
                alignItems: "center",
              }}
            >
              <Text style={{ color: colors.muted, fontSize: 12 }}>Start</Text>
              <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "600" }}>
                {formatTime(trimStart)}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSetTrimEnd}
              style={{
                flex: 1,
                backgroundColor: colors.background,
                padding: 12,
                borderRadius: 8,
                alignItems: "center",
              }}
            >
              <Text style={{ color: colors.muted, fontSize: 12 }}>End</Text>
              <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "600" }}>
                {formatTime(trimEnd)}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={{ color: colors.muted, fontSize: 12, marginTop: 8, textAlign: "center" }}>
            Seek to position and tap to set trim points
          </Text>
        </View>

        {/* Slate Toggle */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View>
              <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>
                Slate Overlay
              </Text>
              <Text style={{ fontSize: 14, color: colors.muted, marginTop: 2 }}>
                Show name and role at video start
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setSlateEnabled(!slateEnabled)}
              style={{
                width: 50,
                height: 30,
                borderRadius: 15,
                backgroundColor: slateEnabled ? colors.primary : colors.border,
                padding: 2,
              }}
            >
              <View
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  backgroundColor: "#fff",
                  marginLeft: slateEnabled ? 20 : 0,
                }}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Project Details */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: colors.foreground,
              marginBottom: 12,
            }}
          >
            Project Details
          </Text>

          <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 4 }}>
            Project Title *
          </Text>
          <TextInput
            value={projectTitle}
            onChangeText={setProjectTitle}
            placeholder="e.g., The Great Adventure"
            placeholderTextColor={colors.muted}
            style={{
              backgroundColor: colors.background,
              borderRadius: 8,
              padding: 12,
              color: colors.foreground,
              marginBottom: 12,
            }}
          />

          <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 4 }}>
            Character Name
          </Text>
          <TextInput
            value={characterName}
            onChangeText={setCharacterName}
            placeholder="e.g., Detective Sarah"
            placeholderTextColor={colors.muted}
            style={{
              backgroundColor: colors.background,
              borderRadius: 8,
              padding: 12,
              color: colors.foreground,
              marginBottom: 12,
            }}
          />

          <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 4 }}>
            Role Description
          </Text>
          <TextInput
            value={roleDescription}
            onChangeText={setRoleDescription}
            placeholder="Brief description of the role..."
            placeholderTextColor={colors.muted}
            multiline
            numberOfLines={3}
            style={{
              backgroundColor: colors.background,
              borderRadius: 8,
              padding: 12,
              color: colors.foreground,
              minHeight: 80,
              textAlignVertical: "top",
            }}
          />
        </View>

        {/* Actor Notes */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 16,
            marginBottom: 32,
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: colors.foreground,
              marginBottom: 12,
            }}
          >
            Notes for Producer
          </Text>
          <TextInput
            value={actorNotes}
            onChangeText={setActorNotes}
            placeholder="Any notes about your performance, choices, or questions..."
            placeholderTextColor={colors.muted}
            multiline
            numberOfLines={4}
            style={{
              backgroundColor: colors.background,
              borderRadius: 8,
              padding: 12,
              color: colors.foreground,
              minHeight: 100,
              textAlignVertical: "top",
            }}
          />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  slateOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.8)",
    padding: 16,
    alignItems: "center",
  },
  slateText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  slateSubtext: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 16,
    marginTop: 4,
  },
  playButton: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -30,
    marginLeft: -30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  progressContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#fff",
  },
  trimMarker: {
    position: "absolute",
    top: -4,
    width: 4,
    height: 12,
    backgroundColor: "#22C55E",
    borderRadius: 2,
  },
});
