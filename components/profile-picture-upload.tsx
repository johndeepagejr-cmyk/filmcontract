import React, { useState } from "react";
import { View, Text, Pressable, Image, ActivityIndicator } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

interface ProfilePictureUploadProps {
  currentImageUrl?: string | null;
  onUploadSuccess?: (imageUrl: string) => void;
  size?: "small" | "medium" | "large";
}

const sizeClasses = {
  small: "w-16 h-16",
  medium: "w-24 h-24",
  large: "w-32 h-32",
};

export function ProfilePictureUpload({
  currentImageUrl,
  onUploadSuccess,
  size = "medium",
}: ProfilePictureUploadProps) {
  const [isLoading, setIsLoading] = useState(false);
  const uploadMutation = trpc.profilePicture.uploadProfilePicture.useMutation();
  const removeMutation = trpc.profilePicture.removeProfilePicture.useMutation();

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setIsLoading(true);
        const uri = result.assets[0].uri;
        const fileName = uri.split("/").pop() || "profile-picture.jpg";

        // Convert image to base64
        const response = await fetch(uri);
        const blob = await response.blob();
        const reader = new FileReader();

        reader.onload = async () => {
          const base64Data = reader.result?.toString().split(",")[1] || "";
          try {
            await uploadMutation.mutateAsync({
              imageData: base64Data,
              fileName,
            });
            onUploadSuccess?.(uri);
          } catch (error) {
            console.error("Upload failed:", error);
          } finally {
            setIsLoading(false);
          }
        };

        reader.readAsDataURL(blob);
      }
    } catch (error) {
      console.error("Image picker error:", error);
      setIsLoading(false);
    }
  };

  const handleRemove = async () => {
    try {
      setIsLoading(true);
      await removeMutation.mutateAsync();
      onUploadSuccess?.(null as any);
    } catch (error) {
      console.error("Remove failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="items-center gap-4">
      <View
        className={cn(
          "rounded-full bg-surface border-2 border-border items-center justify-center overflow-hidden",
          sizeClasses[size]
        )}
      >
        {isLoading ? (
          <ActivityIndicator size="large" color="#0a7ea4" />
        ) : currentImageUrl ? (
          <Image
            source={{ uri: currentImageUrl }}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <Text className="text-3xl">📷</Text>
        )}
      </View>

      <View className="gap-2">
        <Pressable
          onPress={pickImage}
          disabled={isLoading}
          className="bg-primary px-6 py-2 rounded-lg active:opacity-80"
        >
          <Text className="text-background font-semibold text-center">
            {currentImageUrl ? "Change Photo" : "Add Photo"}
          </Text>
        </Pressable>

        {currentImageUrl && (
          <Pressable
            onPress={handleRemove}
            disabled={isLoading}
            className="bg-error px-6 py-2 rounded-lg active:opacity-80"
          >
            <Text className="text-background font-semibold text-center">
              Remove Photo
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
