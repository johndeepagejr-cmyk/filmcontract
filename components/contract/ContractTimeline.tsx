import { View, Text } from "react-native";
import { Card, SectionHeader } from "@/components/ui/design-system";
import { Typography, Spacing } from "@/constants/design-tokens";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

interface Props {
  contractId: number;
}

const EVENT_ICONS: Record<string, string> = {
  created: "📄",
  edited: "✏️",
  status_changed: "🔄",
  payment_received: "💰",
};

const EVENT_COLORS: Record<string, string> = {
  created: "#22C55E",
  edited: "#3B82F6",
  status_changed: "#F59E0B",
  payment_received: "#10B981",
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function ContractTimeline({ contractId }: Props) {
  const colors = useColors();
  const accent = (colors as any).accent || "#C9963B";

  const { data: history, isLoading } = trpc.contracts.getHistory.useQuery({ contractId });

  if (isLoading) {
    return (
      <Card>
        <View style={{ gap: 12 }}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surface }} />
              <View style={{ flex: 1, gap: 4 }}>
                <View style={{ width: "60%", height: 12, borderRadius: 6, backgroundColor: colors.surface }} />
                <View style={{ width: "40%", height: 10, borderRadius: 5, backgroundColor: colors.surface }} />
              </View>
            </View>
          ))}
        </View>
      </Card>
    );
  }

  const events = (history as any[]) || [];

  if (events.length === 0) {
    return (
      <Card>
        <View style={{ alignItems: "center", paddingVertical: 16 }}>
          <Text style={{ fontSize: 32 }}>📋</Text>
          <Text style={[Typography.bodySm, { color: colors.muted, marginTop: 8 }]}>No history yet</Text>
        </View>
      </Card>
    );
  }

  return (
    <View style={{ gap: Spacing.md }}>
      <SectionHeader title="Contract Timeline" subtitle={`${events.length} events`} />
      <Card>
        <View style={{ gap: 0 }}>
          {events.map((event: any, index: number) => {
            const isLast = index === events.length - 1;
            const color = EVENT_COLORS[event.eventType] || accent;
            const icon = EVENT_ICONS[event.eventType] || "📌";

            return (
              <View key={event.id} style={{ flexDirection: "row", gap: 12 }}>
                {/* Timeline Line + Dot */}
                <View style={{ alignItems: "center", width: 32 }}>
                  <View style={{
                    width: 32, height: 32, borderRadius: 16,
                    backgroundColor: color + "15",
                    alignItems: "center", justifyContent: "center",
                    borderWidth: 2, borderColor: color + "30",
                  }}>
                    <Text style={{ fontSize: 14 }}>{icon}</Text>
                  </View>
                  {!isLast && (
                    <View style={{
                      width: 2, flex: 1, minHeight: 24,
                      backgroundColor: colors.border,
                    }} />
                  )}
                </View>

                {/* Content */}
                <View style={{ flex: 1, paddingBottom: isLast ? 0 : 16 }}>
                  <Text style={[Typography.labelMd, { color: colors.foreground }]}>
                    {event.eventDescription}
                  </Text>
                  <View style={{ flexDirection: "row", gap: 8, marginTop: 2 }}>
                    <Text style={[Typography.caption, { color: colors.muted }]}>
                      {event.userName || "System"}
                    </Text>
                    <Text style={[Typography.caption, { color: colors.muted }]}>•</Text>
                    <Text style={[Typography.caption, { color: colors.muted }]}>
                      {formatDate(event.createdAt)}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </Card>
    </View>
  );
}
