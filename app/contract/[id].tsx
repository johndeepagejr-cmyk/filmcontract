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
        <TouchableOpacity onPress={() => router.back()} className="mt-6 bg-primary px-6 py-3 rounded-full active:opacity-80">
          <Text className="text-white font-semibold">Go Back</Text>
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
                className="bg-primary px-6 py-4 rounded-xl items-center active:opacity-80"
              >
                <Text className="text-white text-base font-semibold">Make Payment</Text>
              </TouchableOpacity>
            )}

            {/* Status update buttons */}
            {isProducer && contract.status === "draft" && (
              <TouchableOpacity
                onPress={() => handleStatusUpdate("pending")}
                disabled={updatingStatus}
                className="bg-warning px-6 py-4 rounded-xl items-center active:opacity-80"
                style={{ opacity: updatingStatus ? 0.6 : 1 }}
              >
                {updatingStatus ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text className="text-white text-base font-semibold">Send to Actor</Text>
                )}
              </TouchableOpacity>
            )}

            {isActor && contract.status === "pending" && (
              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => handleStatusUpdate("active")}
                  disabled={updatingStatus}
                  className="flex-1 bg-success px-4 py-4 rounded-xl items-center active:opacity-80"
                  style={{ opacity: updatingStatus ? 0.6 : 1 }}
                >
                  <Text className="text-white text-base font-semibold">Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleStatusUpdate("cancelled")}
                  disabled={updatingStatus}
                  className="flex-1 bg-error px-4 py-4 rounded-xl items-center active:opacity-80"
                  style={{ opacity: updatingStatus ? 0.6 : 1 }}
                >
                  <Text className="text-white text-base font-semibold">Decline</Text>
                </TouchableOpacity>
              </View>
            )}

            {isProducer && contract.status === "active" && (
              <TouchableOpacity
                onPress={() => handleStatusUpdate("completed")}
                disabled={updatingStatus}
                className="bg-primary px-6 py-4 rounded-xl items-center active:opacity-80"
                style={{ opacity: updatingStatus ? 0.6 : 1 }}
              >
                {updatingStatus ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text className="text-white text-base font-semibold">Mark as Completed</Text>
                )}
              </TouchableOpacity>
            )}

            {/* Review buttons */}
            {contract.status === "completed" && isProducer && (
              <TouchableOpacity
                onPress={() => router.push(`/review-actor/${contract.id}` as any)}
                className="bg-surface px-6 py-4 rounded-xl items-center border border-border active:opacity-80"
              >
                <Text className="text-foreground text-base font-semibold">Review Actor</Text>
              </TouchableOpacity>
            )}

            {contract.status === "completed" && isActor && (
              <TouchableOpacity
                onPress={() => router.push(`/review/${contract.id}` as any)}
                className="bg-surface px-6 py-4 rounded-xl items-center border border-border active:opacity-80"
              >
                <Text className="text-foreground text-base font-semibold">Review Producer</Text>
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
});
