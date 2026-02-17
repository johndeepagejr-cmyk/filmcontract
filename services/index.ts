/**
 * Services Index
 * Central export for all production services
 *
 * Created by John dee page jr
 */

// Environment configuration
export {
  getEnvConfig,
  validateEnv,
  getEnvSummary,
  type Environment,
} from "./env-config";

// API service with offline support
export {
  api,
  apiRequest,
  getNetworkStatus,
  setNetworkStatus,
  subscribeNetworkStatus,
  processOfflineQueue,
  getOfflineQueueSize,
  clearOfflineQueue,
  ApiTimeoutError,
  ApiNetworkError,
  ApiHttpError,
  type ApiRequestConfig,
  type ApiResponse,
} from "./api-service";

// Health check
export {
  checkHealth,
  startHealthChecks,
  stopHealthChecks,
  subscribeHealth,
  getLastHealthResult,
  type HealthStatus,
  type HealthCheckResult,
} from "./health-check";
