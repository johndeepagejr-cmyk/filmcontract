import { Modal, View, Text, TouchableOpacity, Pressable } from "react-native";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

export interface QuickAction {
  label: string;
  icon: string;
  onPress: () => void;
  destructive?: boolean;
}

interface QuickActionsMenuProps {
  visible: boolean;
  onClose: () => void;
  actions: QuickAction[];
  title?: string;
}

export function QuickActionsMenu({ visible, onClose, actions, title }: QuickActionsMenuProps) {
  const colors = useColors();

  const handleActionPress = (action: QuickAction) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onClose();
    // Delay action execution slightly to allow modal to close smoothly
    setTimeout(() => action.onPress(), 100);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable
        className="flex-1 bg-black/50 justify-end"
        onPress={onClose}
      >
        <Pressable
          className="bg-background rounded-t-3xl p-6 gap-2"
          style={{ backgroundColor: colors.background }}
          onPress={(e) => e.stopPropagation()}
        >
          {title && (
            <View className="pb-2 border-b border-border mb-2">
              <Text className="text-lg font-bold text-foreground text-center">
                {title}
              </Text>
            </View>
          )}

          {actions.map((action, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => handleActionPress(action)}
              className="flex-row items-center gap-3 p-4 rounded-xl bg-surface active:opacity-70"
              style={{ backgroundColor: colors.surface }}
            >
              <Text className="text-2xl">{action.icon}</Text>
              <Text
                className={`text-base font-semibold ${
                  action.destructive ? "text-error" : "text-foreground"
                }`}
                style={{
                  color: action.destructive ? colors.error : colors.foreground,
                }}
              >
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            onPress={onClose}
            className="p-4 rounded-xl bg-border/30 mt-2 active:opacity-70"
          >
            <Text className="text-base font-semibold text-center text-muted">
              Cancel
            </Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
