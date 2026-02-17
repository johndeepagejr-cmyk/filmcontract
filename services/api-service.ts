/**
 * Production API Service Layer
 *
 * Features:
 * - Automatic JWT refresh on 401
 * - Request queue for offline actions
 * - Background sync when connection returns
 * - Retry with exponential backoff
 * - Request timeout
 * - Request deduplication
 *
 * Created by John dee page jr
 */
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Auth from "@/lib/_core/auth";
import { getEnvConfig } from "./env-config";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ApiRequestConfig {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
  /** If true, queue this request when offline instead of failing */
  offlineQueue?: boolean;
  /** Skip JWT refresh attempt on 401 */
  skipAuthRefresh?: boolean;
  /** Unique key for request deduplication */
  dedupeKey?: string;
}

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  headers: Record<string, string>;
}

interface QueuedRequest {
  id: string;
  url: string;
  config: ApiRequestConfig;
  timestamp: number;
  retryCount: number;
}

type NetworkListener = (isOnline: boolean) => void;

// ─── Constants ───────────────────────────────────────────────────────────────

const OFFLINE_QUEUE_KEY = "@filmcontract:offline_queue";
const PENDING_REQUESTS = new Map<string, Promise<any>>();

// ─── Network State ───────────────────────────────────────────────────────────

let _isOnline = true;
let _networkListeners: NetworkListener[] = [];

export function getNetworkStatus(): boolean {
  return _isOnline;
}

export function setNetworkStatus(online: boolean): void {
  const wasOffline = !_isOnline;
  _isOnline = online;
  _networkListeners.forEach((fn) => fn(online));

  // Trigger background sync when coming back online
  if (wasOffline && online) {
    processOfflineQueue().catch(console.error);
  }
}

export function subscribeNetworkStatus(listener: NetworkListener): () => void {
  _networkListeners.push(listener);
  return () => {
    _networkListeners = _networkListeners.filter((fn) => fn !== listener);
  };
}

// ─── JWT Refresh ─────────────────────────────────────────────────────────────

let _isRefreshing = false;
let _refreshPromise: Promise<string | null> | null = null;

/**
 * Attempt to refresh the JWT session token.
 * Uses a mutex pattern so only one refresh runs at a time.
 */
async function refreshToken(): Promise<string | null> {
  if (_isRefreshing && _refreshPromise) {
    return _refreshPromise;
  }

  _isRefreshing = true;
  _refreshPromise = (async () => {
    try {
      const config = getEnvConfig();
      const currentToken = await Auth.getSessionToken();
      if (!currentToken) return null;

      const response = await fetch(`${config.apiBaseUrl}/api/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentToken}`,
        },
        credentials: "include",
      });

      if (!response.ok) {
        // Token is truly invalid — clear auth state
        console.warn("[ApiService] Token refresh failed:", response.status);
        return null;
      }

      const data = await response.json();
      const newToken = data.app_session_id || data.token;
      if (newToken) {
        await Auth.setSessionToken(newToken);
        return newToken;
      }
      return currentToken; // Server may return 200 without new token (still valid)
    } catch (err) {
      console.error("[ApiService] Token refresh error:", err);
      return null;
    } finally {
      _isRefreshing = false;
      _refreshPromise = null;
    }
  })();

  return _refreshPromise;
}

// ─── Retry with Exponential Backoff ──────────────────────────────────────────

