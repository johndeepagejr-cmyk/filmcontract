import { useState } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { Stack, useLocalSearchParams, router } from "expo-router";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { Card, SectionHeader, Divider, Button } from "@/components/ui/design-system";
import { Typography, Spacing, Radius } from "@/constants/design-tokens";
import { NegotiationThread } from "@/components/contract/NegotiationThread";
import { SignatureCapture } from "@/components/contract/SignatureCapture";
import { ContractTimeline } from "@/components/contract/ContractTimeline";
import * as Haptics from "expo-haptics";

type Tab = "details" | "negotiate" | "timeline";

export default function ContractDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const contractId = parseInt(id || "0", 10);
  const colors = useColors();
  const accent = (colors as any).accent || "#C9963B";
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("details");

  const { data: contract, isLoading, refetch } = trpc.contracts.getById.useQuery(
    { id: contractId },
    { enabled: !!contractId }
  );

  const updateStatusMutation = trpc.contracts.updateStatus.useMutation({
    onSuccess: () => refetch(),
  });

  const [updatingStatus, setUpdatingStatus] = useState(false);

  const handleStatusUpdate = async (newStatus: string) => {
    setUpdatingStatus(true);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await updateStatusMutation.mutateAsync({ id: contractId, status: newStatus as any });
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const msg = `Contract status updated to ${newStatus}.`;
      Platform.OS === "web" ? alert(msg) : Alert.alert("Updated", msg);
    } catch (error) {
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const errorMsg = error instanceof Error ? error.message : "Failed to update status.";
      Platform.OS === "web" ? alert(errorMsg) : Alert.alert("Error", errorMsg);
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (isLoading) {
    return (
      <ScreenContainer>
        <Stack.Screen options={{ title: "Contract Details" }} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={accent} />
        </View>
      </ScreenContainer>
    );
  }

  if (!contract) {
    return (
      <ScreenContainer>
        <Stack.Screen options={{ title: "Contract Not Found" }} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: Spacing.lg }}>
          <Text style={{ fontSize: 48 }}>📄</Text>
          <Text style={[Typography.h2, { color: colors.foreground, marginTop: 12 }]}>Contract Not Found</Text>
          <Text style={[Typography.bodySm, { color: colors.muted, marginTop: 4 }]}>This contract may have been deleted.</Text>
          <Button title="Go Back" onPress={() => router.back()} variant="primary" style={{ marginTop: 24 }} />
        </View>
      </ScreenContainer>
    );
  }

  const isProducer = user?.id === contract.producerId;
  const isActor = user?.id === contract.actorId;
  const userRole = isProducer ? "producer" : "actor";

  const statusConfig: Record<string, { color: string; label: string }> = {
    active: { color: colors.success, label: "Active" },
    pending: { color: colors.warning, label: "Pending" },
    completed: { color: colors.primary, label: "Completed" },
    cancelled: { color: colors.error, label: "Cancelled" },
    draft: { color: colors.muted, label: "Draft" },
  };
  const status = statusConfig[contract.status] || statusConfig.draft;

  const TABS: { key: Tab; label: string; icon: string }[] = [
    { key: "details", label: "Details", icon: "📋" },
    { key: "negotiate", label: "Discuss", icon: "💬" },
    { key: "timeline", label: "Timeline", icon: "📅" },
  ];

  return (
    <ScreenContainer>
      <Stack.Screen
        options={{
          title: contract.projectTitle || "Contract",
          headerShown: true,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.foreground,
        }}
      />

      {/* Tab Bar */}
      <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => {
              setActiveTab(tab.key);
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            activeOpacity={0.7}
            style={[styles.tab, activeTab === tab.key && { borderBottomColor: accent, borderBottomWidth: 2 }]}
          >
            <Text style={{ fontSize: 14 }}>{tab.icon}</Text>
            <Text style={[Typography.labelSm, { color: activeTab === tab.key ? accent : colors.muted }]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === "details" && (
        <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 120, gap: Spacing.lg }}>
          {/* Status + Payment Badge */}
          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
            <View style={[styles.badge, { backgroundColor: status.color + "15", borderColor: status.color + "30" }]}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: status.color }} />
              <Text style={[Typography.labelSm, { color: status.color }]}>{status.label}</Text>
            </View>
            {contract.paymentStatus && (
              <View style={[styles.badge, {
                backgroundColor: contract.paymentStatus === "paid" ? colors.success + "15" : colors.warning + "15",
                borderColor: contract.paymentStatus === "paid" ? colors.success + "30" : colors.warning + "30",
              }]}>
                <Text style={[Typography.labelSm, {
                  color: contract.paymentStatus === "paid" ? colors.success : colors.warning,
                }]}>
                  {contract.paymentStatus === "paid" ? "Paid" : contract.paymentStatus === "partial" ? "Partially Paid" : "Unpaid"}
                </Text>
              </View>
            )}
          </View>

          {/* Parties Card */}
          <Card>
            <SectionHeader title="Parties" />
            <View style={{ gap: 12, marginTop: 8 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View style={{ gap: 2 }}>
                  <Text style={[Typography.caption, { color: colors.muted }]}>Producer</Text>
                  <Text style={[Typography.labelMd, { color: colors.foreground }]}>
                    {(contract as any).producer?.name || (contract as any).producerName || "Unknown"}
                  </Text>
                </View>
                {(contract as any).producerSignature && (
                  <View style={[styles.signedBadge, { backgroundColor: colors.success + "15" }]}>
                    <Text style={[Typography.caption, { color: colors.success }]}>Signed ✓</Text>
                  </View>
                )}
              </View>
              <Divider />
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View style={{ gap: 2 }}>
                  <Text style={[Typography.caption, { color: colors.muted }]}>Actor</Text>
                  <Text style={[Typography.labelMd, { color: colors.foreground }]}>
                    {(contract as any).actor?.name || (contract as any).actorName || "Unknown"}
                  </Text>
                </View>
                {(contract as any).actorSignature && (
                  <View style={[styles.signedBadge, { backgroundColor: colors.success + "15" }]}>
                    <Text style={[Typography.caption, { color: colors.success }]}>Signed ✓</Text>
                  </View>
                )}
              </View>
            </View>
          </Card>

          {/* Payment Card */}
          <Card>
            <SectionHeader title="Payment" />
            <View style={{ gap: 12, marginTop: 8 }}>
              {contract.paymentAmount && (
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={[Typography.bodySm, { color: colors.muted }]}>Amount</Text>
                  <Text style={[Typography.displaySm, { color: accent }]}>
                    ${parseFloat(contract.paymentAmount).toLocaleString()}
                  </Text>
                </View>
              )}
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <Text style={[Typography.bodySm, { color: colors.muted }]}>Terms</Text>
                <Text style={[Typography.bodySm, { color: colors.foreground, flex: 1, textAlign: "right", marginLeft: 16 }]} numberOfLines={3}>
                  {contract.paymentTerms}
                </Text>
              </View>
            </View>
          </Card>

          {/* Deliverables */}
          {contract.deliverables && (
            <Card>
              <SectionHeader title="Deliverables" />
              <Text style={[Typography.bodySm, { color: colors.foreground, lineHeight: 22, marginTop: 8 }]}>
                {contract.deliverables}
              </Text>
            </Card>
          )}

          {/* Timeline Dates */}
          <Card>
            <SectionHeader title="Schedule" />
            <View style={{ gap: 10, marginTop: 8 }}>
              {[
                { label: "Start Date", value: contract.startDate },
                { label: "End Date", value: contract.endDate },
                { label: "Created", value: contract.createdAt },
              ].map((item) => (
                <View key={item.label} style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={[Typography.bodySm, { color: colors.muted }]}>{item.label}</Text>
                  <Text style={[Typography.labelSm, { color: colors.foreground }]}>
                    {item.value ? new Date(item.value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Not set"}
                  </Text>
                </View>
              ))}
            </View>
          </Card>

          {/* Signature Section */}
          {(contract.status === "active" || contract.status === "pending") && (isProducer || isActor) && (
            <SignatureCapture
              contractId={contractId}
              signerName={user?.name || ""}
              signerRole={userRole as "producer" | "actor"}
              onSigned={refetch}
            />
          )}

          {/* Action Buttons */}
          <View style={{ gap: 12 }}>
            {isProducer && contract.paymentStatus !== "paid" && contract.paymentAmount && (
              <Button title="Make Payment" onPress={() => router.push(`/payment/${contract.id}` as any)} variant="accent" fullWidth />
            )}
            {isProducer && contract.status === "draft" && (
              <Button title="Send to Actor" onPress={() => handleStatusUpdate("pending")} variant="primary" fullWidth loading={updatingStatus} />
            )}
            {isActor && contract.status === "pending" && (
              <View style={{ flexDirection: "row", gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Button title="Accept" onPress={() => handleStatusUpdate("active")} variant="primary" fullWidth loading={updatingStatus} />
                </View>
                <View style={{ flex: 1 }}>
                  <Button title="Decline" onPress={() => handleStatusUpdate("cancelled")} variant="outline" fullWidth loading={updatingStatus} />
                </View>
              </View>
            )}
            {isProducer && contract.status === "active" && (
              <Button title="Mark as Completed" onPress={() => handleStatusUpdate("completed")} variant="accent" fullWidth loading={updatingStatus} />
            )}
          </View>
        </ScrollView>
      )}

      {activeTab === "negotiate" && (
        <NegotiationThread
          contractId={contractId}
          currentUserId={user?.id || 0}
        />
      )}

      {activeTab === "timeline" && (
        <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 60 }}>
          <ContractTimeline contractId={contractId} />
        </ScrollView>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
    paddingHorizontal: Spacing.md,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  signedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
});
