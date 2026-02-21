/**
 * Environment Configuration System
 * Supports dev / staging / prod with .env validation
 *
 * Created by John dee page jr
 */
import { Platform } from "react-native";
import Constants from "expo-constants";

export type Environment = "development" | "staging" | "production";

interface EnvConfig {
  environment: Environment;
  apiBaseUrl: string;
  wsBaseUrl: string;
  enableDebugLogs: boolean;
  requestTimeoutMs: number;
  maxRetries: number;
  retryBaseDelayMs: number;
  offlineQueueMaxSize: number;
  healthCheckIntervalMs: number;
  jwtRefreshBufferMs: number;
}

/**
 * Detect current environment from Expo config or env vars
 */
function detectEnvironment(): Environment {
  // Check Expo Constants extra config first
  const expoEnv = Constants.expoConfig?.extra?.environment;
  if (expoEnv === "production" || expoEnv === "staging") return expoEnv;

  // Check process.env
  const envVar = process.env.EXPO_PUBLIC_ENVIRONMENT;
  if (envVar === "production" || envVar === "staging") return envVar;

  // Check if running in EAS build (production builds)
  const isEasBuild = !!process.env.EAS_BUILD;
  if (isEasBuild) return "production";

  return "development";
}

/**
 * Resolve API base URL based on environment
 */
function resolveApiBaseUrl(env: Environment): string {
  // 1. Explicit env var always wins
  const explicitUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (explicitUrl && explicitUrl.trim()) {
    return explicitUrl.replace(/\/$/, "");
  }

  // 2. Production: use the published/deployed URL
  //    This will be set when the app is published via Manus platform
  if (env === "production") {
    // Fallback to sandbox URL for now — will be replaced with permanent URL after publishing
    const prodUrl = process.env.EXPO_PUBLIC_PROD_API_URL || "";
    if (prodUrl) return prodUrl.replace(/\/$/, "");
  }

  // 3. Staging
  if (env === "staging") {
    const stagingUrl = process.env.EXPO_PUBLIC_STAGING_API_URL || "";
    if (stagingUrl) return stagingUrl.replace(/\/$/, "");
  }

  // 4. Web: derive from current hostname (8081 → 3000)
  if (Platform.OS === "web" && typeof window !== "undefined" && window.location) {
    const { protocol, hostname } = window.location;
    const apiHostname = hostname.replace(/^8081-/, "3000-");
    if (apiHostname !== hostname) {
      return `${protocol}//${apiHostname}`;
    }
  }

  // 5. Fallback to the sandbox API URL (same as constants/oauth.ts)
  return "https://3000-itzz2mez36esf7r2wm53a-41c31b39.us1.manus.computer";
}

/**
 * Build the full environment configuration
 */
function buildConfig(): EnvConfig {
  const environment = detectEnvironment();
  const apiBaseUrl = resolveApiBaseUrl(environment);

  // Derive WebSocket URL from API URL
  const wsBaseUrl = apiBaseUrl.replace(/^http/, "ws");

  const config: EnvConfig = {
    environment,
    apiBaseUrl,
    wsBaseUrl,
    enableDebugLogs: environment === "development",
    requestTimeoutMs: environment === "production" ? 15000 : 30000,
    maxRetries: 3,
    retryBaseDelayMs: 1000,
    offlineQueueMaxSize: 100,
    healthCheckIntervalMs: environment === "production" ? 60000 : 30000,
    jwtRefreshBufferMs: 5 * 60 * 1000, // Refresh 5 min before expiry
  };

  return config;
}

// Singleton config instance
let _config: EnvConfig | null = null;

export function getEnvConfig(): EnvConfig {
  if (!_config) {
    _config = buildConfig();
  }
  return _config;
}

/**
 * Validate required environment variables
 * Returns array of missing/invalid vars
 */
export function validateEnv(): string[] {
  const errors: string[] = [];
  const config = getEnvConfig();

  if (!config.apiBaseUrl) {
    errors.push("API base URL is not configured");
  }

  // Validate URL format
  try {
    new URL(config.apiBaseUrl);
  } catch {
    errors.push(`Invalid API base URL: ${config.apiBaseUrl}`);
  }

  return errors;
}

/**
 * Get a human-readable summary of the current config (for debug)
 */
export function getEnvSummary(): string {
  const config = getEnvConfig();
  return [
    `Environment: ${config.environment}`,
    `API URL: ${config.apiBaseUrl}`,
    `Debug: ${config.enableDebugLogs}`,
    `Timeout: ${config.requestTimeoutMs}ms`,
    `Max Retries: ${config.maxRetries}`,
  ].join("\n");
}
