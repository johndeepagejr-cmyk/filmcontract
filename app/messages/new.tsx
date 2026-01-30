import { View, Text, TextInput, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { CustomHeader } from "@/components/custom-header";
import { trpc } from "@/lib/trpc";
import { useLocalSearchParams, router } from "expo-router";
import { useColors } from "@/hooks/use-colors";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useState } from "react";

export default function NewMessageScreen() {
  const colors = useColors();
  const { recipientId, name } = useLocalSearchParams<{ recipientId: string; name: string }>();
  const [message, setMessage] = useState("");

  const startConversation = trpc.messaging.startConversation.useMutation();
  const sendMessage = trpc.messaging.sendMessage.useMutation();

  const handleSend = async () => {
    if (!message.trim() || !recipientId) return;

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    try {
      // Start or get existing conversation
      const conv = await startConversation.mutateAsync({ recipientId: parseInt(recipientId) });

      // Send the message
      await sendMessage.mutateAsync({
        conversationId: conv.id,
        content: message.trim(),
      });

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Navigate to the conversation
      router.replace({
        pathname: "/messages/[id]",
        params: { id: conv.id.toString(), name: name || "User" },
      });
    } catch (error) {
      console.error("Error sending message:", error);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
  };

  const isPending = startConversation.isPending || sendMessage.isPending;

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <CustomHeader title={`Message ${name || "User"}`} showBack={true} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <View style={{ flex: 1, padding: 16 }}>
          {/* Recipient Info */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              padding: 16,
              backgroundColor: colors.surface,
              borderRadius: 12,
              marginBottom: 16,
            }}
          >
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
                {(name || "U").charAt(0).toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground }}>
                {name || "User"}
              </Text>
              <Text style={{ fontSize: 14, color: colors.muted }}>
                Start a new conversation
              </Text>
            </View>
          </View>

          {/* Message Input */}
          <Text style={{ fontSize: 14, fontWeight: "500", color: colors.foreground, marginBottom: 8 }}>
            Your Message
          </Text>
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Type your message here..."
            placeholderTextColor={colors.muted}
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 16,
              fontSize: 16,
              color: colors.foreground,
              minHeight: 150,
              textAlignVertical: "top",
            }}
            multiline
            autoFocus
          />

          {/* Send Button */}
          <Pressable
            onPress={handleSend}
            disabled={!message.trim() || isPending}
            style={({ pressed }) => [
              {
                marginTop: 16,
                backgroundColor: message.trim() ? colors.primary : colors.surface,
                borderRadius: 12,
                padding: 16,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            {isPending ? (
              <ActivityIndicator size="small" color={colors.background} />
            ) : (
              <>
                <Ionicons
                  name="send"
                  size={20}
                  color={message.trim() ? colors.background : colors.muted}
                  style={{ marginRight: 8 }}
                />
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: message.trim() ? colors.background : colors.muted,
                  }}
                >
                  Send Message
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
