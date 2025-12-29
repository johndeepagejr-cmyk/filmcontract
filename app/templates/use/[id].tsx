import { ScrollView, Text, View, TouchableOpacity, TextInput, ActivityIndicator, Alert, Platform } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { DatePicker } from "@/components/date-picker";

export default function UseTemplateScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { data: template, isLoading } = trpc.templates.getById.useQuery({ id: Number(id) });
  const { data: actors } = trpc.user.getActors.useQuery();
  const createContractMutation = trpc.contracts.create.useMutation();

  const [projectTitle, setProjectTitle] = useState("");
  const [actorEmail, setActorEmail] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleCreateContract = async () => {
    if (!projectTitle.trim()) {
      if (Platform.OS === "web") {
        alert("Please enter a project title");
      } else {
        Alert.alert("Error", "Please enter a project title");
      }
      return;
    }

    if (!actorEmail.trim()) {
      if (Platform.OS === "web") {
        alert("Please enter actor email");
      } else {
        Alert.alert("Error", "Please enter actor email");
      }
      return;
    }

    if (!paymentAmount.trim()) {
      if (Platform.OS === "web") {
        alert("Please enter payment amount");
      } else {
        Alert.alert("Error", "Please enter payment amount");
      }
      return;
    }

    if (!startDate.trim() || !endDate.trim()) {
      if (Platform.OS === "web") {
        alert("Please enter start and end dates");
      } else {
        Alert.alert("Error", "Please enter start and end dates");
      }
      return;
    }

    try {
      setSubmitting(true);

      // Find actor by email
      const actor = actors?.find((a: any) => a.email === actorEmail);
      
      if (!actor) {
        if (Platform.OS === "web") {
          alert("Actor not found with this email. Please make sure the actor has signed up.");
        } else {
          Alert.alert("Error", "Actor not found with this email. Please make sure the actor has signed up.");
        }
        setSubmitting(false);
        return;
      }

      await createContractMutation.mutateAsync({
        projectTitle,
        actorId: actor.id,
        paymentTerms: template?.defaultPaymentTerms || "",
        paymentAmount: paymentAmount,
        startDate,
        endDate,
        deliverables: template?.defaultDeliverables || "",
      });

      if (Platform.OS === "web") {
        alert("Contract created successfully!");
      } else {
        Alert.alert("Success", "Contract created successfully!");
      }

      router.back();
    } catch (error) {
      console.error("Error creating contract:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      if (Platform.OS === "web") {
        alert(`Failed to create contract: ${errorMessage}`);
      } else {
        Alert.alert("Error", `Failed to create contract: ${errorMessage}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <Stack.Screen options={{ title: "Use Template" }} />
        <ActivityIndicator size="large" color="#1E40AF" />
      </ScreenContainer>
    );
  }

  if (!template) {
    return (
      <ScreenContainer className="p-6 items-center justify-center">
        <Stack.Screen options={{ title: "Template Not Found" }} />
        <Text className="text-lg font-semibold text-foreground">Template not found</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-primary px-6 py-3 rounded-xl mt-4 active:opacity-80"
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-6">
      <Stack.Screen options={{ title: `Use ${template.name}` }} />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="gap-6">
          {/* Template Info */}
          <View className="bg-surface rounded-xl p-4 border border-border">
            <Text className="text-xl font-bold text-foreground">{template.name}</Text>
            <Text className="text-sm text-muted mt-1">{template.description}</Text>
          </View>

          {/* Project Title */}
          <View>
            <Text className="text-sm font-semibold text-foreground mb-2">Project Title *</Text>
            <TextInput
              value={projectTitle}
              onChangeText={setProjectTitle}
              placeholder="Enter project title"
              placeholderTextColor="#9CA3AF"
              className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
            />
          </View>

          {/* Actor Details */}
          <View>
            <Text className="text-sm font-semibold text-foreground mb-2">Actor Email *</Text>
            <TextInput
              value={actorEmail}
              onChangeText={setActorEmail}
              placeholder="Enter actor email"
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
              className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
            />
          </View>

          {/* Payment Amount */}
          <View>
            <Text className="text-sm font-semibold text-foreground mb-2">Payment Amount ($) *</Text>
            <TextInput
              value={paymentAmount}
              onChangeText={setPaymentAmount}
              placeholder="Enter payment amount"
              placeholderTextColor="#9CA3AF"
              keyboardType="decimal-pad"
              className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
            />
          </View>

          {/* Dates */}
          <DatePicker
            label="Start Date *"
            value={startDate}
            onChange={setStartDate}
            placeholder="Select start date"
          />

          <DatePicker
            label="End Date *"
            value={endDate}
            onChange={setEndDate}
            placeholder="Select end date"
          />

          {/* Pre-filled Terms (Read-only) */}
          <View>
            <Text className="text-sm font-semibold text-foreground mb-2">Payment Terms (from template)</Text>
            <View className="bg-surface border border-border rounded-xl px-4 py-3">
              <Text className="text-foreground">{template.defaultPaymentTerms}</Text>
            </View>
          </View>

          <View>
            <Text className="text-sm font-semibold text-foreground mb-2">Deliverables (from template)</Text>
            <View className="bg-surface border border-border rounded-xl px-4 py-3">
              <Text className="text-foreground">{template.defaultDeliverables}</Text>
            </View>
          </View>

          {/* Create Button */}
          <TouchableOpacity
            onPress={handleCreateContract}
            disabled={submitting}
            className="bg-primary px-6 py-4 rounded-xl items-center active:opacity-80"
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text className="text-white font-bold text-lg">Create Contract</Text>
            )}
          </TouchableOpacity>

          <View className="h-8" />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
