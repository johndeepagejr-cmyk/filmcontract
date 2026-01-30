import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Video, ResizeMode, AVPlaybackStatus } from "expo-av";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import * as Haptics from "expo-haptics";

const FEEDBACK_TYPES = [
  { value: "positive", label: "Positive", color: "#22C55E" },
  { value: "constructive", label: "Constructive", color: "#F59E0B" },
  { value: "question", label: "Question", color: "#3B82F6" },
  { value: "general", label: "General", color: "#6B7280" },
] as const;

export default function SelfTapeDetailScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const selfTapeId = parseInt(id || "0");

  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);

  // Feedback state
  const [feedbackNote, setFeedbackNote] = useState("");
  const [feedbackType, setFeedbackType] = useState<"positive" | "constructive" | "question" | "general">("general");
  const [addingFeedback, setAddingFeedback] = useState(false);

  // Rating state
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [fitScore, setFitScore] = useState(5);
  const [energyScore, setEnergyScore] = useState(5);
  const [deliveryScore, setDeliveryScore] = useState(5);
  const [technicalScore, setTechnicalScore] = useState(5);
  const [overallScore, setOverallScore] = useState(5);
  const [ratingSummary, setRatingSummary] = useState("");
  const [wouldConsider, setWouldConsider] = useState(true);

  // Revision state
  const [showRevisionForm, setShowRevisionForm] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState("");
  const [revisionPriority, setRevisionPriority] = useState<"low" | "medium" | "high">("medium");

  const isProducer = user?.userRole === "producer";

  const { data: selfTape, isLoading, refetch } = trpc.selfTape.getSelfTape.useQuery(
    { selfTapeId },
    { enabled: !!selfTapeId }
  );

  const submitMutation = trpc.selfTape.submitSelfTape.useMutation({
    onSuccess: () => {
      Alert.alert("Success", "Self-tape submitted for review!");
      refetch();
    },
    onError: (error) => Alert.alert("Error", error.message),
  });

  const addFeedbackMutation = trpc.selfTape.addFeedback.useMutation({
    onSuccess: () => {
      setFeedbackNote("");
      setAddingFeedback(false);
      refetch();
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    },
    onError: (error) => Alert.alert("Error", error.message),
  });

  const submitRatingMutation = trpc.selfTape.submitRating.useMutation({
    onSuccess: () => {
      setShowRatingForm(false);
      refetch();
      Alert.alert("Success", "Rating submitted!");
    },
    onError: (error) => Alert.alert("Error", error.message),
  });

  const requestRevisionMutation = trpc.selfTape.requestRevision.useMutation({
    onSuccess: () => {
      setShowRevisionForm(false);
      setRevisionNotes("");
      refetch();
      Alert.alert("Success", "Revision requested!");
    },
    onError: (error) => Alert.alert("Error", error.message),
  });

  const updateStatusMutation = trpc.selfTape.updateStatus.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: (error) => Alert.alert("Error", error.message),
  });

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setCurrentTime(status.positionMillis / 1000);
      if (status.durationMillis) {
        setVideoDuration(status.durationMillis / 1000);
      }
      setIsPlaying(status.isPlaying);
    }
  };

  const handlePlayPause = async () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      await videoRef.current.pauseAsync();
    } else {
      await videoRef.current.playAsync();
    }
  };

  const handleSeekToFeedback = async (timestamp: number | null) => {
    if (!videoRef.current || timestamp === null) return;
    await videoRef.current.setPositionAsync(timestamp * 1000);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleAddFeedback = () => {
    if (!feedbackNote.trim()) {
      Alert.alert("Error", "Please enter feedback");
      return;
    }

    addFeedbackMutation.mutate({
      selfTapeId,
      timestampSeconds: Math.floor(currentTime),
      note: feedbackNote.trim(),
      feedbackType,
    });
  };

  const handleSubmitRating = () => {
    submitRatingMutation.mutate({
      selfTapeId,
      fitScore,
      energyScore,
      deliveryScore,
      technicalScore,
      overallScore,
      summary: ratingSummary.trim() || undefined,
      wouldConsider,
    });
  };

  const handleRequestRevision = () => {
    if (!revisionNotes.trim()) {
      Alert.alert("Error", "Please describe the changes needed");
      return;
    }

    requestRevisionMutation.mutate({
      selfTapeId,
      requestedChanges: revisionNotes.trim(),
      priority: revisionPriority,
    });
  };

  const handleApprove = () => {
    Alert.alert(
      "Approve Self-Tape",
      "Are you sure you want to approve this self-tape?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve",
          onPress: () => updateStatusMutation.mutate({ selfTapeId, status: "approved" }),
        },
      ]
    );
  };

  const handleReject = () => {
    Alert.alert(
      "Reject Self-Tape",
      "Are you sure you want to reject this self-tape?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject",
          style: "destructive",
          onPress: () => updateStatusMutation.mutate({ selfTapeId, status: "rejected" }),
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  if (!selfTape) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center p-6">
        <Text style={{ color: colors.foreground, fontSize: 18 }}>
          Self-tape not found
        </Text>
      </ScreenContainer>
    );
  }

  const isOwner = selfTape.actorId === user?.id;
  const canReview = isProducer && selfTape.status !== "draft";

  return (
    <ScreenContainer className="flex-1">
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground }}>
          Self-Tape
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={{ flex: 1 }}>
        {/* Video Player */}
        <View style={{ backgroundColor: "#000" }}>
          <Video
            ref={videoRef}
            source={{ uri: selfTape.videoUrl }}
            style={{ width: "100%", aspectRatio: 9 / 16 }}
            resizeMode={ResizeMode.CONTAIN}
            onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
            shouldPlay={false}
          />

          {/* Slate Overlay */}
          {selfTape.slateEnabled && selfTape.slateText && (
            <View style={styles.slateOverlay}>
              <Text style={styles.slateText}>{selfTape.slateText}</Text>
            </View>
          )}

          {/* Play Button */}
          <TouchableOpacity onPress={handlePlayPause} style={styles.playButton}>
            <IconSymbol
              name={isPlaying ? "pause.fill" : "play.fill"}
              size={32}
              color="#fff"
            />
          </TouchableOpacity>

          {/* Timeline with feedback markers */}
          <View style={styles.timelineContainer}>
            <View
              style={[
                styles.progressBar,
                { width: `${(currentTime / videoDuration) * 100}%` },
              ]}
            />
            {/* Feedback markers */}
            {selfTape.feedback?.map((fb: any) => (
              fb.timestampSeconds !== null && (
                <TouchableOpacity
                  key={fb.id}
                  onPress={() => handleSeekToFeedback(fb.timestampSeconds)}
                  style={[
                    styles.feedbackMarker,
                    {
                      left: `${(fb.timestampSeconds / videoDuration) * 100}%`,
                      backgroundColor: FEEDBACK_TYPES.find(t => t.value === fb.feedbackType)?.color || "#6B7280",
                    },
                  ]}
                />
              )
            ))}
          </View>

          {/* Time display */}
          <View style={styles.timeDisplay}>
            <Text style={styles.timeText}>
              {formatTime(currentTime)} / {formatTime(videoDuration)}
            </Text>
          </View>
        </View>

        <View style={{ padding: 16 }}>
          {/* Project Info */}
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: "600", color: colors.foreground }}>
              {selfTape.projectTitle}
            </Text>
            {selfTape.characterName && (
              <Text style={{ fontSize: 16, color: colors.muted, marginTop: 4 }}>
                {selfTape.characterName}
              </Text>
            )}
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8, gap: 8 }}>
              <View
                style={{
                  backgroundColor: selfTape.status === "approved" ? "#22C55E" : 
                                   selfTape.status === "rejected" ? "#EF4444" :
                                   selfTape.status === "revision_requested" ? "#8B5CF6" :
                                   selfTape.status === "under_review" ? "#F59E0B" :
                                   selfTape.status === "submitted" ? "#3B82F6" : "#6B7280",
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 4,
                }}
              >
                <Text style={{ color: "#fff", fontSize: 12, fontWeight: "500" }}>
                  {selfTape.status.replace("_", " ").toUpperCase()}
                </Text>
              </View>
              {selfTape.isRevision && (
                <Text style={{ color: colors.muted, fontSize: 12 }}>
                  Revision #{selfTape.revisionNumber}
                </Text>
              )}
            </View>
            {selfTape.roleDescription && (
              <Text style={{ color: colors.muted, marginTop: 12, lineHeight: 20 }}>
                {selfTape.roleDescription}
              </Text>
            )}
            {selfTape.actorNotes && (
              <View style={{ marginTop: 12, padding: 12, backgroundColor: colors.background, borderRadius: 8 }}>
                <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 4 }}>Actor Notes</Text>
                <Text style={{ color: colors.foreground }}>{selfTape.actorNotes}</Text>
              </View>
            )}
          </View>

          {/* Submit Button (for drafts) */}
          {isOwner && selfTape.status === "draft" && (
            <TouchableOpacity
              onPress={() => submitMutation.mutate({ selfTapeId })}
              disabled={submitMutation.isPending}
              style={{
                backgroundColor: colors.primary,
                padding: 16,
                borderRadius: 12,
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              {submitMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
                  Submit for Review
                </Text>
              )}
            </TouchableOpacity>
          )}

          {/* Producer Actions */}
          {canReview && selfTape.status !== "approved" && selfTape.status !== "rejected" && (
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground, marginBottom: 12 }}>
                Actions
              </Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <TouchableOpacity
                  onPress={handleApprove}
                  style={{
                    flex: 1,
                    backgroundColor: "#22C55E",
                    padding: 12,
                    borderRadius: 8,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "#fff", fontWeight: "600" }}>Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShowRevisionForm(true)}
                  style={{
                    flex: 1,
                    backgroundColor: "#8B5CF6",
                    padding: 12,
                    borderRadius: 8,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "#fff", fontWeight: "600" }}>Request Revision</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleReject}
                  style={{
                    flex: 1,
                    backgroundColor: "#EF4444",
                    padding: 12,
                    borderRadius: 8,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "#fff", fontWeight: "600" }}>Reject</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Add Feedback (Producer) */}
          {canReview && (
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 16,
                marginBottom: 16,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground, marginBottom: 12 }}>
                Add Feedback at {formatTime(currentTime)}
              </Text>

              {/* Feedback Type */}
              <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
                {FEEDBACK_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    onPress={() => setFeedbackType(type.value)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 16,
                      backgroundColor: feedbackType === type.value ? type.color : colors.background,
                    }}
                  >
                    <Text
                      style={{
                        color: feedbackType === type.value ? "#fff" : colors.foreground,
                        fontSize: 12,
                        fontWeight: "500",
                      }}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                value={feedbackNote}
                onChangeText={setFeedbackNote}
                placeholder="Enter your feedback..."
                placeholderTextColor={colors.muted}
                multiline
                style={{
                  backgroundColor: colors.background,
                  borderRadius: 8,
                  padding: 12,
                  color: colors.foreground,
                  minHeight: 80,
                  textAlignVertical: "top",
                  marginBottom: 12,
                }}
              />

              <TouchableOpacity
                onPress={handleAddFeedback}
                disabled={addFeedbackMutation.isPending}
                style={{
                  backgroundColor: colors.primary,
                  padding: 12,
                  borderRadius: 8,
                  alignItems: "center",
                }}
              >
                {addFeedbackMutation.isPending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={{ color: "#fff", fontWeight: "600" }}>Add Feedback</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Rating Section */}
          {canReview && (
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 16,
                marginBottom: 16,
              }}
            >
              <TouchableOpacity
                onPress={() => setShowRatingForm(!showRatingForm)}
                style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
              >
                <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>
                  Rate Performance
                </Text>
                <IconSymbol
                  name={showRatingForm ? "chevron.up" : "chevron.down"}
                  size={20}
                  color={colors.muted}
                />
              </TouchableOpacity>

              {showRatingForm && (
                <View style={{ marginTop: 16 }}>
                  {/* Rating sliders */}
                  {[
                    { label: "Fit for Role", value: fitScore, setter: setFitScore },
                    { label: "Energy/Presence", value: energyScore, setter: setEnergyScore },
                    { label: "Delivery", value: deliveryScore, setter: setDeliveryScore },
                    { label: "Technical Quality", value: technicalScore, setter: setTechnicalScore },
                    { label: "Overall", value: overallScore, setter: setOverallScore },
                  ].map((item) => (
                    <View key={item.label} style={{ marginBottom: 16 }}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                        <Text style={{ color: colors.foreground }}>{item.label}</Text>
                        <Text style={{ color: colors.primary, fontWeight: "600" }}>{item.value}/10</Text>
                      </View>
                      <View style={{ flexDirection: "row", gap: 4 }}>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                          <TouchableOpacity
                            key={n}
                            onPress={() => item.setter(n)}
                            style={{
                              flex: 1,
                              height: 24,
                              backgroundColor: n <= item.value ? colors.primary : colors.background,
                              borderRadius: 4,
                            }}
                          />
                        ))}
                      </View>
                    </View>
                  ))}

                  {/* Would consider */}
                  <TouchableOpacity
                    onPress={() => setWouldConsider(!wouldConsider)}
                    style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}
                  >
                    <View
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 4,
                        borderWidth: 2,
                        borderColor: wouldConsider ? colors.primary : colors.border,
                        backgroundColor: wouldConsider ? colors.primary : "transparent",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 12,
                      }}
                    >
                      {wouldConsider && <IconSymbol name="checkmark" size={16} color="#fff" />}
                    </View>
                    <Text style={{ color: colors.foreground }}>Would consider for role</Text>
                  </TouchableOpacity>

                  <TextInput
                    value={ratingSummary}
                    onChangeText={setRatingSummary}
                    placeholder="Summary notes..."
                    placeholderTextColor={colors.muted}
                    multiline
                    style={{
                      backgroundColor: colors.background,
                      borderRadius: 8,
                      padding: 12,
                      color: colors.foreground,
                      minHeight: 60,
                      textAlignVertical: "top",
                      marginBottom: 12,
                    }}
                  />

                  <TouchableOpacity
                    onPress={handleSubmitRating}
                    disabled={submitRatingMutation.isPending}
                    style={{
                      backgroundColor: colors.primary,
                      padding: 12,
                      borderRadius: 8,
                      alignItems: "center",
                    }}
                  >
                    {submitRatingMutation.isPending ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={{ color: "#fff", fontWeight: "600" }}>Submit Rating</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* Existing Feedback */}
          {selfTape.feedback && selfTape.feedback.length > 0 && (
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 16,
                marginBottom: 16,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground, marginBottom: 12 }}>
                Feedback ({selfTape.feedback.length})
              </Text>
              {selfTape.feedback.map((fb: any) => (
                <TouchableOpacity
                  key={fb.id}
                  onPress={() => handleSeekToFeedback(fb.timestampSeconds)}
                  style={{
                    backgroundColor: colors.background,
                    borderRadius: 8,
                    padding: 12,
                    marginBottom: 8,
                    borderLeftWidth: 3,
                    borderLeftColor: FEEDBACK_TYPES.find(t => t.value === fb.feedbackType)?.color || "#6B7280",
                  }}
                >
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                    <Text style={{ color: colors.muted, fontSize: 12 }}>
                      {fb.timestampSeconds !== null ? formatTime(fb.timestampSeconds) : "General"}
                    </Text>
                    <Text style={{ color: colors.muted, fontSize: 12, textTransform: "capitalize" }}>
                      {fb.feedbackType}
                    </Text>
                  </View>
                  <Text style={{ color: colors.foreground }}>{fb.note}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Existing Rating */}
          {selfTape.rating && (
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 16,
                marginBottom: 16,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground, marginBottom: 12 }}>
                Rating
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
                {[
                  { label: "Fit", value: selfTape.rating.fitScore },
                  { label: "Energy", value: selfTape.rating.energyScore },
                  { label: "Delivery", value: selfTape.rating.deliveryScore },
                  { label: "Technical", value: selfTape.rating.technicalScore },
                  { label: "Overall", value: selfTape.rating.overallScore },
                ].map((item) => (
                  item.value && (
                    <View key={item.label} style={{ alignItems: "center" }}>
                      <Text style={{ color: colors.muted, fontSize: 12 }}>{item.label}</Text>
                      <Text style={{ color: colors.primary, fontSize: 20, fontWeight: "bold" }}>
                        {item.value}
                      </Text>
                    </View>
                  )
                ))}
              </View>
              {selfTape.rating.summary && (
                <Text style={{ color: colors.foreground, marginTop: 12 }}>
                  {selfTape.rating.summary}
                </Text>
              )}
              {selfTape.rating.wouldConsider !== null && (
                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}>
                  <IconSymbol
                    name={selfTape.rating.wouldConsider ? "checkmark.circle.fill" : "xmark.circle.fill"}
                    size={20}
                    color={selfTape.rating.wouldConsider ? "#22C55E" : "#EF4444"}
                  />
                  <Text style={{ color: colors.muted, marginLeft: 8 }}>
                    {selfTape.rating.wouldConsider ? "Would consider for role" : "Not a fit for this role"}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Revision Requests */}
          {selfTape.revisions && selfTape.revisions.length > 0 && (
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 16,
                marginBottom: 32,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground, marginBottom: 12 }}>
                Revision Requests
              </Text>
              {selfTape.revisions.map((rev: any) => (
                <View
                  key={rev.id}
                  style={{
                    backgroundColor: colors.background,
                    borderRadius: 8,
                    padding: 12,
                    marginBottom: 8,
                  }}
                >
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                    <View
                      style={{
                        backgroundColor: rev.status === "completed" ? "#22C55E" : "#F59E0B",
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: 4,
                      }}
                    >
                      <Text style={{ color: "#fff", fontSize: 12, textTransform: "uppercase" }}>
                        {rev.status}
                      </Text>
                    </View>
                    <Text style={{ color: colors.muted, fontSize: 12, textTransform: "capitalize" }}>
                      {rev.priority} priority
                    </Text>
                  </View>
                  <Text style={{ color: colors.foreground }}>{rev.requestedChanges}</Text>
                  {isOwner && rev.status === "pending" && (
                    <TouchableOpacity
                      onPress={() => router.push("/self-tapes/record")}
                      style={{
                        backgroundColor: colors.primary,
                        padding: 10,
                        borderRadius: 6,
                        alignItems: "center",
                        marginTop: 12,
                      }}
                    >
                      <Text style={{ color: "#fff", fontWeight: "600" }}>Record Revision</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Revision Request Modal */}
      {showRevisionForm && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground, marginBottom: 16 }}>
              Request Revision
            </Text>

            <Text style={{ color: colors.muted, marginBottom: 8 }}>Priority</Text>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
              {(["low", "medium", "high"] as const).map((p) => (
                <TouchableOpacity
                  key={p}
                  onPress={() => setRevisionPriority(p)}
                  style={{
                    flex: 1,
                    padding: 10,
                    borderRadius: 8,
                    backgroundColor: revisionPriority === p ? colors.primary : colors.background,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: revisionPriority === p ? "#fff" : colors.foreground,
                      textTransform: "capitalize",
                    }}
                  >
                    {p}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              value={revisionNotes}
              onChangeText={setRevisionNotes}
              placeholder="Describe what changes you'd like..."
              placeholderTextColor={colors.muted}
              multiline
              style={{
                backgroundColor: colors.background,
                borderRadius: 8,
                padding: 12,
                color: colors.foreground,
                minHeight: 120,
                textAlignVertical: "top",
                marginBottom: 16,
              }}
            />

            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                onPress={() => setShowRevisionForm(false)}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 8,
                  backgroundColor: colors.background,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: colors.foreground }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleRequestRevision}
                disabled={requestRevisionMutation.isPending}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 8,
                  backgroundColor: colors.primary,
                  alignItems: "center",
                }}
              >
                {requestRevisionMutation.isPending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={{ color: "#fff", fontWeight: "600" }}>Request</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  slateOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.8)",
    padding: 16,
    alignItems: "center",
  },
  slateText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  playButton: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -30,
    marginLeft: -30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  timelineContainer: {
    position: "absolute",
    bottom: 30,
    left: 16,
    right: 16,
    height: 4,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 2,
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#fff",
    borderRadius: 2,
  },
  feedbackMarker: {
    position: "absolute",
    top: -6,
    width: 8,
    height: 16,
    borderRadius: 4,
    marginLeft: -4,
  },
  timeDisplay: {
    position: "absolute",
    bottom: 8,
    left: 16,
  },
  timeText: {
    color: "#fff",
    fontSize: 12,
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    borderRadius: 16,
    padding: 20,
  },
});
