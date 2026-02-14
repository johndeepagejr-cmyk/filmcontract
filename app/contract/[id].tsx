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

export default function ContractDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const contractId = parseInt(id || "0", 10);
  const colors = useColors();
  const { user } = useAuth();

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
    try {
      await updateStatusMutation.mutateAsync({
        id: contractId,
        status: newStatus as any,
      });
      const msg = `Contract status updated to ${newStatus}.`;
      Platform.OS === "web" ? alert(msg) : Alert.alert("Updated", msg);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to update status.";
      Platform.OS === "web" ? alert(errorMsg) : Alert.alert("Error", errorMsg);
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (isLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <Stack.Screen options={{ title: "Contract Details" }} />
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  if (!contract) {
    return (
      <ScreenContainer className="p-6 items-center justify-center">
        <Stack.Screen options={{ title: "Contract Not Found" }} />
        <Text className="text-4xl mb-4">📄</Text>
        <Text className="text-lg font-semibold text-foreground">Contract Not Found</Text>
        <Text className="text-sm text-muted mt-2">This contract may have been deleted.</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.goBackBtn}
        >
          <Text style={styles.goBackText}>Go Back</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  const isProducer = user?.id === contract.producerId;
  const isActor = user?.id === contract.actorId;

  const statusColor =
    contract.status === "active"
      ? colors.success
      : contract.status === "pending"
      ? colors.warning
      : contract.status === "completed"
      ? colors.primary
      : contract.status === "cancelled"
      ? colors.error
      : colors.muted;

  return (
    <ScreenContainer>
      <Stack.Screen
        options={{
          title: contract.projectTitle || "Contract Details",
          headerShown: true,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.foreground,
        }}
      />
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 20, paddingBottom: 60 }}>
        <View className="gap-5">
          {/* Status Badge */}
          <View className="flex-row items-center gap-3">
            <View style={[styles.statusBadge, { backgroundColor: statusColor + "20" }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
              </Text>
            </View>
            {contract.paymentStatus && (
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      contract.paymentStatus === "paid"
                        ? colors.success + "20"
                        : contract.paymentStatus === "partial"
                        ? colors.warning + "20"
                        : colors.muted + "20",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    {
                      color:
                        contract.paymentStatus === "paid"
                          ? colors.success
                          : contract.paymentStatus === "partial"
                          ? colors.warning
                          : colors.muted,
                    },
                  ]}
                >
                  {contract.paymentStatus === "paid"
                    ? "Paid"
                    : contract.paymentStatus === "partial"
                    ? "Partially Paid"
                    : "Unpaid"}
                </Text>
              </View>
            )}
          </View>

          {/* Project Title */}
          <View className="gap-1">
            <Text className="text-2xl font-bold text-foreground">{contract.projectTitle}</Text>
          </View>

          {/* Parties */}
          <View className="bg-surface rounded-xl p-4 border border-border gap-3">
            <Text className="text-sm font-semibold text-muted uppercase">Parties</Text>
            <View className="gap-2">
              <View className="flex-row justify-between items-center">
                <Text className="text-sm text-muted">Producer</Text>
                <Text className="text-base font-semibold text-foreground">
                  {contract.producer?.name || "Unknown"}
                </Text>
              </View>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View className="flex-row justify-between items-center">
                <Text className="text-sm text-muted">Actor</Text>
                <Text className="text-base font-semibold text-foreground">
                  {contract.actor?.name || "Unknown"}
                </Text>
              </View>
            </View>
          </View>

          {/* Payment Details */}
          <View className="bg-surface rounded-xl p-4 border border-border gap-3">
            <Text className="text-sm font-semibold text-muted uppercase">Payment</Text>
            {contract.paymentAmount && (
              <View className="flex-row justify-between items-center">
                <Text className="text-sm text-muted">Amount</Text>
                <Text className="text-2xl font-bold text-foreground">
                  ${parseFloat(contract.paymentAmount).toLocaleString()}
                </Text>
              </View>
            )}
            <View className="flex-row justify-between items-center">
              <Text className="text-sm text-muted">Terms</Text>
              <Text className="text-sm text-foreground flex-1 text-right ml-4" numberOfLines={3}>
                {contract.paymentTerms}
              </Text>
            </View>
          </View>

          {/* Deliverables */}
          {contract.deliverables && (
            <View className="bg-surface rounded-xl p-4 border border-border gap-2">
              <Text className="text-sm font-semibold text-muted uppercase">Deliverables</Text>
              <Text className="text-base text-foreground leading-6">{contract.deliverables}</Text>
            </View>
          )}

          {/* Dates */}
          <View className="bg-surface rounded-xl p-4 border border-border gap-3">
            <Text className="text-sm font-semibold text-muted uppercase">Timeline</Text>
            <View className="flex-row justify-between items-center">
              <Text className="text-sm text-muted">Start Date</Text>
              <Text className="text-sm text-foreground">
                {contract.startDate ? new Date(contract.startDate).toLocaleDateString() : "Not set"}
              </Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text className="text-sm text-muted">End Date</Text>
              <Text className="text-sm text-foreground">
                {contract.endDate ? new Date(contract.endDate).toLocaleDateString() : "Not set"}
              </Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text className="text-sm text-muted">Created</Text>
              <Text className="text-sm text-foreground">
                {contract.createdAt ? new Date(contract.createdAt).toLocaleDateString() : "Unknown"}
              </Text>
            </View>
          </View>

          {/* Actions */}
          <View className="gap-3 mt-2">
            {/* Payment button for producers */}
            {isProducer && contract.paymentStatus !== "paid" && contract.paymentAmount && (
              <TouchableOpacity
                onPress={() => router.push(`/payment/${contract.id}` as any)}
                style={[styles.actionBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.actionBtnText}>Make Payment</Text>
              </TouchableOpacity>
            )}

            {/* Status update buttons */}
            {isProducer && contract.status === "draft" && (
              <TouchableOpacity
                onPress={() => handleStatusUpdate("pending")}
                disabled={updatingStatus}
                style={[styles.actionBtn, { backgroundColor: colors.warning, opacity: updatingStatus ? 0.6 : 1 }]}
              >
                {updatingStatus ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.actionBtnText}>Send to Actor</Text>
                )}
              </TouchableOpacity>
            )}

            {isActor && contract.status === "pending" && (
              <View style={styles.rowBtns}>
                <TouchableOpacity
                  onPress={() => handleStatusUpdate("active")}
                  disabled={updatingStatus}
                  style={[styles.actionBtn, styles.flexBtn, { backgroundColor: colors.success, opacity: updatingStatus ? 0.6 : 1 }]}
                >
                  <Text style={styles.actionBtnText}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleStatusUpdate("cancelled")}
                  disabled={updatingStatus}
                  style={[styles.actionBtn, styles.flexBtn, { backgroundColor: colors.error, opacity: updatingStatus ? 0.6 : 1 }]}
                >
                  <Text style={styles.actionBtnText}>Decline</Text>
                </TouchableOpacity>
              </View>
            )}

            {isProducer && contract.status === "active" && (
              <TouchableOpacity
                onPress={() => handleStatusUpdate("completed")}
                disabled={updatingStatus}
                style={[styles.actionBtn, { backgroundColor: colors.primary, opacity: updatingStatus ? 0.6 : 1 }]}
              >
                {updatingStatus ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.actionBtnText}>Mark as Completed</Text>
                )}
              </TouchableOpacity>
            )}

            {/* Review buttons */}
            {contract.status === "completed" && isProducer && (
              <TouchableOpacity
                onPress={() => router.push(`/review-actor/${contract.id}` as any)}
                style={[styles.actionBtn, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}
              >
                <Text style={[styles.actionBtnText, { color: colors.foreground }]}>Review Actor</Text>
              </TouchableOpacity>
            )}

            {contract.status === "completed" && isActor && (
              <TouchableOpacity
                onPress={() => router.push(`/review/${contract.id}` as any)}
                style={[styles.actionBtn, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}
              >
                <Text style={[styles.actionBtnText, { color: colors.foreground }]}>Review Producer</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "600",
  },
  divider: {
    height: 0.5,
    width: "100%",
  },
  goBackBtn: {
    marginTop: 24,
    backgroundColor: "#0a7ea4",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
  },
  goBackText: {
    color: "#fff",
    fontWeight: "600",
  },
  actionBtn: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center" as const,
  },
  actionBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  rowBtns: {
    flexDirection: "row" as const,
    gap: 12,
  },
  flexBtn: {
    flex: 1,
  },
});
