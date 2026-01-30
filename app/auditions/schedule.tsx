import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { IconSymbol } from "@/components/ui/icon-symbol";
import DateTimePicker from "@react-native-community/datetimepicker";

export default function ScheduleAuditionScreen() {
  const colors = useColors();
  const router = useRouter();
  const params = useLocalSearchParams<{ actorId?: string; projectId?: string }>();

  const [selectedProject, setSelectedProject] = useState<number | null>(
    params.projectId ? parseInt(params.projectId) : null
  );
  const [selectedActor, setSelectedActor] = useState<number | null>(
    params.actorId ? parseInt(params.actorId) : null
  );
  const [selectedRole, setSelectedRole] = useState<number | null>(null);
  const [scheduledDate, setScheduledDate] = useState(new Date(Date.now() + 24 * 60 * 60 * 1000)); // Tomorrow
  const [duration, setDuration] = useState(30);
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [enableRecording, setEnableRecording] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Fetch producer's projects
  const { data: projects } = trpc.projects.getMyProjects.useQuery();
  
  // Fetch actors (for selection if not pre-selected)
  const { data: actors } = trpc.actors.searchActors.useQuery({
    limit: 100,
  });

  // Fetch roles for selected project
  const { data: roles } = trpc.projects.getProjectRoles.useQuery(
    { projectId: selectedProject! },
    { enabled: !!selectedProject }
  );

  const scheduleMutation = trpc.videoAudition.scheduleAudition.useMutation({
    onSuccess: (data) => {
      Alert.alert(
        "Audition Scheduled! 🎬",
        "The actor has been notified and will receive an invitation.",
        [
          {
            text: "View Audition",
            onPress: () => router.replace(`/auditions/${data.id}`),
          },
        ]
      );
    },
    onError: (error) => {
      Alert.alert("Error", error.message);
    },
  });

  const handleSchedule = () => {
    if (!selectedProject) {
      Alert.alert("Error", "Please select a project");
      return;
    }
    if (!selectedActor) {
      Alert.alert("Error", "Please select an actor");
      return;
    }
    if (scheduledDate < new Date()) {
      Alert.alert("Error", "Please select a future date and time");
      return;
    }

    scheduleMutation.mutate({
      projectId: selectedProject,
      roleId: selectedRole || undefined,
      actorId: selectedActor,
      scheduledAt: scheduledDate.toISOString(),
      durationMinutes: duration,
      notes: notes || undefined,
      message: message || undefined,
      enableRecording,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <ScreenContainer className="flex-1">
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 24 }}>
          <TouchableOpacity onPress={() => router.back()}>
            <IconSymbol name="chevron.left" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={{ fontSize: 24, fontWeight: "bold", color: colors.foreground, marginLeft: 12 }}>
            Schedule Audition
          </Text>
        </View>

        {/* Project Selection */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground, marginBottom: 8 }}>
            Project *
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {projects?.map((project: any) => (
              <TouchableOpacity
                key={project.id}
                onPress={() => {
                  setSelectedProject(project.id);
                  setSelectedRole(null);
                }}
                style={{
                  backgroundColor: selectedProject === project.id ? colors.primary : colors.surface,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderRadius: 12,
                  marginRight: 8,
                  borderWidth: 1,
                  borderColor: selectedProject === project.id ? colors.primary : colors.border,
                }}
              >
                <Text
                  style={{
                    color: selectedProject === project.id ? "#fff" : colors.foreground,
                    fontWeight: "500",
                  }}
                >
                  {project.title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Role Selection (if project selected) */}
        {selectedProject && roles && roles.length > 0 && (
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground, marginBottom: 8 }}>
              Role (Optional)
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {roles.map((role: any) => (
                <TouchableOpacity
                  key={role.id}
                  onPress={() => setSelectedRole(role.id === selectedRole ? null : role.id)}
                  style={{
                    backgroundColor: selectedRole === role.id ? colors.primary : colors.surface,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderRadius: 12,
                    marginRight: 8,
                    borderWidth: 1,
                    borderColor: selectedRole === role.id ? colors.primary : colors.border,
                  }}
                >
                  <Text
                    style={{
                      color: selectedRole === role.id ? "#fff" : colors.foreground,
                      fontWeight: "500",
                    }}
                  >
                    {role.roleName}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Actor Selection */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground, marginBottom: 8 }}>
            Actor *
          </Text>
          {selectedActor ? (
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 16,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Text style={{ color: colors.foreground, fontWeight: "500" }}>
                {actors?.find((a: any) => a.id === selectedActor)?.name || "Selected Actor"}
              </Text>
              <TouchableOpacity onPress={() => setSelectedActor(null)}>
                <Text style={{ color: colors.primary }}>Change</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {actors?.slice(0, 10).map((actor: any) => (
                <TouchableOpacity
                  key={actor.id}
                  onPress={() => setSelectedActor(actor.id)}
                  style={{
                    backgroundColor: colors.surface,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderRadius: 12,
                    marginRight: 8,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Text style={{ color: colors.foreground, fontWeight: "500" }}>
                    {actor.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Date Selection */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground, marginBottom: 8 }}>
            Date & Time *
          </Text>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              style={{
                flex: 1,
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 4 }}>Date</Text>
              <Text style={{ color: colors.foreground, fontWeight: "500" }}>
                {formatDate(scheduledDate)}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowTimePicker(true)}
              style={{
                flex: 1,
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 4 }}>Time</Text>
              <Text style={{ color: colors.foreground, fontWeight: "500" }}>
                {formatTime(scheduledDate)}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Date/Time Pickers */}
        {showDatePicker && (
          <DateTimePicker
            value={scheduledDate}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            minimumDate={new Date()}
            onChange={(event, date) => {
              setShowDatePicker(false);
              if (date) {
                const newDate = new Date(scheduledDate);
                newDate.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
                setScheduledDate(newDate);
              }
            }}
          />
        )}
        {showTimePicker && (
          <DateTimePicker
            value={scheduledDate}
            mode="time"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(event, date) => {
              setShowTimePicker(false);
              if (date) {
                const newDate = new Date(scheduledDate);
                newDate.setHours(date.getHours(), date.getMinutes());
                setScheduledDate(newDate);
              }
            }}
          />
        )}

        {/* Duration */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground, marginBottom: 8 }}>
            Duration
          </Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {[15, 30, 45, 60].map((mins) => (
              <TouchableOpacity
                key={mins}
                onPress={() => setDuration(mins)}
                style={{
                  flex: 1,
                  backgroundColor: duration === mins ? colors.primary : colors.surface,
                  paddingVertical: 12,
                  borderRadius: 12,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: duration === mins ? colors.primary : colors.border,
                }}
              >
                <Text
                  style={{
                    color: duration === mins ? "#fff" : colors.foreground,
                    fontWeight: "500",
                  }}
                >
                  {mins} min
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recording Toggle */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 16,
            marginBottom: 20,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>
              Enable Recording
            </Text>
            <Text style={{ fontSize: 13, color: colors.muted, marginTop: 4 }}>
              Save the audition for later review
            </Text>
          </View>
          <Switch
            value={enableRecording}
            onValueChange={setEnableRecording}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>

        {/* Notes */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground, marginBottom: 8 }}>
            Notes (Optional)
          </Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Any preparation notes for yourself..."
            placeholderTextColor={colors.muted}
            multiline
            numberOfLines={3}
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 16,
              color: colors.foreground,
              borderWidth: 1,
              borderColor: colors.border,
              minHeight: 80,
              textAlignVertical: "top",
            }}
          />
        </View>

        {/* Message to Actor */}
        <View style={{ marginBottom: 32 }}>
          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground, marginBottom: 8 }}>
            Message to Actor (Optional)
          </Text>
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Include any details or preparation instructions..."
            placeholderTextColor={colors.muted}
            multiline
            numberOfLines={3}
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 16,
              color: colors.foreground,
              borderWidth: 1,
              borderColor: colors.border,
              minHeight: 80,
              textAlignVertical: "top",
            }}
          />
        </View>

        {/* Schedule Button */}
        <TouchableOpacity
          onPress={handleSchedule}
          disabled={scheduleMutation.isPending || !selectedProject || !selectedActor}
          style={{
            backgroundColor: colors.primary,
            borderRadius: 16,
            paddingVertical: 18,
            alignItems: "center",
            opacity: scheduleMutation.isPending || !selectedProject || !selectedActor ? 0.6 : 1,
            marginBottom: 40,
          }}
        >
          {scheduleMutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 18 }}>
              Schedule Audition
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}
