/**
 * Health Check Service
 *
 * Checks API server health on app launch and periodically.
 * Supports maintenance mode detection.
 *
 * Created by John dee page jr
 */
import { getEnvConfig } from "./env-config";

export type HealthStatus = "healthy" | "degraded" | "maintenance" | "unreachable";

export interface HealthCheckResult {
  status: HealthStatus;
  latencyMs: number;
  serverVersion?: string;
  message?: string;
  timestamp: number;
}

type HealthListener = (result: HealthCheckResult) => void;

let _lastResult: HealthCheckResult | null = null;
let _listeners: HealthListener[] = [];
let _intervalId: ReturnType<typeof setInterval> | null = null;

/**
 * Perform a single health check against the API server
 */
export async function checkHealth(): Promise<HealthCheckResult> {
  const config = getEnvConfig();
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000); // 10s timeout for health check

    const response = await fetch(`${config.apiBaseUrl}/api/health`, {
      method: "GET",
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });

    clearTimeout(timer);
    const latencyMs = Date.now() - startTime;

    if (response.status === 503) {
      // Maintenance mode
      let message = "Server is under maintenance";
      try {
        const data = await response.json();
        message = data.message || message;
      } catch {}

      const result: HealthCheckResult = {
        status: "maintenance",
        latencyMs,
        message,
        timestamp: Date.now(),
      };
      _lastResult = result;
      _listeners.forEach((fn) => fn(result));
      return result;
    }

    if (!response.ok) {
      const result: HealthCheckResult = {
        status: "degraded",
        latencyMs,
        message: `Server returned ${response.status}`,
        timestamp: Date.now(),
      };
      _lastResult = result;
      _listeners.forEach((fn) => fn(result));
      return result;
    }

    let serverVersion: string | undefined;
    try {
      const data = await response.json();
      serverVersion = data.version;
    } catch {}

    const result: HealthCheckResult = {
      status: latencyMs > 5000 ? "degraded" : "healthy",
      latencyMs,
      serverVersion,
      timestamp: Date.now(),
    };
    _lastResult = result;
    _listeners.forEach((fn) => fn(result));
    return result;
  } catch (err) {
    const latencyMs = Date.now() - startTime;
    const isAbort = err instanceof Error && err.name === "AbortError";

    const result: HealthCheckResult = {
      status: "unreachable",
      latencyMs,
      message: isAbort ? "Health check timed out" : "Cannot reach server",
      timestamp: Date.now(),
    };
    _lastResult = result;
    _listeners.forEach((fn) => fn(result));
    return result;
  }
}

/**
 * Start periodic health checks
 */
export function startHealthChecks(): void {
  if (_intervalId) return; // Already running

  const config = getEnvConfig();

  // Initial check
  checkHealth().catch(console.error);

  // Periodic checks
  _intervalId = setInterval(() => {
    checkHealth().catch(console.error);
  }, config.healthCheckIntervalMs);
}

/**
 * Stop periodic health checks
 */
export function stopHealthChecks(): void {
  if (_intervalId) {
    clearInterval(_intervalId);
    _intervalId = null;
  }
}

/**
 * Subscribe to health check results
 */
export function subscribeHealth(listener: HealthListener): () => void {
  _listeners.push(listener);
  // Immediately emit last result if available
  if (_lastResult) {
    listener(_lastResult);
  }
  return () => {
    _listeners = _listeners.filter((fn) => fn !== listener);
  };
}

/**
 * Get the last health check result
 */
export function getLastHealthResult(): HealthCheckResult | null {
  return _lastResult;
}
