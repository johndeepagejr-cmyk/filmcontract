import { useState } from "react";
import {
  ScrollView,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  KeyboardAvoidingView,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { Stack, router } from "expo-router";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";

export default function CreateContractScreen() {
  const colors = useColors();
  const { user } = useAuth();
  const [projectTitle, setProjectTitle] = useState("");
  const [selectedActorId, setSelectedActorId] = useState<number | null>(null);
  const [paymentTerms, setPaymentTerms] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [deliverables, setDeliverables] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [actorSearch, setActorSearch] = useState("");
  const [showActorPicker, setShowActorPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: actors, isLoading: actorsLoading } = trpc.user.getActors.useQuery();
  const createContractMutation = trpc.contracts.create.useMutation();

  const filteredActors = actors?.filter((a: any) => {
    if (!actorSearch.trim()) return true;
    const q = actorSearch.toLowerCase();
    return (
      (a.name || "").toLowerCase().includes(q) ||
      (a.email || "").toLowerCase().includes(q)
    );
  }) || [];

  const selectedActor = actors?.find((a: any) => a.id === selectedActorId);

  const handleSubmit = async () => {
    if (!projectTitle.trim()) {
      const msg = "Please enter a project title.";
      Platform.OS === "web" ? alert(msg) : Alert.alert("Missing Info", msg);
      return;
    }
    if (!selectedActorId) {
      const msg = "Please select an actor for this contract.";
      Platform.OS === "web" ? alert(msg) : Alert.alert("Missing Info", msg);
      return;
    }
    if (!paymentTerms.trim()) {
      const msg = "Please enter payment terms.";
      Platform.OS === "web" ? alert(msg) : Alert.alert("Missing Info", msg);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createContractMutation.mutateAsync({
        projectTitle: projectTitle.trim(),
        actorId: selectedActorId,
        paymentTerms: paymentTerms.trim(),
        paymentAmount: paymentAmount.trim() || undefined,
        startDate: startDate.trim() || undefined,
        endDate: endDate.trim() || undefined,
        deliverables: deliverables.trim() || undefined,
        status: "draft",
      });

      const successMsg = "Contract created successfully!";
      if (Platform.OS === "web") {
        alert(successMsg);
        router.back();
      } else {
        Alert.alert("Success", successMsg, [
          { text: "OK", onPress: () => router.back() },
        ]);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to create contract.";
      Platform.OS === "web"
        ? alert(`Error: ${errorMsg}`)
        : Alert.alert("Error", errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenContainer>
      <Stack.Screen
        options={{
          title: "Create Contract",
          headerShown: true,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.foreground,
        }}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, padding: 20, paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="gap-5">
            {/* Project Title */}
            <View className="gap-2">
              <Text className="text-sm font-semibold text-muted">Project Title *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]}
                placeholder="e.g., Summer Feature Film"
                placeholderTextColor={colors.muted}
                value={projectTitle}
                onChangeText={setProjectTitle}
                returnKeyType="next"
              />
            </View>

            {/* Actor Selection */}
            <View className="gap-2">
              <Text className="text-sm font-semibold text-muted">Select Actor *</Text>
              {selectedActor ? (
                <View className="flex-row items-center gap-3 bg-surface rounded-xl p-4 border border-border">
                  <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: colors.primary + "20" }}>
                    <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 16 }}>
                      {(selectedActor.name || "A").charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-foreground">{selectedActor.name || "Unnamed"}</Text>
                    <Text className="text-sm text-muted">{selectedActor.email || ""}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedActorId(null);
                      setShowActorPicker(true);
                    }}
                    style={{ opacity: 1 }}
                  >
                    <Text style={{ fontSize: 14, color: colors.primary, fontWeight: '600' }}>Change</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => setShowActorPicker(!showActorPicker)}
                  style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: colors.border }}
                >
                  <Text className="text-base text-muted">
                    {showActorPicker ? "Search below..." : "Tap to select an actor"}
                  </Text>
                </TouchableOpacity>
              )}

              {showActorPicker && !selectedActorId && (
                <View className="gap-2">
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]}
                    placeholder="Search actors by name or email..."
                    placeholderTextColor={colors.muted}
                    value={actorSearch}
                    onChangeText={setActorSearch}
                    autoFocus
                  />
                  {actorsLoading ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : filteredActors.length > 0 ? (
                    <View className="bg-surface rounded-xl border border-border overflow-hidden" style={{ maxHeight: 200 }}>
                      <ScrollView nestedScrollEnabled>
                        {filteredActors.map((actor: any) => (
                          <TouchableOpacity
                            key={actor.id}
                            onPress={() => {
                              setSelectedActorId(actor.id);
                              setShowActorPicker(false);
                              setActorSearch("");
                            }}
                            style={[styles.actorOption, { borderBottomColor: colors.border }]}
                          >
                            <View className="w-8 h-8 rounded-full items-center justify-center" style={{ backgroundColor: colors.primary + "20" }}>
                              <Text style={{ color: colors.primary, fontWeight: "600", fontSize: 14 }}>
                                {(actor.name || "A").charAt(0).toUpperCase()}
                              </Text>
                            </View>
                            <View className="flex-1">
                              <Text className="text-sm font-semibold text-foreground">{actor.name || "Unnamed"}</Text>
                              <Text className="text-xs text-muted">{actor.email || ""}</Text>
                            </View>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  ) : (
                    <Text className="text-sm text-muted text-center py-4">
                      {actorSearch ? "No actors found" : "No actors registered yet"}
                    </Text>
                  )}
                </View>
              )}
            </View>

            {/* Payment Terms */}
            <View className="gap-2">
              <Text className="text-sm font-semibold text-muted">Payment Terms *</Text>
              <TextInput
                style={[styles.textArea, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]}
                placeholder="e.g., 50% upfront, 50% upon completion"
                placeholderTextColor={colors.muted}
                value={paymentTerms}
                onChangeText={setPaymentTerms}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Payment Amount */}
            <View className="gap-2">
              <Text className="text-sm font-semibold text-muted">Payment Amount ($)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]}
                placeholder="e.g., 5000"
                placeholderTextColor={colors.muted}
                value={paymentAmount}
                onChangeText={setPaymentAmount}
                keyboardType="decimal-pad"
                returnKeyType="next"
              />
            </View>

            {/* Deliverables */}
            <View className="gap-2">
              <Text className="text-sm font-semibold text-muted">Deliverables</Text>
              <TextInput
                style={[styles.textArea, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]}
                placeholder="Describe what the actor will deliver..."
                placeholderTextColor={colors.muted}
                value={deliverables}
                onChangeText={setDeliverables}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Dates */}
            <View className="flex-row gap-3">
              <View className="flex-1 gap-2">
                <Text className="text-sm font-semibold text-muted">Start Date</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.muted}
                  value={startDate}
                  onChangeText={setStartDate}
                  returnKeyType="next"
                />
              </View>
              <View className="flex-1 gap-2">
                <Text className="text-sm font-semibold text-muted">End Date</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.muted}
                  value={endDate}
                  onChangeText={setEndDate}
                  returnKeyType="done"
                />
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isSubmitting}
              style={[styles.submitBtn, { backgroundColor: colors.primary, opacity: isSubmitting ? 0.6 : 1 }]}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.submitBtnText}>Create Contract</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  input: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  textArea: {
    minHeight: 80,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 16,
    borderWidth: 1,
  },
  actorOption: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
  },
  submitBtn: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center" as const,
    marginTop: 8,
  },
  submitBtnText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600" as const,
  },
});
