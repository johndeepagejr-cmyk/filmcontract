import { useState } from "react";
import {
  ScrollView,
  Text,
  View,
  Pressable,
  ActivityIndicator,
  Alert,
  Platform,
  Linking,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useRouter } from "expo-router";
import { trpc } from "@/lib/trpc";
import { useColors } from "@/hooks/use-colors";
import { MaterialIcons } from "@expo/vector-icons";

type BillingCycle = "monthly" | "yearly";

export default function SubscriptionScreen() {
  const colors = useColors();
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [changingPlan, setChangingPlan] = useState<string | null>(null);

  const { data: currentSub, isLoading: subLoading } =
    trpc.subscription.getCurrent.useQuery();
  const { data: plansData, isLoading: plansLoading } =
    trpc.subscription.getPlans.useQuery();
  const changePlanMutation = trpc.subscription.changePlan.useMutation();

  const isLoading = subLoading || plansLoading;

  const handleChangePlan = async (planId: string) => {
    if (planId === currentSub?.plan) return;

    if (planId === "free" && currentSub?.plan !== "free") {
      Alert.alert(
        "Downgrade to Free?",
        "You will lose access to premium features at the end of your billing period.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Downgrade",
            style: "destructive",
            onPress: () => executePlanChange(planId),
          },
        ]
      );
      return;
    }

    executePlanChange(planId);
  };

  const executePlanChange = async (planId: string) => {
    setChangingPlan(planId);
    try {
      const result = await changePlanMutation.mutateAsync({
        plan: planId as "free" | "pro" | "studio",
        billingCycle,
      });

      if (result.checkoutUrl) {
        if (Platform.OS === "web") {
          window.open(result.checkoutUrl, "_blank");
        } else {
          await Linking.openURL(result.checkoutUrl);
        }
      } else {
        Alert.alert(
          "Plan Updated",
          result.message || `You are now on the ${planId} plan.`
        );
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to change plan");
    } finally {
      setChangingPlan(null);
    }
  };

  if (isLoading) {
    return (
      <ScreenContainer
        edges={["top", "bottom", "left", "right"]}
        className="p-6"
      >
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  const plans = plansData?.plans || [];

  return (
    <ScreenContainer
      edges={["top", "bottom", "left", "right"]}
      className="p-0"
    >
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="px-5 pt-4 pb-2">
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              { opacity: pressed ? 0.6 : 1, flexDirection: "row", alignItems: "center", marginBottom: 16 },
            ]}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
            <Text className="text-foreground text-base ml-2">Back</Text>
          </Pressable>

          <Text className="text-3xl font-bold text-foreground">
            Choose Your Plan
          </Text>
          <Text className="text-base text-muted mt-2">
            Unlock powerful features for your film career
          </Text>
        </View>

        {/* Current Plan Badge */}
        {currentSub && (
          <View className="mx-5 mt-4 bg-surface rounded-xl p-4 border border-border">
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <MaterialIcons name="verified" size={20} color={colors.primary} />
              <Text className="text-foreground font-semibold ml-2">
                Current Plan:{" "}
                {currentSub.plan.charAt(0).toUpperCase() +
                  currentSub.plan.slice(1)}
              </Text>
            </View>
            <Text className="text-muted text-sm mt-1">
              {currentSub.contractsUsedThisMonth} /{" "}
              {currentSub.limits.contractsPerMonth === -1
                ? "Unlimited"
                : currentSub.limits.contractsPerMonth}{" "}
              contracts used this month
            </Text>
            {currentSub.isTrial && currentSub.trialEndsAt && (
              <Text className="text-warning text-sm mt-1">
                Trial ends{" "}
                {new Date(currentSub.trialEndsAt).toLocaleDateString()}
              </Text>
            )}
          </View>
        )}

        {/* Billing Toggle */}
        <View className="mx-5 mt-6 mb-4">
          <View
            style={{
              flexDirection: "row",
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 4,
            }}
          >
            <Pressable
              onPress={() => setBillingCycle("monthly")}
              style={({ pressed }) => [
                {
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 10,
                  alignItems: "center",
                  backgroundColor:
                    billingCycle === "monthly" ? colors.primary : "transparent",
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Text
                style={{
                  color:
                    billingCycle === "monthly"
                      ? colors.background
                      : colors.muted,
                  fontWeight: "600",
                }}
              >
                Monthly
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setBillingCycle("yearly")}
              style={({ pressed }) => [
                {
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 10,
                  alignItems: "center",
                  backgroundColor:
                    billingCycle === "yearly" ? colors.primary : "transparent",
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Text
                style={{
                  color:
                    billingCycle === "yearly"
                      ? colors.background
                      : colors.muted,
                  fontWeight: "600",
                }}
              >
                Yearly (Save 17%)
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Plan Cards */}
        {plans.map((plan) => {
          const isCurrent = currentSub?.plan === plan.id;
          const isPopular = "popular" in plan && plan.popular;
          const price =
            billingCycle === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
          const isChanging = changingPlan === plan.id;

          return (
            <View
              key={plan.id}
              className="mx-5 mb-4"
              style={{
                borderWidth: isPopular ? 2 : 1,
                borderColor: isPopular ? colors.primary : colors.border,
                borderRadius: 16,
                overflow: "hidden",
              }}
            >
              {/* Popular Badge */}
              {isPopular && (
                <View
                  style={{
                    backgroundColor: colors.primary,
                    paddingVertical: 6,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: colors.background,
                      fontWeight: "700",
                      fontSize: 12,
                      textTransform: "uppercase",
                      letterSpacing: 1,
                    }}
                  >
                    Most Popular
                  </Text>
                </View>
              )}

              <View className="p-5">
                {/* Plan Name & Price */}
                <Text className="text-xl font-bold text-foreground">
                  {plan.name}
                </Text>
                <Text className="text-sm text-muted mt-1">
                  {plan.description}
                </Text>

                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "baseline",
                    marginTop: 16,
                  }}
                >
                  <Text className="text-4xl font-bold text-foreground">
                    ${price === 0 ? "0" : price.toFixed(2)}
                  </Text>
                  {price > 0 && (
                    <Text className="text-muted ml-1">
                      /{billingCycle === "monthly" ? "mo" : "yr"}
                    </Text>
                  )}
                </View>

                {/* Features List */}
                <View className="mt-4">
                  {plan.features.map((feature, idx) => (
                    <View
                      key={idx}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: 10,
                      }}
                    >
                      <MaterialIcons
                        name="check-circle"
                        size={18}
                        color={colors.success}
                      />
                      <Text className="text-foreground text-sm ml-2 flex-1">
                        {feature}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* CTA Button */}
                <Pressable
                  onPress={() => handleChangePlan(plan.id)}
                  disabled={isCurrent || isChanging}
                  style={({ pressed }) => [
                    {
                      marginTop: 16,
                      paddingVertical: 14,
                      borderRadius: 12,
                      alignItems: "center",
                      backgroundColor: isCurrent
                        ? colors.surface
                        : isPopular
                        ? colors.primary
                        : colors.foreground,
                      opacity: pressed && !isCurrent ? 0.8 : 1,
                    },
                  ]}
                >
                  {isChanging ? (
                    <ActivityIndicator
                      size="small"
                      color={isPopular ? colors.background : colors.background}
                    />
                  ) : (
                    <Text
                      style={{
                        color: isCurrent
                          ? colors.muted
                          : isPopular
                          ? colors.background
                          : colors.background,
                        fontWeight: "700",
                        fontSize: 16,
                      }}
                    >
                      {isCurrent
                        ? "Current Plan"
                        : plan.id === "free"
                        ? "Downgrade"
                        : `Upgrade to ${plan.name}`}
                    </Text>
                  )}
                </Pressable>
              </View>
            </View>
          );
        })}

        {/* FAQ Section */}
        <View className="mx-5 mt-4">
          <Text className="text-xl font-bold text-foreground mb-4">
            Frequently Asked Questions
          </Text>

          <View className="bg-surface rounded-xl p-4 mb-3 border border-border">
            <Text className="text-foreground font-semibold">
              Can I cancel anytime?
            </Text>
            <Text className="text-muted text-sm mt-1">
              Yes, you can cancel or downgrade at any time. Your premium
              features will remain active until the end of your billing period.
            </Text>
          </View>

          <View className="bg-surface rounded-xl p-4 mb-3 border border-border">
            <Text className="text-foreground font-semibold">
              What happens to my contracts if I downgrade?
            </Text>
            <Text className="text-muted text-sm mt-1">
              All your existing contracts are safe. You just won't be able to
              create new ones beyond the free tier limit.
            </Text>
          </View>

          <View className="bg-surface rounded-xl p-4 mb-3 border border-border">
            <Text className="text-foreground font-semibold">
              Is there a free trial?
            </Text>
            <Text className="text-muted text-sm mt-1">
              Yes! New Pro and Studio subscribers get a 30-day free trial to
              explore all features before being charged.
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
