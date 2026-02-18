import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator, StyleSheet, TextInput, Alert, Platform } from "react-native";
import { useState, useCallback } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { router, useLocalSearchParams } from "expo-router";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import * as ImagePicker from "expo-image-picker";

type Step = 1 | 2 | 3;

export default function SelfTapeUploadFlow() {
  const { castingId } = useLocalSearchParams<{ castingId: string }>();
  const { user } = useAuth();
  const colors = useColors();
  const [step, setStep] = useState<Step>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: Video
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [videoName, setVideoName] = useState<string>("");

  // Step 2: Slate info
  const [slateName, setSlateName] = useState(user?.name || "");
  const [slateHeight, setSlateHeight] = useState("");
  const [slateLocation, setSlateLocation] = useState("");
  const [slateAgency, setSlateAgency] = useState("");

  // Step 3: Additional materials
  const [notes, setNotes] = useState("");
  const [resumeUri, setResumeUri] = useState<string | null>(null);
  const [headshotUri, setHeadshotUri] = useState<string | null>(null);

  const submitMutation = trpc.casting.submit.useMutation({
    onSuccess: () => {
      Alert.alert("Submitted!", "Your self-tape has been submitted successfully.", [
        { text: "OK", onPress: () => router.back() },
      ]);
      setIsSubmitting(false);
    },
    onError: (err) => {
      Alert.alert("Error", err.message || "Failed to submit self-tape");
      setIsSubmitting(false);
    },
  });

  const pickVideo = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["videos"],
        quality: 0.8,
        videoMaxDuration: 300, // 5 min max
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        // Check file size (2GB limit)
        if (asset.fileSize && asset.fileSize > 2 * 1024 * 1024 * 1024) {
          Alert.alert("File Too Large", "Video must be under 2GB. Please trim or compress your video.");
          return;
        }
        setVideoUri(asset.uri);
        setVideoName(asset.fileName || "self-tape.mp4");
      }
    } catch (err) {
      Alert.alert("Error", "Failed to pick video. Please try again.");
    }
  }, []);

  const recordVideo = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Camera permission is needed to record a self-tape.");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["videos"],
        quality: 0.8,
        videoMaxDuration: 300,
      });
      if (!result.canceled && result.assets[0]) {
        setVideoUri(result.assets[0].uri);
        setVideoName(result.assets[0].fileName || "self-tape.mp4");
      }
    } catch (err) {
      Alert.alert("Error", "Failed to record video. Please try again.");
    }
  }, []);

  const pickImage = useCallback(async (setter: (uri: string) => void) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        setter(result.assets[0].uri);
      }
    } catch (err) {
      Alert.alert("Error", "Failed to pick image.");
    }
  }, []);

  const handleSubmit = () => {
    if (!castingId) {
      Alert.alert("Error", "Missing casting call ID");
      return;
    }
    setIsSubmitting(true);
    const slateInfo = `Name: ${slateName}\nHeight: ${slateHeight}\nLocation: ${slateLocation}\nAgency: ${slateAgency}`;
    const fullNotes = `${slateInfo}\n\nNotes: ${notes}`;
    submitMutation.mutate({
      castingCallId: parseInt(castingId, 10),
      videoUrl: videoUri || undefined,
      notes: fullNotes,
    });
  };

  const canProceedStep1 = !!videoUri;
  const canProceedStep2 = slateName.trim().length > 0;

  const stepLabels = ["Select Video", "Slate Info", "Review & Submit"];

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (step > 1 ? setStep((step - 1) as Step) : router.back())} style={styles.backBtn}>
          <IconSymbol name="arrow.left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.screenTitle, { color: colors.foreground }]}>Self-Tape</Text>
        <Text style={[styles.stepIndicator, { color: colors.muted }]}>Step {step}/3</Text>
      </View>

      {/* Progress Bar */}
      <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
        <View style={[styles.progressFill, { width: `${(step / 3) * 100}%`, backgroundColor: colors.primary }]} />
      </View>

      {/* Step Labels */}
      <View style={styles.stepLabelsRow}>
        {stepLabels.map((label, idx) => (
          <View key={idx} style={styles.stepLabelItem}>
            <View style={[styles.stepDot, { backgroundColor: idx + 1 <= step ? colors.primary : colors.border }]}>
              {idx + 1 < step ? (
                <IconSymbol name="checkmark" size={12} color="#fff" />
              ) : (
                <Text style={[styles.stepDotText, { color: idx + 1 <= step ? "#fff" : colors.muted }]}>{idx + 1}</Text>
              )}
            </View>
            <Text style={[styles.stepLabel, { color: idx + 1 === step ? colors.primary : colors.muted }]}>{label}</Text>
          </View>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Step 1: Video Selection */}
        {step === 1 && (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>Record or Select Your Self-Tape</Text>
            <Text style={[styles.stepDesc, { color: colors.muted }]}>
              Upload a video (max 2GB, 5 min) or record directly from your camera.
            </Text>

            {videoUri ? (
              <View style={[styles.videoPreview, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={[styles.videoIcon, { backgroundColor: colors.primary + "15" }]}>
                  <IconSymbol name="film" size={32} color={colors.primary} />
                </View>
                <Text style={[styles.videoFileName, { color: colors.foreground }]} numberOfLines={1}>{videoName}</Text>
                <Text style={[styles.videoReady, { color: colors.success }]}>Ready to upload</Text>
                <TouchableOpacity onPress={() => { setVideoUri(null); setVideoName(""); }} style={styles.removeBtn}>
                  <Text style={[styles.removeBtnText, { color: colors.error }]}>Remove</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.videoActions}>
                <TouchableOpacity
                  onPress={recordVideo}
                  style={[styles.videoActionBtn, { backgroundColor: colors.primary }]}
                  activeOpacity={0.8}
                >
                  <IconSymbol name="camera.fill" size={24} color="#fff" />
                  <Text style={styles.videoActionText}>Record Video</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={pickVideo}
                  style={[styles.videoActionBtn, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}
                  activeOpacity={0.8}
                >
                  <IconSymbol name="photo" size={24} color={colors.primary} />
                  <Text style={[styles.videoActionText, { color: colors.foreground }]}>Choose from Library</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={[styles.tipCard, { backgroundColor: colors.warning + "10", borderColor: colors.warning + "30" }]}>
              <Text style={[styles.tipTitle, { color: colors.warning }]}>Tips for a Great Self-Tape</Text>
              <Text style={[styles.tipText, { color: colors.muted }]}>
                {"\u2022"} Use good lighting (natural light is best){"\n"}
                {"\u2022"} Frame from chest up{"\n"}
                {"\u2022"} Use a neutral background{"\n"}
                {"\u2022"} Ensure clear audio{"\n"}
                {"\u2022"} Start with your slate
              </Text>
            </View>
          </View>
        )}

        {/* Step 2: Slate Info */}
        {step === 2 && (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>Slate Information</Text>
            <Text style={[styles.stepDesc, { color: colors.muted }]}>
              This info will overlay your self-tape slate. Fill in your details.
            </Text>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.foreground }]}>Full Name *</Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]}
                value={slateName}
                onChangeText={setSlateName}
                placeholder="Your full name"
                placeholderTextColor={colors.muted}
                returnKeyType="next"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.foreground }]}>Height</Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]}
                value={slateHeight}
                onChangeText={setSlateHeight}
                placeholder={'e.g., 5\'10"'}
                placeholderTextColor={colors.muted}
                returnKeyType="next"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.foreground }]}>Location</Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]}
                value={slateLocation}
                onChangeText={setSlateLocation}
                placeholder="e.g., Los Angeles, CA"
                placeholderTextColor={colors.muted}
                returnKeyType="next"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.foreground }]}>Agency (optional)</Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]}
                value={slateAgency}
                onChangeText={setSlateAgency}
                placeholder="Your agency name"
                placeholderTextColor={colors.muted}
                returnKeyType="done"
              />
            </View>
          </View>
        )}

        {/* Step 3: Review & Submit */}
        {step === 3 && (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>Review & Submit</Text>
            <Text style={[styles.stepDesc, { color: colors.muted }]}>
              Review your submission details before sending.
            </Text>

            {/* Summary */}
            <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.summaryTitle, { color: colors.foreground }]}>Submission Summary</Text>

              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.muted }]}>Video</Text>
                <Text style={[styles.summaryValue, { color: colors.success }]}>{videoName || "Not selected"}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.muted }]}>Name</Text>
                <Text style={[styles.summaryValue, { color: colors.foreground }]}>{slateName}</Text>
              </View>
              {slateHeight && (
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: colors.muted }]}>Height</Text>
                  <Text style={[styles.summaryValue, { color: colors.foreground }]}>{slateHeight}</Text>
                </View>
              )}
              {slateLocation && (
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: colors.muted }]}>Location</Text>
                  <Text style={[styles.summaryValue, { color: colors.foreground }]}>{slateLocation}</Text>
                </View>
              )}
              {slateAgency && (
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: colors.muted }]}>Agency</Text>
                  <Text style={[styles.summaryValue, { color: colors.foreground }]}>{slateAgency}</Text>
                </View>
              )}
            </View>

            {/* Additional materials */}
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.foreground }]}>Additional Notes</Text>
              <TextInput
                style={[styles.formTextarea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Any additional information for the casting director..."
                placeholderTextColor={colors.muted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Attach headshot/resume */}
            <View style={styles.attachRow}>
              <TouchableOpacity
                onPress={() => pickImage(setHeadshotUri)}
                style={[styles.attachBtn, { backgroundColor: colors.surface, borderColor: headshotUri ? colors.success : colors.border }]}
                activeOpacity={0.7}
              >
                <IconSymbol name="person.fill" size={20} color={headshotUri ? colors.success : colors.muted} />
                <Text style={[styles.attachText, { color: headshotUri ? colors.success : colors.muted }]}>
                  {headshotUri ? "Headshot Added" : "Add Headshot"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => pickImage(setResumeUri)}
                style={[styles.attachBtn, { backgroundColor: colors.surface, borderColor: resumeUri ? colors.success : colors.border }]}
                activeOpacity={0.7}
              >
                <IconSymbol name="doc.text.fill" size={20} color={resumeUri ? colors.success : colors.muted} />
                <Text style={[styles.attachText, { color: resumeUri ? colors.success : colors.muted }]}>
                  {resumeUri ? "Resume Added" : "Add Resume"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={[styles.bottomBar, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        {step > 1 && (
          <TouchableOpacity
            onPress={() => setStep((step - 1) as Step)}
            style={[styles.secondaryBtn, { borderColor: colors.border }]}
            activeOpacity={0.7}
          >
            <Text style={[styles.secondaryBtnText, { color: colors.foreground }]}>Back</Text>
          </TouchableOpacity>
        )}
        {step < 3 ? (
          <TouchableOpacity
            onPress={() => setStep((step + 1) as Step)}
            style={[
              styles.primaryBtn,
              { backgroundColor: colors.primary, flex: step === 1 ? 1 : undefined },
              (step === 1 && !canProceedStep1) && { opacity: 0.5 },
              (step === 2 && !canProceedStep2) && { opacity: 0.5 },
            ]}
            activeOpacity={0.8}
            disabled={(step === 1 && !canProceedStep1) || (step === 2 && !canProceedStep2)}
          >
            <Text style={styles.primaryBtnText}>Continue</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleSubmit}
            style={[styles.primaryBtn, { backgroundColor: colors.primary }, isSubmitting && { opacity: 0.7 }]}
            activeOpacity={0.8}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>Submit Self-Tape</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  backBtn: { padding: 4 },
  screenTitle: { fontSize: 20, fontWeight: "800", flex: 1 },
  stepIndicator: { fontSize: 14, fontWeight: "600" },
  progressBar: { height: 3, marginHorizontal: 16, borderRadius: 2, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 2 },
  stepLabelsRow: { flexDirection: "row", paddingHorizontal: 16, paddingVertical: 14, justifyContent: "space-between" },
  stepLabelItem: { alignItems: "center", gap: 4, flex: 1 },
  stepDot: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  stepDotText: { fontSize: 12, fontWeight: "700" },
  stepLabel: { fontSize: 11, fontWeight: "600" },
  content: { paddingHorizontal: 16, paddingBottom: 120 },
  stepContent: { gap: 16 },
  stepTitle: { fontSize: 22, fontWeight: "800" },
  stepDesc: { fontSize: 14, lineHeight: 20 },
  videoPreview: { borderRadius: 16, padding: 24, borderWidth: 1, alignItems: "center", gap: 10 },
  videoIcon: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center" },
  videoFileName: { fontSize: 15, fontWeight: "600", maxWidth: 250 },
  videoReady: { fontSize: 13, fontWeight: "600" },
  removeBtn: { marginTop: 4, padding: 8 },
  removeBtnText: { fontSize: 14, fontWeight: "600" },
  videoActions: { gap: 12 },
  videoActionBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 18, borderRadius: 14 },
  videoActionText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  tipCard: { borderRadius: 14, padding: 16, borderWidth: 1, gap: 6 },
  tipTitle: { fontSize: 14, fontWeight: "700" },
  tipText: { fontSize: 13, lineHeight: 22 },
  formGroup: { gap: 6 },
  formLabel: { fontSize: 14, fontWeight: "600" },
  formInput: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  formTextarea: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, minHeight: 100 },
  summaryCard: { borderRadius: 14, padding: 16, borderWidth: 1, gap: 10 },
  summaryTitle: { fontSize: 16, fontWeight: "700", marginBottom: 4 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between" },
  summaryLabel: { fontSize: 14 },
  summaryValue: { fontSize: 14, fontWeight: "600" },
  attachRow: { flexDirection: "row", gap: 12 },
  attachBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 12, borderWidth: 1 },
  attachText: { fontSize: 13, fontWeight: "600" },
  bottomBar: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", gap: 12, paddingHorizontal: 16, paddingVertical: 12, paddingBottom: 32, borderTopWidth: 1 },
  secondaryBtn: { paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14, borderWidth: 1 },
  secondaryBtnText: { fontSize: 15, fontWeight: "600" },
  primaryBtn: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 14, borderRadius: 14 },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
