import {
  ScrollView,
  Text,
  View,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { useLocalSearchParams, Stack, router } from "expo-router";

export default function ContractVersionsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const contractId = parseInt(id || "0", 10);

  const { data: versions, isLoading } = trpc.contracts.getVersions.useQuery(
    { contractId },
    { enabled: !!contractId }
  );

  const { data: contract } = trpc.contracts.getById.useQuery(
    { id: contractId },
    { enabled: !!contractId }
  );

  const formatDate = (date: string | Date | null) => {
    if (!date) return "Not specified";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <Stack.Screen options={{ title: "Version History" }} />
        <ActivityIndicator size="large" color="#1E40AF" />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-6">
      <Stack.Screen options={{ title: "Version History" }} />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 gap-6">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-2xl font-bold text-foreground">Version History</Text>
            <Text className="text-base text-muted">
              {contract?.projectTitle || "Contract"}
            </Text>
          </View>

          {/* Current Version */}
          {contract && (
            <View className="bg-primary/10 border-2 border-primary rounded-xl p-4">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-lg font-bold text-primary">Current Version</Text>
                <View className="bg-primary px-3 py-1 rounded-full">
                  <Text className="text-xs font-semibold text-white">ACTIVE</Text>
                </View>
              </View>
              <View className="gap-2">
                <View className="flex-row">
                  <Text className="text-sm text-muted w-32">Project:</Text>
                  <Text className="text-sm text-foreground flex-1">{contract.projectTitle}</Text>
                </View>
                <View className="flex-row">
                  <Text className="text-sm text-muted w-32">Producer:</Text>
                  <Text className="text-sm text-foreground flex-1">{contract.producer?.name || "Unknown"}</Text>
                </View>
                <View className="flex-row">
                  <Text className="text-sm text-muted w-32">Payment:</Text>
                  <Text className="text-sm text-foreground flex-1">
                    {contract.paymentAmount ? `$${parseFloat(contract.paymentAmount.toString()).toLocaleString()}` : "N/A"}
                  </Text>
                </View>
                <View className="flex-row">
                  <Text className="text-sm text-muted w-32">Status:</Text>
                  <Text className="text-sm text-foreground flex-1 capitalize">{contract.status}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Version History */}
          {versions && versions.length > 0 ? (
            <View className="gap-3">
              <Text className="text-lg font-bold text-foreground">Previous Versions</Text>
              {versions.map((version, index) => (
                <View
                  key={version.id}
                  className="bg-surface border border-border rounded-xl p-4"
                >
                  <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-base font-semibold text-foreground">
                      Version {version.versionNumber}
                    </Text>
                    <Text className="text-xs text-muted">{formatDate(version.createdAt)}</Text>
                  </View>
                  
                  <View className="gap-2">
                    <View className="flex-row">
                      <Text className="text-sm text-muted w-32">Edited by:</Text>
                      <Text className="text-sm text-foreground flex-1">{version.editorName}</Text>
                    </View>
                    <View className="flex-row">
                      <Text className="text-sm text-muted w-32">Project:</Text>
                      <Text className="text-sm text-foreground flex-1">{version.projectTitle}</Text>
                    </View>
                    <View className="flex-row">
                      <Text className="text-sm text-muted w-32">Actor:</Text>
                      <Text className="text-sm text-foreground flex-1">{version.actorName}</Text>
                    </View>
                    <View className="flex-row">
                      <Text className="text-sm text-muted w-32">Payment:</Text>
                      <Text className="text-sm text-foreground flex-1">
                        {version.paymentAmount ? `$${parseFloat(version.paymentAmount.toString()).toLocaleString()}` : "N/A"}
                      </Text>
                    </View>
                    <View className="flex-row">
                      <Text className="text-sm text-muted w-32">Status:</Text>
                      <Text className="text-sm text-foreground flex-1 capitalize">{version.status}</Text>
                    </View>
                    {version.deliverables && (
                      <View className="mt-2">
                        <Text className="text-sm text-muted mb-1">Deliverables:</Text>
                        <Text className="text-sm text-foreground">{version.deliverables}</Text>
                      </View>
                    )}
                  </View>

                  {/* Show changes compared to previous version */}
                  {index < versions.length - 1 && (
                    <View className="mt-3 pt-3 border-t border-border">
                      <Text className="text-xs font-semibold text-muted mb-1">Changes from previous:</Text>
                      <View className="gap-1">
                        {version.projectTitle !== versions[index + 1].projectTitle && (
                          <Text className="text-xs text-muted">• Project title updated</Text>
                        )}
                        {version.actorId !== versions[index + 1].actorId && (
                          <Text className="text-xs text-muted">• Actor changed</Text>
                        )}
                        {version.paymentAmount !== versions[index + 1].paymentAmount && (
                          <Text className="text-xs text-muted">• Payment amount changed</Text>
                        )}
                        {version.status !== versions[index + 1].status && (
                          <Text className="text-xs text-muted">• Status updated</Text>
                        )}
                        {version.deliverables !== versions[index + 1].deliverables && (
                          <Text className="text-xs text-muted">• Deliverables modified</Text>
                        )}
                      </View>
                    </View>
                  )}
                </View>
              ))}
            </View>
          ) : (
            <View className="flex-1 items-center justify-center py-12">
              <Text className="text-lg text-muted text-center">No version history</Text>
              <Text className="text-sm text-muted text-center mt-2">
                Version history will appear here when the contract is edited
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
