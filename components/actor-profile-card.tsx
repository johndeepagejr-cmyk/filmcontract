import React from "react";
import { View, Text, Image, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { cn } from "@/lib/utils";

interface ActorProfileCardProps {
  actorId: number;
  name: string;
  email?: string | null;
  profilePictureUrl?: string | null;
  trustScore?: number;
  isVerified?: boolean;
  onPress?: () => void;
}

export function ActorProfileCard({
  actorId,
  name,
  email,
  profilePictureUrl,
  trustScore,
  isVerified,
  onPress,
}: ActorProfileCardProps) {
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/actors/${actorId}`);
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      className="bg-surface rounded-xl p-4 border border-border active:opacity-80"
    >
      <View className="flex-row gap-4">
        {/* Profile Picture */}
        <View className="w-16 h-16 rounded-full bg-muted items-center justify-center overflow-hidden">
          {profilePictureUrl ? (
            <Image
              source={{ uri: profilePictureUrl }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <Text className="text-2xl">👤</Text>
          )}
        </View>

        {/* Actor Info */}
        <View className="flex-1 justify-center gap-1">
          <View className="flex-row items-center gap-2">
            <Text className="text-base font-semibold text-foreground flex-1">
              {name}
            </Text>
            {isVerified && <Text className="text-lg">✓</Text>}
          </View>

          {email && (
            <Text className="text-xs text-muted">{email}</Text>
          )}

          {trustScore !== undefined && (
            <View className="flex-row items-center gap-1 mt-1">
              <Text className="text-xs text-muted">Trust Score:</Text>
              <Text className="text-xs font-semibold text-primary">
                {trustScore}/100
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}
