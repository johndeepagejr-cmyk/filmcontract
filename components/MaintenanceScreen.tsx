/**
 * MaintenanceScreen — Shown when server is in maintenance mode
 *
 * Created by John dee page jr
 */
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useNetwork } from "@/context/NetworkContext";
import { useColors } from "@/hooks/use-colors";
import { ScreenContainer } from "@/components/screen-container";

export function MaintenanceScreen() {
  const { refreshHealth, bannerMessage, healthStatus } = useNetwork();
  const colors = useColors();
  const [checking, setChecking] = React.useState(false);

  const handleRetry = async () => {
    setChecking(true);
    await refreshHealth();
    setChecking(false);
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <View style={styles.container}>
        <Text style={[styles.icon]}>🔧</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>
          Under Maintenance
        </Text>
        <Text style={[styles.message, { color: colors.muted }]}>
          {bannerMessage || "We're performing scheduled maintenance to improve your experience. Please check back shortly."}
        </Text>
        <TouchableOpacity
          onPress={handleRetry}
          disabled={checking}
          style={[styles.retryButton, { backgroundColor: colors.primary, opacity: checking ? 0.6 : 1 }]}
        >
          {checking ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text style={styles.retryText}>Try Again</Text>
          )}
        </TouchableOpacity>
        <Text style={[styles.footer, { color: colors.muted }]}>
          FilmContract by John dee page jr
        </Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  icon: {
    fontSize: 64,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 12,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    marginBottom: 32,
    maxWidth: 320,
  },
  retryButton: {
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 14,
    minWidth: 160,
    alignItems: "center",
  },
  retryText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  footer: {
    position: "absolute",
    bottom: 32,
    fontSize: 12,
  },
});
