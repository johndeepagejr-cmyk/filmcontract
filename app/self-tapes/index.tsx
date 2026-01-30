import { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuth } from "@/hooks/use-auth";
import { Image } from "expo-image";

type StatusFilter = "all" | "draft" | "submitted" | "under_review" | "approved" | "rejected" | "revision_requested";

const STATUS_FILTERS: { label: string; value: StatusFilter }[] = [
  { label: "All", value: "all" },
  { label: "Drafts", value: "draft" },
  { label: "Submitted", value: "submitted" },
  { label: "In Review", value: "under_review" },
  { label: "Approved", value: "approved" },
  { label: "Revisions", value: "revision_requested" },
];

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  draft: { bg: "#6B7280", text: "#fff" },
  submitted: { bg: "#3B82F6", text: "#fff" },
  under_review: { bg: "#F59E0B", text: "#fff" },
  approved: { bg: "#22C55E", text: "#fff" },
  rejected: { bg: "#EF4444", text: "#fff" },
  revision_requested: { bg: "#8B5CF6", text: "#fff" },
};

function formatDuration(seconds: number | null): string {
  if (!seconds) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function SelfTapesScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const isProducer = user?.userRole === "producer";

  // Use different queries for actors vs producers
  const actorTapesQuery = trpc.selfTape.getMyTapes.useQuery(
    { status: statusFilter as any, limit: 50 },
    { enabled: !isProducer }
  );

  const producerTapesQuery = trpc.selfTape.getTapesForReview.useQuery(
    { status: statusFilter === "all" ? "all" : statusFilter as any, limit: 50 },
    { enabled: isProducer }
  );

  const { data: tapes, isLoading, refetch } = isProducer 
    ? producerTapesQuery 
    : actorTapesQuery;

  const handleRefresh = () => {
    refetch();
  };

  const renderTapeItem = ({ item }: { item: any }) => {
    const tape = isProducer ? item.selfTape : item;
    const actor = isProducer ? item.actor : null;
    const statusStyle = STATUS_COLORS[tape.status] || STATUS_COLORS.draft;

    return (
      <TouchableOpacity
        onPress={() => router.push(`/self-tapes/${tape.id}`)}
        style={{
          backgroundColor: colors.surface,
          borderRadius: 12,
          marginBottom: 12,
          overflow: "hidden",
        }}
      >
        <View style={{ flexDirection: "row" }}>
          {/* Thumbnail */}
          <View
            style={{
              width: 100,
              height: 100,
              backgroundColor: colors.border,
            }}
          >
            {tape.thumbnailUrl ? (
              <Image
                source={{ uri: tape.thumbnailUrl }}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
              />
            ) : (
              <View
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconSymbol name="video.fill" size={32} color={colors.muted} />
              </View>
            )}
            {/* Duration overlay */}
            <View
              style={{
                position: "absolute",
                bottom: 4,
                right: 4,
                backgroundColor: "rgba(0,0,0,0.7)",
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: 4,
              }}
            >
              <Text style={{ color: "#fff", fontSize: 12 }}>
                {formatDuration(tape.durationSeconds)}
              </Text>
            </View>
          </View>

          {/* Info */}
          <View style={{ flex: 1, padding: 12 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: colors.foreground,
                marginBottom: 4,
              }}
              numberOfLines={1}
            >
              {tape.projectTitle}
            </Text>
            {tape.characterName && (
              <Text
                style={{ fontSize: 14, color: colors.muted, marginBottom: 4 }}
                numberOfLines={1}
              >
                {tape.characterName}
              </Text>
            )}
            {isProducer && actor && (
              <Text
                style={{ fontSize: 14, color: colors.muted, marginBottom: 4 }}
                numberOfLines={1}
              >
                By: {actor.name || "Unknown Actor"}
              </Text>
            )}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <View
                style={{
                  backgroundColor: statusStyle.bg,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 4,
                }}
              >
                <Text style={{ color: statusStyle.text, fontSize: 12, fontWeight: "500" }}>
                  {tape.status.replace("_", " ").toUpperCase()}
                </Text>
              </View>
              {tape.isRevision && (
                <Text style={{ fontSize: 12, color: colors.muted }}>
                  Rev. {tape.revisionNumber}
                </Text>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenContainer className="flex-1">
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground }}>
          {isProducer ? "Self-Tapes to Review" : "My Self-Tapes"}
        </Text>
        {!isProducer && (
          <TouchableOpacity onPress={() => router.push("/self-tapes/record")}>
            <IconSymbol name="plus.circle.fill" size={28} color={colors.primary} />
          </TouchableOpacity>
        )}
        {isProducer && (
          <TouchableOpacity onPress={() => router.push("/self-tapes/analytics")}>
            <IconSymbol name="chart.bar.fill" size={24} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Status Filter */}
      <View style={{ paddingVertical: 12 }}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          data={STATUS_FILTERS.filter(f => 
            isProducer ? f.value !== "draft" : true
          )}
          keyExtractor={(item) => item.value}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setStatusFilter(item.value)}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor:
                  statusFilter === item.value ? colors.primary : colors.surface,
              }}
            >
              <Text
                style={{
                  color: statusFilter === item.value ? "#fff" : colors.foreground,
                  fontWeight: "500",
                }}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Tapes List */}
      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={tapes || []}
          keyExtractor={(item: any) => (isProducer ? item.selfTape.id : item.id).toString()}
          renderItem={renderTapeItem}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl refreshing={false} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingTop: 60 }}>
              <IconSymbol name="video.fill" size={48} color={colors.muted} />
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "600",
                  color: colors.foreground,
                  marginTop: 16,
                }}
              >
                No Self-Tapes Yet
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: colors.muted,
                  marginTop: 8,
                  textAlign: "center",
                }}
              >
                {isProducer
                  ? "Self-tapes submitted by actors will appear here"
                  : "Record your first self-tape to get started"}
              </Text>
              {!isProducer && (
                <TouchableOpacity
                  onPress={() => router.push("/self-tapes/record")}
                  style={{
                    backgroundColor: colors.primary,
                    paddingHorizontal: 24,
                    paddingVertical: 12,
                    borderRadius: 24,
                    marginTop: 24,
                  }}
                >
                  <Text style={{ color: "#fff", fontWeight: "600" }}>
                    Record Self-Tape
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}
    </ScreenContainer>
  );
}
