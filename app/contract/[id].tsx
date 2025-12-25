import {
  ScrollView,
  Text,
  View,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { useLocalSearchParams, Stack, router } from "expo-router";
import { generateContractPDF } from "@/lib/pdf-generator";
import { useState } from "react";
import { ContractTimeline } from "@/components/contract-timeline";

export default function ContractDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const contractId = parseInt(id || "0", 10);
  const { user } = useAuth();

  const { data: contract, isLoading: contractLoading } = trpc.contracts.getById.useQuery(
    { id: contractId },
    { enabled: !!contractId }
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-success";
      case "pending":
        return "bg-warning";
      case "completed":
        return "bg-primary";
      case "draft":
        return "bg-muted";
      case "cancelled":
        return "bg-error";
      default:
        return "bg-muted";
    }
  };

  const formatDate = (date: string | Date | null) => {
    if (!date) return "Not specified";
    return new Date(date).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  if (contractLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <Stack.Screen options={{ title: "Contract Details" }} />
        <ActivityIndicator size="large" color="#1E40AF" />
      </ScreenContainer>
    );
  }

  if (!contract) {
    return (
      <ScreenContainer className="p-6">
        <Stack.Screen options={{ title: "Contract Not Found" }} />
        <Text className="text-lg text-muted text-center">Contract not found</Text>
      </ScreenContainer>
    );
  }

  const [exportingPDF, setExportingPDF] = useState(false);

  const isProducer = contract.producerId === user?.id;
  const isActor = contract.actorId === user?.id;
  const totalAmount = contract.paymentAmount ? parseFloat(contract.paymentAmount.toString()) : 0;
  const paidAmount = contract.paidAmount ? parseFloat(contract.paidAmount.toString()) : 0;
  const remainingAmount = totalAmount - paidAmount;
  const isFullyPaid = contract.paymentStatus === "paid" || remainingAmount <= 0;

  const handleExportPDF = async () => {
    if (!contract) return;
    try {
      setExportingPDF(true);
      await generateContractPDF({
        ...contract,
        producerName: (contract as any).producerName || "Unknown Producer",
        actorName: (contract as any).actorName || "Unknown Actor",
      });
      if (Platform.OS !== "web") {
        Alert.alert("Success", "Contract PDF exported successfully!");
      }
    } catch (error) {
      console.error("PDF export error:", error);
      if (Platform.OS === "web") {
        alert("Failed to export PDF. Please try again.");
      } else {
        Alert.alert("Error", "Failed to export PDF. Please try again.");
      }
    } finally {
      setExportingPDF(false);
    }
  };

  return (
    <ScreenContainer className="p-6">
      <Stack.Screen options={{ title: contract.projectTitle }} />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 gap-6">
          {/* Status Badge */}
          <View className="flex-row items-center justify-between">
            <View className={`${getStatusColor(contract.status)} px-4 py-2 rounded-full`}>
              <Text className="text-sm font-semibold text-white capitalize">
                {contract.status}
              </Text>
            </View>
            <Text className="text-sm text-muted">{formatDate(contract.createdAt)}</Text>
          </View>

          {/* Project Title */}
          <View className="gap-2">
            <Text className="text-sm font-medium text-muted">Project</Text>
            <Text className="text-2xl font-bold text-foreground">{contract.projectTitle}</Text>
          </View>

          {/* Parties */}
          <View className="bg-surface rounded-xl p-4 gap-4">
            <View className="gap-1">
              <Text className="text-sm font-medium text-muted">Producer</Text>
              <Text className="text-lg font-semibold text-foreground">
                {contract.producer?.name || "Unknown"}
              </Text>
              <Text className="text-sm text-muted">{contract.producer?.email || ""}</Text>
            </View>

            <View className="h-px bg-border" />

            <View className="gap-1">
              <Text className="text-sm font-medium text-muted">Actor</Text>
              <Text className="text-lg font-semibold text-foreground">
                {contract.actor?.name || "Unknown"}
              </Text>
              <Text className="text-sm text-muted">{contract.actor?.email || ""}</Text>
            </View>
          </View>

          {/* Payment Terms */}
          <View className="gap-2">
            <Text className="text-sm font-medium text-muted">Payment Terms</Text>
            <View className="bg-surface rounded-xl p-4">
              <Text className="text-base text-foreground">{contract.paymentTerms}</Text>
              {contract.paymentAmount && (
                <Text className="text-lg font-bold text-primary mt-2">
                  ${parseFloat(contract.paymentAmount).toLocaleString()}
                </Text>
              )}
            </View>
          </View>

          {/* Dates */}
          <View className="bg-surface rounded-xl p-4 gap-3">
            <View className="flex-row justify-between">
              <Text className="text-sm font-medium text-muted">Start Date</Text>
              <Text className="text-sm text-foreground">{formatDate(contract.startDate)}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-sm font-medium text-muted">End Date</Text>
              <Text className="text-sm text-foreground">{formatDate(contract.endDate)}</Text>
            </View>
          </View>

          {/* Deliverables */}
          {contract.deliverables && (
            <View className="gap-2">
              <Text className="text-sm font-medium text-muted">Deliverables</Text>
              <View className="bg-surface rounded-xl p-4">
                <Text className="text-base text-foreground">{contract.deliverables}</Text>
              </View>
            </View>
          )}

          {/* Payment Status */}
          {contract.paymentAmount && (
            <View className="bg-surface rounded-xl p-4 gap-3">
              <View className="flex-row justify-between items-center">
                <Text className="text-sm font-medium text-muted">Payment Status</Text>
                <View
                  className={`px-3 py-1 rounded-full ${
                    contract.paymentStatus === "paid"
                      ? "bg-success"
                      : contract.paymentStatus === "partial"
                      ? "bg-warning"
                      : "bg-error"
                  }`}
                >
                  <Text className="text-xs font-semibold text-white capitalize">
                    {contract.paymentStatus}
                  </Text>
                </View>
              </View>
              <View className="flex-row justify-between items-center">
                <Text className="text-sm text-muted">Paid Amount</Text>
                <Text className="text-base font-semibold text-foreground">
                  ${paidAmount.toLocaleString()} / ${totalAmount.toLocaleString()}
                </Text>
              </View>
            </View>
          )}

          {/* Pay Now Button (Actors Only) */}
          {isActor && !isFullyPaid && contract.paymentAmount && (
            <TouchableOpacity
              onPress={() => router.push(`/contract/pay/${contract.id}`)}
              className="bg-success px-6 py-4 rounded-xl items-center active:opacity-80 mt-4"
            >
              <Text className="text-white text-lg font-semibold">Pay Now</Text>
            </TouchableOpacity>
          )}

          {/* Contract Timeline */}
          <ContractTimeline contractId={contract.id} />

          {/* Export PDF Button */}
          <TouchableOpacity
            onPress={handleExportPDF}
            disabled={exportingPDF}
            className="bg-surface border border-border px-6 py-4 rounded-xl items-center active:opacity-80 mt-4"
            style={{ opacity: exportingPDF ? 0.6 : 1 }}
          >
            {exportingPDF ? (
              <ActivityIndicator color="#1E40AF" />
            ) : (
              <Text className="text-foreground text-lg font-semibold">📄 Export PDF</Text>
            )}
          </TouchableOpacity>

          {/* Edit Button (Producers Only) */}
          {isProducer && (
            <TouchableOpacity
              onPress={() => router.push(`/contract/edit/${contract.id}`)}
              className="bg-primary px-6 py-4 rounded-xl items-center active:opacity-80"
            >
              <Text className="text-white text-lg font-semibold">Edit Contract</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
