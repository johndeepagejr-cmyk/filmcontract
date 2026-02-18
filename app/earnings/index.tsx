import {
  ScrollView, Text, View, TouchableOpacity, ActivityIndicator,
  StyleSheet, Alert, Linking, Platform, RefreshControl,
} from "react-native";
import { useState, useCallback } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";

// ─── Types ──────────────────────────────────────────────────

interface EarningsSummary {
  totalEarned: number;
  pendingRelease: number;
  availableBalance: number;
  totalContracts: number;
  thisMonthEarned: number;
  lastMonthEarned: number;
}

// ─── Component ──────────────────────────────────────────────

export default function EarningsScreen() {
  const colors = useColors();
  const [refreshing, setRefreshing] = useState(false);

  // Stripe Connect status
  const { data: connectStatus, refetch: refetchConnect } =
    trpc.stripeConnect.getConnectStatus.useQuery();

  // Earnings data
  const { data: earnings, refetch: refetchEarnings } =
    trpc.escrow.getEarningsSummary.useQuery();

  // Payment history
  const { data: history, refetch: refetchHistory } =
    trpc.escrow.getHistory.useQuery({ role: "payee" });

  // Stripe Connect mutations
  const createAccountMutation = trpc.stripeConnect.createConnectAccount.useMutation({
    onSuccess: (data: any) => {
      if (data.onboardingUrl) {
        Linking.openURL(data.onboardingUrl);
      }
    },
    onError: (err: any) => Alert.alert("Error", err.message),
  });

  const dashboardMutation = trpc.stripeConnect.createPortalSession.useMutation({
    onSuccess: (data: any) => {
      if (data.url) Linking.openURL(data.url);
    },
    onError: (err: any) => Alert.alert("Error", err.message),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchConnect(), refetchEarnings(), refetchHistory()]);
    setRefreshing(false);
  }, [refetchConnect, refetchEarnings, refetchHistory]);

  const isOnboarded = connectStatus?.chargesEnabled && connectStatus?.payoutsEnabled;
  const hasAccount = !!connectStatus?.accountId;

  const earningsData: EarningsSummary = {
    totalEarned: (earnings as any)?.totalEarned ?? 0,
    pendingRelease: (earnings as any)?.pendingRelease ?? 0,
    availableBalance: (earnings as any)?.availableBalance ?? 0,
    totalContracts: (earnings as any)?.totalContracts ?? 0,
    thisMonthEarned: (earnings as any)?.thisMonthEarned ?? 0,
    lastMonthEarned: (earnings as any)?.lastMonthEarned ?? 0,
  };

  const historyItems: any[] = (history as any)?.items ?? (Array.isArray(history) ? history : []);

  const formatCurrency = (amount: number) =>
    `$${(amount / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

  const monthChange = earningsData.lastMonthEarned > 0
    ? ((earningsData.thisMonthEarned - earningsData.lastMonthEarned) / earningsData.lastMonthEarned * 100).toFixed(0)
    : null;

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Header */}
        <View style={[s.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <IconSymbol name="chevron.left" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[s.title, { color: colors.foreground }]}>Earnings</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Stripe Connect Status */}
        {!isOnboarded && (
          <View style={[s.connectBanner, { backgroundColor: "#FFF3E0", borderColor: "#FFB74D" }]}>
            <View style={s.connectBannerContent}>
              <View style={[s.connectIcon, { backgroundColor: "#FF9800" }]}>
                <IconSymbol name="creditcard.fill" size={24} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.connectTitle, { color: "#E65100" }]}>
                  {hasAccount ? "Complete Payment Setup" : "Set Up Payments"}
                </Text>
                <Text style={[s.connectDesc, { color: "#BF360C" }]}>
                  {hasAccount
                    ? "Your Stripe account needs additional verification before you can receive payments."
                    : "Connect your bank account to receive payments for your work. Powered by Stripe."}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => {
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                createAccountMutation.mutate();
              }}
              disabled={createAccountMutation.isPending}
              style={[s.connectBtn, { backgroundColor: "#FF9800" }]}
              activeOpacity={0.8}
            >
              {createAccountMutation.isPending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <IconSymbol name="arrow.right" size={16} color="#fff" />
                  <Text style={s.connectBtnText}>
                    {hasAccount ? "Continue Setup" : "Get Started"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Earnings Overview */}
        <View style={s.section}>
          <View style={[s.earningsCard, { backgroundColor: colors.primary }]}>
            <Text style={s.earningsLabel}>Total Earned</Text>
            <Text style={s.earningsAmount}>{formatCurrency(earningsData.totalEarned)}</Text>
            <View style={s.earningsRow}>
              <View style={s.earningsStat}>
                <Text style={s.earningsStatLabel}>This Month</Text>
                <Text style={s.earningsStatValue}>{formatCurrency(earningsData.thisMonthEarned)}</Text>
                {monthChange && (
                  <Text style={[s.earningsChange, { color: parseInt(monthChange) >= 0 ? "#A5D6A7" : "#EF9A9A" }]}>
                    {parseInt(monthChange) >= 0 ? "↑" : "↓"} {Math.abs(parseInt(monthChange))}%
                  </Text>
                )}
              </View>
              <View style={[s.earningsDivider, { backgroundColor: "rgba(255,255,255,0.2)" }]} />
              <View style={s.earningsStat}>
                <Text style={s.earningsStatLabel}>Contracts</Text>
                <Text style={s.earningsStatValue}>{earningsData.totalContracts}</Text>
              </View>
            </View>
          </View>

          {/* Balance Cards */}
          <View style={s.balanceRow}>
            <View style={[s.balanceCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[s.balanceIcon, { backgroundColor: "#E8F5E9" }]}>
                <IconSymbol name="checkmark.circle.fill" size={20} color="#4CAF50" />
              </View>
              <Text style={[s.balanceLabel, { color: colors.muted }]}>Available</Text>
              <Text style={[s.balanceAmount, { color: "#4CAF50" }]}>
                {formatCurrency(earningsData.availableBalance)}
              </Text>
            </View>
            <View style={[s.balanceCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[s.balanceIcon, { backgroundColor: "#FFF3E0" }]}>
                <IconSymbol name="clock.fill" size={20} color="#FF9800" />
              </View>
              <Text style={[s.balanceLabel, { color: colors.muted }]}>In Escrow</Text>
              <Text style={[s.balanceAmount, { color: "#FF9800" }]}>
                {formatCurrency(earningsData.pendingRelease)}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        {isOnboarded && (
          <View style={s.section}>
            <Text style={[s.sectionTitle, { color: colors.foreground }]}>Quick Actions</Text>
            <View style={s.actionsRow}>
              <TouchableOpacity
                onPress={() => dashboardMutation.mutate()}
                style={[s.actionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                activeOpacity={0.7}
              >
                <View style={[s.actionIcon, { backgroundColor: colors.primary + "15" }]}>
                  <IconSymbol name="creditcard.fill" size={22} color={colors.primary} />
                </View>
                <Text style={[s.actionLabel, { color: colors.foreground }]}>Stripe Dashboard</Text>
                <Text style={[s.actionDesc, { color: colors.muted }]}>Manage payouts</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push("/payments" as any)}
                style={[s.actionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                activeOpacity={0.7}
              >
                <View style={[s.actionIcon, { backgroundColor: "#E8F5E9" }]}>
                  <IconSymbol name="doc.text.fill" size={22} color="#4CAF50" />
                </View>
                <Text style={[s.actionLabel, { color: colors.foreground }]}>Payment History</Text>
                <Text style={[s.actionDesc, { color: colors.muted }]}>View all transactions</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Recent Payments */}
        <View style={s.section}>
          <Text style={[s.sectionTitle, { color: colors.foreground }]}>Recent Payments</Text>
          {historyItems.length === 0 ? (
            <View style={[s.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <IconSymbol name="creditcard.fill" size={32} color={colors.muted} />
              <Text style={[s.emptyText, { color: colors.muted }]}>No payments yet</Text>
              <Text style={[s.emptyDesc, { color: colors.muted }]}>
                Payments from completed contracts will appear here.
              </Text>
            </View>
          ) : (
            historyItems.slice(0, 10).map((item: any, i: number) => (
              <View
                key={item.id || i}
                style={[s.paymentItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <View style={[
                  s.paymentIcon,
                  {
                    backgroundColor: item.status === "released"
                      ? "#E8F5E9"
                      : item.status === "funded"
                        ? "#FFF3E0"
                        : item.status === "disputed"
                          ? "#FFEBEE"
                          : colors.surface,
                  },
                ]}>
                  <IconSymbol
                    name={
                      item.status === "released"
                        ? "checkmark.circle.fill"
                        : item.status === "funded"
                          ? "clock.fill"
                          : "xmark.circle.fill"
                    }
                    size={20}
                    color={
                      item.status === "released"
                        ? "#4CAF50"
                        : item.status === "funded"
                          ? "#FF9800"
                          : "#F44336"
                    }
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.paymentTitle, { color: colors.foreground }]}>
                    Contract #{item.contractId}
                  </Text>
                  <Text style={[s.paymentDate, { color: colors.muted }]}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={[s.paymentAmount, {
                    color: item.status === "released" ? "#4CAF50" : colors.foreground,
                  }]}>
                    {item.status === "released" ? "+" : ""}{formatCurrency(item.amount || 0)}
                  </Text>
                  <Text style={[s.paymentStatus, {
                    color: item.status === "released"
                      ? "#4CAF50"
                      : item.status === "funded"
                        ? "#FF9800"
                        : "#F44336",
                  }]}>
                    {item.status?.charAt(0).toUpperCase() + item.status?.slice(1)}
                  </Text>
                </View>
              </View>
            ))
          )}

          {historyItems.length > 10 && (
            <TouchableOpacity
              onPress={() => router.push("/payments" as any)}
              style={[s.viewAllBtn, { borderColor: colors.primary }]}
              activeOpacity={0.7}
            >
              <Text style={[s.viewAllText, { color: colors.primary }]}>View All Transactions</Text>
              <IconSymbol name="arrow.right" size={14} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Tax Info */}
        <View style={s.section}>
          <View style={[s.taxCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={s.taxHeader}>
              <IconSymbol name="doc.text.fill" size={20} color={colors.primary} />
              <Text style={[s.taxTitle, { color: colors.foreground }]}>Tax Information</Text>
            </View>
            <Text style={[s.taxDesc, { color: colors.muted }]}>
              Earnings over $600/year will receive a 1099-NEC form. Manage your tax information through your Stripe Dashboard.
            </Text>
            {isOnboarded && (
              <TouchableOpacity
                onPress={() => dashboardMutation.mutate()}
                style={[s.taxBtn, { borderColor: colors.primary }]}
                activeOpacity={0.7}
              >
                <Text style={[s.taxBtnText, { color: colors.primary }]}>Manage Tax Info</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

// ─── Styles ─────────────────────────────────────────────────

const s = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, gap: 8 },
  backBtn: { padding: 4 },
  title: { fontSize: 20, fontWeight: "800", flex: 1, textAlign: "center" },

  // Connect Banner
  connectBanner: { margin: 16, borderRadius: 16, borderWidth: 1, padding: 16, overflow: "hidden" },
  connectBannerContent: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  connectIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  connectTitle: { fontSize: 16, fontWeight: "700" },
  connectDesc: { fontSize: 13, lineHeight: 18, marginTop: 4 },
  connectBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 14, paddingVertical: 12, borderRadius: 12 },
  connectBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },

  // Sections
  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: 12 },

  // Earnings Card
  earningsCard: { borderRadius: 20, padding: 24, marginBottom: 16 },
  earningsLabel: { color: "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: "500" },
  earningsAmount: { color: "#fff", fontSize: 36, fontWeight: "800", marginTop: 4 },
  earningsRow: { flexDirection: "row", marginTop: 20, gap: 16 },
  earningsStat: { flex: 1 },
  earningsStatLabel: { color: "rgba(255,255,255,0.6)", fontSize: 12 },
  earningsStatValue: { color: "#fff", fontSize: 18, fontWeight: "700", marginTop: 2 },
  earningsChange: { fontSize: 12, fontWeight: "600", marginTop: 2 },
  earningsDivider: { width: 1, marginVertical: 4 },

  // Balance Cards
  balanceRow: { flexDirection: "row", gap: 12 },
  balanceCard: { flex: 1, borderRadius: 16, borderWidth: 1, padding: 16, alignItems: "center" },
  balanceIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  balanceLabel: { fontSize: 12, fontWeight: "500" },
  balanceAmount: { fontSize: 20, fontWeight: "800", marginTop: 4 },

  // Actions
  actionsRow: { flexDirection: "row", gap: 12 },
  actionCard: { flex: 1, borderRadius: 16, borderWidth: 1, padding: 16, alignItems: "center" },
  actionIcon: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  actionLabel: { fontSize: 14, fontWeight: "600" },
  actionDesc: { fontSize: 11, marginTop: 2 },

  // Empty State
  emptyCard: { borderRadius: 16, borderWidth: 1, padding: 32, alignItems: "center", gap: 8 },
  emptyText: { fontSize: 16, fontWeight: "600" },
  emptyDesc: { fontSize: 13, textAlign: "center" },

  // Payment Items
  paymentItem: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 8 },
  paymentIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  paymentTitle: { fontSize: 15, fontWeight: "600" },
  paymentDate: { fontSize: 12, marginTop: 2 },
  paymentAmount: { fontSize: 16, fontWeight: "700" },
  paymentStatus: { fontSize: 11, fontWeight: "600", marginTop: 2 },

  // View All
  viewAllBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, marginTop: 8 },
  viewAllText: { fontSize: 14, fontWeight: "600" },

  // Tax
  taxCard: { borderRadius: 16, borderWidth: 1, padding: 16 },
  taxHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  taxTitle: { fontSize: 16, fontWeight: "700" },
  taxDesc: { fontSize: 13, lineHeight: 18 },
  taxBtn: { marginTop: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, alignItems: "center" },
  taxBtnText: { fontSize: 14, fontWeight: "600" },
});
