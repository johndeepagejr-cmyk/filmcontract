import { useMemo, useCallback } from "react";
import { Alert, Linking, Platform } from "react-native";
import { trpc } from "@/lib/trpc";
import { useRouter } from "expo-router";

/** Plan feature limits */
const PLAN_LIMITS = {
  free: {
    contractsPerMonth: 3,
    castingsPerMonth: 2,
    selfTapesPerMonth: 5,
    templates: false,
    pdfExport: false,
    signatures: false,
    analytics: false,
    prioritySupport: false,
    featuredProfile: false,
    teamMembers: 1,
    storageGB: 1,
    boostCastings: false,
    advancedFilters: false,
    comparisonMode: false,
  },
  pro: {
    contractsPerMonth: -1,
    castingsPerMonth: -1,
    selfTapesPerMonth: -1,
    templates: true,
    pdfExport: true,
    signatures: true,
    analytics: true,
    prioritySupport: false,
    featuredProfile: false,
    teamMembers: 3,
    storageGB: 25,
    boostCastings: true,
    advancedFilters: true,
    comparisonMode: true,
  },
  studio: {
    contractsPerMonth: -1,
    castingsPerMonth: -1,
    selfTapesPerMonth: -1,
    templates: true,
    pdfExport: true,
    signatures: true,
    analytics: true,
    prioritySupport: true,
    featuredProfile: true,
    teamMembers: 10,
    storageGB: 100,
    boostCastings: true,
    advancedFilters: true,
    comparisonMode: true,
  },
} as const;

type PlanName = keyof typeof PLAN_LIMITS;
type FeatureName = keyof (typeof PLAN_LIMITS)["free"];

export function useSubscription() {
  const router = useRouter();
  const { data: subscription, isLoading, refetch } = trpc.subscription.getCurrent.useQuery();

  const plan = (subscription?.plan || "free") as PlanName;
  const limits = PLAN_LIMITS[plan];

  const canUseFeature = useCallback(
    (feature: FeatureName): boolean => {
      const value = limits[feature];
      if (typeof value === "boolean") return value;
      if (typeof value === "number") return value === -1 || value > 0;
      return false;
    },
    [limits]
  );

  const checkFeatureAccess = useCallback(
    (feature: FeatureName, featureLabel: string): boolean => {
      if (canUseFeature(feature)) return true;

      const requiredPlan = feature === "prioritySupport" || feature === "featuredProfile" ? "Studio" : "Pro";

      Alert.alert(
        `${requiredPlan} Feature`,
        `${featureLabel} requires the ${requiredPlan} plan. Upgrade to unlock this feature.`,
        [
          { text: "Not Now", style: "cancel" },
          {
            text: `Upgrade to ${requiredPlan}`,
            onPress: () => router.push("/subscription" as any),
          },
        ]
      );
      return false;
    },
    [canUseFeature, router]
  );

  const checkUsageLimit = useCallback(
    (feature: "contractsPerMonth" | "castingsPerMonth" | "selfTapesPerMonth", used: number): boolean => {
      const limit = limits[feature] as number;
      if (limit === -1) return true; // Unlimited

      if (used >= limit) {
        const labels: Record<string, string> = {
          contractsPerMonth: "contracts this month",
          castingsPerMonth: "casting calls this month",
          selfTapesPerMonth: "self-tapes this month",
        };

        Alert.alert(
          "Limit Reached",
          `You've used ${used}/${limit} ${labels[feature]} on the ${plan.charAt(0).toUpperCase() + plan.slice(1)} plan. Upgrade for unlimited access.`,
          [
            { text: "OK", style: "cancel" },
            {
              text: "Upgrade",
              onPress: () => router.push("/subscription" as any),
            },
          ]
        );
        return false;
      }
      return true;
    },
    [limits, plan, router]
  );

  const isPro = plan === "pro" || plan === "studio";
  const isStudio = plan === "studio";

  return {
    plan,
    limits,
    isPro,
    isStudio,
    isLoading,
    subscription,
    canUseFeature,
    checkFeatureAccess,
    checkUsageLimit,
    refetch,
  };
}
