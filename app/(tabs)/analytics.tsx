import {
  ScrollView,
  Text,
  View,
  ActivityIndicator,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";

export default function AnalyticsScreen() {
  const { user } = useAuth();

  const { data: contracts, isLoading } = trpc.contracts.list.useQuery();

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

  if (isLoading) {
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
            <Text className="text-3xl font-bold text-foreground">Analytics</Text>
            <Text className="text-base text-muted">
              {user?.userRole === "producer"
                ? "Your contract performance overview"
                : "Your contract statistics"}
            </Text>
          </View>

          {/* Overview Stats */}
          <View className="gap-3">
            <Text className="text-lg font-bold text-foreground">Overview</Text>
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

          {/* Status Breakdown */}
          <View className="gap-3">
            <Text className="text-lg font-bold text-foreground">Status Breakdown</Text>
            <View className="bg-surface border border-border rounded-2xl p-4 gap-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-base text-foreground">Active</Text>
                <View className="flex-row items-center gap-2">
                  <View className="h-2 bg-success rounded-full" style={{ width: `${((stats?.active || 0) / (stats?.total || 1)) * 100}%`, minWidth: 20 }} />
                  <Text className="text-base font-semibold text-foreground w-8 text-right">
                    {stats?.active || 0}
                  </Text>
                </View>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-base text-foreground">Pending</Text>
                <View className="flex-row items-center gap-2">
                  <View className="h-2 bg-warning rounded-full" style={{ width: `${((stats?.pending || 0) / (stats?.total || 1)) * 100}%`, minWidth: 20 }} />
                  <Text className="text-base font-semibold text-foreground w-8 text-right">
                    {stats?.pending || 0}
                  </Text>
                </View>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-base text-foreground">Completed</Text>
                <View className="flex-row items-center gap-2">
                  <View className="h-2 bg-primary rounded-full" style={{ width: `${((stats?.completed || 0) / (stats?.total || 1)) * 100}%`, minWidth: 20 }} />
                  <Text className="text-base font-semibold text-foreground w-8 text-right">
                    {stats?.completed || 0}
                  </Text>
                </View>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-base text-foreground">Draft</Text>
                <View className="flex-row items-center gap-2">
                  <View className="h-2 bg-muted rounded-full" style={{ width: `${((stats?.draft || 0) / (stats?.total || 1)) * 100}%`, minWidth: 20 }} />
                  <Text className="text-base font-semibold text-foreground w-8 text-right">
                    {stats?.draft || 0}
                  </Text>
                </View>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-base text-foreground">Cancelled</Text>
                <View className="flex-row items-center gap-2">
                  <View className="h-2 bg-error rounded-full" style={{ width: `${((stats?.cancelled || 0) / (stats?.total || 1)) * 100}%`, minWidth: 20 }} />
                  <Text className="text-base font-semibold text-foreground w-8 text-right">
                    {stats?.cancelled || 0}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Payment Status Breakdown */}
          <View className="gap-3">
            <Text className="text-lg font-bold text-foreground">Payment Status</Text>
            <View className="bg-surface border border-border rounded-2xl p-4 gap-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-base text-foreground">Paid</Text>
                <View className="flex-row items-center gap-2">
                  <View className="h-2 bg-success rounded-full" style={{ width: `${((stats?.paidContracts || 0) / (stats?.total || 1)) * 100}%`, minWidth: 20 }} />
                  <Text className="text-base font-semibold text-foreground w-8 text-right">
                    {stats?.paidContracts || 0}
                  </Text>
                </View>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-base text-foreground">Partial</Text>
                <View className="flex-row items-center gap-2">
                  <View className="h-2 bg-warning rounded-full" style={{ width: `${((stats?.partialContracts || 0) / (stats?.total || 1)) * 100}%`, minWidth: 20 }} />
                  <Text className="text-base font-semibold text-foreground w-8 text-right">
                    {stats?.partialContracts || 0}
                  </Text>
                </View>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-base text-foreground">Unpaid</Text>
                <View className="flex-row items-center gap-2">
                  <View className="h-2 bg-error rounded-full" style={{ width: `${((stats?.unpaidContracts || 0) / (stats?.total || 1)) * 100}%`, minWidth: 20 }} />
                  <Text className="text-base font-semibold text-foreground w-8 text-right">
                    {stats?.unpaidContracts || 0}
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
