import { View, Text, TouchableOpacity, ActivityIndicator, Platform, TextInput, Alert, KeyboardAvoidingView, ScrollView } from "react-native";
import { useAuth } from "@/hooks/use-auth";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { getApiBaseUrl } from "@/constants/oauth";
import { useState } from "react";
import * as Auth from "@/lib/_core/auth";

export function LoginScreen() {
  const { refresh } = useAuth();
  const colors = useColors();
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError("");

      if (!email.trim() || !password.trim()) {
        setError("Please enter your email and password");
        return;
      }

      if (isSignUp && !name.trim()) {
        setError("Please enter your name");
        return;
      }

      if (password.length < 6) {
        setError("Password must be at least 6 characters");
        return;
      }

      const baseUrl = getApiBaseUrl();
      const endpoint = isSignUp ? "/api/auth/register" : "/api/auth/login";
      const body = isSignUp
        ? { email: email.trim(), password, name: name.trim() }
        : { email: email.trim(), password };

      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Authentication failed");
        return;
      }

      // Store session token for native platforms
      if (Platform.OS !== "web" && data.app_session_id) {
        await Auth.setSessionToken(data.app_session_id);
      }

      // Store user info
      if (data.user) {
        const userInfo: Auth.User = {
          id: data.user.id,
          openId: data.user.openId,
          name: data.user.name,
          email: data.user.email,
          loginMethod: data.user.loginMethod,
          lastSignedIn: new Date(data.user.lastSignedIn),
          userRole: data.user.userRole || null,
        };
        await Auth.setUserInfo(userInfo);
      }

      // Refresh auth state
      await refresh();
    } catch (err) {
      console.error("Auth error:", err);
      setError("Connection failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer className="justify-center">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* App Title */}
          <View style={{ alignItems: "center", marginBottom: 40 }}>
            <Text style={{ fontSize: 36, fontWeight: "800", color: colors.foreground }}>
              FilmContract
            </Text>
            <Text style={{ fontSize: 15, color: colors.muted, textAlign: "center", marginTop: 6 }}>
              Transparent contracts for film professionals
            </Text>
          </View>

          {/* Form */}
          <View style={{ width: "100%", maxWidth: 380, alignSelf: "center", gap: 14 }}>
            {/* Tab Toggle */}
            <View style={{
              flexDirection: "row",
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 4,
              marginBottom: 8,
            }}>
              <TouchableOpacity
                onPress={() => { setIsSignUp(false); setError(""); }}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 10,
                  backgroundColor: !isSignUp ? colors.primary : "transparent",
                  alignItems: "center",
                }}
              >
                <Text style={{
                  fontWeight: "600",
                  fontSize: 15,
                  color: !isSignUp ? "#fff" : colors.muted,
                }}>
                  Sign In
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { setIsSignUp(true); setError(""); }}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 10,
                  backgroundColor: isSignUp ? colors.primary : "transparent",
                  alignItems: "center",
                }}
              >
                <Text style={{
                  fontWeight: "600",
                  fontSize: 15,
                  color: isSignUp ? "#fff" : colors.muted,
                }}>
                  Sign Up
                </Text>
              </TouchableOpacity>
            </View>

            {/* Name field (sign up only) */}
            {isSignUp && (
              <View>
                <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground, marginBottom: 6 }}>
                  Full Name
                </Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="John Doe"
                  placeholderTextColor={colors.muted}
                  autoCapitalize="words"
                  style={{
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    fontSize: 16,
                    color: colors.foreground,
                  }}
                />
              </View>
            )}

            {/* Email field */}
            <View>
              <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground, marginBottom: 6 }}>
                Email
              </Text>
              <TextInput
                testID="emailInput"
                accessibilityLabel="Email input"
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={colors.muted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={{
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  fontSize: 16,
                  color: colors.foreground,
                }}
              />
            </View>

            {/* Password field */}
            <View>
              <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground, marginBottom: 6 }}>
                Password
              </Text>
              <TextInput
                testID="passwordInput"
                accessibilityLabel="Password input"
                value={password}
                onChangeText={setPassword}
                placeholder="At least 6 characters"
                placeholderTextColor={colors.muted}
                secureTextEntry
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
                style={{
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  fontSize: 16,
                  color: colors.foreground,
                }}
              />
            </View>

            {/* Error message */}
            {error ? (
              <Text style={{ color: colors.error, fontSize: 14, textAlign: "center" }}>
                {error}
              </Text>
            ) : null}

            {/* Submit button */}
            <TouchableOpacity
              testID="signInButton"
              accessibilityLabel="Sign in button"
              onPress={handleSubmit}
              disabled={loading}
              style={{
                backgroundColor: colors.primary,
                borderRadius: 12,
                paddingVertical: 16,
                alignItems: "center",
                opacity: loading ? 0.6 : 1,
                marginTop: 4,
              }}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={{ color: "#fff", fontSize: 17, fontWeight: "700" }}>
                  {isSignUp ? "Create Account" : "Sign In"}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <Text style={{
            fontSize: 12,
            color: colors.muted,
            textAlign: "center",
            marginTop: 32,
          }}>
            Created by John Dee Page Jr
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
