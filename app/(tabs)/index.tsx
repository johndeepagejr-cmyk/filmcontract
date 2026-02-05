import { ScrollView, Text, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";

export default function HomeScreen() {
  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 gap-8">
          <View className="items-center gap-2">
            <Text className="text-4xl font-bold text-foreground">FilmContract</Text>
            <Text className="text-base text-muted text-center">
              Professional film contract management platform
            </Text>
          </View>

          <View className="w-full max-w-sm self-center bg-surface rounded-2xl p-6 shadow-sm border border-border">
            <Text className="text-lg font-semibold text-foreground mb-2">Welcome</Text>
            <Text className="text-sm text-muted leading-relaxed">
              FilmContract helps producers and actors manage contracts, auditions, and communications all in one place.
            </Text>
          </View>

          <View className="items-center gap-4">
            <Text className="text-sm text-muted">Ready to get started?</Text>
            <Text className="text-xs text-muted text-center">Sign in with your account to continue</Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
