import { View, Text, ActivityIndicator } from "react-native";
import { trpc } from "@/lib/trpc";

interface ContractTimelineProps {
  contractId: number;
}

export function ContractTimeline({ contractId }: ContractTimelineProps) {
  const { data: history, isLoading } = trpc.contracts.getHistory.useQuery(
    { contractId },
    { enabled: !!contractId }
  );

  if (isLoading) {
    return (
      <View className="py-8 items-center">
        <ActivityIndicator size="small" color="#1E40AF" />
      </View>
    );
  }

  if (!history || history.length === 0) {
    return (
      <View className="bg-surface rounded-xl p-6">
        <Text className="text-sm text-muted text-center">No activity yet</Text>
      </View>
    );
  }

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case "created":
        return "✨";
      case "edited":
        return "✏️";
      case "status_changed":
        return "🔄";
      case "payment_received":
        return "💰";
      default:
        return "📌";
    }
  };

  return (
    <View className="bg-surface rounded-xl p-4 gap-4">
      <Text className="text-lg font-bold text-foreground">Contract Timeline</Text>

      {history.map((event, index) => (
        <View key={event.id} className="flex-row gap-3">
          {/* Timeline Line */}
          <View className="items-center">
            <View className="w-8 h-8 rounded-full bg-primary items-center justify-center">
              <Text className="text-base">{getEventIcon(event.eventType)}</Text>
            </View>
            {index < history.length - 1 && (
              <View className="w-0.5 flex-1 bg-border mt-2" style={{ minHeight: 40 }} />
            )}
          </View>

          {/* Event Content */}
          <View className="flex-1 pb-4">
            <Text className="text-base font-semibold text-foreground">
              {event.eventDescription}
            </Text>
            <Text className="text-sm text-muted mt-1">
              {new Date(event.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
            {event.userName && (
              <Text className="text-sm text-muted">by {event.userName}</Text>
            )}
          </View>
        </View>
      ))}
    </View>
  );
}
