import {
  ScrollView,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { router, useLocalSearchParams, Stack } from "expo-router";

export default function EditContractScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const contractId = parseInt(id || "0", 10);
  const { user } = useAuth();

  const [projectTitle, setProjectTitle] = useState("");
  const [actorId, setActorId] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [deliverables, setDeliverables] = useState("");

  const { data: contract, isLoading: contractLoading } = trpc.contracts.getById.useQuery(
    { id: contractId },
    { enabled: !!contractId }
  );

  const { data: actors, isLoading: actorsLoading } = trpc.user.getActors.useQuery();

  const updateMutation = trpc.contracts.update.useMutation({
    onSuccess: () => {
      if (Platform.OS === "web") {
        alert("Contract updated successfully!");
      } else {
        Alert.alert("Success", "Contract updated successfully!");
      }
      router.back();
    },
    onError: (error) => {
      if (Platform.OS === "web") {
        alert(`Error: ${error.message}`);
      } else {
        Alert.alert("Error", error.message);
      }
    },
  });

  // Populate form with existing contract data
  useEffect(() => {
    if (contract) {
      setProjectTitle(contract.projectTitle || "");
      setActorId(contract.actorId?.toString() || "");
      setPaymentTerms(contract.paymentTerms || "");
      setPaymentAmount(contract.paymentAmount || "");
      setStartDate(
        contract.startDate ? new Date(contract.startDate).toISOString().split("T")[0] : ""
      );
      setEndDate(contract.endDate ? new Date(contract.endDate).toISOString().split("T")[0] : "");
      setDeliverables(contract.deliverables || "");
    }
  }, [contract]);

  const handleSubmit = () => {
    if (!projectTitle.trim()) {
      if (Platform.OS === "web") {
        alert("Please enter a project title");
      } else {
        Alert.alert("Validation Error", "Please enter a project title");
      }
      return;
    }

    if (!actorId) {
      if (Platform.OS === "web") {
        alert("Please select an actor");
      } else {
        Alert.alert("Validation Error", "Please select an actor");
      }
      return;
    }

    if (!paymentTerms.trim()) {
      if (Platform.OS === "web") {
        alert("Please enter payment terms");
      } else {
        Alert.alert("Validation Error", "Please enter payment terms");
      }
      return;
    }

    updateMutation.mutate({
      id: contractId,
      projectTitle: projectTitle.trim(),
      actorId: parseInt(actorId, 10),
      paymentTerms: paymentTerms.trim(),
      paymentAmount: paymentAmount.trim() || undefined,
      startDate: startDate.trim() || undefined,
      endDate: endDate.trim() || undefined,
      deliverables: deliverables.trim() || undefined,
    });
  };

  if (contractLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <Stack.Screen options={{ title: "Edit Contract" }} />
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

  // Only allow producer to edit
  if (contract.producerId !== user?.id) {
    return (
      <ScreenContainer className="p-6 items-center justify-center">
        <Stack.Screen options={{ title: "Edit Contract" }} />
        <Text className="text-lg text-muted text-center">
          Only the producer can edit this contract
        </Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-6">
      <Stack.Screen options={{ title: "Edit Contract" }} />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 gap-6">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">Edit Contract</Text>
            <Text className="text-base text-muted">Update contract details below</Text>
          </View>

          {/* Form */}
          <View className="gap-4">
            {/* Project Title */}
            <View className="gap-2">
              <Text className="text-sm font-medium text-foreground">Project Title *</Text>
              <TextInput
                value={projectTitle}
                onChangeText={setProjectTitle}
                placeholder="Enter project name"
                placeholderTextColor="#9CA3AF"
                className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
                returnKeyType="next"
              />
            </View>

            {/* Actor Selection */}
            <View className="gap-2">
              <Text className="text-sm font-medium text-foreground">Select Actor *</Text>
              {actorsLoading ? (
                <ActivityIndicator size="small" color="#1E40AF" />
              ) : actors && actors.length > 0 ? (
                <View className="gap-2">
                  {actors.map((actor) => (
                    <TouchableOpacity
                      key={actor.id}
                      onPress={() => setActorId(actor.id.toString())}
                      className={`border rounded-xl px-4 py-3 ${
                        actorId === actor.id.toString()
                          ? "bg-primary/10 border-primary"
                          : "bg-surface border-border"
                      }`}
                    >
                      <Text
                        className={`font-medium ${
                          actorId === actor.id.toString() ? "text-primary" : "text-foreground"
                        }`}
                      >
                        {actor.name || actor.email}
                      </Text>
                      {actor.email && actor.name && (
                        <Text className="text-sm text-muted mt-1">{actor.email}</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <Text className="text-sm text-muted">No actors available</Text>
              )}
            </View>

            {/* Payment Terms */}
            <View className="gap-2">
              <Text className="text-sm font-medium text-foreground">Payment Terms *</Text>
              <TextInput
                value={paymentTerms}
                onChangeText={setPaymentTerms}
                placeholder="e.g., 50% upfront, 50% on completion"
                placeholderTextColor="#9CA3AF"
                className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Payment Amount */}
            <View className="gap-2">
              <Text className="text-sm font-medium text-foreground">Payment Amount</Text>
              <TextInput
                value={paymentAmount}
                onChangeText={setPaymentAmount}
                placeholder="Enter amount (e.g., 50000)"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
              />
            </View>

            {/* Start Date */}
            <View className="gap-2">
              <Text className="text-sm font-medium text-foreground">Start Date</Text>
              <TextInput
                value={startDate}
                onChangeText={setStartDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#9CA3AF"
                className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
              />
            </View>

            {/* End Date */}
            <View className="gap-2">
              <Text className="text-sm font-medium text-foreground">End Date</Text>
              <TextInput
                value={endDate}
                onChangeText={setEndDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#9CA3AF"
                className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
              />
            </View>

            {/* Deliverables */}
            <View className="gap-2">
              <Text className="text-sm font-medium text-foreground">Deliverables</Text>
              <TextInput
                value={deliverables}
                onChangeText={setDeliverables}
                placeholder="Describe what the actor will deliver"
                placeholderTextColor="#9CA3AF"
                className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={updateMutation.isPending}
            className="bg-primary px-6 py-4 rounded-xl items-center active:opacity-80 mt-4"
            style={{ opacity: updateMutation.isPending ? 0.6 : 1 }}
          >
            {updateMutation.isPending ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-white text-lg font-semibold">Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
