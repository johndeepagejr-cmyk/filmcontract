import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator, StyleSheet, TextInput, Alert, Switch } from "react-native";
import { useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { router } from "expo-router";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";

interface RoleBreakdown {
  name: string;
  type: string;
  description: string;
  age: string;
  gender: string;
}

const ROLE_TEMPLATES = [
  { label: "Film - Lead", type: "film", name: "Lead Role" },
  { label: "Film - Supporting", type: "film", name: "Supporting Role" },
  { label: "Commercial - Principal", type: "commercial", name: "Principal" },
  { label: "Commercial - Extra", type: "commercial", name: "Extra" },
  { label: "TV - Series Regular", type: "tv", name: "Series Regular" },
  { label: "TV - Guest Star", type: "tv", name: "Guest Star" },
  { label: "Voice Over", type: "voice_over", name: "Voice Actor" },
];

export default function ProducerCreateCasting() {
  const colors = useColors();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [isDraft, setIsDraft] = useState(false);
  const [roles, setRoles] = useState<RoleBreakdown[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);

  const createMutation = trpc.casting.create.useMutation({
    onSuccess: () => {
      Alert.alert("Success", isDraft ? "Casting call saved as draft." : "Casting call published!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    },
    onError: (err) => {
      Alert.alert("Error", err.message || "Failed to create casting call");
    },
  });

  const addRole = (template?: typeof ROLE_TEMPLATES[0]) => {
    setRoles([
      ...roles,
      {
        name: template?.name || "",
        type: template?.type || "film",
        description: "",
        age: "",
        gender: "",
      },
    ]);
    setShowTemplates(false);
  };

  const updateRole = (index: number, field: keyof RoleBreakdown, value: string) => {
    const updated = [...roles];
    updated[index] = { ...updated[index], [field]: value };
    setRoles(updated);
  };

  const removeRole = (index: number) => {
    setRoles(roles.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      Alert.alert("Required", "Please enter a project title.");
      return;
    }
    if (!description.trim()) {
      Alert.alert("Required", "Please enter a description.");
      return;
    }

    createMutation.mutate({
      title: title.trim(),
      description: description.trim(),
      budget: budget || undefined,
      deadline: deadline || undefined,
      roles: roles.length > 0 ? JSON.stringify(roles) : undefined,
      status: isDraft ? "closed" : "open",
    });
  };

  const canSubmit = title.trim().length > 0 && description.trim().length > 0;

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <IconSymbol name="arrow.left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.screenTitle, { color: colors.foreground }]}>Create Casting Call</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Project Details */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Project Details</Text>

          <View style={styles.formGroup}>
            <Text style={[styles.formLabel, { color: colors.foreground }]}>Project Title *</Text>
            <TextInput
              style={[styles.formInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g., Untitled Feature Film"
              placeholderTextColor={colors.muted}
              returnKeyType="next"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.formLabel, { color: colors.foreground }]}>Description *</Text>
            <TextInput
              style={[styles.formTextarea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe the project, story, and what you're looking for..."
              placeholderTextColor={colors.muted}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.formRow}>
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={[styles.formLabel, { color: colors.foreground }]}>Budget ($)</Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]}
                value={budget}
                onChangeText={setBudget}
                placeholder="e.g., 5000"
                placeholderTextColor={colors.muted}
                keyboardType="numeric"
                returnKeyType="next"
              />
            </View>
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={[styles.formLabel, { color: colors.foreground }]}>Deadline</Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]}
                value={deadline}
                onChangeText={setDeadline}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.muted}
                returnKeyType="done"
              />
            </View>
          </View>
        </View>

        {/* Role Breakdowns */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Role Breakdowns</Text>
            <TouchableOpacity
              onPress={() => setShowTemplates(!showTemplates)}
              style={[styles.addRoleBtn, { backgroundColor: colors.primary }]}
              activeOpacity={0.8}
            >
              <IconSymbol name="plus" size={16} color="#fff" />
              <Text style={styles.addRoleBtnText}>Add Role</Text>
            </TouchableOpacity>
          </View>

          {/* Template selector */}
          {showTemplates && (
            <View style={[styles.templateGrid, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.templateTitle, { color: colors.foreground }]}>Choose a template:</Text>
              {ROLE_TEMPLATES.map((tmpl, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => addRole(tmpl)}
                  style={[styles.templateItem, { borderColor: colors.border }]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.templateLabel, { color: colors.primary }]}>{tmpl.label}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                onPress={() => addRole()}
                style={[styles.templateItem, { borderColor: colors.border }]}
                activeOpacity={0.7}
              >
                <Text style={[styles.templateLabel, { color: colors.muted }]}>Custom Role</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Role cards */}
          {roles.map((role, idx) => (
            <View key={idx} style={[styles.roleCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.roleCardHeader}>
                <Text style={[styles.roleCardTitle, { color: colors.foreground }]}>Role {idx + 1}</Text>
                <TouchableOpacity onPress={() => removeRole(idx)}>
                  <IconSymbol name="xmark.circle.fill" size={22} color={colors.error} />
                </TouchableOpacity>
              </View>

              <TextInput
                style={[styles.roleInput, { borderColor: colors.border, color: colors.foreground }]}
                value={role.name}
                onChangeText={(v) => updateRole(idx, "name", v)}
                placeholder="Role name"
                placeholderTextColor={colors.muted}
              />
              <TextInput
                style={[styles.roleInput, { borderColor: colors.border, color: colors.foreground }]}
                value={role.description}
                onChangeText={(v) => updateRole(idx, "description", v)}
                placeholder="Role description"
                placeholderTextColor={colors.muted}
                multiline
              />
              <View style={styles.formRow}>
                <TextInput
                  style={[styles.roleInput, { borderColor: colors.border, color: colors.foreground, flex: 1 }]}
                  value={role.age}
                  onChangeText={(v) => updateRole(idx, "age", v)}
                  placeholder="Age range"
                  placeholderTextColor={colors.muted}
                />
                <TextInput
                  style={[styles.roleInput, { borderColor: colors.border, color: colors.foreground, flex: 1 }]}
                  value={role.gender}
                  onChangeText={(v) => updateRole(idx, "gender", v)}
                  placeholder="Gender"
                  placeholderTextColor={colors.muted}
                />
              </View>
            </View>
          ))}

          {roles.length === 0 && !showTemplates && (
            <View style={[styles.emptyRoles, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={styles.emptyIcon}>🎭</Text>
              <Text style={[styles.emptyText, { color: colors.muted }]}>No roles added yet. Tap "Add Role" to define role breakdowns.</Text>
            </View>
          )}
        </View>

        {/* Publish/Draft toggle */}
        <View style={[styles.toggleRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.toggleLabel, { color: colors.foreground }]}>Save as Draft</Text>
            <Text style={[styles.toggleDesc, { color: colors.muted }]}>
              Draft casting calls are not visible to actors
            </Text>
          </View>
          <Switch
            value={isDraft}
            onValueChange={setIsDraft}
            trackColor={{ false: colors.border, true: colors.primary + "60" }}
            thumbColor={isDraft ? colors.primary : colors.muted}
          />
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={[styles.bottomBar, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <TouchableOpacity
          onPress={handleSubmit}
          style={[styles.submitBtn, { backgroundColor: colors.primary }, !canSubmit && { opacity: 0.5 }]}
          activeOpacity={0.8}
          disabled={!canSubmit || createMutation.isPending}
        >
          {createMutation.isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>{isDraft ? "Save Draft" : "Publish Casting Call"}</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  backBtn: { padding: 4 },
  screenTitle: { fontSize: 20, fontWeight: "800", flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 120, gap: 24 },
  section: { gap: 12 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { fontSize: 18, fontWeight: "700" },
  formGroup: { gap: 6 },
  formLabel: { fontSize: 14, fontWeight: "600" },
  formInput: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  formTextarea: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, minHeight: 120 },
  formRow: { flexDirection: "row", gap: 12 },
  addRoleBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  addRoleBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  templateGrid: { borderRadius: 14, padding: 14, borderWidth: 1, gap: 8 },
  templateTitle: { fontSize: 14, fontWeight: "600", marginBottom: 4 },
  templateItem: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1 },
  templateLabel: { fontSize: 14, fontWeight: "600" },
  roleCard: { borderRadius: 14, padding: 14, borderWidth: 1, gap: 10 },
  roleCardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  roleCardTitle: { fontSize: 15, fontWeight: "700" },
  roleInput: { borderBottomWidth: 1, paddingVertical: 8, fontSize: 14 },
  emptyRoles: { borderRadius: 14, padding: 24, borderWidth: 1, alignItems: "center", gap: 8, borderStyle: "dashed" },
  emptyIcon: { fontSize: 32 },
  emptyText: { fontSize: 13, textAlign: "center" },
  toggleRow: { flexDirection: "row", alignItems: "center", padding: 16, borderRadius: 14, borderWidth: 1 },
  toggleLabel: { fontSize: 15, fontWeight: "600" },
  toggleDesc: { fontSize: 12, marginTop: 2 },
  bottomBar: { position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: 16, paddingVertical: 12, paddingBottom: 32, borderTopWidth: 1 },
  submitBtn: { alignItems: "center", justifyContent: "center", paddingVertical: 16, borderRadius: 14 },
  submitBtnText: { color: "#fff", fontSize: 17, fontWeight: "700" },
});
