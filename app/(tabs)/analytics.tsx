import {
  ScrollView,
  Text,
  View,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { VictoryLine, VictoryChart, VictoryAxis, VictoryTheme, VictoryBar } from "victory-native";

type TimeRange = 7 | 30 | 90;

export default function AnalyticsEnhancedScreen() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<TimeRange>(30);

  const { data: contracts, isLoading: contractsLoading } = trpc.contracts.list.useQuery();
  const { data: portfolioStats, isLoading: portfolioLoading } = trpc.analytics.getPortfolioStats.useQuery(
    { days: timeRange },
    { enabled: !!user?.id }
  );
  const { data: contractTrends, isLoading: trendsLoading } = trpc.analytics.getContractTrends.useQuery(
    { days: timeRange },
    { enabled: !!user?.id }
  );
  const { data: paymentTrends, isLoading: paymentsLoading } = trpc.analytics.getPaymentTrends.useQuery(
    { days: timeRange },
    { enabled: !!user?.id }
  );

  // Calculate statistics
  const stats = contracts
    ? {
        total: contracts.length,
        active: contracts.filter((c) => c.status === "active").length,
        pending: contracts.filter((c) => c.status === "pending").length,
        completed: contracts.filter((c) => c.status === "completed").length,
        cancelled: contracts.filter((c) => c.status === "cancelled").length,
        draft: contracts.filter((c) => c.status === "draft").length,
        totalPayment: contracts.reduce(
          (sum, c) => sum + (parseFloat(c.paymentAmount?.toString() || "0") || 0),
          0
        ),
        paidAmount: contracts.reduce(
          (sum, c) => sum + (parseFloat(c.paidAmount?.toString() || "0") || 0),
          0
        ),
        unpaidContracts: contracts.filter((c) => c.paymentStatus === "unpaid").length,
        paidContracts: contracts.filter((c) => c.paymentStatus === "paid").length,
        partialContracts: contracts.filter((c) => c.paymentStatus === "partial").length,
      }
    : null;

  const StatCard = ({
    title,
    value,
    subtitle,
    color = "bg-primary",
  }: {
    title: string;
    value: string | number;
    subtitle?: string;
    color?: string;
  }) => (
    <View className="bg-surface border border-border rounded-2xl p-4">
      <Text className="text-sm text-muted mb-1">{title}</Text>
      <Text className="text-3xl font-bold text-foreground mb-1">{value}</Text>
      {subtitle && <Text className="text-xs text-muted">{subtitle}</Text>}
    </View>
  );

  const TimeRangeButton = ({ days, label }: { days: TimeRange; label: string }) => (
    <TouchableOpacity
      onPress={() => setTimeRange(days)}
      className={`px-4 py-2 rounded-full ${
        timeRange === days ? "bg-primary" : "bg-surface border border-border"
      }`}
    >
      <Text
        className={`text-sm font-semibold ${
          timeRange === days ? "text-white" : "text-foreground"
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  if (contractsLoading || portfolioLoading || trendsLoading || paymentsLoading) {
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
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">Analytics Dashboard</Text>
            <Text className="text-base text-muted">
              {user?.userRole === "producer"
                ? "Your contract performance overview"
                : "Your contract statistics"}
            </Text>
          </View>

          {/* Time Range Selector */}
          <View className="flex-row gap-2">
            <TimeRangeButton days={7} label="7 Days" />
            <TimeRangeButton days={30} label="30 Days" />
            <TimeRangeButton days={90} label="90 Days" />
          </View>

          {/* Portfolio Stats */}
          {portfolioStats && (
            <View className="gap-3">
              <Text className="text-lg font-bold text-foreground">Portfolio Performance</Text>
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <StatCard
                    title="Total Views"
                    value={portfolioStats.totalViews}
                    subtitle="All time"
                  />
                </View>
                <View className="flex-1">
                  <StatCard
                    title="Recent Views"
                    value={portfolioStats.recentViews}
                    subtitle={`Last ${timeRange} days`}
                    color="bg-success"
                  />
                </View>
              </View>
              <StatCard
                title="Unique Visitors"
                value={portfolioStats.uniqueVisitors}
                subtitle={`Last ${timeRange} days`}
                color="bg-primary"
              />

              {/* Portfolio Views Chart */}
              {portfolioStats.viewsByDay && portfolioStats.viewsByDay.length > 0 && (
                <View className="bg-surface border border-border rounded-2xl p-4">
                  <Text className="text-base font-semibold text-foreground mb-4">
                    Portfolio Views Trend
                  </Text>
                  <VictoryChart
                    theme={VictoryTheme.material}
                    height={200}
                    padding={{ top: 20, bottom: 40, left: 50, right: 20 }}
                  >
                    <VictoryAxis
                      style={{
                        tickLabels: { fontSize: 10, fill: "#687076" },
                        axis: { stroke: "#E5E7EB" },
                      }}
                    />
                    <VictoryAxis
                      dependentAxis
                      style={{
                        tickLabels: { fontSize: 10, fill: "#687076" },
                        axis: { stroke: "#E5E7EB" },
                        grid: { stroke: "#E5E7EB", strokeDasharray: "3,3" },
                      }}
                    />
                    <VictoryLine
                      data={portfolioStats.viewsByDay.map((d) => ({
                        x: new Date(d.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        }),
                        y: d.views,
                      }))}
                      style={{
                        data: { stroke: "#0a7ea4", strokeWidth: 2 },
                      }}
                    />
                  </VictoryChart>
                </View>
              )}
            </View>
          )}

          {/* Contract Overview Stats */}
          <View className="gap-3">
            <Text className="text-lg font-bold text-foreground">Contract Overview</Text>
            <View className="flex-row gap-3">
              <View className="flex-1">
                <StatCard title="Total Contracts" value={stats?.total || 0} />
              </View>
              <View className="flex-1">
                <StatCard
                  title="Active"
                  value={stats?.active || 0}
                  color="bg-success"
                />
              </View>
            </View>
            <View className="flex-row gap-3">
              <View className="flex-1">
                <StatCard
                  title="Pending"
                  value={stats?.pending || 0}
                  color="bg-warning"
                />
              </View>
              <View className="flex-1">
                <StatCard
                  title="Completed"
                  value={stats?.completed || 0}
                  color="bg-primary"
                />
              </View>
            </View>
          </View>

          {/* Contract Trends Chart */}
          {contractTrends && contractTrends.contractsByDay.length > 0 && (
            <View className="bg-surface border border-border rounded-2xl p-4">
              <Text className="text-base font-semibold text-foreground mb-4">
                Contracts Created Over Time
              </Text>
              <VictoryChart
                theme={VictoryTheme.material}
                height={200}
                padding={{ top: 20, bottom: 40, left: 50, right: 20 }}
              >
                <VictoryAxis
                  style={{
                    tickLabels: { fontSize: 10, fill: "#687076" },
                    axis: { stroke: "#E5E7EB" },
                  }}
                />
                <VictoryAxis
                  dependentAxis
                  style={{
                    tickLabels: { fontSize: 10, fill: "#687076" },
                    axis: { stroke: "#E5E7EB" },
                    grid: { stroke: "#E5E7EB", strokeDasharray: "3,3" },
                  }}
                />
                <VictoryBar
                  data={contractTrends.contractsByDay.map((d) => ({
                    x: new Date(d.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    }),
                    y: d.count,
                  }))}
                  style={{
                    data: { fill: "#0a7ea4" },
                  }}
                />
              </VictoryChart>
            </View>
          )}

          {/* Payment Stats */}
          <View className="gap-3">
            <Text className="text-lg font-bold text-foreground">Payment Statistics</Text>
            <StatCard
              title="Total Contract Value"
              value={`$${(stats?.totalPayment || 0).toLocaleString()}`}
              subtitle="Combined value of all contracts"
            />
            <StatCard
              title="Total Paid"
              value={`$${(stats?.paidAmount || 0).toLocaleString()}`}
              subtitle={`${stats?.paidContracts || 0} contracts fully paid`}
              color="bg-success"
            />
            <StatCard
              title="Outstanding"
              value={`$${((stats?.totalPayment || 0) - (stats?.paidAmount || 0)).toLocaleString()}`}
              subtitle={`${stats?.unpaidContracts || 0} unpaid, ${stats?.partialContracts || 0} partial`}
              color="bg-warning"
            />
          </View>

          {/* Payment Trends Chart */}
          {paymentTrends && paymentTrends.paymentsByMonth.length > 0 && (
            <View className="bg-surface border border-border rounded-2xl p-4">
              <Text className="text-base font-semibold text-foreground mb-4">
                Payment Trends by Month
              </Text>
              <VictoryChart
                theme={VictoryTheme.material}
                height={200}
                padding={{ top: 20, bottom: 40, left: 60, right: 20 }}
              >
                <VictoryAxis
                  style={{
                    tickLabels: { fontSize: 10, fill: "#687076" },
                    axis: { stroke: "#E5E7EB" },
                  }}
                />
                <VictoryAxis
                  dependentAxis
                  style={{
                    tickLabels: { fontSize: 10, fill: "#687076" },
                    axis: { stroke: "#E5E7EB" },
                    grid: { stroke: "#E5E7EB", strokeDasharray: "3,3" },
                  }}
                />
                <VictoryBar
                  data={paymentTrends.paymentsByMonth.map((d) => ({
                    x: d.month,
                    y: d.amount,
                  }))}
                  style={{
                    data: { fill: "#22C55E" },
                  }}
                />
              </VictoryChart>
            </View>
          )}

          {/* Status Breakdown */}
          <View className="gap-3">
            <Text className="text-lg font-bold text-foreground">Status Breakdown</Text>
            <View className="bg-surface border border-border rounded-2xl p-4 gap-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-base text-foreground">Active</Text>
                <View className="flex-row items-center gap-2">
                  <View
                    className="h-2 bg-success rounded-full"
                    style={{
                      width: `${((stats?.active || 0) / (stats?.total || 1)) * 100}%`,
                      minWidth: 20,
                    }}
                  />
                  <Text className="text-base font-semibold text-foreground w-8 text-right">
                    {stats?.active || 0}
                  </Text>
                </View>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-base text-foreground">Pending</Text>
                <View className="flex-row items-center gap-2">
                  <View
                    className="h-2 bg-warning rounded-full"
                    style={{
                      width: `${((stats?.pending || 0) / (stats?.total || 1)) * 100}%`,
                      minWidth: 20,
                    }}
                  />
                  <Text className="text-base font-semibold text-foreground w-8 text-right">
                    {stats?.pending || 0}
                  </Text>
                </View>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-base text-foreground">Completed</Text>
                <View className="flex-row items-center gap-2">
                  <View
                    className="h-2 bg-primary rounded-full"
                    style={{
                      width: `${((stats?.completed || 0) / (stats?.total || 1)) * 100}%`,
                      minWidth: 20,
                    }}
                  />
                  <Text className="text-base font-semibold text-foreground w-8 text-right">
                    {stats?.completed || 0}
                  </Text>
                </View>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-base text-foreground">Draft</Text>
                <View className="flex-row items-center gap-2">
                  <View
                    className="h-2 bg-muted rounded-full"
                    style={{
                      width: `${((stats?.draft || 0) / (stats?.total || 1)) * 100}%`,
                      minWidth: 20,
                    }}
                  />
                  <Text className="text-base font-semibold text-foreground w-8 text-right">
                    {stats?.draft || 0}
                  </Text>
                </View>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-base text-foreground">Cancelled</Text>
                <View className="flex-row items-center gap-2">
                  <View
                    className="h-2 bg-error rounded-full"
                    style={{
                      width: `${((stats?.cancelled || 0) / (stats?.total || 1)) * 100}%`,
                      minWidth: 20,
                    }}
                  />
                  <Text className="text-base font-semibold text-foreground w-8 text-right">
                    {stats?.cancelled || 0}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
