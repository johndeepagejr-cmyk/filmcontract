import {
  ScrollView,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { useLocalSearchParams, Stack, router } from "expo-router";
import { useState, useEffect } from "react";

export default function RenewContractScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const originalContractId = parseInt(id || "0", 10);
  const { user } = useAuth();

  const { data: originalContract, isLoading } = trpc.contracts.getById.useQuery(
    { id: originalContractId },
    { enabled: !!originalContractId }
  );

  const [projectTitle, setProjectTitle] = useState("");
  const [actorId, setActorId] = useState<number | null>(null);
  const [paymentTerms, setPaymentTerms] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [deliverables, setDeliverables] = useState("");

  const createMutation = trpc.contracts.create.useMutation();

  // Pre-fill form with original contract data
  useEffect(() => {
    if (originalContract) {
      setProjectTitle(originalContract.projectTitle + " (Renewal)");
      setActorId(originalContract.actorId);
      setPaymentTerms(originalContract.paymentTerms || "");
      setPaymentAmount(originalContract.paymentAmount?.toString() || "");
      setDeliverables(originalContract.deliverables || "");
      
      // Set new dates (extend by same duration)
      if (originalContract.startDate && originalContract.endDate) {
        const originalStart = new Date(originalContract.startDate);
        const originalEnd = new Date(originalContract.endDate);
        const duration = originalEnd.getTime() - originalStart.getTime();
        
        const newStart = new Date();
        const newEnd = new Date(newStart.getTime() + duration);
        
        setStartDate(newStart.toISOString().split("T")[0]);
        setEndDate(newEnd.toISOString().split("T")[0]);
      }
    }
  }, [originalContract]);

  const handleRenewContract = async () => {
    if (!projectTitle.trim() || !actorId || !paymentTerms.trim()) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    try {
      const result = await createMutation.mutateAsync({
        projectTitle: projectTitle.trim(),
        actorId,
        paymentTerms: paymentTerms.trim(),
        paymentAmount: paymentAmount || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        deliverables: deliverables || undefined,
        status: "pending",
      });

      Alert.alert("Success", "Contract renewed successfully!", [
        {
          text: "View Contract",
          onPress: () => router.replace(`/contract/${result.id}`),
        },
      ]);
    } catch (error) {
      console.error("Error renewing contract:", error);
      Alert.alert("Error", "Failed to renew contract. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color="#1E40AF" />
      </ScreenContainer>
    );
  }

  if (!originalContract) {
    return (
      <ScreenContainer className="items-center justify-center">
        <Text className="text-base text-muted">Contract not found</Text>
      </ScreenContainer>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: "Renew Contract" }} />
      <ScreenContainer className="p-6">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View className="gap-6">
            {/* Header */}
            <View className="gap-2">
              <Text className="text-2xl font-bold text-foreground">Renew Contract</Text>
              <Text className="text-base text-muted">
                Creating a new contract based on: {originalContract.projectTitle}
              </Text>
            </View>

            {/* Form Fields */}
            <View className="gap-4">
              {/* Project Title */}
              <View className="gap-2">
                <Text className="text-sm font-semibold text-foreground">
                  Project Title <Text className="text-error">*</Text>
                </Text>
                <TextInput
                  value={projectTitle}
                  onChangeText={setProjectTitle}
                  placeholder="Enter project title"
                  placeholderTextColor="#9BA1A6"
                  className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground text-base"
                />
              </View>

              {/* Actor (Read-only) */}
              <View className="gap-2">
                <Text className="text-sm font-semibold text-foreground">
                  Actor <Text className="text-error">*</Text>
                </Text>
                <View className="bg-surface border border-border rounded-xl px-4 py-3">
                  <Text className="text-foreground text-base">
                    {originalContract.actor?.name || "Unknown Actor"}
                  </Text>
                </View>
              </View>

              {/* Payment Terms */}
              <View className="gap-2">
                <Text className="text-sm font-semibold text-foreground">
                  Payment Terms <Text className="text-error">*</Text>
                </Text>
                <TextInput
                  value={paymentTerms}
                  onChangeText={setPaymentTerms}
                  placeholder="e.g., 50% upfront, 50% on completion"
                  placeholderTextColor="#9BA1A6"
                  multiline
                  numberOfLines={3}
                  className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground text-base"
                  style={{ textAlignVertical: "top" }}
                />
              </View>

              {/* Payment Amount */}
              <View className="gap-2">
                <Text className="text-sm font-semibold text-foreground">Payment Amount</Text>
                <TextInput
                  value={paymentAmount}
                  onChangeText={setPaymentAmount}
                  placeholder="e.g., 50000"
                  placeholderTextColor="#9BA1A6"
                  keyboardType="numeric"
                  className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground text-base"
                />
              </View>

              {/* Start Date */}
              <View className="gap-2">
                <Text className="text-sm font-semibold text-foreground">Start Date</Text>
                <TextInput
                  value={startDate}
                  onChangeText={setStartDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#9BA1A6"
                  className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground text-base"
                />
              </View>

              {/* End Date */}
              <View className="gap-2">
                <Text className="text-sm font-semibold text-foreground">End Date</Text>
                <TextInput
                  value={endDate}
                  onChangeText={setEndDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#9BA1A6"
                  className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground text-base"
                />
              </View>

              {/* Deliverables */}
              <View className="gap-2">
                <Text className="text-sm font-semibold text-foreground">Deliverables</Text>
                <TextInput
                  value={deliverables}
                  onChangeText={setDeliverables}
                  placeholder="List the expected deliverables"
                  placeholderTextColor="#9BA1A6"
                  multiline
                  numberOfLines={4}
                  className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground text-base"
                  style={{ textAlignVertical: "top" }}
                />
              </View>
            </View>

            {/* Action Buttons */}
            <View className="gap-3 pb-8">
              <TouchableOpacity
                onPress={handleRenewContract}
                disabled={createMutation.isPending}
                className="bg-primary px-6 py-4 rounded-xl items-center active:opacity-80"
                style={{ opacity: createMutation.isPending ? 0.5 : 1 }}
              >
                {createMutation.isPending ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="text-white text-base font-semibold">Create Renewal Contract</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.back()}
                className="bg-surface border border-border px-6 py-4 rounded-xl items-center active:opacity-70"
              >
                <Text className="text-foreground text-base font-semibold">Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </ScreenContainer>
    </>
  );
}