function calculateBackoff(attempt: number, baseDelay: number): number {
  // Exponential backoff with jitter: base * 2^attempt + random(0, base)
  const exponential = baseDelay * Math.pow(2, attempt);
  const jitter = Math.random() * baseDelay;
  return Math.min(exponential + jitter, 30000); // Cap at 30s
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Timeout Wrapper ─────────────────────────────────────────────────────────

function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  return new Promise((resolve, reject) => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      controller.abort();
      reject(new ApiTimeoutError(`Request timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    fetch(url, { ...options, signal: controller.signal })
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

// ─── Custom Errors ───────────────────────────────────────────────────────────

export class ApiTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiTimeoutError";
  }
}

export class ApiNetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiNetworkError";
  }
}

export class ApiHttpError extends Error {
  status: number;
  responseBody: string;

  constructor(status: number, body: string) {
    super(`HTTP ${status}: ${body}`);
    this.name = "ApiHttpError";
    this.status = status;
    this.responseBody = body;
  }
}

// ─── Offline Queue ───────────────────────────────────────────────────────────

async function loadOfflineQueue(): Promise<QueuedRequest[]> {
  try {
    const raw = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveOfflineQueue(queue: QueuedRequest[]): Promise<void> {
  try {
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.error("[ApiService] Failed to save offline queue:", err);
  }
}

async function enqueueRequest(url: string, config: ApiRequestConfig): Promise<void> {
  const envConfig = getEnvConfig();
  const queue = await loadOfflineQueue();

  if (queue.length >= envConfig.offlineQueueMaxSize) {
    console.warn("[ApiService] Offline queue full, dropping oldest request");
    queue.shift();
  }

  const request: QueuedRequest = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    url,
    config: {
      method: config.method,
      headers: config.headers,
      body: config.body,
    },
    timestamp: Date.now(),
    retryCount: 0,
  };

  queue.push(request);
  await saveOfflineQueue(queue);
  console.log(`[ApiService] Request queued for offline sync: ${config.method} ${url}`);
}

/**
 * Process all queued offline requests when connection returns.
 * Processes sequentially to maintain order.
 */
export async function processOfflineQueue(): Promise<{ processed: number; failed: number }> {
  const queue = await loadOfflineQueue();
  if (queue.length === 0) return { processed: 0, failed: 0 };

  console.log(`[ApiService] Processing ${queue.length} offline queued requests...`);

  let processed = 0;
  let failed = 0;
  const remaining: QueuedRequest[] = [];

  for (const request of queue) {
    try {
      await apiRequest(request.url, {
        ...request.config,
        offlineQueue: false, // Don't re-queue if this fails
        retries: 1,
      });
      processed++;
    } catch (err) {
      request.retryCount++;
      if (request.retryCount < 3) {
        remaining.push(request);
      } else {
        failed++;
        console.error(`[ApiService] Dropping failed queued request after 3 retries: ${request.url}`);
      }
    }
  }

  await saveOfflineQueue(remaining);
  console.log(`[ApiService] Queue processed: ${processed} success, ${failed} failed, ${remaining.length} remaining`);
  return { processed, failed };
}

export async function getOfflineQueueSize(): Promise<number> {
  const queue = await loadOfflineQueue();
  return queue.length;
}

export async function clearOfflineQueue(): Promise<void> {
  await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);
}

// ─── Main API Request Function ───────────────────────────────────────────────

/**
 * Make an API request with full production features:
 * - JWT auth header injection
 * - Automatic 401 → token refresh → retry
 * - Exponential backoff retry on network errors
 * - Offline queueing for write operations
 * - Request timeout
 * - Request deduplication
 */
export async function apiRequest<T = any>(
  endpoint: string,
  config: ApiRequestConfig = {},
): Promise<ApiResponse<T>> {
  const envConfig = getEnvConfig();
  const {
    method = "GET",
    headers: customHeaders = {},
    body,
    timeout = envConfig.requestTimeoutMs,
    retries = envConfig.maxRetries,
    offlineQueue = false,
    skipAuthRefresh = false,
    dedupeKey,
  } = config;

  // Request deduplication for GET requests
  if (dedupeKey && method === "GET" && PENDING_REQUESTS.has(dedupeKey)) {
    if (envConfig.enableDebugLogs) {
      console.log(`[ApiService] Deduplicating request: ${dedupeKey}`);
    }
    return PENDING_REQUESTS.get(dedupeKey)!;
  }

  // Build full URL
  const baseUrl = envConfig.apiBaseUrl;
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${cleanEndpoint}`;

  // Build headers
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...customHeaders,
  };

  // Add auth header for native platforms
  if (Platform.OS !== "web") {
    const token = await Auth.getSessionToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  // Prepare fetch options
  const fetchOptions: RequestInit = {
    method,
    headers,
    credentials: "include",
  };
  if (body && method !== "GET") {
    fetchOptions.body = typeof body === "string" ? body : JSON.stringify(body);
  }

  // Execute with retry logic
  const executeRequest = async (): Promise<ApiResponse<T>> => {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // Check if offline
        if (!_isOnline) {
          if (offlineQueue && method !== "GET") {
            await enqueueRequest(cleanEndpoint, config);
            return {
              data: { queued: true, message: "Request queued for when connection returns" } as any,
              status: 202,
              headers: {},
            };
          }
          throw new ApiNetworkError("No network connection");
        }

        if (attempt > 0 && envConfig.enableDebugLogs) {
          console.log(`[ApiService] Retry attempt ${attempt}/${retries} for ${method} ${cleanEndpoint}`);
        }

        const response = await fetchWithTimeout(url, fetchOptions, timeout);

        // Handle 401 — attempt token refresh
        if (response.status === 401 && !skipAuthRefresh && Platform.OS !== "web") {
          const newToken = await refreshToken();
          if (newToken) {
            // Retry with new token
            headers["Authorization"] = `Bearer ${newToken}`;
            const retryResponse = await fetchWithTimeout(
              url,
              { ...fetchOptions, headers },
              timeout,
            );

            if (retryResponse.ok) {
              const data = await parseResponse<T>(retryResponse);
              return {
                data,
                status: retryResponse.status,
                headers: Object.fromEntries(retryResponse.headers.entries()),
              };
            }
          }

          // Token refresh failed or retry still 401 — user needs to re-login
          throw new ApiHttpError(401, "Session expired. Please log in again.");
        }

        // Handle other HTTP errors
        if (!response.ok) {
          const errorBody = await response.text();
          throw new ApiHttpError(response.status, errorBody);
        }

        // Success
        const data = await parseResponse<T>(response);
        return {
          data,
          status: response.status,
          headers: Object.fromEntries(response.headers.entries()),
        };
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));

        // Don't retry on auth errors or client errors (4xx except 408, 429)
        if (err instanceof ApiHttpError) {
          if (err.status >= 400 && err.status < 500 && err.status !== 408 && err.status !== 429) {
            throw err;
          }
        }

        // Wait before retrying (except on last attempt)
        if (attempt < retries) {
          const backoff = calculateBackoff(attempt, envConfig.retryBaseDelayMs);
          if (envConfig.enableDebugLogs) {
            console.log(`[ApiService] Waiting ${backoff}ms before retry...`);
          }
          await delay(backoff);
        }
      }
    }

    // All retries exhausted
    if (offlineQueue && method !== "GET" && lastError instanceof ApiNetworkError) {
      await enqueueRequest(cleanEndpoint, config);
      return {
        data: { queued: true, message: "Request queued for when connection returns" } as any,
        status: 202,
        headers: {},
      };
    }

    throw lastError || new Error("Request failed after all retries");
  };

  // Execute with optional deduplication
  const promise = executeRequest();
  if (dedupeKey && method === "GET") {
    PENDING_REQUESTS.set(dedupeKey, promise);
    promise.finally(() => PENDING_REQUESTS.delete(dedupeKey));
  }

  return promise;
}

// ─── Response Parsing ────────────────────────────────────────────────────────

async function parseResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return response.json();
  }
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return text as any;
  }
}

// ─── Convenience Methods ─────────────────────────────────────────────────────

export const api = {
  get<T = any>(endpoint: string, config?: Omit<ApiRequestConfig, "method" | "body">) {
    return apiRequest<T>(endpoint, { ...config, method: "GET" });
  },

  post<T = any>(endpoint: string, body?: any, config?: Omit<ApiRequestConfig, "method" | "body">) {
    return apiRequest<T>(endpoint, { ...config, method: "POST", body });
  },

  put<T = any>(endpoint: string, body?: any, config?: Omit<ApiRequestConfig, "method" | "body">) {
    return apiRequest<T>(endpoint, { ...config, method: "PUT", body });
  },

  patch<T = any>(endpoint: string, body?: any, config?: Omit<ApiRequestConfig, "method" | "body">) {
    return apiRequest<T>(endpoint, { ...config, method: "PATCH", body });
  },

  delete<T = any>(endpoint: string, config?: Omit<ApiRequestConfig, "method">) {
    return apiRequest<T>(endpoint, { ...config, method: "DELETE" });
  },
};
