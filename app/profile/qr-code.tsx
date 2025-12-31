import { View, Text, TouchableOpacity, Alert, Platform } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { router } from "expo-router";
import QRCode from "react-native-qrcode-svg";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";
import { captureRef } from "react-native-view-shot";
import { useRef } from "react";

export default function QRCodeScreen() {
  const { user } = useAuth();
  const qrRef = useRef<View>(null);

  if (!user?.id) {
    return (
      <ScreenContainer className="items-center justify-center p-6">
        <Text className="text-lg text-muted">Please sign in to generate QR code</Text>
      </ScreenContainer>
    );
  }

  const portfolioUrl = `https://8081-ia6sbgycqgi78h1m3wxmm-268d213c.us2.manus.computer/public-portfolio/${user.id}`;

  const handleDownload = async () => {
    try {
      if (!qrRef.current) return;

      // Capture the QR code as image
      const uri = await captureRef(qrRef, {
        format: "png",
        quality: 1,
      });

      if (Platform.OS === "web") {
        // On web, download directly
        const link = document.createElement("a");
        link.download = `filmcontract-qr-${user.id}.png`;
        link.href = uri;
        link.click();
      } else {
        // On mobile, share the image
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(uri);
        } else {
          Alert.alert("Success", "QR code saved!");
        }
      }
    } catch (error) {
      console.error("Error downloading QR code:", error);
      Alert.alert("Error", "Failed to download QR code");
    }
  };

  return (
    <ScreenContainer className="p-6">
      <View className="flex-1 gap-6">
        {/* Header */}
        <View className="gap-2">
          <TouchableOpacity onPress={() => router.back()} className="self-start">
            <Text className="text-primary text-base">← Back</Text>
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-foreground">Portfolio QR Code</Text>
          <Text className="text-base text-muted">
            Share this QR code on business cards, headshots, or anywhere else. People can scan it to view your portfolio instantly!
          </Text>
        </View>

        {/* QR Code Display */}
        <View className="items-center gap-6 py-8">
          <View
            ref={qrRef}
            className="bg-white p-8 rounded-2xl"
            style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 }}
          >
            <QRCode
              value={portfolioUrl}
              size={250}
              backgroundColor="white"
              color="black"
            />
          </View>

          <View className="items-center gap-2">
            <Text className="text-sm font-semibold text-foreground">Scan to view portfolio</Text>
            <Text className="text-xs text-muted text-center px-4">
              {portfolioUrl}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="gap-3">
          <TouchableOpacity
            onPress={handleDownload}
            className="bg-primary py-4 rounded-full active:opacity-80"
          >
            <Text className="text-white text-center font-semibold text-base">
              Download QR Code
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-surface py-4 rounded-full active:opacity-80"
          >
            <Text className="text-foreground text-center font-semibold text-base">
              Close
            </Text>
          </TouchableOpacity>
        </View>

        {/* Instructions */}
        <View className="bg-surface rounded-2xl p-6 gap-3">
          <Text className="text-lg font-semibold text-foreground">How to use:</Text>
          <View className="gap-2">
            <Text className="text-sm text-muted">• Download and print on business cards</Text>
            <Text className="text-sm text-muted">• Add to the back of headshots</Text>
            <Text className="text-sm text-muted">• Include in email signatures</Text>
            <Text className="text-sm text-muted">• Share on social media</Text>
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
}
