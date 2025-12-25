import { View, Text, TouchableOpacity, ActivityIndicator, Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { useAuth } from "@/hooks/use-auth";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { getLoginUrl } from "@/constants/oauth";
import { useState } from "react";

WebBrowser.maybeCompleteAuthSession();

export function LoginScreen() {
  const { refresh } = useAuth();
  const colors = useColors();
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);
      
      const loginUrl = getLoginUrl();
      
      if (Platform.OS === "web") {
        // For web, redirect to Manus OAuth portal
        window.location.href = loginUrl;
        return;
      }

      // For native, use WebBrowser to open OAuth portal
      const result = await WebBrowser.openAuthSessionAsync(
        loginUrl,
        undefined,
        { showInRecents: true }
      );
      
      if (result.type === "success") {
        // Refresh user data after successful login
        await refresh();
      }
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer className="p-6 justify-center">
      <View className="flex-1 justify-center items-center gap-8">
        {/* App Title */}
        <View className="items-center gap-2">
          <Text className="text-4xl font-bold text-foreground">FilmContract</Text>
          <Text className="text-base text-muted text-center">
            Transparent contracts for film professionals
          </Text>
        </View>

        {/* Login Button */}
        <View className="w-full max-w-sm">
          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            className="bg-primary px-6 py-4 rounded-xl items-center active:opacity-80"
            style={{ opacity: loading ? 0.6 : 1 }}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-white text-lg font-semibold">Sign In with Manus</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Info Text */}
        <Text className="text-sm text-muted text-center max-w-sm">
          Sign in to create and manage contracts between producers and actors
        </Text>
      </View>
    </ScreenContainer>
  );
}
