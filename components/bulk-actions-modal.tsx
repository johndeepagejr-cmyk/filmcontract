import { View, Text, TouchableOpacity, Modal, ActivityIndicator, Alert } from "react-native";
import { useState } from "react";
import { generateContractPDF } from "@/lib/pdf-generator";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

interface BulkActionsModalProps {
  visible: boolean;
  onClose: () => void;
  selectedCount: number;
  contracts: any[];
  onComplete: () => void;
}

export function BulkActionsModal({
  visible,
  onClose,
  selectedCount,
  contracts,
  onComplete,
}: BulkActionsModalProps) {
  const [exporting, setExporting] = useState(false);

  const handleBulkExportPDF = async () => {
    try {
      setExporting(true);
      Alert.alert(
        "Export PDFs",
        `This will export ${selectedCount} contract(s) as PDF files.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Export",
            onPress: async () => {
              for (const contract of contracts) {
                await generateContractPDF(contract);
              }
              Alert.alert("Success", `Exported ${selectedCount} PDF(s) successfully!`);
              onComplete();
              onClose();
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error exporting PDFs:", error);
      Alert.alert("Error", "Failed to export PDFs. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-background rounded-t-3xl p-6">
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-xl font-bold text-foreground">
              Bulk Actions ({selectedCount} selected)
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text className="text-lg text-primary font-semibold">Done</Text>
            </TouchableOpacity>
          </View>

          <View className="gap-3">
            {/* Export PDFs */}
            <TouchableOpacity
              onPress={handleBulkExportPDF}
              disabled={exporting}
              className="bg-surface border border-border px-6 py-4 rounded-xl active:opacity-80"
              style={{ opacity: exporting ? 0.6 : 1 }}
            >
              {exporting ? (
                <View className="flex-row items-center gap-3">
                  <ActivityIndicator color="#1E40AF" />
                  <Text className="text-foreground text-base font-semibold">Exporting...</Text>
                </View>
              ) : (
                <Text className="text-foreground text-base font-semibold">📄 Export All as PDFs</Text>
              )}
            </TouchableOpacity>

            {/* Cancel */}
            <TouchableOpacity
              onPress={onClose}
              className="bg-surface border border-border px-6 py-4 rounded-xl active:opacity-80"
            >
              <Text className="text-muted text-base font-semibold text-center">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
