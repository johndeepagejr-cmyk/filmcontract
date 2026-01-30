import { View, Text, FlatList, Pressable, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { CustomHeader } from "@/components/custom-header";
import { trpc } from "@/lib/trpc";
import { router } from "expo-router";
import { useColors } from "@/hooks/use-colors";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

export default function MessagesScreen() {
  const colors = useColors();
  const { data: conversations, isLoading, refetch } = trpc.messaging.getConversations.useQuery();

  const handleConversationPress = (conversationId: number, otherUserName: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push({
      pathname: "/messages/[id]",
      params: { id: conversationId.toString(), name: otherUserName },
    });
  };

  const formatTime = (date: Date | string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else if (days === 1) {
      return "Yesterday";
    } else if (days < 7) {
      return d.toLocaleDateString([], { weekday: "short" });
    } else {
      return d.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  const renderConversation = ({ item }: { item: any }) => (
    <Pressable
      onPress={() => handleConversationPress(item.id, item.otherUser?.name || "User")}
      style={({ pressed }) => [
        {
          backgroundColor: pressed ? colors.surface : colors.background,
          padding: 16,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          flexDirection: "row",
          alignItems: "center",
        },
      ]}
    >
      {/* Avatar */}
      <View
        style={{
          width: 50,
          height: 50,
          borderRadius: 25,
          backgroundColor: colors.primary,
          justifyContent: "center",
          alignItems: "center",
          marginRight: 12,
        }}
      >
        <Text style={{ color: colors.background, fontSize: 20, fontWeight: "bold" }}>
          {(item.otherUser?.name || "U").charAt(0).toUpperCase()}
        </Text>
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: item.unreadCount > 0 ? "bold" : "600",
              color: colors.foreground,
            }}
          >
            {item.otherUser?.name || "Unknown User"}
          </Text>
          <Text style={{ fontSize: 12, color: colors.muted }}>
            {formatTime(item.lastMessageAt)}
          </Text>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
          <Text
            style={{
              fontSize: 14,
              color: item.unreadCount > 0 ? colors.foreground : colors.muted,
              fontWeight: item.unreadCount > 0 ? "500" : "normal",
              flex: 1,
            }}
            numberOfLines={1}
          >
            {item.lastMessagePreview || "No messages yet"}
          </Text>
          {item.unreadCount > 0 && (
            <View
              style={{
                backgroundColor: colors.primary,
                borderRadius: 10,
                minWidth: 20,
                height: 20,
                justifyContent: "center",
                alignItems: "center",
                marginLeft: 8,
                paddingHorizontal: 6,
              }}
            >
              <Text style={{ color: colors.background, fontSize: 12, fontWeight: "bold" }}>
                {item.unreadCount}
              </Text>
            </View>
          )}
        </View>
        <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
          {item.otherUser?.userRole === "producer" ? "Producer" : "Actor"}
        </Text>
      </View>
    </Pressable>
  );

  return (
    <ScreenContainer>
      <CustomHeader title="Messages" showBack={true} />

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.muted, marginTop: 12 }}>Loading conversations...</Text>
        </View>
      ) : conversations && conversations.length > 0 ? (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderConversation}
          refreshing={false}
          onRefresh={refetch}
        />
      ) : (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
          <Ionicons name="chatbubbles-outline" size={64} color={colors.muted} />
          <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground, marginTop: 16 }}>
            No Messages Yet
          </Text>
          <Text style={{ fontSize: 14, color: colors.muted, textAlign: "center", marginTop: 8 }}>
            Start a conversation by messaging an actor or producer from their profile.
          </Text>
        </View>
      )}
    </ScreenContainer>
  );
}
