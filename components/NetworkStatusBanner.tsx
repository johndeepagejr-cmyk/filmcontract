/**
 * NetworkStatusBanner — Shows network/server status at top of screen
 *
 * Created by John dee page jr
 */
import React, { useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring } from "react-native-reanimated";
import { useNetwork } from "@/context/NetworkContext";
import { useColors } from "@/hooks/use-colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const BANNER_HEIGHT = 40;

export function NetworkStatusBanner() {
  const { showBanner, bannerMessage, bannerType, dismissBanner, syncOfflineQueue, offlineQueueSize } = useNetwork();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(-BANNER_HEIGHT - insets.top);

  useEffect(() => {
    translateY.value = withTiming(showBanner ? 0 : -BANNER_HEIGHT - insets.top, { duration: 300 });
  }, [showBanner, insets.top]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backgroundColor = (() => {
    switch (bannerType) {
      case "offline":
        return colors.error;
      case "maintenance":
        return colors.warning;
      case "degraded":
        return colors.warning;
      case "syncing":
        return colors.primary;
      default:
        return colors.muted;
    }
  })();

  const icon = (() => {
    switch (bannerType) {
      case "offline":
        return "⚠";
      case "maintenance":
        return "🔧";
      case "degraded":
        return "⚡";
      case "syncing":
        return "↻";
      default:
        return "";
    }
  })();

  return (
    <Animated.View
      style={[
        styles.container,
        animatedStyle,
        {
          backgroundColor,
          paddingTop: insets.top + 4,
        },
      ]}
    >
      <View style={styles.content}>
        <Text style={styles.icon}>{icon}</Text>
        <Text style={styles.message} numberOfLines={1}>
          {bannerMessage}
        </Text>
        {offlineQueueSize > 0 && bannerType === "syncing" && (
          <TouchableOpacity
            onPress={syncOfflineQueue}
            style={styles.syncButton}
          >
            <Text style={styles.syncText}>Sync Now</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={dismissBanner} style={styles.dismissButton}>
          <Text style={styles.dismissText}>✕</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    elevation: 10,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: BANNER_HEIGHT,
  },
  icon: {
    fontSize: 14,
    marginRight: 8,
  },
  message: {
    flex: 1,
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "600",
  },
  syncButton: {
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginLeft: 8,
  },
  syncText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  dismissButton: {
    marginLeft: 8,
    padding: 4,
  },
  dismissText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 16,
    fontWeight: "700",
  },
});
