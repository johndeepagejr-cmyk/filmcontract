import { View, Text, TouchableOpacity, Modal, Platform, Alert } from "react-native";
import { useState, useRef } from "react";
import SignatureCanvas from "react-native-signature-canvas";

interface SignatureCaptureProps {
  visible: boolean;
  onClose: () => void;
  onSave: (signature: string) => void;
  title?: string;
}

export function SignatureCapture({ visible, onClose, onSave, title = "Sign Contract" }: SignatureCaptureProps) {
  const [signature, setSignature] = useState<string | null>(null);
  const signatureRef = useRef<any>(null);

  const handleSignature = (sig: string) => {
    setSignature(sig);
  };

  const handleClear = () => {
    signatureRef.current?.clearSignature();
    setSignature(null);
  };

  const handleSave = () => {
    if (!signature) {
      if (Platform.OS === "web") {
        alert("Please provide a signature before saving");
      } else {
        Alert.alert("Error", "Please provide a signature before saving");
      }
      return;
    }
    onSave(signature);
    handleClear();
    onClose();
  };

  const handleCancel = () => {
    handleClear();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={handleCancel}
    >
      <View className="flex-1 bg-background">
        {/* Header */}
        <View className="bg-primary px-6 py-4 pt-12">
          <Text className="text-white text-2xl font-bold">{title}</Text>
          <Text className="text-white/80 text-sm mt-1">Sign with your finger or stylus</Text>
        </View>

        {/* Signature Canvas */}
        <View className="flex-1 bg-white m-4 rounded-xl overflow-hidden border-2 border-border">
          <SignatureCanvas
            ref={signatureRef}
            onOK={handleSignature}
            onEmpty={() => setSignature(null)}
            descriptionText=""
            clearText="Clear"
            confirmText="Done"
            webStyle={`
              .m-signature-pad {
                box-shadow: none;
                border: none;
                margin: 0;
              }
              .m-signature-pad--body {
                border: none;
              }
              .m-signature-pad--footer {
                display: none;
              }
              body, html {
                width: 100%;
                height: 100%;
              }
            `}
          />
        </View>

        {/* Actions */}
        <View className="px-6 pb-8 gap-3">
          <TouchableOpacity
            onPress={handleClear}
            className="bg-surface border border-border px-6 py-4 rounded-xl items-center active:opacity-80"
          >
            <Text className="text-foreground text-lg font-semibold">Clear Signature</Text>
          </TouchableOpacity>

          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={handleCancel}
              className="flex-1 bg-surface border border-border px-6 py-4 rounded-xl items-center active:opacity-80"
            >
              <Text className="text-foreground text-lg font-semibold">Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSave}
              className="flex-1 bg-primary px-6 py-4 rounded-xl items-center active:opacity-80"
            >
              <Text className="text-white text-lg font-semibold">Save Signature</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
