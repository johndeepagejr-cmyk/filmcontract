import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { LoginScreen } from "@/components/auth/login-screen";
import { RoleSelectionScreen } from "@/components/auth/role-selection-screen";
import { trpc } from "@/lib/trpc";
import { router } from "expo-router";
import { useState } from "react";
import { BulkActionsModal } from "@/components/bulk-actions-modal";
import { UpcomingContracts } from "@/components/upcoming-contracts";

export default function HomeScreen() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedContracts, setSelectedContracts] = useState<number[]>([]);

  const {
    data: contracts,
    isLoading: contractsLoading,
    refetch,
  } = trpc.contracts.list.useQuery(undefined, {
    enabled: isAuthenticated && !!user?.userRole,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Filter contracts based on search query
  const filteredContracts = contracts?.filter((contract) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      contract.projectTitle.toLowerCase().includes(query) ||
      contract.producerName.toLowerCase().includes(query) ||
      contract.actorName.toLowerCase().includes(query) ||
      contract.status.toLowerCase().includes(query)
    );
  }) || [];

  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedContracts([]);
  };

  const toggleContractSelection = (contractId: number) => {
    if (selectedContracts.includes(contractId)) {
      setSelectedContracts(selectedContracts.filter((id) => id !== contractId));
    } else {
      setSelectedContracts([...selectedContracts, contractId]);
    }
  };

  const selectAll = () => {
    setSelectedContracts(filteredContracts.map((c) => c.id));
  };

  const deselectAll = () => {
    setSelectedContracts([]);
  };

  // Show login screen if not authenticated
  if (!isAuthenticated && !authLoading) {
    return <LoginScreen />;
  }

  // Show role selection if user hasn't selected a role yet
  if (isAuthenticated && user && !user.userRole && !authLoading) {
    return <RoleSelectionScreen />;
  }

  // Show loading while checking auth
  if (authLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color="#1E40AF" />
      </ScreenContainer>
    );
  }

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
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <ScreenContainer className="p-6">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View className="flex-1 gap-6">
          {/* Header */}
          <View className="gap-2">
            <View className="flex-row items-center justify-between">
              <Text className="text-3xl font-bold text-foreground">Contracts</Text>
              {filteredContracts.length > 0 && (
                <TouchableOpacity
                  onPress={toggleSelectionMode}
                  className="bg-primary px-4 py-2 rounded-full active:opacity-80"
                >
                  <Text className="text-white text-sm font-semibold">
                    {selectionMode ? "Cancel" : "Select"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <Text className="text-base text-muted">
              {user?.userRole === "producer"
                ? "Manage your contracts with actors"
                : "View your contracts with producers"}
            </Text>
          </View>

          {/* Upcoming Deadlines */}
          {!selectionMode && filteredContracts.length > 0 && (
            <UpcomingContracts contracts={filteredContracts} />
          )}

          {/* Selection Controls */}
          {selectionMode && filteredContracts.length > 0 && (
            <View className="flex-row items-center justify-between bg-surface border border-border rounded-xl p-4">
              <Text className="text-base text-foreground font-semibold">
                {selectedContracts.length} selected
              </Text>
              <View className="flex-row gap-3">
                <TouchableOpacity onPress={selectAll} className="active:opacity-70">
                  <Text className="text-primary font-semibold">Select All</Text>
                </TouchableOpacity>
                {selectedContracts.length > 0 && (
                  <TouchableOpacity onPress={deselectAll} className="active:opacity-70">
                    <Text className="text-muted font-semibold">Clear</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* Search Bar */}
          <View className="bg-surface border border-border rounded-xl px-4 py-3 flex-row items-center gap-2">
            <Text className="text-xl">🔍</Text>
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by project, actor, or status..."
              placeholderTextColor="#9CA3AF"
              className="flex-1 text-foreground"
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")} className="active:opacity-70">
                <Text className="text-lg text-muted">✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Contracts List */}
          {contractsLoading ? (
            <View className="flex-1 items-center justify-center py-12">
              <ActivityIndicator size="large" color="#1E40AF" />
            </View>
          ) : filteredContracts && filteredContracts.length > 0 ? (
            <View className="gap-4">
              {filteredContracts.map((contract) => (
                <TouchableOpacity
                  key={contract.id}
                  onPress={() => {
                    if (selectionMode) {
                      toggleContractSelection(contract.id);
                    } else {
                      router.push(`/contract/${contract.id}`);
                    }
                  }}
                  className="bg-surface rounded-2xl p-4 border border-border active:opacity-70"
                >
                  {selectionMode && (
                    <View className="absolute top-4 right-4 z-10">
                      <View
                        className={`w-6 h-6 rounded border-2 items-center justify-center ${
                          selectedContracts.includes(contract.id)
                            ? "bg-primary border-primary"
                            : "bg-transparent border-border"
                        }`}
                      >
                        {selectedContracts.includes(contract.id) && (
                          <Text className="text-white text-xs font-bold">✓</Text>
                        )}
                      </View>
                    </View>
                  )}
                  {/* Project Title */}
                  <Text className="text-lg font-bold text-foreground mb-2">
                    {contract.projectTitle}
                  </Text>

                  {/* Parties */}
                  <Text className="text-sm text-muted mb-3">
                    {contract.producerName} → {contract.actorName}
                  </Text>

                  {/* Status and Date */}
                  <View className="flex-row items-center justify-between">
                    <View
                      className={`${getStatusColor(contract.status)} px-3 py-1 rounded-full`}
                    >
                      <Text className="text-xs font-semibold text-white capitalize">
                        {contract.status}
                      </Text>
                    </View>
                    <Text className="text-xs text-muted">
                      {formatDate(contract.createdAt)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : searchQuery.trim() ? (
            <View className="flex-1 items-center justify-center py-12">
              <Text className="text-lg text-muted text-center">No results found</Text>
              <Text className="text-sm text-muted text-center mt-2">
                Try searching with different keywords
              </Text>
            </View>
          ) : (
            <View className="flex-1 items-center justify-center py-12">
              <Text className="text-lg text-muted text-center">No contracts yet</Text>
              <Text className="text-sm text-muted text-center mt-2">
                {user?.userRole === "producer"
                  ? "Create your first contract using the + tab"
                  : "Contracts will appear here when producers create them"}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bulk Actions Modal */}
      {selectionMode && selectedContracts.length > 0 && (
        <View className="absolute bottom-8 left-6 right-6">
          <TouchableOpacity
            onPress={() => {}}
            className="bg-primary px-6 py-4 rounded-full shadow-lg active:opacity-80"
            style={{ elevation: 5 }}
          >
            <Text className="text-white text-center text-lg font-bold">
              Actions ({selectedContracts.length})
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <BulkActionsModal
        visible={selectionMode && selectedContracts.length > 0}
        onClose={() => setSelectedContracts([])}
        selectedCount={selectedContracts.length}
        contracts={filteredContracts.filter((c) => selectedContracts.includes(c.id))}
        onComplete={() => {
          setSelectionMode(false);
          setSelectedContracts([]);
          refetch();
        }}
      />
    </ScreenContainer>
  );
}
