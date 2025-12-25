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
import { useState } from "react";
import { router } from "expo-router";

export default function CreateContractScreen() {
  const { user, isAuthenticated } = useAuth();
  const [projectTitle, setProjectTitle] = useState("");
  const [actorId, setActorId] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [deliverables, setDeliverables] = useState("");

  const { data: actors, isLoading: actorsLoading } = trpc.user.getActors.useQuery(undefined, {
    enabled: isAuthenticated && user?.userRole === "producer",
  });

  const createMutation = trpc.contracts.create.useMutation({
    onSuccess: () => {
      if (Platform.OS === "web") {
        alert("Contract created successfully!");
      } else {
        Alert.alert("Success", "Contract created successfully!");
      }
      // Reset form
      setProjectTitle("");
      setActorId("");
      setPaymentTerms("");
      setPaymentAmount("");
      setStartDate("");
      setEndDate("");
      setDeliverables("");
      // Navigate to home
      router.push("/(tabs)");
    },
    onError: (error) => {
      if (Platform.OS === "web") {
        alert(`Error: ${error.message}`);
      } else {
        Alert.alert("Error", error.message);
      }
    },
  });

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

    createMutation.mutate({
      projectTitle: projectTitle.trim(),
      actorId: parseInt(actorId, 10),
      paymentTerms: paymentTerms.trim(),
      paymentAmount: paymentAmount.trim() || undefined,
      startDate: startDate.trim() || undefined,
      endDate: endDate.trim() || undefined,
      deliverables: deliverables.trim() || undefined,
      status: "active",
    });
  };

  if (!isAuthenticated || user?.userRole !== "producer") {
    return (
      <ScreenContainer className="p-6 items-center justify-center">
        <Text className="text-lg text-muted text-center">
          Only producers can create contracts
        </Text>
        <Text className="text-sm text-muted text-center mt-2">
          Please sign in as a producer to continue
        </Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 gap-6">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">Create Contract</Text>
            <Text className="text-base text-muted">Enter contract details below</Text>
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
            disabled={createMutation.isPending}
            className="bg-primary px-6 py-4 rounded-xl items-center active:opacity-80 mt-4"
            style={{ opacity: createMutation.isPending ? 0.6 : 1 }}
          >
            {createMutation.isPending ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-white text-lg font-semibold">Create Contract</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
