import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { CameraView, useCameraPermissions, useMicrophonePermissions } from "expo-camera";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import * as Haptics from "expo-haptics";

type RecordingState = "idle" | "countdown" | "recording" | "paused" | "preview";

export default function RecordScreen() {
  const colors = useColors();
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();

  const [facing, setFacing] = useState<"front" | "back">("front");
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [countdown, setCountdown] = useState(3);
  const [recordingTime, setRecordingTime] = useState(0);
  const [videoUri, setVideoUri] = useState<string | null>(null);

  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Request permissions on mount
  useEffect(() => {
    if (!cameraPermission?.granted) {
      requestCameraPermission();
    }
    if (!micPermission?.granted) {
      requestMicPermission();
    }
  }, []);

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const startCountdown = () => {
    setRecordingState("countdown");
    setCountdown(3);
    
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    countdownTimerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
          startRecording();
          return 0;
        }
        if (Platform.OS !== "web") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startRecording = async () => {
    if (!cameraRef.current) return;

    setRecordingState("recording");
    setRecordingTime(0);

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    // Start timer
    recordingTimerRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);

    try {
      const video = await cameraRef.current.recordAsync({
        maxDuration: 300, // 5 minutes max
      });
      
      if (video?.uri) {
        setVideoUri(video.uri);
        setRecordingState("preview");
      }
    } catch (error) {
      console.error("Recording error:", error);
      Alert.alert("Error", "Failed to record video");
      setRecordingState("idle");
    }
  };

  const stopRecording = async () => {
    if (!cameraRef.current) return;

    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    try {
      await cameraRef.current.stopRecording();
    } catch (error) {
      console.error("Stop recording error:", error);
    }
  };

  const toggleCamera = () => {
    setFacing((prev) => (prev === "front" ? "back" : "front"));
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleRetake = () => {
    setVideoUri(null);
    setRecordingState("idle");
    setRecordingTime(0);
  };

  const handleUseVideo = () => {
    if (videoUri) {
      // Navigate to edit screen with video URI
      router.push({
        pathname: "/self-tapes/edit",
        params: { videoUri, duration: recordingTime.toString() },
      });
    }
  };

  const handleClose = () => {
    if (recordingState === "recording") {
      Alert.alert(
        "Stop Recording?",
        "Are you sure you want to stop and discard this recording?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Stop",
            style: "destructive",
            onPress: async () => {
              await stopRecording();
              router.back();
            },
          },
        ]
      );
    } else {
      router.back();
    }
  };

  // Permission check
  if (!cameraPermission?.granted || !micPermission?.granted) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center p-6">
        <IconSymbol name="video.fill" size={64} color={colors.muted} />
        <Text
          style={{
            fontSize: 20,
            fontWeight: "600",
            color: colors.foreground,
            marginTop: 24,
            textAlign: "center",
          }}
        >
          Camera & Microphone Access Required
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: colors.muted,
            marginTop: 12,
            textAlign: "center",
          }}
        >
          Please grant camera and microphone permissions to record self-tapes.
        </Text>
        <TouchableOpacity
          onPress={() => {
            requestCameraPermission();
            requestMicPermission();
          }}
          style={{
            backgroundColor: colors.primary,
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 24,
            marginTop: 24,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>
            Grant Permissions
          </Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera View */}
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        mode="video"
      >
        {/* Top Controls */}
        <View style={styles.topControls}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <IconSymbol name="xmark" size={24} color="#fff" />
          </TouchableOpacity>

          {recordingState === "recording" && (
            <View style={styles.recordingIndicator}>
              <View style={styles.recordingDot} />
              <Text style={styles.recordingTime}>{formatTime(recordingTime)}</Text>
            </View>
          )}

          <TouchableOpacity
            onPress={toggleCamera}
            style={styles.flipButton}
            disabled={recordingState === "recording"}
          >
            <IconSymbol name="arrow.triangle.2.circlepath" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Countdown Overlay */}
        {recordingState === "countdown" && (
          <View style={styles.countdownOverlay}>
            <Text style={styles.countdownText}>{countdown}</Text>
          </View>
        )}

        {/* Bottom Controls */}
        <View style={styles.bottomControls}>
          {recordingState === "idle" && (
            <>
              <View style={{ width: 50 }} />
              <TouchableOpacity onPress={startCountdown} style={styles.recordButton}>
                <View style={styles.recordButtonInner} />
              </TouchableOpacity>
              <View style={{ width: 50 }} />
            </>
          )}

          {recordingState === "recording" && (
            <>
              <View style={{ width: 50 }} />
              <TouchableOpacity onPress={stopRecording} style={styles.stopButton}>
                <View style={styles.stopButtonInner} />
              </TouchableOpacity>
              <View style={{ width: 50 }} />
            </>
          )}

          {recordingState === "preview" && (
            <>
              <TouchableOpacity onPress={handleRetake} style={styles.actionButton}>
                <IconSymbol name="arrow.counterclockwise" size={24} color="#fff" />
                <Text style={styles.actionButtonText}>Retake</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleUseVideo}
                style={[styles.actionButton, { backgroundColor: colors.primary }]}
              >
                <IconSymbol name="checkmark" size={24} color="#fff" />
                <Text style={styles.actionButtonText}>Use Video</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Recording Tips */}
        {recordingState === "idle" && (
          <View style={styles.tipsContainer}>
            <Text style={styles.tipsText}>
              Tap the record button to start a 3-second countdown
            </Text>
            <Text style={styles.tipsSubtext}>
              Use good lighting • Face the camera • Speak clearly
            </Text>
          </View>
        )}
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  camera: {
    flex: 1,
  },
  topControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  flipButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  recordingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#EF4444",
    marginRight: 8,
  },
  recordingTime: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  bottomControls: {
    position: "absolute",
    bottom: 60,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 40,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  recordButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#EF4444",
  },
  stopButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  stopButtonInner: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: "#EF4444",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  countdownOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  countdownText: {
    fontSize: 120,
    fontWeight: "bold",
    color: "#fff",
  },
  tipsContainer: {
    position: "absolute",
    bottom: 160,
    left: 20,
    right: 20,
    alignItems: "center",
  },
  tipsText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  tipsSubtext: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
