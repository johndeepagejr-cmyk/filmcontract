import { View, Text, TouchableOpacity, ScrollView, Alert } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useState } from "react";

type ThemeOption = "grid" | "masonry" | "carousel";

export default function ThemeSelectionScreen() {
  const colors = useColors();
  const utils = trpc.useUtils();
  
  const { data: actorProfile } = trpc.actorProfile.getProfile.useQuery();
  const { data: producerProfile } = trpc.producerProfile.getProfile.useQuery();
  
  const currentTheme = actorProfile?.portfolioTheme || producerProfile?.portfolioTheme || "grid";
  const [selectedTheme, setSelectedTheme] = useState<ThemeOption>(currentTheme as ThemeOption);
  
  const updateActorTheme = trpc.actorProfile.updateProfile.useMutation({
    onSuccess: () => {
      utils.actorProfile.getProfile.invalidate();
      Alert.alert("Success", "Portfolio theme updated!");
      router.back();
    },
    onError: (error) => {
      Alert.alert("Error", error.message);
    },
  });
  
  const updateProducerTheme = trpc.producerProfile.updateProfile.useMutation({
    onSuccess: () => {
      utils.producerProfile.getProfile.invalidate();
      Alert.alert("Success", "Portfolio theme updated!");
      router.back();
    },
    onError: (error) => {
      Alert.alert("Error", error.message);
    },
  });
  
  const themes: { value: ThemeOption; label: string; description: string }[] = [
    {
      value: "grid",
      label: "Grid Layout",
      description: "Classic grid layout with evenly sized photos in rows and columns",
    },
    {
      value: "masonry",
      label: "Masonry Layout",
      description: "Pinterest-style layout with staggered photo heights for visual interest",
    },
    {
      value: "carousel",
      label: "Carousel Layout",
      description: "Swipeable carousel showcasing one photo at a time with smooth transitions",
    },
  ];
  
  const handleSave = () => {
    if (actorProfile) {
      updateActorTheme.mutate({ portfolioTheme: selectedTheme });
    } else if (producerProfile) {
      updateProducerTheme.mutate({ portfolioTheme: selectedTheme });
    }
  };
  
  return (
    <ScreenContainer>
      <ScrollView className="flex-1 p-6">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-foreground mb-2">
            Portfolio Theme
          </Text>
          <Text className="text-base text-muted">
            Choose how your portfolio photos are displayed
          </Text>
        </View>
        
        {/* Theme Options */}
        <View className="gap-4 mb-6">
          {themes.map((theme) => (
            <TouchableOpacity
              key={theme.value}
              onPress={() => setSelectedTheme(theme.value)}
              className={`p-4 rounded-xl border-2 ${
                selectedTheme === theme.value
                  ? "border-primary bg-primary/10"
                  : "border-border bg-surface"
              }`}
              style={{
                borderColor: selectedTheme === theme.value ? colors.primary : colors.border,
              }}
            >
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-xl font-semibold text-foreground">
                  {theme.label}
                </Text>
                {selectedTheme === theme.value && (
                  <View
                    className="w-6 h-6 rounded-full items-center justify-center"
                    style={{ backgroundColor: colors.primary }}
                  >
                    <Text className="text-white font-bold">✓</Text>
                  </View>
                )}
              </View>
              <Text className="text-sm text-muted leading-relaxed">
                {theme.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Save Button */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={updateActorTheme.isPending || updateProducerTheme.isPending}
          className="py-4 rounded-full items-center"
          style={{ backgroundColor: colors.primary }}
        >
          <Text className="text-white font-semibold text-lg">
            {updateActorTheme.isPending || updateProducerTheme.isPending
              ? "Saving..."
              : "Save Theme"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}
