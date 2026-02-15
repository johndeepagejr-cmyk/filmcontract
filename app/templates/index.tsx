import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { Stack, router } from "expo-router";
import { Pressable } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "@/hooks/use-auth";

export default function TemplatesScreen() {
  const colors = useColors();
  const { isAuthenticated } = useAuth();
  const { data: currentSub } = trpc.subscription.getCurrent.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  const { data: templates, isLoading } = trpc.templates.list.useQuery(
    undefined,
    { enabled: currentSub?.limits?.templates === true }
  );

  // Show upgrade prompt for free users
  if (currentSub && !currentSub.limits.templates) {
    return (
      <ScreenContainer className="p-6">
        <Stack.Screen options={{ title: "Contract Templates" }} />
        <View className="flex-1 items-center justify-center gap-6">
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: colors.surface,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MaterialIcons name="description" size={40} color={colors.primary} />
          </View>
          <Text className="text-2xl font-bold text-foreground text-center">
            Contract Templates
          </Text>
          <Text className="text-base text-muted text-center leading-relaxed px-4">
            Access professional contract templates for feature films, commercials, TV series, and more.
            Available on the Pro plan.
          </Text>
          <Pressable
            onPress={() => router.push("/subscription")}
            style={({ pressed }) => [{
              backgroundColor: colors.primary,
              paddingHorizontal: 32,
              paddingVertical: 14,
              borderRadius: 12,
              opacity: pressed ? 0.8 : 1,
            }]}
          >
            <Text style={{ color: colors.background, fontWeight: "700", fontSize: 16 }}>
              Upgrade to Pro — $4.99/mo
            </Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "feature_film":
        return "Feature Film";
      case "commercial":
        return "Commercial";
      case "voice_over":
        return "Voice-Over";
      case "tv_series":
        return "TV Series";
      default:
        return "Custom";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "feature_film":
        return "🎬";
      case "commercial":
        return "📺";
      case "voice_over":
        return "🎙️";
      case "tv_series":
        return "📹";
      default:
        return "📄";
    }
  };

  if (isLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <Stack.Screen options={{ title: "Contract Templates" }} />
        <ActivityIndicator size="large" color="#1E40AF" />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-6">
      <Stack.Screen options={{ title: "Contract Templates" }} />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="gap-6">
          <View>
            <Text className="text-2xl font-bold text-foreground">Contract Templates</Text>
            <Text className="text-base text-muted mt-2">
              Choose a template to quickly create a new contract with pre-filled terms
            </Text>
          </View>

          {templates && templates.length > 0 ? (
            <View className="gap-4">
              {templates.map((template) => (
                <TouchableOpacity
                  key={template.id}
                  onPress={() => router.push(`/templates/use/${template.id}` as any)}
                  className="bg-surface rounded-xl p-4 active:opacity-80 border border-border"
                >
                  <View className="flex-row items-start gap-3">
                    <Text className="text-3xl">{getCategoryIcon(template.category)}</Text>
                    <View className="flex-1">
                      <View className="flex-row items-center gap-2">
                        <Text className="text-lg font-bold text-foreground flex-1">
                          {template.name}
                        </Text>
                        {template.isSystemTemplate && (
                          <View className="bg-primary/10 px-2 py-1 rounded">
                            <Text className="text-xs font-semibold text-primary">System</Text>
                          </View>
                        )}
                      </View>
                      <Text className="text-sm text-muted mt-1">{template.description}</Text>
                      <View className="mt-3">
                        <Text className="text-xs font-semibold text-muted">Category</Text>
                        <Text className="text-sm text-foreground">
                          {getCategoryLabel(template.category)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View className="bg-surface rounded-xl p-8 items-center">
              <Text className="text-4xl mb-4">📋</Text>
              <Text className="text-lg font-semibold text-foreground text-center">
                No Templates Available
              </Text>
              <Text className="text-sm text-muted text-center mt-2">
                Templates will appear here once they are created
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
