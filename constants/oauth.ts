import * as Linking from "expo-linking";
import * as ReactNative from "react-native";

// Extract scheme from bundle ID (last segment timestamp, prefixed with "manus")
// e.g., "space.manus.my.app.t20240115103045" -> "manus20240115103045"
const bundleId = "space.manus.filmcontract.t20251225042755";
const timestamp = bundleId.split(".").pop()?.replace(/^t/, "") ?? "";
const schemeFromBundleId = `manus${timestamp}`;

// Production fallback values - these are used when EXPO_PUBLIC_* env vars
// are not available (e.g., in EAS production builds where env vars may not
// be injected into the JS bundle at build time)
const FALLBACK_PORTAL = "https://manus.im";
const FALLBACK_SERVER = "https://api.manus.im";
const FALLBACK_APP_ID = "9Ds5MzMMryKSoRAkX3DK9S";
const FALLBACK_OWNER_ID = "R729Ru8Hn3QNLeTJitmgkD";
const FALLBACK_OWNER_NAME = "John Doeknow";
const FALLBACK_API_BASE_URL = "https://3000-itzz2mez36esf7r2wm53a-41c31b39.us1.manus.computer";

const env = {
  portal: process.env.EXPO_PUBLIC_OAUTH_PORTAL_URL || FALLBACK_PORTAL,
  server: process.env.EXPO_PUBLIC_OAUTH_SERVER_URL || FALLBACK_SERVER,
  appId: process.env.EXPO_PUBLIC_APP_ID || FALLBACK_APP_ID,
  ownerId: process.env.EXPO_PUBLIC_OWNER_OPEN_ID || FALLBACK_OWNER_ID,
  ownerName: process.env.EXPO_PUBLIC_OWNER_NAME || FALLBACK_OWNER_NAME,
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || FALLBACK_API_BASE_URL,
  deepLinkScheme: schemeFromBundleId,
};

export const OAUTH_PORTAL_URL = env.portal;
export const OAUTH_SERVER_URL = env.server;
export const APP_ID = env.appId;
export const OWNER_OPEN_ID = env.ownerId;
export const OWNER_NAME = env.ownerName;
export const API_BASE_URL = env.apiBaseUrl;

/**
 * Get the API base URL, deriving from current hostname if not set.
 * Metro runs on 8081, API server runs on 3000.
 * URL pattern: https://PORT-sandboxid.region.domain
 */
export function getApiBaseUrl(): string {
  // If API_BASE_URL is set, use it
  if (API_BASE_URL) {
    return API_BASE_URL.replace(/\/$/, "");
  }

  // On web, derive from current hostname by replacing port 8081 with 3000
  if (ReactNative.Platform.OS === "web" && typeof window !== "undefined" && window.location) {
    const { protocol, hostname } = window.location;
    // Pattern: 8081-sandboxid.region.domain -> 3000-sandboxid.region.domain
    const apiHostname = hostname.replace(/^8081-/, "3000-");
    if (apiHostname !== hostname) {
      return `${protocol}//${apiHostname}`;
    }
  }

  // Fallback to the hardcoded production URL
  return FALLBACK_API_BASE_URL;
}

export const SESSION_TOKEN_KEY = "app_session_token";
export const USER_INFO_KEY = "manus-runtime-user-info";

const encodeState = (value: string) => {
  if (typeof globalThis.btoa === "function") {
    return globalThis.btoa(value);
  }
  const BufferImpl = (globalThis as Record<string, any>).Buffer;
  if (BufferImpl) {
    return BufferImpl.from(value, "utf-8").toString("base64");
  }
  return value;
};

export const getLoginUrl = () => {
  let redirectUri: string;

  if (ReactNative.Platform.OS === "web") {
    // Web platform: redirect to API server callback (not Metro bundler)
    // The API server will then redirect back to the frontend with the session token
    redirectUri = `${getApiBaseUrl()}/api/oauth/callback`;
  } else {
    // Native platform: use deep link scheme for mobile OAuth callback
    // This allows the OS to redirect back to the app after authentication
    redirectUri = Linking.createURL("/oauth/callback", {
      scheme: env.deepLinkScheme,
    });
  }

  const state = encodeState(redirectUri);

  const url = new URL(`${OAUTH_PORTAL_URL}/app-auth`);
  url.searchParams.set("appId", APP_ID);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};
