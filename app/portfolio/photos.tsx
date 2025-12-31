import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, Modal } from "react-native";
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
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<number>>(new Set());
  const [galleryVisible, setGalleryVisible] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

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

  const handleBulkDelete = async () => {
    if (selectedPhotos.size === 0) {
      Alert.alert("No Selection", "Please select photos to delete.");
      return;
    }

    Alert.alert(
      "Delete Photos",
      `Are you sure you want to delete ${selectedPhotos.size} photo(s)?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              for (const photoId of selectedPhotos) {
                await deletePhotoMutation.mutateAsync({ photoId });
              }
              await refetch();
              setSelectedPhotos(new Set());
              setSelectionMode(false);
              Alert.alert("Success", `${selectedPhotos.size} photo(s) deleted.`);
            } catch (error) {
              Alert.alert("Error", "Failed to delete some photos.");
            }
          },
        },
      ]
    );
  };

  const togglePhotoSelection = (photoId: number) => {
    const newSelection = new Set(selectedPhotos);
    if (newSelection.has(photoId)) {
      newSelection.delete(photoId);
    } else {
      newSelection.add(photoId);
    }
    setSelectedPhotos(newSelection);
  };

  const selectAllPhotos = () => {
    if (photos) {
      setSelectedPhotos(new Set(photos.map((p) => p.id)));
    }
  };

  const deselectAllPhotos = () => {
    setSelectedPhotos(new Set());
  };

  const openGallery = (index: number) => {
    setCurrentPhotoIndex(index);
    setGalleryVisible(true);
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
              <Text className="text-base text-muted">
                {selectionMode
                  ? `${selectedPhotos.size} selected`
                  : "Manage your photo gallery"}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.back()}
              className="bg-surface px-4 py-2 rounded-full active:opacity-80"
            >
              <Text className="text-foreground font-semibold">Done</Text>
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          <View className="flex-row gap-3">
            {!selectionMode ? (
              <>
                <TouchableOpacity
                  onPress={handlePickImage}
                  disabled={uploading}
                  className="flex-1 bg-primary p-4 rounded-2xl active:opacity-80"
                >
                  <Text className="text-white text-center font-semibold">
                    {uploading ? "Uploading..." : "+ Add Photo"}
                  </Text>
                </TouchableOpacity>
                {photos && photos.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setSelectionMode(true)}
                    className="bg-surface px-6 py-4 rounded-2xl active:opacity-80"
                  >
                    <Text className="text-foreground font-semibold">Select</Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <>
                <TouchableOpacity
                  onPress={selectAllPhotos}
                  className="flex-1 bg-surface p-4 rounded-2xl active:opacity-80"
                >
                  <Text className="text-foreground text-center font-semibold">Select All</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={deselectAllPhotos}
                  className="flex-1 bg-surface p-4 rounded-2xl active:opacity-80"
                >
                  <Text className="text-foreground text-center font-semibold">Deselect All</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Bulk Actions */}
          {selectionMode && (
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={handleBulkDelete}
                disabled={selectedPhotos.size === 0}
                className={`flex-1 p-4 rounded-2xl active:opacity-80 ${
                  selectedPhotos.size === 0 ? "bg-surface opacity-50" : "bg-error"
                }`}
              >
                <Text className="text-white text-center font-semibold">
                  Delete Selected ({selectedPhotos.size})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setSelectionMode(false);
                  setSelectedPhotos(new Set());
                }}
                className="bg-surface px-6 py-4 rounded-2xl active:opacity-80"
              >
                <Text className="text-foreground font-semibold">Cancel</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Photos Grid */}
          {photos && photos.length > 0 ? (
            <View className="gap-4">
              {photos.map((photo, index) => (
                <View key={photo.id} className="bg-surface rounded-2xl p-4 gap-3">
                  <TouchableOpacity
                    onPress={() =>
                      selectionMode ? togglePhotoSelection(photo.id) : openGallery(index)
                    }
                    activeOpacity={0.8}
                  >
                    <View className="relative">
                      <Image
                        source={{ uri: photo.photoUrl }}
                        className="w-full h-64 rounded-xl"
                        contentFit="cover"
                      />
                      {selectionMode && (
                        <View className="absolute top-3 right-3 w-8 h-8 rounded-full border-2 border-white bg-white/20 items-center justify-center">
                          {selectedPhotos.has(photo.id) && (
                            <View className="w-5 h-5 rounded-full bg-primary" />
                          )}
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>

                  {!selectionMode && (
                    <>
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
                    </>
                  )}
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

      {/* Full-Screen Gallery Modal */}
      {photos && photos.length > 0 && (
        <Modal
          visible={galleryVisible}
          transparent={false}
          animationType="fade"
          onRequestClose={() => setGalleryVisible(false)}
        >
          <View className="flex-1 bg-black">
            {/* Close Button */}
            <View className="absolute top-12 right-6 z-10">
              <TouchableOpacity
                onPress={() => setGalleryVisible(false)}
                className="bg-black/50 w-12 h-12 rounded-full items-center justify-center"
              >
                <Text className="text-white text-2xl">×</Text>
              </TouchableOpacity>
            </View>

            {/* Photo Counter */}
            <View className="absolute top-12 left-6 z-10">
              <View className="bg-black/50 px-4 py-2 rounded-full">
                <Text className="text-white font-semibold">
                  {currentPhotoIndex + 1} / {photos.length}
                </Text>
              </View>
            </View>

            {/* Main Photo */}
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(event) => {
                const index = Math.round(
                  event.nativeEvent.contentOffset.x / event.nativeEvent.layoutMeasurement.width
                );
                setCurrentPhotoIndex(index);
              }}
              contentOffset={{ x: currentPhotoIndex * 393, y: 0 }} // 393 is approximate screen width
            >
              {photos.map((photo) => (
                <View key={photo.id} className="w-screen h-full items-center justify-center">
                  <Image
                    source={{ uri: photo.photoUrl }}
                    className="w-full h-full"
                    contentFit="contain"
                  />
                </View>
              ))}
            </ScrollView>

            {/* Caption */}
            {photos[currentPhotoIndex]?.caption && (
              <View className="absolute bottom-12 left-6 right-6">
                <View className="bg-black/70 p-4 rounded-2xl">
                  <Text className="text-white text-center">
                    {photos[currentPhotoIndex].caption}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </Modal>
      )}
    </ScreenContainer>
  );
}
