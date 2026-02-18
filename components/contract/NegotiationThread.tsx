import { useState } from "react";
import { View, Text, FlatList, TouchableOpacity, TextInput, Platform, KeyboardAvoidingView } from "react-native";
import { Card, Button } from "@/components/ui/design-system";
import { Typography, Spacing, Radius } from "@/constants/design-tokens";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import * as Haptics from "expo-haptics";

interface NegotiationMessage {
  id: number;
  contractId: number;
  userId: number;
  userName: string;
  userRole: string;
  message: string;
  type: string;
  createdAt: string;
}

interface Props {
  contractId: number;
  currentUserId: number;
}

export function NegotiationThread({ contractId, currentUserId }: Props) {
  const colors = useColors();
  const accent = (colors as any).accent || "#C9963B";
  const [message, setMessage] = useState("");

  const { data: negotiations, refetch } = trpc.contracts.getNotes.useQuery({ contractId });
  const addNote = trpc.contracts.addNote.useMutation({
    onSuccess: () => {
      refetch();
      setMessage("");
    },
  });

  const handleSend = () => {
    if (!message.trim()) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addNote.mutate({ contractId, message: message.trim() });
  };

  const handleCounterOffer = () => {
    if (!message.trim()) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    addNote.mutate({ contractId, message: `[COUNTER OFFER] ${message.trim()}` });
  };

  const renderMessage = ({ item }: { item: NegotiationMessage }) => {
    const isMe = item.userId === currentUserId;
    const isCounterOffer = typeof item.message === "string" && item.message.startsWith("[COUNTER OFFER]");
    const isSystemMsg = false;

    if (isSystemMsg) {
      return (
        <View style={{ alignItems: "center", paddingVertical: 8 }}>
          <View style={{ backgroundColor: colors.surface, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 12 }}>
            <Text style={[Typography.caption, { color: colors.muted, fontStyle: "italic" }]}>{item.message}</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={{ alignItems: isMe ? "flex-end" : "flex-start", marginBottom: 12 }}>
        <View style={{ maxWidth: "80%", gap: 4 }}>
          <Text style={[Typography.caption, { color: colors.muted, paddingHorizontal: 4 }]}>
            {item.userName} • {item.userRole === "producer" ? "Producer" : "Actor"}
          </Text>
          <View style={{
            backgroundColor: isMe ? colors.primary : colors.surface,
            borderRadius: 16,
            borderTopRightRadius: isMe ? 4 : 16,
            borderTopLeftRadius: isMe ? 16 : 4,
            padding: 12,
            borderWidth: isCounterOffer ? 2 : 0,
            borderColor: isCounterOffer ? accent : "transparent",
          }}>
            {isCounterOffer && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 6 }}>
                <Text style={{ fontSize: 12 }}>💰</Text>
                <Text style={[Typography.labelSm, { color: isMe ? "#fff" : accent }]}>Counter Offer</Text>
              </View>
            )}
            <Text style={[Typography.bodySm, { color: isMe ? "#fff" : colors.foreground }]}>{item.message}</Text>
          </View>
          <Text style={[Typography.caption, { color: colors.muted, fontSize: 10, paddingHorizontal: 4 }]}>
            {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <Text style={[Typography.h2, { color: colors.foreground }]}>Negotiation</Text>
          <Text style={[Typography.caption, { color: colors.muted }]}>
            {(negotiations as any)?.length || 0} messages
          </Text>
        </View>

        {/* Messages */}
        <FlatList
          data={(negotiations as any) || []}
          renderItem={renderMessage}
          keyExtractor={(item: any) => String(item.id)}
          contentContainerStyle={{ padding: Spacing.lg, flexGrow: 1 }}
          inverted={false}
          ListEmptyComponent={
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 40 }}>
              <Text style={{ fontSize: 40 }}>💬</Text>
              <Text style={[Typography.bodySm, { color: colors.muted, textAlign: "center", marginTop: 8 }]}>
                No messages yet. Start the negotiation by sending a message.
              </Text>
            </View>
          }
        />

        {/* Input */}
        <View style={{ borderTopWidth: 1, borderTopColor: colors.border, padding: Spacing.md, backgroundColor: colors.background }}>
          <View style={{ flexDirection: "row", gap: 8, alignItems: "flex-end" }}>
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="Type a message..."
              placeholderTextColor={colors.muted}
              multiline
              style={{
                flex: 1,
                backgroundColor: colors.surface,
                borderRadius: Radius.lg,
                paddingHorizontal: 16,
                paddingVertical: 10,
                color: colors.foreground,
                fontSize: 15,
                maxHeight: 100,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            />
            <View style={{ gap: 4 }}>
              <TouchableOpacity
                onPress={handleSend}
                disabled={!message.trim() || addNote.isPending}
                activeOpacity={0.7}
                style={{
                  width: 40, height: 40, borderRadius: 20,
                  backgroundColor: message.trim() ? colors.primary : colors.surface,
                  alignItems: "center", justifyContent: "center",
                }}
              >
                <Text style={{ color: message.trim() ? "#fff" : colors.muted, fontSize: 16 }}>↑</Text>
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity
            onPress={handleCounterOffer}
            disabled={!message.trim() || addNote.isPending}
            activeOpacity={0.7}
            style={{ marginTop: 8, alignSelf: "flex-start" }}
          >
            <Text style={[Typography.labelSm, { color: message.trim() ? accent : colors.muted }]}>
              💰 Send as Counter Offer
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
