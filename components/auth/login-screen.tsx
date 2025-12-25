import { View, Text, TouchableOpacity, ActivityIndicator, Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { useAuth } from "@/hooks/use-auth";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { makeRedirectUri } from "expo-auth-session";
import Constants from "expo-constants";
import { useState } from "react";

WebBrowser.maybeCompleteAuthSession();

const API_URL = Constants.expoConfig?.extra?.apiUrl || "http://localhost:3000";

export function LoginScreen() {
  const { refresh } = useAuth();
  const colors = useColors();
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);
      
      if (Platform.OS === "web") {
        // For web, redirect to OAuth endpoint
        window.location.href = `${API_URL}/oauth/login`;
        return;
      }

      // For native, use WebBrowser
      const redirectUri = makeRedirectUri({ path: "oauth/callback" });
      const authUrl = `${API_URL}/oauth/login?redirect_uri=${encodeURIComponent(redirectUri)}`;
      
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
      
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
