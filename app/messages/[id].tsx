import { View, Text, FlatList, TextInput, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { CustomHeader } from "@/components/custom-header";
import { trpc } from "@/lib/trpc";
import { useLocalSearchParams } from "expo-router";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useState, useRef, useEffect } from "react";

export default function ChatScreen() {
  const colors = useColors();
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
  const conversationId = parseInt(id || "0");
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const flatListRef = useRef<FlatList>(null);

  const { data: messages, isLoading, refetch } = trpc.messaging.getMessages.useQuery(
    { conversationId },
    { enabled: conversationId > 0, refetchInterval: 5000 }
  );

  const sendMessage = trpc.messaging.sendMessage.useMutation({
    onSuccess: () => {
      setMessage("");
      refetch();
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    },
  });

  const handleSend = () => {
    if (!message.trim()) return;
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    sendMessage.mutate({
      conversationId,
      content: message.trim(),
    });
  };

  const formatTime = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) {
      return "Today";
    } else if (d.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return d.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });
    }
  };

  // Group messages by date
  const groupedMessages = messages?.reduce((groups: any[], msg: any) => {
    const date = formatDate(msg.createdAt);
    const lastGroup = groups[groups.length - 1];

    if (lastGroup && lastGroup.date === date) {
      lastGroup.messages.push(msg);
    } else {
      groups.push({ date, messages: [msg] });
    }
    return groups;
  }, []);

  useEffect(() => {
    if (messages && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const renderMessage = ({ item }: { item: any }) => {
    const isMe = item.senderId === user?.id;

    return (
      <View
        style={{
          alignSelf: isMe ? "flex-end" : "flex-start",
          maxWidth: "80%",
          marginVertical: 4,
          marginHorizontal: 16,
        }}
      >
        <View
          style={{
            backgroundColor: isMe ? colors.primary : colors.surface,
            borderRadius: 18,
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderBottomRightRadius: isMe ? 4 : 18,
            borderBottomLeftRadius: isMe ? 18 : 4,
          }}
        >
          <Text
            style={{
              color: isMe ? colors.background : colors.foreground,
              fontSize: 16,
            }}
          >
            {item.content}
          </Text>
        </View>
        <Text
          style={{
            fontSize: 11,
            color: colors.muted,
            marginTop: 4,
            alignSelf: isMe ? "flex-end" : "flex-start",
            marginHorizontal: 4,
          }}
        >
          {formatTime(item.createdAt)}
          {isMe && item.isRead && " ✓"}
        </Text>
      </View>
    );
  };

  const renderDateHeader = (date: string) => (
    <View style={{ alignItems: "center", marginVertical: 16 }}>
      <View
        style={{
          backgroundColor: colors.surface,
          paddingHorizontal: 12,
          paddingVertical: 4,
          borderRadius: 12,
        }}
      >
        <Text style={{ fontSize: 12, color: colors.muted }}>{date}</Text>
      </View>
    </View>
  );

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <CustomHeader title={name || "Chat"} showBack={true} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {isLoading ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={groupedMessages?.flatMap((group: any) => [
              { type: "header", date: group.date, id: `header-${group.date}` },
              ...group.messages.map((msg: any) => ({ ...msg, type: "message" })),
            ])}
            keyExtractor={(item) => item.type === "header" ? item.id : item.id.toString()}
            renderItem={({ item }) =>
              item.type === "header" ? renderDateHeader(item.date) : renderMessage({ item })
            }
            contentContainerStyle={{ paddingVertical: 8 }}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          />
        )}

        {/* Message Input */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            padding: 12,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            backgroundColor: colors.background,
          }}
        >
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Type a message..."
            placeholderTextColor={colors.muted}
            style={{
              flex: 1,
              backgroundColor: colors.surface,
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 10,
              fontSize: 16,
              color: colors.foreground,
              maxHeight: 100,
            }}
            multiline
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />
          <Pressable
            onPress={handleSend}
            disabled={!message.trim() || sendMessage.isPending}
            style={({ pressed }) => [
              {
                marginLeft: 8,
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: message.trim() ? colors.primary : colors.surface,
                justifyContent: "center",
                alignItems: "center",
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            {sendMessage.isPending ? (
              <ActivityIndicator size="small" color={colors.background} />
            ) : (
              <Ionicons
                name="send"
                size={20}
                color={message.trim() ? colors.background : colors.muted}
              />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
