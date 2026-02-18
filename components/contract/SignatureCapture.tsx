import { useState, useRef, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform, Alert } from "react-native";
import { Button, Card, Modal } from "@/components/ui/design-system";
import { Typography, Spacing, Radius } from "@/constants/design-tokens";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import * as Haptics from "expo-haptics";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSequence, Easing } from "react-native-reanimated";

interface Props {
  contractId: number;
  signerName: string;
  signerRole: "producer" | "actor";
  onSigned?: () => void;
  alreadySigned?: boolean;
}

export function SignatureCapture({ contractId, signerName, signerRole, onSigned, alreadySigned = false }: Props) {
  const colors = useColors();
  const accent = (colors as any).accent || "#C9963B";
  const [showModal, setShowModal] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(alreadySigned);

  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const signContract = trpc.contracts.signContract.useMutation({
    onSuccess: () => {
      setSigned(true);
      setShowModal(false);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSigned?.();
    },
    onError: (err: any) => {
      Alert.alert("Error", err.message || "Failed to sign contract");
    },
  });

  const handleSign = async () => {
    if (!agreed) {
      Alert.alert("Agreement Required", "Please agree to the terms before signing.");
      return;
    }
    setSigning(true);
    scale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withTiming(1.05, { duration: 150 }),
      withTiming(1, { duration: 100 })
    );
    try {
      await signContract.mutateAsync({ contractId, signature: signerName, role: signerRole });
    } finally {
      setSigning(false);
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (signed) {
    return (
      <Card>
        <View style={{ alignItems: "center", gap: 12, paddingVertical: 8 }}>
          <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.success + "20", alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 28 }}>✓</Text>
          </View>
          <View style={{ alignItems: "center" }}>
            <Text style={[Typography.h3, { color: colors.success }]}>Signed</Text>
            <Text style={[Typography.caption, { color: colors.muted }]}>
              {signerName} ({signerRole === "producer" ? "Producer" : "Actor"})
            </Text>
          </View>
          <View style={{ borderTopWidth: 1, borderTopColor: colors.border, width: "60%", paddingTop: 8, alignItems: "center" }}>
            <Text style={{ fontStyle: "italic", fontSize: 18, color: colors.foreground }}>{signerName}</Text>
            <Text style={[Typography.caption, { color: colors.muted, marginTop: 2 }]}>Digital Signature</Text>
          </View>
        </View>
      </Card>
    );
  }

  return (
    <>
      <Card onPress={() => setShowModal(true)}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: accent + "15", alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 20 }}>✍️</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[Typography.h3, { color: colors.foreground }]}>Sign Contract</Text>
            <Text style={[Typography.caption, { color: colors.muted }]}>Tap to review and sign as {signerRole}</Text>
          </View>
          <Text style={{ color: accent, fontSize: 18 }}>›</Text>
        </View>
      </Card>

      <Modal
        visible={showModal}
        onClose={() => setShowModal(false)}
        title="Sign Contract"
        footer={
          <View style={{ flexDirection: "row", gap: 12, flex: 1 }}>
            <Button title="Cancel" onPress={() => setShowModal(false)} variant="ghost" />
            <View style={{ flex: 1 }}>
              <Button title="Sign Now" onPress={handleSign} variant="accent" loading={signing} disabled={!agreed} fullWidth />
            </View>
          </View>
        }
      >
        <View style={{ gap: Spacing.lg }}>
          <Text style={[Typography.bodySm, { color: colors.foreground }]}>
            By signing this contract, you ({signerName}) agree to all terms and conditions outlined in this agreement.
          </Text>

          {/* Agreement Checkbox */}
          <TouchableOpacity
            onPress={() => {
              setAgreed(!agreed);
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            activeOpacity={0.7}
            style={{ flexDirection: "row", gap: 12, alignItems: "flex-start" }}
          >
            <View style={{
              width: 24, height: 24, borderRadius: 6, borderWidth: 2,
              borderColor: agreed ? colors.success : colors.border,
              backgroundColor: agreed ? colors.success : "transparent",
              alignItems: "center", justifyContent: "center",
            }}>
              {agreed && <Text style={{ color: "#fff", fontSize: 14, fontWeight: "800" }}>✓</Text>}
            </View>
            <Text style={[Typography.bodySm, { color: colors.foreground, flex: 1 }]}>
              I have read and agree to all terms, conditions, and provisions in this contract. I understand this constitutes a legally binding digital signature.
            </Text>
          </TouchableOpacity>

          {/* Signature Preview */}
          <Animated.View style={animatedStyle}>
            <View style={{
              borderWidth: 1, borderColor: colors.border, borderRadius: Radius.md,
              padding: 20, alignItems: "center", backgroundColor: colors.background,
              borderStyle: "dashed",
            }}>
              <Text style={{ fontStyle: "italic", fontSize: 24, color: agreed ? colors.foreground : colors.muted }}>
                {signerName}
              </Text>
              <Text style={[Typography.caption, { color: colors.muted, marginTop: 4 }]}>
                {signerRole === "producer" ? "Producer" : "Actor"} • {new Date().toLocaleDateString()}
              </Text>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}
