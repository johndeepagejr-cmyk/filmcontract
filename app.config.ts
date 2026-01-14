// Load environment variables with proper priority (system > .env)
import "./scripts/load-env.js";
import type { ExpoConfig } from "expo/config";

// Bundle ID format: space.manus.<project_name_dots>.<timestamp>
// e.g., "my-app" created at 2024-01-15 10:30:45 -> "space.manus.my.app.t20240115103045"
const bundleId = "space.manus.filmcontract.t20251225042755";
// Extract timestamp from bundle ID and prefix with "manus" for deep link scheme
// e.g., "space.manus.my.app.t20240115103045" -> "manus20240115103045"
const timestamp = bundleId.split(".").pop()?.replace(/^t/, "") ?? "";
const schemeFromBundleId = `manus${timestamp}`;

// Keep previous branding/env data (update as needed)
const env = {
  // App branding - update these values directly (do not use env vars)
  appName: "FilmContract",
  appSlug: "filmcontract",
};

// Treat only explicit production builds as enabled for OTA updates
const isProduction = process.env.NODE_ENV === "production";

/**
 * Expo config
 *
 * Important:
 * - OTA updates (expo-updates) are enabled only for production builds.
 * - During development and local/debug builds updates are disabled to avoid runtime attempts
 *   to download a remote update package (which triggers the java.io.IOException on Android).
 */
const config: ExpoConfig = {
  name: env.appName,
  slug: env.appSlug,
  scheme: schemeFromBundleId,
  // if you had other existing settings (icons, splash, android/ios blocks), preserve them here
  // Example minimal android/ios stubs — KEEP your existing values if present in your file
  ios: {
    bundleIdentifier: bundleId, // keep existing, or replace with your real ios.bundleIdentifier
  },
  android: {
    package: bundleId, // keep existing, or replace with your real android.package
  },

  // Updates configuration — disable in non-production to prevent the runtime from fetching updates
  updates: {
    // Only enable OTA updates for production builds
    enabled: isProduction,
    // When enabled in production, check automatically on load; otherwise, don't check
    checkAutomatically: isProduction ? "ON_LOAD" : "NEVER",
    // For production allow a short fallback timeout (ms) for the update to download before using cached bundle
    fallbackToCacheTimeout: isProduction ? 30000 : 0,
  },

  // Ensure a runtimeVersion is present — use nativeVersion policy so the runtimeVersion is derived from native version
  runtimeVersion: {
    policy: "nativeVersion",
  },

  // Keep other fields you need (version, orientation, icon, splash, extra, etc.)
  // Add or merge your existing config values below as needed.
};

export default config;
