import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { router } from "expo-router";
import { useState } from "react";

/**
 * Producer Analytics Dashboard
 * Shows self-tape submission metrics, ratings, and performance insights
 */
export default function AnalyticsScreen() {
  const { user, isAuthenticated } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<"7" | "30" | "90">("30");

  const { data: metrics, isLoading: metricsLoading } = trpc.selfTapeAnalytics.getDashboardMetrics.useQuery(undefined, {
    enabled: isAuthenticated && user?.userRole === "producer",
  });

  const { data: trends } = trpc.selfTapeAnalytics.getSubmissionTrends.useQuery(
    { days: parseInt(selectedPeriod) },
    {
      enabled: isAuthenticated && user?.userRole === "producer",
    }
  );

  const { data: ratingDistribution } = trpc.selfTapeAnalytics.getRatingDistribution.useQuery(undefined, {
    enabled: isAuthenticated && user?.userRole === "producer",
  });

  const { data: topActors } = trpc.selfTapeAnalytics.getTopActors.useQuery({ limit: 5 }, {
    enabled: isAuthenticated && user?.userRole === "producer",
  });

  const { data: revisionPatterns } = trpc.selfTapeAnalytics.getRevisionPatterns.useQuery(undefined, {
    enabled: isAuthenticated && user?.userRole === "producer",
  });

  if (!isAuthenticated || user?.userRole !== "producer") {
    return (
      <ScreenContainer className="p-6 items-center justify-center">
        <Text className="text-lg text-muted text-center">Only producers can view analytics</Text>
      </ScreenContainer>
    );
  }

  if (metricsLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color="#1E40AF" />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 gap-6">
          {/* Header */}
          <View className="flex-row items-center justify-between">
            <TouchableOpacity onPress={() => router.back()}>
              <Text className="text-2xl">‹</Text>
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-foreground">Analytics</Text>
            <View className="w-6" />
          </View>

          {/* Key Metrics */}
          <View className="bg-surface rounded-2xl p-6 gap-4">
            <Text className="text-lg font-bold text-foreground">Key Metrics</Text>

            <View className="grid grid-cols-2 gap-4">
              <View className="bg-background rounded-xl p-4">
                <Text className="text-sm text-muted">Total Submissions</Text>
                <Text className="text-3xl font-bold text-foreground mt-2">{metrics?.totalSubmissions || 0}</Text>
              </View>

              <View className="bg-background rounded-xl p-4">
                <Text className="text-sm text-muted">Approval Rate</Text>
                <Text className="text-3xl font-bold text-success mt-2">{metrics?.approvalRate || 0}%</Text>
              </View>

              <View className="bg-background rounded-xl p-4">
                <Text className="text-sm text-muted">Avg Rating</Text>
                <Text className="text-3xl font-bold text-primary mt-2">{metrics?.averageRating || 0}</Text>
                <Text className="text-xs text-muted mt-1">/10</Text>
              </View>

              <View className="bg-background rounded-xl p-4">
                <Text className="text-sm text-muted">Pending Review</Text>
                <Text className="text-3xl font-bold text-warning mt-2">{metrics?.underReviewCount || 0}</Text>
              </View>
            </View>
          </View>

          {/* Status Breakdown */}
          <View className="bg-surface rounded-2xl p-6 gap-4">
            <Text className="text-lg font-bold text-foreground">Submission Status</Text>

            <View className="gap-3">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2 flex-1">
                  <View className="w-3 h-3 rounded-full bg-success" />
                  <Text className="text-sm text-foreground">Approved</Text>
                </View>
                <Text className="font-bold text-foreground">{metrics?.approvedCount || 0}</Text>
              </View>

              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2 flex-1">
                  <View className="w-3 h-3 rounded-full bg-warning" />
                  <Text className="text-sm text-foreground">Under Review</Text>
                </View>
                <Text className="font-bold text-foreground">{metrics?.underReviewCount || 0}</Text>
              </View>

              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2 flex-1">
                  <View className="w-3 h-3 rounded-full bg-error" />
                  <Text className="text-sm text-foreground">Rejected</Text>
                </View>
                <Text className="font-bold text-foreground">{metrics?.rejectedCount || 0}</Text>
              </View>

              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2 flex-1">
                  <View className="w-3 h-3 rounded-full bg-primary" />
                  <Text className="text-sm text-foreground">Revision Requested</Text>
                </View>
                <Text className="font-bold text-foreground">{metrics?.revisionRequestedCount || 0}</Text>
              </View>
            </View>
          </View>

          {/* Rating Scores */}
          <View className="bg-surface rounded-2xl p-6 gap-4">
            <Text className="text-lg font-bold text-foreground">Average Scores</Text>

            <View className="gap-4">
              <View>
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-sm text-muted">Fit for Role</Text>
                  <Text className="font-bold text-foreground">{metrics?.averageFitScore || 0}/10</Text>
                </View>
                <View className="h-2 bg-background rounded-full overflow-hidden">
                  <View
                    className="h-full bg-primary"
                    style={{ width: `${((metrics?.averageFitScore || 0) / 10) * 100}%` }}
                  />
                </View>
              </View>

              <View>
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-sm text-muted">Energy Level</Text>
                  <Text className="font-bold text-foreground">{metrics?.averageEnergyScore || 0}/10</Text>
                </View>
                <View className="h-2 bg-background rounded-full overflow-hidden">
                  <View
                    className="h-full bg-success"
                    style={{ width: `${((metrics?.averageEnergyScore || 0) / 10) * 100}%` }}
                  />
                </View>
              </View>

              <View>
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-sm text-muted">Delivery Quality</Text>
                  <Text className="font-bold text-foreground">{metrics?.averageDeliveryScore || 0}/10</Text>
                </View>
                <View className="h-2 bg-background rounded-full overflow-hidden">
                  <View
                    className="h-full bg-warning"
                    style={{ width: `${((metrics?.averageDeliveryScore || 0) / 10) * 100}%` }}
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Revision Requests */}
          <View className="bg-surface rounded-2xl p-6 gap-4">
            <Text className="text-lg font-bold text-foreground">Revision Requests</Text>

            <View className="gap-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-muted">Total Requests</Text>
                <Text className="font-bold text-foreground">{revisionPatterns?.totalRequests || 0}</Text>
              </View>

              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-muted">Completion Rate</Text>
                <Text className="font-bold text-success">{revisionPatterns?.completionRate || 0}%</Text>
              </View>

              <View className="h-px bg-border" />

              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-muted">Pending</Text>
                <Text className="font-bold text-warning">{revisionPatterns?.byStatus.pending || 0}</Text>
              </View>

              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-muted">In Progress</Text>
                <Text className="font-bold text-primary">{revisionPatterns?.byStatus.in_progress || 0}</Text>
              </View>

              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-muted">Completed</Text>
                <Text className="font-bold text-success">{revisionPatterns?.byStatus.completed || 0}</Text>
              </View>
            </View>
          </View>

          {/* Response Time */}
          <View className="bg-surface rounded-2xl p-6 gap-4">
            <Text className="text-lg font-bold text-foreground">Response Time</Text>

            <View className="gap-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-muted">Avg Time to Rate</Text>
                <Text className="font-bold text-foreground">~{metrics?.averageRating || 0} hours</Text>
              </View>

              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-muted">Pending Review</Text>
                <Text className="font-bold text-warning">{metrics?.underReviewCount || 0}</Text>
              </View>
            </View>
          </View>

          {/* Period Selector */}
          <View className="gap-3">
            <Text className="text-sm font-semibold text-muted">Time Period</Text>
            <View className="flex-row gap-2">
              {(["7", "30", "90"] as const).map((period) => (
                <TouchableOpacity
                  key={period}
                  onPress={() => setSelectedPeriod(period)}
                  className={`flex-1 py-2 rounded-lg ${
                    selectedPeriod === period
                      ? "bg-primary"
                      : "bg-surface border border-border"
                  }`}
                >
                  <Text
                    className={`text-center font-semibold ${
                      selectedPeriod === period
                        ? "text-white"
                        : "text-foreground"
                    }`}
                  >
                    {period}d
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
