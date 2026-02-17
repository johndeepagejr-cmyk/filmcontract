/**
 * NetworkContext — Global network state provider
 *
 * Provides:
 * - Online/offline status
 * - Health check results
 * - Offline queue size
 * - Network status banner visibility
 *
 * Created by John dee page jr
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AppState, AppStateStatus, Platform } from "react-native";
import {
  getNetworkStatus,
  setNetworkStatus,
  subscribeNetworkStatus,
  getOfflineQueueSize,
  processOfflineQueue,
} from "@/services/api-service";
import {
  checkHealth,
  startHealthChecks,
  stopHealthChecks,
  subscribeHealth,
  type HealthCheckResult,
  type HealthStatus,
} from "@/services/health-check";

interface NetworkContextValue {
  /** Whether the device has network connectivity */
  isOnline: boolean;
  /** Current server health status */
  healthStatus: HealthStatus;
  /** Last health check result */
  lastHealthCheck: HealthCheckResult | null;
  /** Whether the server is in maintenance mode */
  isMaintenanceMode: boolean;
  /** Number of requests queued for offline sync */
  offlineQueueSize: number;
  /** Whether to show the network status banner */
  showBanner: boolean;
  /** Banner message text */
  bannerMessage: string;
  /** Banner type for styling */
  bannerType: "offline" | "maintenance" | "degraded" | "syncing" | "none";
  /** Manually trigger a health check */
  refreshHealth: () => Promise<void>;
  /** Manually process the offline queue */
  syncOfflineQueue: () => Promise<void>;
  /** Dismiss the banner */
  dismissBanner: () => void;
}

const NetworkContext = createContext<NetworkContextValue>({
  isOnline: true,
  healthStatus: "healthy",
  lastHealthCheck: null,
  isMaintenanceMode: false,
  offlineQueueSize: 0,
  showBanner: false,
  bannerMessage: "",
  bannerType: "none",
  refreshHealth: async () => {},
  syncOfflineQueue: async () => {},
  dismissBanner: () => {},
});

export function useNetwork() {
  return useContext(NetworkContext);
}

interface NetworkProviderProps {
  children: React.ReactNode;
}

export function NetworkProvider({ children }: NetworkProviderProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [healthResult, setHealthResult] = useState<HealthCheckResult | null>(null);
  const [offlineQueueSize, setOfflineQueueSize] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  // Monitor network connectivity
  useEffect(() => {
    // Use web navigator.onLine for web platform
    if (Platform.OS === "web" && typeof window !== "undefined") {
      const handleOnline = () => {
        setNetworkStatus(true);
        setIsOnline(true);
        setBannerDismissed(false);
      };
      const handleOffline = () => {
        setNetworkStatus(false);
        setIsOnline(false);
        setBannerDismissed(false);
      };

      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
      setIsOnline(navigator.onLine);
      setNetworkStatus(navigator.onLine);

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }

    // For native, use NetInfo-style polling via health checks
    // The health check will detect if server is unreachable
    const unsubscribe = subscribeNetworkStatus((online) => {
      setIsOnline(online);
      if (!online) setBannerDismissed(false);
    });

    return unsubscribe;
  }, []);

  // Subscribe to health check results
  useEffect(() => {
    const unsubscribe = subscribeHealth((result) => {
      setHealthResult(result);

      // Update network status based on health
      if (result.status === "unreachable") {
        setNetworkStatus(false);
      } else if (!getNetworkStatus()) {
        setNetworkStatus(true);
      }
    });

    return unsubscribe;
  }, []);

  // Start/stop health checks based on app state
  useEffect(() => {
    startHealthChecks();

    const subscription = AppState.addEventListener("change", (nextState) => {
      if (appStateRef.current.match(/inactive|background/) && nextState === "active") {
        // App came to foreground — check health and sync
        checkHealth().catch(console.error);
        updateQueueSize();
      }
      appStateRef.current = nextState;
    });

    return () => {
      stopHealthChecks();
      subscription.remove();
    };
  }, []);

  // Update offline queue size periodically
  const updateQueueSize = useCallback(async () => {
    const size = await getOfflineQueueSize();
    setOfflineQueueSize(size);
  }, []);

  useEffect(() => {
    updateQueueSize();
    const interval = setInterval(updateQueueSize, 10000);
    return () => clearInterval(interval);
  }, [updateQueueSize]);

  // Manual health refresh
  const refreshHealth = useCallback(async () => {
    await checkHealth();
    await updateQueueSize();
  }, [updateQueueSize]);

  // Manual offline queue sync
  const syncOfflineQueue = useCallback(async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      await processOfflineQueue();
      await updateQueueSize();
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, updateQueueSize]);

  // Compute banner state
  const healthStatus = healthResult?.status ?? "healthy";
  const isMaintenanceMode = healthStatus === "maintenance";

  const { showBanner, bannerMessage, bannerType } = useMemo(() => {
    if (bannerDismissed) {
      return { showBanner: false, bannerMessage: "", bannerType: "none" as const };
    }

    if (!isOnline) {
      return {
        showBanner: true,
        bannerMessage: "You're offline. Changes will sync when connection returns.",
        bannerType: "offline" as const,
      };
    }

    if (isMaintenanceMode) {
      return {
        showBanner: true,
        bannerMessage: healthResult?.message || "Server is under maintenance. Please try again later.",
        bannerType: "maintenance" as const,
      };
    }

    if (healthStatus === "degraded") {
      return {
        showBanner: true,
        bannerMessage: "Server is experiencing slow response times.",
        bannerType: "degraded" as const,
      };
    }

    if (isSyncing) {
      return {
        showBanner: true,
        bannerMessage: `Syncing ${offlineQueueSize} pending changes...`,
        bannerType: "syncing" as const,
      };
    }

    if (offlineQueueSize > 0) {
      return {
        showBanner: true,
        bannerMessage: `${offlineQueueSize} changes pending sync.`,
        bannerType: "syncing" as const,
      };
    }

    return { showBanner: false, bannerMessage: "", bannerType: "none" as const };
  }, [isOnline, isMaintenanceMode, healthStatus, healthResult, isSyncing, offlineQueueSize, bannerDismissed]);

  const dismissBanner = useCallback(() => {
    setBannerDismissed(true);
  }, []);

  const value = useMemo<NetworkContextValue>(
    () => ({
      isOnline,
      healthStatus,
      lastHealthCheck: healthResult,
      isMaintenanceMode,
      offlineQueueSize,
      showBanner,
      bannerMessage,
      bannerType,
      refreshHealth,
      syncOfflineQueue,
      dismissBanner,
    }),
    [
      isOnline,
      healthStatus,
      healthResult,
      isMaintenanceMode,
      offlineQueueSize,
      showBanner,
      bannerMessage,
      bannerType,
      refreshHealth,
      syncOfflineQueue,
      dismissBanner,
    ],
  );

  return <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>;
}
