import { View, Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";

interface UpcomingContract {
  id: number;
  projectTitle: string;
  endDate: Date | string | null;
  daysUntilEnd: number;
}

interface UpcomingContractsProps {
  contracts: any[];
}

export function UpcomingContracts({ contracts }: UpcomingContractsProps) {
  // Filter contracts ending within 30 days
  const upcomingContracts: UpcomingContract[] = contracts
    .filter((contract) => {
      if (!contract.endDate || contract.status !== "active") return false;
      const endDate = new Date(contract.endDate);
      const now = new Date();
      const daysUntil = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntil > 0 && daysUntil <= 30;
    })
    .map((contract) => {
      const endDate = new Date(contract.endDate);
      const now = new Date();
      const daysUntilEnd = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return {
        id: contract.id,
        projectTitle: contract.projectTitle,
        endDate: contract.endDate,
        daysUntilEnd,
      };
    })
    .sort((a, b) => a.daysUntilEnd - b.daysUntilEnd);

  if (upcomingContracts.length === 0) return null;

  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between">
        <Text className="text-lg font-bold text-foreground">⏰ Upcoming Deadlines</Text>
        <Text className="text-sm text-muted">{upcomingContracts.length} contract(s)</Text>
      </View>
      <View className="gap-2">
        {upcomingContracts.slice(0, 3).map((contract) => (
          <TouchableOpacity
            key={contract.id}
            onPress={() => router.push(`/contract/${contract.id}`)}
            className="bg-warning/10 border border-warning rounded-xl p-3 active:opacity-70"
          >
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-semibold text-foreground flex-1">
                {contract.projectTitle}
              </Text>
              <View className="bg-warning px-3 py-1 rounded-full">
                <Text className="text-xs font-bold text-white">
                  {contract.daysUntilEnd} day{contract.daysUntilEnd !== 1 ? "s" : ""}
                </Text>
              </View>
            </View>
            <Text className="text-sm text-muted mt-1">
              Ends {new Date(contract.endDate!).toLocaleDateString()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
