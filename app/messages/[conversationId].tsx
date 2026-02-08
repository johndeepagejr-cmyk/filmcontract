import { useState, useRef, useEffect } from "react";
import {
  Text,
  View,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { Stack, useLocalSearchParams } from "expo-router";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import * as Haptics from "expo-haptics";

export default function ChatScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const convId = parseInt(conversationId || "0", 10);
  const colors = useColors();
  const { user } = useAuth();
  const [messageText, setMessageText] = useState("");
  const flatListRef = useRef<FlatList>(null);

  const { data: messages, isLoading, refetch } =
    trpc.messaging.getMessages.useQuery(
      { conversationId: convId },
      { enabled: !!convId, refetchInterval: 3000 }
    );

  const { data: conversations } = trpc.messaging.getConversations.useQuery();
  const sendMessage = trpc.messaging.sendMessage.useMutation({
    onSuccess: () => {
      setMessageText("");
      refetch();
    },
  });

  // Find the other user's name from conversations
  const currentConversation = conversations?.find((c: any) => c.id === convId);
  const otherUserName = currentConversation?.otherUser?.name || "Chat";

  const handleSend = async () => {
    if (!messageText.trim()) return;
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    try {
      await sendMessage.mutateAsync({
        conversationId: convId,
        content: messageText.trim(),
      });
    } catch (error) {
      // silently fail
    }
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isMe = item.senderId === user?.id;
    return (
      <View
        style={[
          styles.messageBubbleRow,
          isMe ? styles.myMessageRow : styles.theirMessageRow,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isMe
              ? [styles.myBubble, { backgroundColor: colors.primary }]
              : [styles.theirBubble, { backgroundColor: colors.surface }],
          ]}
        >
          <Text
            style={[
              styles.messageText,
              { color: isMe ? "#fff" : colors.foreground },
            ]}
          >
            {item.content}
          </Text>
          <Text
            style={[
              styles.messageTime,
              { color: isMe ? "rgba(255,255,255,0.7)" : colors.muted },
            ]}
          >
            {new Date(item.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <Stack.Screen options={{ title: otherUserName }} />
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <Stack.Screen
        options={{
          title: otherUserName,
          headerShown: true,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.foreground,
        }}
      />
      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={90}
      >
        <FlatList
          ref={flatListRef}
          data={messages || []}
          renderItem={renderMessage}
          keyExtractor={(item: any) => item.id.toString()}
          contentContainerStyle={styles.messagesList}
          inverted={false}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.muted }]}>
                No messages yet. Say hello! 👋
              </Text>
            </View>
          }
        />

        {/* Message Input Bar */}
        <View
          style={[
            styles.inputBar,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
            },
          ]}
        >
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: colors.surface,
                color: colors.foreground,
                borderColor: colors.border,
              },
            ]}
            value={messageText}
            onChangeText={setMessageText}
            placeholder="Type a message..."
            placeholderTextColor={colors.muted}
            multiline
            maxLength={2000}
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />
          <Pressable
            onPress={handleSend}
            disabled={!messageText.trim() || sendMessage.isPending}
            style={({ pressed }) => [
              styles.sendButton,
              {
                backgroundColor: messageText.trim()
                  ? colors.primary
                  : colors.surface,
              },
              pressed && { opacity: 0.8, transform: [{ scale: 0.95 }] },
            ]}
          >
            <Text
              style={[
                styles.sendButtonText,
                {
                  color: messageText.trim() ? "#fff" : colors.muted,
                },
              ]}
            >
              ➤
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  messagesList: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexGrow: 1,
  },
  messageBubbleRow: {
    marginVertical: 3,
    flexDirection: "row",
  },
  myMessageRow: {
    justifyContent: "flex-end",
  },
  theirMessageRow: {
    justifyContent: "flex-start",
  },
  messageBubble: {
    maxWidth: "78%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  myBubble: {
    borderBottomRightRadius: 4,
  },
  theirBubble: {
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
    alignSelf: "flex-end",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 0.5,
    gap: 8,
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    borderWidth: 1,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonText: {
    fontSize: 20,
  },
});
