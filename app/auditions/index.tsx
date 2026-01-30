import { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { format, isToday, isTomorrow, isPast } from "date-fns";

type AuditionStatus = "scheduled" | "in_progress" | "completed" | "cancelled" | "no_show" | "all";

export default function AuditionsScreen() {
  const colors = useColors();
  const router = useRouter();
  const [selectedStatus, setSelectedStatus] = useState<AuditionStatus>("all");

  const { data: auditions, isLoading, refetch, isRefetching } = trpc.videoAudition.getMyAuditions.useQuery({
    status: selectedStatus,
    limit: 50,
  });

  const { data: invitations } = trpc.videoAudition.getMyInvitations.useQuery();

  const statusFilters: { label: string; value: AuditionStatus }[] = [
    { label: "All", value: "all" },
    { label: "Upcoming", value: "scheduled" },
    { label: "In Progress", value: "in_progress" },
    { label: "Completed", value: "completed" },
    { label: "Cancelled", value: "cancelled" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return colors.primary;
      case "in_progress":
        return colors.success;
      case "completed":
        return colors.muted;
      case "cancelled":
      case "no_show":
        return colors.error;
      default:
        return colors.muted;
    }
  };

  const formatAuditionDate = (date: Date) => {
    const d = new Date(date);
    if (isToday(d)) return `Today at ${format(d, "h:mm a")}`;
    if (isTomorrow(d)) return `Tomorrow at ${format(d, "h:mm a")}`;
    return format(d, "MMM d, yyyy 'at' h:mm a");
  };

  const renderAudition = ({ item }: { item: any }) => {
    const audition = item.audition;
    const project = item.project;
    const isUpcoming = audition.status === "scheduled" && !isPast(new Date(audition.scheduledAt));
    const canJoin = audition.status === "scheduled" || audition.status === "in_progress";

    return (
      <TouchableOpacity
        onPress={() => router.push(`/auditions/${audition.id}`)}
        style={{
          backgroundColor: colors.surface,
          borderRadius: 16,
          padding: 16,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground, marginBottom: 4 }}>
              {project?.title || "Untitled Project"}
            </Text>
            {item.role && (
              <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 8 }}>
                Role: {item.role.roleName}
              </Text>
            )}
          </View>
          <View
            style={{
              backgroundColor: getStatusColor(audition.status) + "20",
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 12,
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: "500", color: getStatusColor(audition.status), textTransform: "capitalize" }}>
              {audition.status.replace("_", " ")}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}>
          <IconSymbol name="clock" size={16} color={colors.muted} />
          <Text style={{ fontSize: 14, color: colors.muted, marginLeft: 6 }}>
            {formatAuditionDate(audition.scheduledAt)}
          </Text>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
          <IconSymbol name="timer" size={16} color={colors.muted} />
          <Text style={{ fontSize: 14, color: colors.muted, marginLeft: 6 }}>
            {audition.durationMinutes} minutes
          </Text>
        </View>

        {audition.recordingEnabled && (
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
            <IconSymbol name="video" size={16} color={colors.error} />
            <Text style={{ fontSize: 14, color: colors.error, marginLeft: 6 }}>
              Recording enabled
            </Text>
          </View>
        )}

        {canJoin && isUpcoming && (
          <TouchableOpacity
            onPress={() => router.push(`/auditions/${audition.id}/call`)}
            style={{
              backgroundColor: colors.primary,
              borderRadius: 12,
              paddingVertical: 12,
              marginTop: 12,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "600", fontSize: 16 }}>
              Join Audition
            </Text>
          </TouchableOpacity>
        )}

        {audition.status === "completed" && audition.recordingUrl && (
          <TouchableOpacity
            onPress={() => router.push(`/auditions/${audition.id}/recording`)}
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              paddingVertical: 12,
              marginTop: 12,
              alignItems: "center",
              borderWidth: 1,
              borderColor: colors.primary,
            }}
          >
            <Text style={{ color: colors.primary, fontWeight: "600", fontSize: 16 }}>
              View Recording
            </Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  const renderInvitation = ({ item }: { item: any }) => {
    const invitation = item.invitation;
    const audition = item.audition;
    const project = item.project;
    const producer = item.producer;

    return (
      <View
        style={{
          backgroundColor: colors.primary + "10",
          borderRadius: 16,
          padding: 16,
          marginBottom: 12,
          borderWidth: 2,
          borderColor: colors.primary,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
          <IconSymbol name="bell" size={20} color={colors.primary} />
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.primary, marginLeft: 8 }}>
            New Audition Invitation
          </Text>
        </View>

        <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground, marginBottom: 4 }}>
          {project?.title || "Untitled Project"}
        </Text>
        
        <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 8 }}>
          From: {producer?.name || "Producer"}
        </Text>

        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
          <IconSymbol name="clock" size={16} color={colors.muted} />
          <Text style={{ fontSize: 14, color: colors.muted, marginLeft: 6 }}>
            {formatAuditionDate(audition.scheduledAt)}
          </Text>
        </View>

        {invitation.message && (
          <Text style={{ fontSize: 14, color: colors.foreground, marginTop: 8, fontStyle: "italic" }}>
            "{invitation.message}"
          </Text>
        )}

        <View style={{ flexDirection: "row", marginTop: 12, gap: 12 }}>
          <TouchableOpacity
            onPress={() => router.push(`/auditions/invitation/${invitation.id}?action=accept`)}
            style={{
              flex: 1,
              backgroundColor: colors.success,
              borderRadius: 12,
              paddingVertical: 12,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "600" }}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push(`/auditions/invitation/${invitation.id}?action=decline`)}
            style={{
              flex: 1,
              backgroundColor: colors.error,
              borderRadius: 12,
              paddingVertical: 12,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "600" }}>Decline</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <ScreenContainer className="flex-1">
      <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <Text style={{ fontSize: 28, fontWeight: "bold", color: colors.foreground }}>
            Video Auditions
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/auditions/schedule")}
            style={{
              backgroundColor: colors.primary,
              width: 44,
              height: 44,
              borderRadius: 22,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconSymbol name="plus" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Status Filter */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={statusFilters}
          keyExtractor={(item) => item.value}
          contentContainerStyle={{ marginBottom: 16 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setSelectedStatus(item.value)}
              style={{
                backgroundColor: selectedStatus === item.value ? colors.primary : colors.surface,
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                marginRight: 8,
                borderWidth: 1,
                borderColor: selectedStatus === item.value ? colors.primary : colors.border,
              }}
            >
              <Text
                style={{
                  color: selectedStatus === item.value ? "#fff" : colors.foreground,
                  fontWeight: "500",
                }}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={[
            ...(invitations || []).map((inv) => ({ type: "invitation", ...inv })),
            ...(auditions || []).map((aud) => ({ type: "audition", ...aud })),
          ]}
          keyExtractor={(item, index) => `${item.type}-${index}`}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
          }
          renderItem={({ item }) =>
            item.type === "invitation" ? renderInvitation({ item }) : renderAudition({ item })
          }
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingTop: 60 }}>
              <IconSymbol name="video.slash" size={64} color={colors.muted} />
              <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground, marginTop: 16 }}>
                No auditions yet
              </Text>
              <Text style={{ fontSize: 14, color: colors.muted, marginTop: 8, textAlign: "center" }}>
                Schedule a video audition with an actor{"\n"}or wait for invitations from producers.
              </Text>
            </View>
          }
        />
      )}
    </ScreenContainer>
  );
}
