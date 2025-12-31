import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from "react-native";
import { Image } from "expo-image";
import { ScreenContainer } from "@/components/screen-container";
import { router } from "expo-router";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "@/hooks/use-auth";

export default function PortfolioPhotosScreen() {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);

  const { data: photos, isLoading, refetch } = trpc.portfolioPhotos.getMy.useQuery();
  const uploadPhotoMutation = trpc.portfolioPhotos.uploadPhoto.useMutation();
  const addPhotoMutation = trpc.portfolioPhotos.addPhoto.useMutation();
  const deletePhotoMutation = trpc.portfolioPhotos.deletePhoto.useMutation();
  const updatePhotoMutation = trpc.portfolioPhotos.updatePhoto.useMutation();

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Please grant camera roll permissions to upload photos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadPhoto(result.assets[0].uri);
    }
  };

  const uploadPhoto = async (uri: string) => {
    try {
      setUploading(true);

      // Convert image to base64
      const response = await fetch(uri);
      const blob = await response.blob();
      const reader = new FileReader();

      reader.onloadend = async () => {
        const base64Data = reader.result as string;
        const fileName = `photo-${Date.now()}.jpg`;

        // Upload to S3
        const uploadResult = await uploadPhotoMutation.mutateAsync({
          base64Data,
          fileName,
          mimeType: "image/jpeg",
        });

        // Add to portfolio
        await addPhotoMutation.mutateAsync({
          photoUrl: uploadResult.photoUrl,
        });

        await refetch();
        Alert.alert("Success", "Photo added to portfolio!");
      };

      reader.readAsDataURL(blob);
    } catch (error) {
      console.error("Error uploading photo:", error);
      Alert.alert("Error", "Failed to upload photo. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async (photoId: number) => {
    Alert.alert(
      "Delete Photo",
      "Are you sure you want to delete this photo from your portfolio?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deletePhotoMutation.mutateAsync({ photoId });
              await refetch();
              Alert.alert("Success", "Photo deleted from portfolio.");
            } catch (error) {
              Alert.alert("Error", "Failed to delete photo.");
            }
          },
        },
      ]
    );
  };

  const handleUpdateCaption = async (photoId: number, caption: string) => {
    try {
      await updatePhotoMutation.mutateAsync({ photoId, caption });
      await refetch();
    } catch (error) {
      Alert.alert("Error", "Failed to update caption.");
    }
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
              <Text className="text-3xl font-bold text-foreground">Portfolio Photos</Text>
              <Text className="text-base text-muted">Manage your photo gallery</Text>
            </View>
            <TouchableOpacity
              onPress={() => router.back()}
              className="bg-surface px-4 py-2 rounded-full active:opacity-80"
            >
              <Text className="text-foreground font-semibold">Done</Text>
            </TouchableOpacity>
          </View>

          {/* Add Photo Button */}
          <TouchableOpacity
            onPress={handlePickImage}
            disabled={uploading}
            className="bg-primary p-4 rounded-2xl active:opacity-80"
          >
            <Text className="text-white text-center font-semibold text-lg">
              {uploading ? "Uploading..." : "+ Add Photo"}
            </Text>
          </TouchableOpacity>

          {/* Photos Grid */}
          {photos && photos.length > 0 ? (
            <View className="gap-4">
              {photos.map((photo) => (
                <View key={photo.id} className="bg-surface rounded-2xl p-4 gap-3">
                  <Image
                    source={{ uri: photo.photoUrl }}
                    className="w-full h-64 rounded-xl"
                    contentFit="cover"
                  />
                  
                  <TextInput
                    placeholder="Add a caption..."
                    value={photo.caption || ""}
                    onChangeText={(text) => handleUpdateCaption(photo.id, text)}
                    className="bg-background px-4 py-3 rounded-xl text-foreground"
                    placeholderTextColor="#9CA3AF"
                  />

                  <TouchableOpacity
                    onPress={() => handleDeletePhoto(photo.id)}
                    className="bg-error/10 p-3 rounded-xl active:opacity-80"
                  >
                    <Text className="text-error text-center font-semibold">Delete Photo</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <View className="flex-1 items-center justify-center py-12">
              <Text className="text-2xl mb-2">📸</Text>
              <Text className="text-lg font-semibold text-foreground mb-2">No Photos Yet</Text>
              <Text className="text-base text-muted text-center">
                Add photos to showcase your work and build your portfolio
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
