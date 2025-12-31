import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from "react-native";
import { VideoView, useVideoPlayer } from "expo-video";
import { ScreenContainer } from "@/components/screen-container";
import { router } from "expo-router";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "@/hooks/use-auth";

function VideoCard({ video, onDelete }: { video: any; onDelete: (id: number) => void }) {
  const player = useVideoPlayer(video.videoUrl, (player) => {
    player.loop = false;
  });

  return (
    <View className="bg-surface rounded-2xl p-4 gap-3">
      <Text className="text-lg font-bold text-foreground">{video.title}</Text>
      
      {video.description && (
        <Text className="text-sm text-muted">{video.description}</Text>
      )}

      <VideoView
        player={player}
        style={{ width: "100%", height: 200, borderRadius: 12 }}
        nativeControls
      />

      {video.duration && (
        <Text className="text-sm text-muted">
          Duration: {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, "0")}
        </Text>
      )}

      <TouchableOpacity
        onPress={() => onDelete(video.id)}
        className="bg-error/10 p-3 rounded-xl active:opacity-80"
      >
        <Text className="text-error text-center font-semibold">Delete Video</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function VideosScreen() {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);

  const { data: videos, isLoading, refetch } = trpc.actorProfile.getVideos.useQuery(
    { userId: user?.id || 0 },
    { enabled: !!user?.id }
  );
  
  const uploadVideoMutation = trpc.actorProfile.uploadVideo.useMutation();
  const addVideoMutation = trpc.actorProfile.addVideo.useMutation();
  const deleteVideoMutation = trpc.actorProfile.deleteVideo.useMutation();

  const handlePickVideo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Please grant media library permissions to upload videos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["videos"],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      Alert.prompt(
        "Video Title",
        "Enter a title for this video:",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Upload",
            onPress: async (title) => {
              if (title) {
                await uploadVideo(result.assets[0].uri, title);
              }
            },
          },
        ],
        "plain-text"
      );
    }
  };

  const uploadVideo = async (uri: string, title: string) => {
    try {
      setUploading(true);

      // Note: For production, you would need to handle large video files differently
      // This is a simplified version for demonstration
      Alert.alert(
        "Video Upload",
        "Video upload functionality requires additional setup for handling large files. For now, you can add a video URL directly.",
        [
          {
            text: "Add Video URL",
            onPress: () => {
              Alert.prompt(
                "Add Video",
                "Enter video URL and title:",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Add",
                    onPress: async (input) => {
                      if (input) {
                        const [url, videoTitle] = input.split("|");
                        if (url && videoTitle) {
                          await addVideoMutation.mutateAsync({
                            videoUrl: url.trim(),
                            title: videoTitle.trim(),
                          });
                          await refetch();
                          Alert.alert("Success", "Video added!");
                        }
                      }
                    },
                  },
                ],
                "plain-text",
                "https://example.com/video.mp4|My Demo Reel"
              );
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error uploading video:", error);
      Alert.alert("Error", "Failed to upload video. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteVideo = async (videoId: number) => {
    Alert.alert(
      "Delete Video",
      "Are you sure you want to delete this video?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteVideoMutation.mutateAsync({ videoId });
              await refetch();
              Alert.alert("Success", "Video deleted.");
            } catch (error) {
              Alert.alert("Error", "Failed to delete video.");
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color="#1E40AF" />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 gap-6">
          {/* Header */}
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-3xl font-bold text-foreground">Demo Reels</Text>
              <Text className="text-base text-muted">Showcase your acting work</Text>
            </View>
            <TouchableOpacity
              onPress={() => router.back()}
              className="bg-surface px-4 py-2 rounded-full active:opacity-80"
            >
              <Text className="text-foreground font-semibold">Done</Text>
            </TouchableOpacity>
          </View>

          {/* Add Video Button */}
          <TouchableOpacity
            onPress={handlePickVideo}
            disabled={uploading}
            className="bg-primary p-4 rounded-2xl active:opacity-80"
          >
            <Text className="text-white text-center font-semibold text-lg">
              {uploading ? "Uploading..." : "+ Add Video"}
            </Text>
          </TouchableOpacity>

          {/* Videos List */}
          {videos && videos.length > 0 ? (
            <View className="gap-4">
              {videos.map((video) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  onDelete={handleDeleteVideo}
                />
              ))}
            </View>
          ) : (
            <View className="flex-1 items-center justify-center py-12">
              <Text className="text-2xl mb-2">🎬</Text>
              <Text className="text-lg font-semibold text-foreground mb-2">No Videos Yet</Text>
              <Text className="text-base text-muted text-center">
                Add demo reels to showcase your acting work
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
