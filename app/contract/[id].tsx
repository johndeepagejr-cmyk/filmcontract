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
import { SignatureCapture } from "@/components/signature-capture";
import { Image } from "expo-image";
import { ContractNotes } from "@/components/contract-notes";
import { ContractAttachments } from "@/components/contract-attachments";

export default function ContractDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const contractId = parseInt(id || "0", 10);
  const { user } = useAuth();

  const { data: contract, isLoading: contractLoading } = trpc.contracts.getById.useQuery(
    { id: contractId },
    { enabled: !!contractId }
  );

  // State hooks must be called before any conditional returns
  const [exportingPDF, setExportingPDF] = useState(false);
  const [showSignature, setShowSignature] = useState(false);
  const signMutation = trpc.contracts.signContract.useMutation();
  const updateStatusMutation = trpc.contracts.updateStatus.useMutation();
  const utils = trpc.useUtils();

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

  const isProducer = contract.producerId === user?.id;
  const isActor = contract.actorId === user?.id;
  const totalAmount = contract.paymentAmount ? parseFloat(contract.paymentAmount.toString()) : 0;
  const paidAmount = contract.paidAmount ? parseFloat(contract.paidAmount.toString()) : 0;
  const remainingAmount = totalAmount - paidAmount;
  const isFullyPaid = contract.paymentStatus === "paid" || remainingAmount <= 0;

  const handleAcceptContract = async () => {
    try {
      await updateStatusMutation.mutateAsync({
        id: contract.id,
        status: "active",
      });
      utils.contracts.getById.invalidate({ id: contract.id });
      utils.contracts.list.invalidate();
      if (Platform.OS === "web") {
        alert("Contract accepted!");
      } else {
        Alert.alert("Success", "Contract accepted!");
      }
    } catch (error) {
      console.error("Accept error:", error);
      if (Platform.OS === "web") {
        alert("Failed to accept contract");
      } else {
        Alert.alert("Error", "Failed to accept contract");
      }
    }
  };

  const handleDeclineContract = async () => {
    if (Platform.OS === "web") {
      if (!confirm("Are you sure you want to decline this contract?")) return;
    } else {
      Alert.alert(
        "Decline Contract",
        "Are you sure you want to decline this contract?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Decline",
            style: "destructive",
            onPress: async () => {
              try {
                await updateStatusMutation.mutateAsync({
                  id: contract.id,
                  status: "cancelled",
                });
                utils.contracts.getById.invalidate({ id: contract.id });
                utils.contracts.list.invalidate();
                Alert.alert("Success", "Contract declined");
              } catch (error) {
                console.error("Decline error:", error);
                Alert.alert("Error", "Failed to decline contract");
              }
            },
          },
        ]
      );
      return;
    }

    try {
      await updateStatusMutation.mutateAsync({
        id: contract.id,
        status: "cancelled",
      });
      utils.contracts.getById.invalidate({ id: contract.id });
      utils.contracts.list.invalidate();
      alert("Contract declined");
    } catch (error) {
      console.error("Decline error:", error);
      alert("Failed to decline contract");
    }
  };

  const handleSign = async (signature: string) => {
    try {
      await signMutation.mutateAsync({
        contractId: contract.id,
        signature,
        role: isProducer ? "producer" : "actor",
      });
      utils.contracts.getById.invalidate({ id: contract.id });
      if (Platform.OS === "web") {
        alert("Contract signed successfully!");
      } else {
        Alert.alert("Success", "Contract signed successfully!");
      }
    } catch (error) {
      console.error("Sign error:", error);
      if (Platform.OS === "web") {
        alert("Failed to sign contract. Please try again.");
      } else {
        Alert.alert("Error", "Failed to sign contract. Please try again.");
      }
    }
  };

  async function handleExportPDF() {
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

          {/* Signatures Section */}
          <View className="bg-surface rounded-xl p-4 gap-4">
            <Text className="text-lg font-bold text-foreground">Signatures</Text>

            {/* Producer Signature */}
            <View>
              <Text className="text-sm font-semibold text-muted mb-2">Producer Signature</Text>
              {contract.producerSignature ? (
                <View>
                  <Image
                    source={{ uri: contract.producerSignature }}
                    style={{ width: "100%", height: 120, backgroundColor: "#fff", borderRadius: 8 }}
                    contentFit="contain"
                  />
                  <Text className="text-xs text-muted mt-1">
                    Signed on {contract.producerSignedAt ? new Date(contract.producerSignedAt).toLocaleDateString() : "Unknown"}
                  </Text>
                </View>
              ) : (
                <View className="bg-white border border-dashed border-border rounded-lg p-6 items-center">
                  <Text className="text-sm text-muted">Not signed yet</Text>
                  {isProducer && (
                    <TouchableOpacity
                      onPress={() => setShowSignature(true)}
                      className="bg-primary px-4 py-2 rounded-lg mt-3 active:opacity-80"
                    >
                      <Text className="text-white font-semibold">Sign as Producer</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>

            {/* Actor Signature */}
            <View>
              <Text className="text-sm font-semibold text-muted mb-2">Actor Signature</Text>
              {contract.actorSignature ? (
                <View>
                  <Image
                    source={{ uri: contract.actorSignature }}
                    style={{ width: "100%", height: 120, backgroundColor: "#fff", borderRadius: 8 }}
                    contentFit="contain"
                  />
                  <Text className="text-xs text-muted mt-1">
                    Signed on {contract.actorSignedAt ? new Date(contract.actorSignedAt).toLocaleDateString() : "Unknown"}
                  </Text>
                </View>
              ) : (
                <View className="bg-white border border-dashed border-border rounded-lg p-6 items-center">
                  <Text className="text-sm text-muted">Not signed yet</Text>
                  {isActor && (
                    <TouchableOpacity
                      onPress={() => setShowSignature(true)}
                      className="bg-primary px-4 py-2 rounded-lg mt-3 active:opacity-80"
                    >
                      <Text className="text-white font-semibold">Sign as Actor</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          </View>

          {/* Contract Attachments */}
          <ContractAttachments contractId={contractId} />

          {/* Contract Notes/Discussion */}
          <ContractNotes contractId={contractId} />

          {/* Contract Timeline */}
          <ContractTimeline contractId={contractId} />

          {/* Approval Buttons (Actors Only for Pending Contracts) */}
          {isActor && contract.status === "pending" && (
            <View className="gap-3">
              <Text className="text-lg font-bold text-foreground">Contract Approval</Text>
              <Text className="text-sm text-muted">Review the contract details and choose to accept or decline.</Text>
              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={handleAcceptContract}
                  disabled={updateStatusMutation.isPending}
                  className="flex-1 bg-success px-6 py-4 rounded-xl items-center active:opacity-80"
                  style={{ opacity: updateStatusMutation.isPending ? 0.6 : 1 }}
                >
                  {updateStatusMutation.isPending ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text className="text-white text-lg font-semibold">✓ Accept</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleDeclineContract}
                  disabled={updateStatusMutation.isPending}
                  className="flex-1 bg-error px-6 py-4 rounded-xl items-center active:opacity-80"
                  style={{ opacity: updateStatusMutation.isPending ? 0.6 : 1 }}
                >
                  {updateStatusMutation.isPending ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text className="text-white text-lg font-semibold">✗ Decline</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* View Version History Button */}
          <TouchableOpacity
            onPress={() => router.push(`/contract/versions/${contractId}`)}
            className="bg-surface border border-border px-6 py-4 rounded-xl items-center active:opacity-80 mt-4"
          >
            <Text className="text-foreground text-lg font-semibold">📋 View Version History</Text>
          </TouchableOpacity>

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

          {/* Review Producer Button (Actors Only for Completed Contracts) */}
          {isActor && contract.status === "completed" && (
            <TouchableOpacity
              onPress={() => router.push(`/review/${contractId}`)}
              className="bg-primary px-6 py-4 rounded-xl items-center active:opacity-80 mt-4"
            >
              <Text className="text-white text-lg font-semibold">⭐ Review Producer</Text>
            </TouchableOpacity>
          )}

          {/* Renew Contract Button (Producers Only for Completed Contracts) */}
          {isProducer && contract.status === "completed" && (
            <TouchableOpacity
              onPress={() => router.push(`/contract/renew/${contractId}`)}
              className="bg-primary px-6 py-4 rounded-xl items-center active:opacity-80 mt-4"
            >
              <Text className="text-white text-lg font-semibold">🔄 Renew Contract</Text>
            </TouchableOpacity>
          )}

          {/* Edit Button (Producers Only) */}
          {isProducer && !contract.producerSignature && !contract.actorSignature && (
            <TouchableOpacity
              onPress={() => router.push(`/contract/edit/${contract.id}`)}
              className="bg-primary px-6 py-4 rounded-xl items-center active:opacity-80"
            >
              <Text className="text-white text-lg font-semibold">Edit Contract</Text>
            </TouchableOpacity>
          )}

          {(contract.producerSignature || contract.actorSignature) && (
            <View className="bg-warning/10 border border-warning rounded-lg p-3">
              <Text className="text-sm text-muted">
                ⚠️ This contract has been signed and can no longer be edited.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Signature Capture Modal */}
      <SignatureCapture
        visible={showSignature}
        onClose={() => setShowSignature(false)}
        onSave={handleSign}
        title={isProducer ? "Sign as Producer" : "Sign as Actor"}
      />
    </ScreenContainer>
  );
}
