import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, TextInput } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useRouter } from "expo-router";
import { useState } from "react";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

export default function MessagesScreen() {
  const colors = useColors();
  const router = useRouter();
  const { data: conversations, isLoading } = trpc.social.getConversations.useQuery();
  const sendMessageMutation = trpc.social.sendMessage.useMutation();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);

  const handleSendMessage = async () => {
    if (!selectedUserId || !messageText.trim()) return;

    try {
      setSending(true);
      await sendMessageMutation.mutateAsync({
        recipientId: selectedUserId,
        content: messageText,
      });
      setMessageText("");
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setSending(false);
    }
  };

  if (isLoading) {
    return (
      <ScreenContainer className="p-6">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-0 flex-1">
      <View className="flex-1 flex-row">
        {/* Conversations List */}
        <ScrollView className="flex-1 bg-surface border-r border-border">
          <View className="p-4 gap-2">
            <Text className="text-lg font-bold text-foreground mb-4">Messages</Text>

            {conversations && conversations.length > 0 ? (
              conversations.map((user: any) => (
                <TouchableOpacity
                  key={user.id}
                  onPress={() => {
                    setSelectedUserId(user.id);
                    if (Platform.OS !== "web") {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                  }}
                  className={`p-3 rounded-lg ${
                    selectedUserId === user.id ? "bg-primary" : "bg-background"
                  }`}
                >
                  <Text
                    className={`font-semibold ${
                      selectedUserId === user.id ? "text-white" : "text-foreground"
                    }`}
                  >
                    {user.name || "Unknown"}
                  </Text>
                  <Text
                    className={`text-xs mt-1 ${
                      selectedUserId === user.id ? "text-white/70" : "text-muted"
                    }`}
                  >
                    {user.userRole === "producer" ? "🎬 Producer" : "🎭 Actor"}
                  </Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text className="text-sm text-muted text-center py-8">
                No conversations yet
              </Text>
            )}
          </View>
        </ScrollView>

        {/* Message Compose Area */}
        {selectedUserId ? (
          <View className="flex-1 flex-col bg-background">
            <View className="flex-1 p-4 gap-4">
              <Text className="text-lg font-bold text-foreground">
                {conversations?.find((u: any) => u.id === selectedUserId)?.name || "User"}
              </Text>
              <View className="flex-1 bg-surface rounded-lg p-4">
                <Text className="text-sm text-muted text-center">
                  Conversation history will appear here
                </Text>
              </View>
            </View>

            {/* Message Input */}
            <View className="p-4 gap-3 border-t border-border">
              <TextInput
                value={messageText}
                onChangeText={setMessageText}
                placeholder="Type a message..."
                placeholderTextColor="#9CA3AF"
                className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
                multiline
                maxLength={1000}
              />
              <TouchableOpacity
                onPress={handleSendMessage}
                disabled={!messageText.trim() || sending}
                className={`px-6 py-3 rounded-lg ${
                  messageText.trim() && !sending ? "bg-primary" : "bg-muted"
                }`}
              >
                <Text className={`text-center font-semibold ${
                  messageText.trim() && !sending ? "text-white" : "text-foreground"
                }`}>
                  {sending ? "Sending..." : "Send"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View className="flex-1 items-center justify-center">
            <Text className="text-lg text-muted">Select a conversation to start messaging</Text>
          </View>
        )}
      </View>
    </ScreenContainer>
  );
}
