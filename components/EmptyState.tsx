import { Text, View, TouchableOpacity, StyleSheet } from "react-native";
import { useColors } from "@/hooks/use-colors";

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  const colors = useColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
      <Text style={[styles.description, { color: colors.muted }]}>{description}</Text>
      {actionLabel && onAction && (
        <TouchableOpacity
          onPress={onAction}
          style={[styles.button, { backgroundColor: colors.primary }]}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: 16, padding: 32, borderWidth: 1, alignItems: "center", gap: 8, borderStyle: "dashed" },
  icon: { fontSize: 40 },
  title: { fontSize: 17, fontWeight: "700" },
  description: { fontSize: 13, textAlign: "center", lineHeight: 18, maxWidth: 260 },
  button: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, marginTop: 8 },
  buttonText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
