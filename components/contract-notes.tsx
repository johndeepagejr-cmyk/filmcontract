import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";

interface ContractNotesProps {
  contractId: number;
}

export function ContractNotes({ contractId }: ContractNotesProps) {
  const { user } = useAuth();
  const [newNote, setNewNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: notes, isLoading, refetch } = trpc.contracts.getNotes.useQuery(
    { contractId },
    { enabled: !!contractId }
  );

  const addNoteMutation = trpc.contracts.addNote.useMutation();

  const handleSubmitNote = async () => {
    if (!newNote.trim() || !user) return;

    try {
      setIsSubmitting(true);
      await addNoteMutation.mutateAsync({
        contractId,
        message: newNote.trim(),
      });
      setNewNote("");
      await refetch();
    } catch (error) {
      console.error("Error adding note:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (date: string | Date) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
    >
      <View className="gap-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-lg font-bold text-foreground">💬 Discussion</Text>
          {notes && notes.length > 0 && (
            <Text className="text-sm text-muted">{notes.length} comment{notes.length !== 1 ? "s" : ""}</Text>
          )}
        </View>

        {/* Notes List */}
        {isLoading ? (
          <View className="py-8 items-center">
            <ActivityIndicator color="#1E40AF" />
          </View>
        ) : notes && notes.length > 0 ? (
          <View className="gap-3 max-h-96">
            <ScrollView className="gap-3" nestedScrollEnabled>
              {notes.map((note) => (
                <View
                  key={note.id}
                  className={`p-4 rounded-xl ${
                    note.userId === user?.id
                      ? "bg-primary/10 border border-primary/30"
                      : "bg-surface border border-border"
                  }`}
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center gap-2">
                      <Text className="text-sm font-semibold text-foreground">
                        {note.userName}
                      </Text>
                      <View
                        className={`px-2 py-0.5 rounded ${
                          note.userRole === "producer" ? "bg-primary" : "bg-success"
                        }`}
                      >
                        <Text className="text-xs font-bold text-white uppercase">
                          {note.userRole}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-xs text-muted">{formatDate(note.createdAt)}</Text>
                  </View>
                  <Text className="text-base text-foreground leading-relaxed">
                    {note.message}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        ) : (
          <View className="py-8 items-center">
            <Text className="text-base text-muted text-center">
              No comments yet. Start a discussion!
            </Text>
          </View>
        )}

        {/* Add Note Input */}
        <View className="gap-2">
          <TextInput
            value={newNote}
            onChangeText={setNewNote}
            placeholder="Add a comment or question..."
            placeholderTextColor="#9BA1A6"
            multiline
            numberOfLines={3}
            className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground text-base"
            style={{ textAlignVertical: "top" }}
          />
          <TouchableOpacity
            onPress={handleSubmitNote}
            disabled={!newNote.trim() || isSubmitting}
            className="bg-primary px-6 py-3 rounded-xl items-center active:opacity-80"
            style={{ opacity: !newNote.trim() || isSubmitting ? 0.5 : 1 }}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-white text-base font-semibold">Post Comment</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
