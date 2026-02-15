import { ScrollView, Text, View, Pressable, Linking, Platform } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useRouter, Stack } from "expo-router";
import { useColors } from "@/hooks/use-colors";
import { MaterialIcons } from "@expo/vector-icons";
import * as StoreReview from "expo-store-review";

export default function AboutScreen() {
  const colors = useColors();
  const router = useRouter();

  const handleRateApp = async () => {
    try {
      if (await StoreReview.hasAction()) {
        await StoreReview.requestReview();
      }
    } catch {
      // Fallback: open store listing
    }
  };

  const handleContact = () => {
    Linking.openURL("mailto:support@filmcontract.app?subject=FilmContract%20Support");
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} className="p-0">
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="px-5 pt-4 pb-2">
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              { opacity: pressed ? 0.6 : 1, flexDirection: "row", alignItems: "center", marginBottom: 16 },
            ]}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
            <Text className="text-foreground text-base ml-2">Back</Text>
          </Pressable>
        </View>

        {/* App Info */}
        <View className="items-center px-5 pb-6">
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 20,
              backgroundColor: colors.primary,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <MaterialIcons name="description" size={40} color={colors.background} />
          </View>
          <Text className="text-2xl font-bold text-foreground">FilmContract</Text>
          <Text className="text-base text-muted mt-1">Version 1.0.0</Text>
        </View>

        {/* About Section */}
        <View className="mx-5 bg-surface rounded-xl p-5 border border-border mb-4">
          <Text className="text-lg font-bold text-foreground mb-3">About</Text>
          <Text className="text-base text-muted leading-relaxed">
            FilmContract is the professional contract management platform built
            specifically for the film industry. Create, sign, and manage contracts
            between producers and actors with ease.
          </Text>
        </View>

        {/* Creator Section */}
        <View className="mx-5 bg-surface rounded-xl p-5 border border-border mb-4">
          <Text className="text-lg font-bold text-foreground mb-3">Created By</Text>
          <Text className="text-base text-foreground font-semibold">
            John Dee Page Jr
          </Text>
          <Text className="text-sm text-muted mt-1">DeePage Studios</Text>
          <Text className="text-sm text-muted mt-2 leading-relaxed">
            Built with passion for the film community to make contract management
            transparent, easy, and accessible for all film professionals.
          </Text>
        </View>

        {/* Actions */}
        <View className="mx-5 gap-3">
          {/* Rate the App */}
          <Pressable
            onPress={handleRateApp}
            style={({ pressed }) => [
              {
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: colors.border,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <MaterialIcons name="star" size={24} color={colors.warning} />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text className="text-foreground font-semibold">Rate FilmContract</Text>
              <Text className="text-sm text-muted">Help us grow by leaving a review</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={colors.muted} />
          </Pressable>

          {/* Contact Support */}
          <Pressable
            onPress={handleContact}
            style={({ pressed }) => [
              {
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: colors.border,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <MaterialIcons name="email" size={24} color={colors.primary} />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text className="text-foreground font-semibold">Contact Support</Text>
              <Text className="text-sm text-muted">Get help or send feedback</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={colors.muted} />
          </Pressable>

          {/* Privacy Policy */}
          <Pressable
            onPress={() => router.push("/legal/privacy")}
            style={({ pressed }) => [
              {
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: colors.border,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <MaterialIcons name="privacy-tip" size={24} color={colors.muted} />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text className="text-foreground font-semibold">Privacy Policy</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={colors.muted} />
          </Pressable>

          {/* Terms of Service */}
          <Pressable
            onPress={() => router.push("/legal/terms")}
            style={({ pressed }) => [
              {
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: colors.border,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <MaterialIcons name="gavel" size={24} color={colors.muted} />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text className="text-foreground font-semibold">Terms of Service</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={colors.muted} />
          </Pressable>
        </View>

        {/* Footer */}
        <View className="items-center mt-8 px-5">
          <Text className="text-sm text-muted text-center">
            &copy; 2026 John Dee Page Jr. All rights reserved.
          </Text>
          <Text className="text-xs text-muted text-center mt-1">
            DeePage Studios
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
