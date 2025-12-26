import { View, Text, TouchableOpacity, ActivityIndicator, Alert, Platform } from "react-native";
import { trpc } from "@/lib/trpc";
import * as DocumentPicker from "expo-document-picker";
import { useState } from "react";
import * as FileSystem from "expo-file-system/legacy";

interface ContractAttachmentsProps {
  contractId: number;
}

export function ContractAttachments({ contractId }: ContractAttachmentsProps) {
  const [uploading, setUploading] = useState(false);
  
  const { data: attachments, isLoading, refetch } = trpc.contracts.getAttachments.useQuery({
    contractId,
  });
  
  const uploadMutation = trpc.contracts.uploadAttachment.useMutation();
  const deleteMutation = trpc.contracts.deleteAttachment.useMutation();

  const handleUpload = async () => {
    try {
      setUploading(true);
      
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setUploading(false);
        return;
      }

      const file = result.assets[0];
      
      // Read file as base64
      const base64 = await FileSystem.readAsStringAsync(file.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Upload to server
      await uploadMutation.mutateAsync({
        contractId,
        fileName: file.name,
        fileType: file.mimeType || "application/octet-stream",
        fileSize: file.size || 0,
        fileData: base64,
      });

      await refetch();
      
      if (Platform.OS === "web") {
        alert("File uploaded successfully!");
      } else {
        Alert.alert("Success", "File uploaded successfully!");
      }
    } catch (error) {
      console.error("Upload error:", error);
      if (Platform.OS === "web") {
        alert("Failed to upload file. Please try again.");
      } else {
        Alert.alert("Error", "Failed to upload file. Please try again.");
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (attachmentId: number, fileName: string) => {
    const confirmed = Platform.OS === "web" 
      ? window.confirm(`Delete ${fileName}?`)
      : await new Promise((resolve) => {
          Alert.alert(
            "Delete Attachment",
            `Are you sure you want to delete ${fileName}?`,
            [
              { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
              { text: "Delete", style: "destructive", onPress: () => resolve(true) },
            ]
          );
        });

    if (!confirmed) return;

    try {
      await deleteMutation.mutateAsync({ attachmentId });
      await refetch();
      
      if (Platform.OS === "web") {
        alert("File deleted successfully!");
      } else {
        Alert.alert("Success", "File deleted successfully!");
      }
    } catch (error) {
      console.error("Delete error:", error);
      if (Platform.OS === "web") {
        alert("Failed to delete file. Please try again.");
      } else {
        Alert.alert("Error", "Failed to delete file. Please try again.");
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (isLoading) {
    return (
      <View className="bg-surface border border-border rounded-xl p-4">
        <ActivityIndicator color="#1E40AF" />
      </View>
    );
  }

  return (
    <View className="bg-surface border border-border rounded-xl p-4">
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-lg font-bold text-foreground">📎 Attachments</Text>
        <TouchableOpacity
          onPress={handleUpload}
          disabled={uploading}
          className="bg-primary px-4 py-2 rounded-lg active:opacity-80"
          style={{ opacity: uploading ? 0.6 : 1 }}
        >
          {uploading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text className="text-white font-semibold">Upload File</Text>
          )}
        </TouchableOpacity>
      </View>

      {attachments && attachments.length > 0 ? (
        <View className="gap-3">
          {attachments.map((attachment) => (
            <View
              key={attachment.id}
              className="bg-background border border-border rounded-lg p-3"
            >
              <View className="flex-row items-start justify-between">
                <View className="flex-1">
                  <Text className="text-foreground font-semibold mb-1">
                    {attachment.fileName}
                  </Text>
                  <Text className="text-sm text-muted">
                    {formatFileSize(attachment.fileSize)} • {new Date(attachment.uploadedAt).toLocaleDateString()}
                  </Text>
                </View>
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    onPress={() => {
                      // Open file in browser
                      if (Platform.OS === "web") {
                        window.open(attachment.fileUrl, "_blank");
                      }
                    }}
                    className="bg-primary px-3 py-1 rounded active:opacity-80"
                  >
                    <Text className="text-white text-sm">Download</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDelete(attachment.id, attachment.fileName)}
                    className="bg-error px-3 py-1 rounded active:opacity-80"
                  >
                    <Text className="text-white text-sm">Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <Text className="text-muted text-center py-4">No attachments yet</Text>
      )}
    </View>
  );
}
