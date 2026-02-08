import {
  Text,
  View,
  FlatList,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { Stack, router } from "expo-router";
import { useColors } from "@/hooks/use-colors";

export default function MessagesScreen() {
  const colors = useColors();
  const { data: conversations, isLoading } =
    trpc.messaging.getConversations.useQuery(undefined, {
      refetchInterval: 5000,
    });

  const renderConversation = ({ item }: { item: any }) => {
    const initials = (item.otherUser?.name || "?")
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    const timeAgo = getTimeAgo(new Date(item.lastMessageAt));

    return (
      <Pressable
        onPress={() =>
          router.push(`/messages/${item.id}` as any)
        }
        style={({ pressed }) => [
          styles.conversationRow,
          { borderBottomColor: colors.border },
          pressed && { opacity: 0.7, backgroundColor: colors.surface },
        ]}
      >
        {/* Avatar */}
        <View
          style={[
            styles.avatar,
            { backgroundColor: colors.primary + "20" },
          ]}
        >
          <Text style={[styles.avatarText, { color: colors.primary }]}>
            {initials}
          </Text>
        </View>

        {/* Content */}
        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text
              style={[styles.conversationName, { color: colors.foreground }]}
              numberOfLines={1}
            >
              {item.otherUser?.name || "Unknown"}
            </Text>
            <Text style={[styles.conversationTime, { color: colors.muted }]}>
              {timeAgo}
            </Text>
          </View>
          <View style={styles.conversationFooter}>
            <Text
              style={[styles.conversationPreview, { color: colors.muted }]}
              numberOfLines={1}
            >
              {item.lastMessagePreview || "No messages yet"}
            </Text>
            {item.unreadCount > 0 && (
              <View
                style={[
                  styles.unreadBadge,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Text style={styles.unreadText}>{item.unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </Pressable>
    );
  };

  if (isLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <Stack.Screen options={{ title: "Messages" }} />
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Stack.Screen
        options={{
          title: "Messages",
          headerShown: true,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.foreground,
        }}
      />
      <FlatList
        data={conversations || []}
        renderItem={renderConversation}
        keyExtractor={(item: any) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              No Messages Yet
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
              Visit an actor's profile and tap "Message" to start a conversation.
            </Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "now";
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

const styles = StyleSheet.create({
  listContainer: {
    flexGrow: 1,
  },
  conversationRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    gap: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "700",
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  conversationTime: {
    fontSize: 13,
    marginLeft: 8,
  },
  conversationFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  conversationPreview: {
    fontSize: 14,
    flex: 1,
  },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  unreadText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 120,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
});
