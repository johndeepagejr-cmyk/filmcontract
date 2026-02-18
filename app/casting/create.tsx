import {
  ScrollView, Text, View, TouchableOpacity, ActivityIndicator,
  StyleSheet, TextInput, Alert, Switch, FlatList, Modal, Platform,
} from "react-native";
import { useState, useCallback, useMemo } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { router } from "expo-router";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import * as Haptics from "expo-haptics";

// ─── Types ──────────────────────────────────────────────────
interface RoleBreakdown {
  id: string;
  name: string;
  type: "lead" | "supporting" | "background" | "voice" | "stunt";
  description: string;
  age: string;
  gender: string;
  ethnicity: string;
  height: string;
  skills: string;
  compensation: string;
  compensationType: "daily" | "weekly" | "flat" | "scale";
}

interface CustomQuestion {
  id: string;
  text: string;
  type: "text" | "yesno" | "multiple" | "file";
  options?: string[];
  required: boolean;
}

type WizardStep = 1 | 2 | 3 | 4;

const PRODUCTION_TYPES = [
  "Feature Film", "Television Series", "TV Movie", "Short Film",
  "Commercial", "Music Video", "Web Series", "Documentary",
  "Industrial/Corporate", "Voice Over", "Theater",
];

const ROLE_TYPES = [
  { value: "lead", label: "Lead" },
  { value: "supporting", label: "Supporting" },
  { value: "background", label: "Background/Extra" },
  { value: "voice", label: "Voice Over" },
  { value: "stunt", label: "Stunt" },
];

const COMP_TYPES = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "flat", label: "Flat Fee" },
  { value: "scale", label: "SAG Scale" },
];

const UNION_OPTIONS = [
  { value: "sag_aftra", label: "SAG-AFTRA" },
  { value: "equity", label: "Actors' Equity" },
  { value: "non_union", label: "Non-Union" },
  { value: "fi_core", label: "Financial Core" },
  { value: "any", label: "Any" },
];

const VISIBILITY_OPTIONS = [
  { value: "public", label: "Public", desc: "Visible to all actors", icon: "eye.fill" as const },
  { value: "agents", label: "Agents Only", desc: "Only visible to talent agents", icon: "person.2.fill" as const },
  { value: "invite", label: "Invite Only", desc: "Only invited actors can view", icon: "envelope.fill" as const },
];

const DURATION_LIMITS = [
  { value: "30", label: "30 sec" },
  { value: "60", label: "1 min" },
  { value: "120", label: "2 min" },
  { value: "300", label: "5 min" },
  { value: "none", label: "No limit" },
];

const QUALITY_MINS = [
  { value: "720p", label: "720p (HD)" },
  { value: "1080p", label: "1080p (Full HD)" },
  { value: "any", label: "Any quality" },
];

// ─── Helpers ────────────────────────────────────────────────
const genId = () => Math.random().toString(36).slice(2, 10);

export default function CreateCastingWizard() {
  const colors = useColors();
  const [step, setStep] = useState<WizardStep>(1);

  // Step 1: Project Setup
  const [title, setTitle] = useState("");
  const [productionType, setProductionType] = useState("Feature Film");
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [company, setCompany] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [budget, setBudget] = useState("");
  const [deadline, setDeadline] = useState("");

  // Step 2: Roles
  const [roles, setRoles] = useState<RoleBreakdown[]>([]);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);

  // Step 3: Requirements
  const [unionStatus, setUnionStatus] = useState("any");
  const [customQuestions, setCustomQuestions] = useState<CustomQuestion[]>([]);
  const [selfTapeDuration, setSelfTapeDuration] = useState("120");
  const [selfTapeQuality, setSelfTapeQuality] = useState("any");
  const [requireSlate, setRequireSlate] = useState(true);
  const [requireResume, setRequireResume] = useState(true);
  const [requireHeadshot, setRequireHeadshot] = useState(true);
  const [sidesText, setSidesText] = useState("");

  // Step 4: Publish
  const [visibility, setVisibility] = useState("public");
  const [publishTiming, setPublishTiming] = useState<"now" | "schedule" | "draft">("now");
  const [scheduleDate, setScheduleDate] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [boostEnabled, setBoostEnabled] = useState(false);
  const [boostDuration, setBoostDuration] = useState<7 | 14 | 30>(7);

  const createMutation = trpc.casting.create.useMutation({
    onSuccess: () => {
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "Success",
        publishTiming === "draft"
          ? "Casting call saved as draft."
          : publishTiming === "schedule"
          ? "Casting call scheduled for publication."
          : "Casting call published!",
        [{ text: "OK", onPress: () => router.back() }]
      );
    },
    onError: (err) => {
      Alert.alert("Error", err.message || "Failed to create casting call");
    },
  });

  // ─── Role Management ──────────────────────────────────────
  const addRole = useCallback(() => {
    const newRole: RoleBreakdown = {
      id: genId(),
      name: "",
      type: "lead",
      description: "",
      age: "",
      gender: "",
      ethnicity: "",
      height: "",
      skills: "",
      compensation: "",
      compensationType: "daily",
    };
    setRoles((prev) => [...prev, newRole]);
    setEditingRoleId(newRole.id);
  }, []);

  const duplicateRole = useCallback((roleId: string) => {
    setRoles((prev) => {
      const source = prev.find((r) => r.id === roleId);
      if (!source) return prev;
      const clone = { ...source, id: genId(), name: `${source.name} (Copy)` };
      const idx = prev.findIndex((r) => r.id === roleId);
      const next = [...prev];
      next.splice(idx + 1, 0, clone);
      return next;
    });
  }, []);

  const removeRole = useCallback((roleId: string) => {
    setRoles((prev) => prev.filter((r) => r.id !== roleId));
    if (editingRoleId === roleId) setEditingRoleId(null);
  }, [editingRoleId]);

  const updateRole = useCallback((roleId: string, field: keyof RoleBreakdown, value: string) => {
    setRoles((prev) =>
      prev.map((r) => (r.id === roleId ? { ...r, [field]: value } : r))
    );
  }, []);

  // ─── Question Management ──────────────────────────────────
  const addQuestion = useCallback((type: CustomQuestion["type"]) => {
    setCustomQuestions((prev) => [
      ...prev,
      { id: genId(), text: "", type, options: type === "multiple" ? ["", ""] : undefined, required: false },
    ]);
  }, []);

  const updateQuestion = useCallback((id: string, field: string, value: any) => {
    setCustomQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, [field]: value } : q))
    );
  }, []);

  const removeQuestion = useCallback((id: string) => {
    setCustomQuestions((prev) => prev.filter((q) => q.id !== id));
  }, []);

  // ─── Validation ───────────────────────────────────────────
  const step1Valid = title.trim().length > 0;
  const step2Valid = roles.length > 0 && roles.every((r) => r.name.trim().length > 0);
  const step3Valid = true; // Requirements are optional
  const step4Valid = publishTiming !== "schedule" || scheduleDate.trim().length > 0;

  const canAdvance = useMemo(() => {
    switch (step) {
      case 1: return step1Valid;
      case 2: return step2Valid;
      case 3: return step3Valid;
      case 4: return step4Valid;
      default: return false;
    }
  }, [step, step1Valid, step2Valid, step3Valid, step4Valid]);

  // ─── Submit ───────────────────────────────────────────────
  const handlePublish = () => {
    if (!step1Valid) { Alert.alert("Missing Info", "Please fill in the project title."); return; }

    const rolesJson = JSON.stringify(
      roles.map((r) => ({
        name: r.name, type: r.type, description: r.description,
        age: r.age, gender: r.gender, ethnicity: r.ethnicity,
        height: r.height, skills: r.skills,
        compensation: r.compensation, compensationType: r.compensationType,
      }))
    );

    createMutation.mutate({
      title: title.trim(),
      description: synopsis.trim() || `${productionType} - ${title.trim()}`,
      budget: budget || undefined,
      deadline: deadline || undefined,
      roles: rolesJson,
      status: publishTiming === "draft" ? "closed" : "open",
    });
  };

  // ─── Navigation ───────────────────────────────────────────
  const goNext = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step < 4) setStep((step + 1) as WizardStep);
  };
  const goBack = () => {
    if (step > 1) setStep((step - 1) as WizardStep);
    else router.back();
  };

  // ─── Step Indicator ───────────────────────────────────────
  const STEPS = [
    { num: 1, label: "Project" },
    { num: 2, label: "Roles" },
    { num: 3, label: "Requirements" },
    { num: 4, label: "Publish" },
  ];

  const renderStepIndicator = () => (
    <View style={s.stepIndicator}>
      {STEPS.map((st, idx) => (
        <View key={st.num} style={s.stepItem}>
          <View style={[
            s.stepCircle,
            { backgroundColor: step >= st.num ? colors.primary : colors.surface, borderColor: step >= st.num ? colors.primary : colors.border },
          ]}>
            {step > st.num ? (
              <IconSymbol name="checkmark" size={14} color="#fff" />
            ) : (
              <Text style={[s.stepNum, { color: step >= st.num ? "#fff" : colors.muted }]}>{st.num}</Text>
            )}
          </View>
          <Text style={[s.stepLabel, { color: step >= st.num ? colors.foreground : colors.muted }]}>{st.label}</Text>
          {idx < STEPS.length - 1 && (
            <View style={[s.stepLine, { backgroundColor: step > st.num ? colors.primary : colors.border }]} />
          )}
        </View>
      ))}
    </View>
  );

  // ═══════════════════════════════════════════════════════════
  // STEP 1: PROJECT SETUP
  // ═══════════════════════════════════════════════════════════
  const renderStep1 = () => (
    <View style={s.stepContent}>
      <Text style={[s.stepTitle, { color: colors.foreground }]}>Project Setup</Text>
      <Text style={[s.stepDesc, { color: colors.muted }]}>
        Tell us about your production. This information will be visible to actors.
      </Text>

      {/* Title */}
      <View style={s.field}>
        <Text style={[s.fieldLabel, { color: colors.foreground }]}>Project Title *</Text>
        <TextInput
          style={[s.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]}
          value={title}
          onChangeText={setTitle}
          placeholder="e.g., The Last Horizon"
          placeholderTextColor={colors.muted}
          returnKeyType="next"
        />
      </View>

      {/* Production Type */}
      <View style={s.field}>
        <Text style={[s.fieldLabel, { color: colors.foreground }]}>Production Type</Text>
        <TouchableOpacity
          onPress={() => setShowTypeModal(true)}
          style={[s.selectBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          activeOpacity={0.7}
        >
          <Text style={[s.selectBtnText, { color: colors.foreground }]}>{productionType}</Text>
          <IconSymbol name="chevron.right" size={16} color={colors.muted} />
        </TouchableOpacity>
      </View>

      {/* Company */}
      <View style={s.field}>
        <Text style={[s.fieldLabel, { color: colors.foreground }]}>Production Company</Text>
        <TextInput
          style={[s.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]}
          value={company}
          onChangeText={setCompany}
          placeholder="e.g., Horizon Pictures LLC"
          placeholderTextColor={colors.muted}
          returnKeyType="next"
        />
      </View>

      {/* Synopsis */}
      <View style={s.field}>
        <Text style={[s.fieldLabel, { color: colors.foreground }]}>Synopsis</Text>
        <TextInput
          style={[s.textarea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]}
          value={synopsis}
          onChangeText={setSynopsis}
          placeholder="Brief description of the project, story, and what you're looking for..."
          placeholderTextColor={colors.muted}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
        />
        <Text style={[s.charCount, { color: colors.muted }]}>{synopsis.length}/500</Text>
      </View>

      {/* Budget & Deadline */}
      <View style={s.row}>
        <View style={[s.field, { flex: 1 }]}>
          <Text style={[s.fieldLabel, { color: colors.foreground }]}>Budget ($)</Text>
          <TextInput
            style={[s.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]}
            value={budget}
            onChangeText={setBudget}
            placeholder="e.g., 5000"
            placeholderTextColor={colors.muted}
            keyboardType="numeric"
          />
        </View>
        <View style={[s.field, { flex: 1 }]}>
          <Text style={[s.fieldLabel, { color: colors.foreground }]}>Deadline</Text>
          <TextInput
            style={[s.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]}
            value={deadline}
            onChangeText={setDeadline}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.muted}
          />
        </View>
      </View>

      {/* Production Type Modal */}
      <Modal visible={showTypeModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={[s.modalContent, { backgroundColor: colors.background }]}>
            <View style={s.modalHeader}>
              <Text style={[s.modalTitle, { color: colors.foreground }]}>Production Type</Text>
              <TouchableOpacity onPress={() => setShowTypeModal(false)} style={s.modalClose}>
                <IconSymbol name="xmark" size={20} color={colors.foreground} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={PRODUCTION_TYPES}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => { setProductionType(item); setShowTypeModal(false); }}
                  style={[s.typeOption, productionType === item && { backgroundColor: colors.primary + "12" }]}
                  activeOpacity={0.7}
                >
                  <Text style={[s.typeOptionText, { color: productionType === item ? colors.primary : colors.foreground }]}>
                    {item}
                  </Text>
                  {productionType === item && <IconSymbol name="checkmark" size={18} color={colors.primary} />}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );

  // ═══════════════════════════════════════════════════════════
  // STEP 2: ROLE CREATION
  // ═══════════════════════════════════════════════════════════
  const renderRoleCard = (role: RoleBreakdown, index: number) => {
    const isEditing = editingRoleId === role.id;
    return (
      <View key={role.id} style={[s.roleCard, { backgroundColor: colors.surface, borderColor: isEditing ? colors.primary : colors.border }]}>
        {/* Role Header */}
        <View style={s.roleHeader}>
          <TouchableOpacity
            onPress={() => setEditingRoleId(isEditing ? null : role.id)}
            style={{ flex: 1 }}
          >
            <View style={s.roleHeaderLeft}>
              <View style={[s.roleNum, { backgroundColor: colors.primary + "18" }]}>
                <Text style={[s.roleNumText, { color: colors.primary }]}>{index + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.roleName, { color: colors.foreground }]} numberOfLines={1}>
                  {role.name || "Untitled Role"}
                </Text>
                <Text style={[s.roleType, { color: colors.muted }]}>
                  {ROLE_TYPES.find((t) => t.value === role.type)?.label || "Lead"}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
          <View style={s.roleActions}>
            <TouchableOpacity onPress={() => duplicateRole(role.id)} style={s.roleActionBtn}>
              <IconSymbol name="doc.on.doc.fill" size={16} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => removeRole(role.id)} style={s.roleActionBtn}>
              <IconSymbol name="trash" size={16} color={colors.error} />
            </TouchableOpacity>
            <IconSymbol name={isEditing ? "chevron.left" : "chevron.right"} size={16} color={colors.muted} />
          </View>
        </View>

        {/* Expanded Role Editor */}
        {isEditing && (
          <View style={s.roleEditor}>
            <View style={s.field}>
              <Text style={[s.fieldLabelSm, { color: colors.foreground }]}>Role Name *</Text>
              <TextInput
                style={[s.inputSm, { borderColor: colors.border, color: colors.foreground }]}
                value={role.name}
                onChangeText={(v) => updateRole(role.id, "name", v)}
                placeholder="e.g., Detective Sarah Chen"
                placeholderTextColor={colors.muted}
              />
            </View>

            {/* Role Type Chips */}
            <View style={s.field}>
              <Text style={[s.fieldLabelSm, { color: colors.foreground }]}>Role Type</Text>
              <View style={s.chipRow}>
                {ROLE_TYPES.map((rt) => (
                  <TouchableOpacity
                    key={rt.value}
                    onPress={() => updateRole(role.id, "type", rt.value)}
                    style={[
                      s.chip,
                      { borderColor: role.type === rt.value ? colors.primary : colors.border },
                      role.type === rt.value && { backgroundColor: colors.primary + "12" },
                    ]}
                  >
                    <Text style={[s.chipText, { color: role.type === rt.value ? colors.primary : colors.muted }]}>
                      {rt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={s.field}>
              <Text style={[s.fieldLabelSm, { color: colors.foreground }]}>Description</Text>
              <TextInput
                style={[s.textareaSm, { borderColor: colors.border, color: colors.foreground }]}
                value={role.description}
                onChangeText={(v) => updateRole(role.id, "description", v)}
                placeholder="Character description, personality, arc..."
                placeholderTextColor={colors.muted}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Demographics Row */}
            <View style={s.row}>
              <View style={[s.field, { flex: 1 }]}>
                <Text style={[s.fieldLabelSm, { color: colors.foreground }]}>Age Range</Text>
                <TextInput
                  style={[s.inputSm, { borderColor: colors.border, color: colors.foreground }]}
                  value={role.age}
                  onChangeText={(v) => updateRole(role.id, "age", v)}
                  placeholder="25-35"
                  placeholderTextColor={colors.muted}
                />
              </View>
              <View style={[s.field, { flex: 1 }]}>
                <Text style={[s.fieldLabelSm, { color: colors.foreground }]}>Gender</Text>
                <TextInput
                  style={[s.inputSm, { borderColor: colors.border, color: colors.foreground }]}
                  value={role.gender}
                  onChangeText={(v) => updateRole(role.id, "gender", v)}
                  placeholder="Any"
                  placeholderTextColor={colors.muted}
                />
              </View>
            </View>

            <View style={s.row}>
              <View style={[s.field, { flex: 1 }]}>
                <Text style={[s.fieldLabelSm, { color: colors.foreground }]}>Ethnicity</Text>
                <TextInput
                  style={[s.inputSm, { borderColor: colors.border, color: colors.foreground }]}
                  value={role.ethnicity}
                  onChangeText={(v) => updateRole(role.id, "ethnicity", v)}
                  placeholder="Open"
                  placeholderTextColor={colors.muted}
                />
              </View>
              <View style={[s.field, { flex: 1 }]}>
                <Text style={[s.fieldLabelSm, { color: colors.foreground }]}>Height</Text>
                <TextInput
                  style={[s.inputSm, { borderColor: colors.border, color: colors.foreground }]}
                  value={role.height}
                  onChangeText={(v) => updateRole(role.id, "height", v)}
                  placeholder={'5\'6"-6\'0"'}
                  placeholderTextColor={colors.muted}
                />
              </View>
            </View>

            <View style={s.field}>
              <Text style={[s.fieldLabelSm, { color: colors.foreground }]}>Special Skills</Text>
              <TextInput
                style={[s.inputSm, { borderColor: colors.border, color: colors.foreground }]}
                value={role.skills}
                onChangeText={(v) => updateRole(role.id, "skills", v)}
                placeholder="e.g., martial arts, piano, Spanish fluency"
                placeholderTextColor={colors.muted}
              />
            </View>

            {/* Compensation */}
            <View style={s.compRow}>
              <View style={[s.field, { flex: 2 }]}>
                <Text style={[s.fieldLabelSm, { color: colors.foreground }]}>Compensation ($)</Text>
                <TextInput
                  style={[s.inputSm, { borderColor: colors.border, color: colors.foreground }]}
                  value={role.compensation}
                  onChangeText={(v) => updateRole(role.id, "compensation", v)}
                  placeholder="Amount"
                  placeholderTextColor={colors.muted}
                  keyboardType="numeric"
                />
              </View>
              <View style={[s.field, { flex: 3 }]}>
                <Text style={[s.fieldLabelSm, { color: colors.foreground }]}>Type</Text>
                <View style={s.chipRow}>
                  {COMP_TYPES.map((ct) => (
                    <TouchableOpacity
                      key={ct.value}
                      onPress={() => updateRole(role.id, "compensationType", ct.value)}
                      style={[
                        s.chipSm,
                        { borderColor: role.compensationType === ct.value ? colors.primary : colors.border },
                        role.compensationType === ct.value && { backgroundColor: colors.primary + "12" },
                      ]}
                    >
                      <Text style={[s.chipTextSm, { color: role.compensationType === ct.value ? colors.primary : colors.muted }]}>
                        {ct.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderStep2 = () => (
    <View style={s.stepContent}>
      <View style={s.stepHeaderRow}>
        <View style={{ flex: 1 }}>
          <Text style={[s.stepTitle, { color: colors.foreground }]}>Role Breakdowns</Text>
          <Text style={[s.stepDesc, { color: colors.muted }]}>
            Define each role you're casting. Add details to attract the right talent.
          </Text>
        </View>
        <TouchableOpacity onPress={addRole} style={[s.addBtn, { backgroundColor: colors.primary }]} activeOpacity={0.8}>
          <IconSymbol name="plus" size={16} color="#fff" />
          <Text style={s.addBtnText}>Add Role</Text>
        </TouchableOpacity>
      </View>

      {roles.length === 0 ? (
        <View style={[s.emptyState, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[s.emptyIcon, { backgroundColor: colors.primary + "12" }]}>
            <IconSymbol name="theatermasks.fill" size={32} color={colors.primary} />
          </View>
          <Text style={[s.emptyTitle, { color: colors.foreground }]}>No Roles Yet</Text>
          <Text style={[s.emptyDesc, { color: colors.muted }]}>
            Tap "Add Role" to define the characters you're casting.
          </Text>
          <TouchableOpacity onPress={addRole} style={[s.emptyBtn, { backgroundColor: colors.primary }]} activeOpacity={0.8}>
            <IconSymbol name="plus" size={16} color="#fff" />
            <Text style={s.emptyBtnText}>Add Your First Role</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={s.rolesList}>
          {roles.map((role, idx) => renderRoleCard(role, idx))}
        </View>
      )}

      {roles.length > 0 && (
        <View style={[s.rolesSummary, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[s.summaryTitle, { color: colors.foreground }]}>Summary</Text>
          <View style={s.summaryRow}>
            <Text style={[s.summaryLabel, { color: colors.muted }]}>Total Roles</Text>
            <Text style={[s.summaryValue, { color: colors.foreground }]}>{roles.length}</Text>
          </View>
          {roles.some((r) => r.compensation) && (
            <View style={s.summaryRow}>
              <Text style={[s.summaryLabel, { color: colors.muted }]}>Total Budget</Text>
              <Text style={[s.summaryValue, { color: colors.primary }]}>
                ${roles.reduce((sum, r) => sum + (parseFloat(r.compensation) || 0), 0).toLocaleString()}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );

  // ═══════════════════════════════════════════════════════════
  // STEP 3: REQUIREMENTS BUILDER
  // ═══════════════════════════════════════════════════════════
  const renderStep3 = () => (
    <View style={s.stepContent}>
      <Text style={[s.stepTitle, { color: colors.foreground }]}>Submission Requirements</Text>
      <Text style={[s.stepDesc, { color: colors.muted }]}>
        Set the requirements for actor submissions. These help filter applicants.
      </Text>

      {/* Union Status */}
      <View style={[s.reqSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[s.reqSectionTitle, { color: colors.foreground }]}>Union Status</Text>
        <View style={s.chipRow}>
          {UNION_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              onPress={() => setUnionStatus(opt.value)}
              style={[
                s.chip,
                { borderColor: unionStatus === opt.value ? colors.primary : colors.border },
                unionStatus === opt.value && { backgroundColor: colors.primary + "12" },
              ]}
            >
              <Text style={[s.chipText, { color: unionStatus === opt.value ? colors.primary : colors.muted }]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Self-Tape Specs */}
      <View style={[s.reqSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[s.reqSectionTitle, { color: colors.foreground }]}>Self-Tape Specifications</Text>

        <Text style={[s.fieldLabelSm, { color: colors.foreground, marginTop: 12 }]}>Max Duration</Text>
        <View style={s.chipRow}>
          {DURATION_LIMITS.map((dl) => (
            <TouchableOpacity
              key={dl.value}
              onPress={() => setSelfTapeDuration(dl.value)}
              style={[
                s.chipSm,
                { borderColor: selfTapeDuration === dl.value ? colors.primary : colors.border },
                selfTapeDuration === dl.value && { backgroundColor: colors.primary + "12" },
              ]}
            >
              <Text style={[s.chipTextSm, { color: selfTapeDuration === dl.value ? colors.primary : colors.muted }]}>
                {dl.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[s.fieldLabelSm, { color: colors.foreground, marginTop: 16 }]}>Min Quality</Text>
        <View style={s.chipRow}>
          {QUALITY_MINS.map((qm) => (
            <TouchableOpacity
              key={qm.value}
              onPress={() => setSelfTapeQuality(qm.value)}
              style={[
                s.chipSm,
                { borderColor: selfTapeQuality === qm.value ? colors.primary : colors.border },
                selfTapeQuality === qm.value && { backgroundColor: colors.primary + "12" },
              ]}
            >
              <Text style={[s.chipTextSm, { color: selfTapeQuality === qm.value ? colors.primary : colors.muted }]}>
                {qm.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Toggles */}
        <View style={s.toggleGroup}>
          <View style={s.toggleRow}>
            <Text style={[s.toggleLabel, { color: colors.foreground }]}>Require Slate</Text>
            <Switch
              value={requireSlate}
              onValueChange={setRequireSlate}
              trackColor={{ false: colors.border, true: colors.primary + "60" }}
              thumbColor={requireSlate ? colors.primary : colors.muted}
            />
          </View>
          <View style={s.toggleRow}>
            <Text style={[s.toggleLabel, { color: colors.foreground }]}>Require Headshot</Text>
            <Switch
              value={requireHeadshot}
              onValueChange={setRequireHeadshot}
              trackColor={{ false: colors.border, true: colors.primary + "60" }}
              thumbColor={requireHeadshot ? colors.primary : colors.muted}
            />
          </View>
          <View style={s.toggleRow}>
            <Text style={[s.toggleLabel, { color: colors.foreground }]}>Require Resume</Text>
            <Switch
              value={requireResume}
              onValueChange={setRequireResume}
              trackColor={{ false: colors.border, true: colors.primary + "60" }}
              thumbColor={requireResume ? colors.primary : colors.muted}
            />
          </View>
        </View>
      </View>

      {/* Sides / Script */}
      <View style={[s.reqSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[s.reqSectionTitle, { color: colors.foreground }]}>Sides / Script</Text>
        <Text style={[s.reqSectionDesc, { color: colors.muted }]}>
          Paste sides text here. Actors can load this into the teleprompter.
        </Text>
        <TextInput
          style={[s.textareaSm, { borderColor: colors.border, color: colors.foreground, marginTop: 10 }]}
          value={sidesText}
          onChangeText={setSidesText}
          placeholder="Paste script sides here..."
          placeholderTextColor={colors.muted}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />
      </View>

      {/* Custom Questions */}
      <View style={[s.reqSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={s.reqSectionHeader}>
          <Text style={[s.reqSectionTitle, { color: colors.foreground }]}>Custom Questions</Text>
        </View>
        <Text style={[s.reqSectionDesc, { color: colors.muted }]}>
          Add screening questions for applicants.
        </Text>

        {customQuestions.map((q) => (
          <View key={q.id} style={[s.questionCard, { borderColor: colors.border }]}>
            <View style={s.questionHeader}>
              <View style={[s.questionTypeBadge, { backgroundColor: colors.primary + "12" }]}>
                <Text style={[s.questionTypeText, { color: colors.primary }]}>
                  {q.type === "text" ? "Text" : q.type === "yesno" ? "Yes/No" : q.type === "multiple" ? "Multiple" : "File"}
                </Text>
              </View>
              <View style={s.questionActions}>
                <TouchableOpacity onPress={() => updateQuestion(q.id, "required", !q.required)}>
                  <Text style={[s.reqToggle, { color: q.required ? colors.primary : colors.muted }]}>
                    {q.required ? "Required" : "Optional"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => removeQuestion(q.id)} style={s.removeQBtn}>
                  <IconSymbol name="xmark" size={14} color={colors.error} />
                </TouchableOpacity>
              </View>
            </View>
            <TextInput
              style={[s.inputSm, { borderColor: colors.border, color: colors.foreground }]}
              value={q.text}
              onChangeText={(v) => updateQuestion(q.id, "text", v)}
              placeholder="Enter your question..."
              placeholderTextColor={colors.muted}
            />
            {q.type === "multiple" && q.options && (
              <View style={s.optionsList}>
                {q.options.map((opt, oi) => (
                  <TextInput
                    key={oi}
                    style={[s.optionInput, { borderColor: colors.border, color: colors.foreground }]}
                    value={opt}
                    onChangeText={(v) => {
                      const newOpts = [...(q.options || [])];
                      newOpts[oi] = v;
                      updateQuestion(q.id, "options", newOpts);
                    }}
                    placeholder={`Option ${oi + 1}`}
                    placeholderTextColor={colors.muted}
                  />
                ))}
                <TouchableOpacity
                  onPress={() => updateQuestion(q.id, "options", [...(q.options || []), ""])}
                  style={s.addOptionBtn}
                >
                  <Text style={[s.addOptionText, { color: colors.primary }]}>+ Add Option</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}

        <View style={s.addQuestionRow}>
          {(["text", "yesno", "multiple", "file"] as const).map((type) => (
            <TouchableOpacity
              key={type}
              onPress={() => addQuestion(type)}
              style={[s.addQuestionBtn, { borderColor: colors.border }]}
              activeOpacity={0.7}
            >
              <IconSymbol name="plus" size={12} color={colors.primary} />
              <Text style={[s.addQuestionText, { color: colors.primary }]}>
                {type === "text" ? "Text" : type === "yesno" ? "Yes/No" : type === "multiple" ? "Choice" : "File"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  // ═══════════════════════════════════════════════════════════
  // STEP 4: PUBLISH
  // ═══════════════════════════════════════════════════════════
  const renderStep4 = () => (
    <View style={s.stepContent}>
      <Text style={[s.stepTitle, { color: colors.foreground }]}>Review & Publish</Text>
      <Text style={[s.stepDesc, { color: colors.muted }]}>
        Review your casting call and choose how to publish it.
      </Text>

      {/* Preview Card */}
      <View style={[s.previewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={s.previewHeader}>
          <View style={[s.previewBadge, { backgroundColor: colors.primary + "15" }]}>
            <IconSymbol name="megaphone.fill" size={24} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.previewTitle, { color: colors.foreground }]}>{title || "Untitled"}</Text>
            <Text style={[s.previewMeta, { color: colors.muted }]}>
              {productionType} {company ? `• ${company}` : ""}
            </Text>
          </View>
        </View>
        {synopsis ? (
          <Text style={[s.previewSynopsis, { color: colors.muted }]} numberOfLines={3}>{synopsis}</Text>
        ) : null}
        <View style={s.previewStats}>
          <View style={s.previewStat}>
            <Text style={[s.previewStatNum, { color: colors.primary }]}>{roles.length}</Text>
            <Text style={[s.previewStatLabel, { color: colors.muted }]}>Roles</Text>
          </View>
          <View style={s.previewStat}>
            <Text style={[s.previewStatNum, { color: colors.primary }]}>{customQuestions.length}</Text>
            <Text style={[s.previewStatLabel, { color: colors.muted }]}>Questions</Text>
          </View>
          <View style={s.previewStat}>
            <Text style={[s.previewStatNum, { color: colors.primary }]}>
              {budget ? `$${parseFloat(budget).toLocaleString()}` : "TBD"}
            </Text>
            <Text style={[s.previewStatLabel, { color: colors.muted }]}>Budget</Text>
          </View>
          <View style={s.previewStat}>
            <Text style={[s.previewStatNum, { color: colors.primary }]}>
              {deadline || "None"}
            </Text>
            <Text style={[s.previewStatLabel, { color: colors.muted }]}>Deadline</Text>
          </View>
        </View>

        {/* Roles Summary */}
        {roles.length > 0 && (
          <View style={[s.previewRoles, { borderTopColor: colors.border }]}>
            <Text style={[s.previewRolesTitle, { color: colors.foreground }]}>Roles</Text>
            {roles.map((r) => (
              <View key={r.id} style={s.previewRoleItem}>
                <Text style={[s.previewRoleName, { color: colors.foreground }]}>{r.name || "Untitled"}</Text>
                <Text style={[s.previewRoleType, { color: colors.muted }]}>
                  {ROLE_TYPES.find((t) => t.value === r.type)?.label}
                  {r.compensation ? ` • $${r.compensation}/${r.compensationType}` : ""}
                </Text>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity
          onPress={() => setShowPreview(true)}
          style={[s.fullPreviewBtn, { borderColor: colors.primary }]}
          activeOpacity={0.7}
        >
          <IconSymbol name="eye.fill" size={16} color={colors.primary} />
          <Text style={[s.fullPreviewText, { color: colors.primary }]}>View Full Actor Preview</Text>
        </TouchableOpacity>
      </View>

      {/* Visibility */}
      <View style={[s.reqSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[s.reqSectionTitle, { color: colors.foreground }]}>Visibility</Text>
        {VISIBILITY_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            onPress={() => setVisibility(opt.value)}
            style={[
              s.visibilityOption,
              { borderColor: visibility === opt.value ? colors.primary : colors.border },
              visibility === opt.value && { backgroundColor: colors.primary + "08" },
            ]}
            activeOpacity={0.7}
          >
            <IconSymbol name={opt.icon} size={20} color={visibility === opt.value ? colors.primary : colors.muted} />
            <View style={{ flex: 1 }}>
              <Text style={[s.visLabel, { color: visibility === opt.value ? colors.primary : colors.foreground }]}>
                {opt.label}
              </Text>
              <Text style={[s.visDesc, { color: colors.muted }]}>{opt.desc}</Text>
            </View>
            <View style={[
              s.radioOuter,
              { borderColor: visibility === opt.value ? colors.primary : colors.border },
            ]}>
              {visibility === opt.value && <View style={[s.radioInner, { backgroundColor: colors.primary }]} />}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Featured Boost */}
      <View style={[s.reqSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flex: 1 }}>
            <Text style={[s.reqSectionTitle, { color: colors.foreground, marginBottom: 0 }]}>⚡ Boost This Casting</Text>
            <Text style={[s.stepDesc, { color: colors.muted, marginTop: 4, marginBottom: 0 }]}>
              Featured castings appear at the top of search results and get 3-5x more applicants.
            </Text>
          </View>
          <Switch
            value={boostEnabled}
            onValueChange={setBoostEnabled}
            trackColor={{ false: colors.border, true: colors.primary + "60" }}
            thumbColor={boostEnabled ? colors.primary : "#f4f3f4"}
          />
        </View>
        {boostEnabled && (
          <View style={{ marginTop: 16 }}>
            <View style={s.timingRow}>
              {([
                { days: 7 as const, price: "$29", label: "7 Days" },
                { days: 14 as const, price: "$49", label: "14 Days" },
                { days: 30 as const, price: "$79", label: "30 Days" },
              ]).map((opt) => (
                <TouchableOpacity
                  key={opt.days}
                  onPress={() => setBoostDuration(opt.days)}
                  style={[
                    s.timingOption,
                    { borderColor: boostDuration === opt.days ? colors.primary : colors.border, flex: 1 },
                    boostDuration === opt.days && { backgroundColor: colors.primary + "12" },
                  ]}
                  activeOpacity={0.7}
                >
                  <Text style={[s.timingLabel, { color: boostDuration === opt.days ? colors.primary : colors.foreground, fontWeight: "700", fontSize: 15 }]}>
                    {opt.label}
                  </Text>
                  <Text style={[s.timingLabel, { color: boostDuration === opt.days ? colors.primary : colors.muted, fontSize: 13 }]}>
                    {opt.price}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={[s.boostNote, { backgroundColor: colors.primary + "08", borderColor: colors.primary + "20" }]}>
              <Text style={{ fontSize: 12, color: colors.muted, lineHeight: 18 }}>
                Payment will be processed after publishing. Your casting will be marked with a ⚡ Featured badge and pinned to the top of actor feeds.
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Timing */}
      <View style={[s.reqSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[s.reqSectionTitle, { color: colors.foreground }]}>When to Publish</Text>
        <View style={s.timingRow}>
          {([
            { value: "now", label: "Now", icon: "bolt.fill" as const },
            { value: "schedule", label: "Schedule", icon: "calendar" as const },
            { value: "draft", label: "Draft", icon: "doc.fill" as const },
          ] as const).map((opt) => (
            <TouchableOpacity
              key={opt.value}
              onPress={() => setPublishTiming(opt.value)}
              style={[
                s.timingOption,
                { borderColor: publishTiming === opt.value ? colors.primary : colors.border },
                publishTiming === opt.value && { backgroundColor: colors.primary + "12" },
              ]}
              activeOpacity={0.7}
            >
              <IconSymbol name={opt.icon} size={20} color={publishTiming === opt.value ? colors.primary : colors.muted} />
              <Text style={[s.timingLabel, { color: publishTiming === opt.value ? colors.primary : colors.muted }]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {publishTiming === "schedule" && (
          <View style={[s.field, { marginTop: 12 }]}>
            <Text style={[s.fieldLabelSm, { color: colors.foreground }]}>Schedule Date</Text>
            <TextInput
              style={[s.inputSm, { borderColor: colors.border, color: colors.foreground }]}
              value={scheduleDate}
              onChangeText={setScheduleDate}
              placeholder="YYYY-MM-DD HH:MM"
              placeholderTextColor={colors.muted}
            />
          </View>
        )}
      </View>

      {/* Full Preview Modal */}
      <Modal visible={showPreview} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={[s.modalContent, { backgroundColor: colors.background, maxHeight: "90%" }]}>
            <View style={s.modalHeader}>
              <Text style={[s.modalTitle, { color: colors.foreground }]}>Actor Preview</Text>
              <TouchableOpacity onPress={() => setShowPreview(false)} style={s.modalClose}>
                <IconSymbol name="xmark" size={20} color={colors.foreground} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={s.previewModalBody}>
                <Text style={[s.previewModalTitle, { color: colors.foreground }]}>{title || "Untitled"}</Text>
                <Text style={[s.previewModalMeta, { color: colors.muted }]}>
                  {productionType} {company ? `by ${company}` : ""}
                </Text>
                {synopsis ? <Text style={[s.previewModalSynopsis, { color: colors.foreground }]}>{synopsis}</Text> : null}
                {budget ? <Text style={[s.previewModalBudget, { color: colors.primary }]}>Budget: ${parseFloat(budget).toLocaleString()}</Text> : null}
                {deadline ? <Text style={[s.previewModalDeadline, { color: colors.warning }]}>Deadline: {deadline}</Text> : null}

                {roles.map((r, i) => (
                  <View key={r.id} style={[s.previewModalRole, { borderColor: colors.border }]}>
                    <Text style={[s.previewModalRoleName, { color: colors.foreground }]}>{r.name || `Role ${i + 1}`}</Text>
                    <Text style={[s.previewModalRoleType, { color: colors.primary }]}>
                      {ROLE_TYPES.find((t) => t.value === r.type)?.label}
                    </Text>
                    {r.description ? <Text style={[s.previewModalRoleDesc, { color: colors.muted }]}>{r.description}</Text> : null}
                    <View style={s.previewModalRoleDetails}>
                      {r.age ? <Text style={[s.previewModalDetail, { color: colors.muted }]}>Age: {r.age}</Text> : null}
                      {r.gender ? <Text style={[s.previewModalDetail, { color: colors.muted }]}>Gender: {r.gender}</Text> : null}
                      {r.ethnicity ? <Text style={[s.previewModalDetail, { color: colors.muted }]}>Ethnicity: {r.ethnicity}</Text> : null}
                      {r.compensation ? (
                        <Text style={[s.previewModalDetail, { color: colors.success }]}>
                          ${r.compensation}/{r.compensationType}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                ))}

                {customQuestions.length > 0 && (
                  <View style={{ marginTop: 16 }}>
                    <Text style={[s.previewModalSubhead, { color: colors.foreground }]}>Screening Questions</Text>
                    {customQuestions.map((q, i) => (
                      <Text key={q.id} style={[s.previewModalQuestion, { color: colors.muted }]}>
                        {i + 1}. {q.text || "(Empty question)"} {q.required ? "*" : ""}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );

  // ═══════════════════════════════════════════════════════════
  // MAIN RENDER
  // ═══════════════════════════════════════════════════════════
  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={goBack} style={s.backBtn}>
          <IconSymbol name="arrow.left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[s.screenTitle, { color: colors.foreground }]}>Create Casting Call</Text>
        {step === 4 && (
          <TouchableOpacity
            onPress={handlePublish}
            disabled={createMutation.isPending}
            style={[s.publishHeaderBtn, { backgroundColor: colors.primary }]}
            activeOpacity={0.8}
          >
            {createMutation.isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={s.publishHeaderBtnText}>
                {publishTiming === "draft" ? "Save" : "Publish"}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {renderStepIndicator()}

      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={[s.bottomBar, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        {step > 1 && (
          <TouchableOpacity
            onPress={goBack}
            style={[s.navBtn, { borderColor: colors.border }]}
            activeOpacity={0.8}
          >
            <Text style={[s.navBtnText, { color: colors.foreground }]}>Back</Text>
          </TouchableOpacity>
        )}
        {step < 4 ? (
          <TouchableOpacity
            onPress={goNext}
            style={[s.navBtnPrimary, { backgroundColor: colors.primary }, !canAdvance && { opacity: 0.5 }]}
            activeOpacity={0.8}
            disabled={!canAdvance}
          >
            <Text style={s.navBtnPrimaryText}>
              {step === 1 ? "Add Roles" : step === 2 ? "Set Requirements" : "Review & Publish"}
            </Text>
            <IconSymbol name="arrow.right" size={16} color="#fff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handlePublish}
            style={[s.navBtnPrimary, { backgroundColor: publishTiming === "draft" ? colors.muted : colors.primary }]}
            activeOpacity={0.8}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <IconSymbol name={publishTiming === "draft" ? "doc.fill" : "megaphone.fill"} size={18} color="#fff" />
                <Text style={s.navBtnPrimaryText}>
                  {publishTiming === "draft" ? "Save Draft" : publishTiming === "schedule" ? "Schedule" : "Publish Now"}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </ScreenContainer>
  );
}

// ─── Styles ─────────────────────────────────────────────────
const s = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  backBtn: { padding: 4 },
  screenTitle: { fontSize: 20, fontWeight: "800", flex: 1 },
  publishHeaderBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  publishHeaderBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },

  // Step Indicator
  stepIndicator: { flexDirection: "row", paddingHorizontal: 24, paddingBottom: 16, alignItems: "center", justifyContent: "center" },
  stepItem: { flexDirection: "row", alignItems: "center" },
  stepCircle: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  stepNum: { fontSize: 12, fontWeight: "700" },
  stepLabel: { fontSize: 11, fontWeight: "600", marginLeft: 4, marginRight: 4 },
  stepLine: { width: 20, height: 2, borderRadius: 1, marginHorizontal: 2 },

  scrollContent: { paddingBottom: 120 },
  stepContent: { paddingHorizontal: 16, gap: 16 },
  stepHeaderRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  stepTitle: { fontSize: 22, fontWeight: "800" },
  stepDesc: { fontSize: 14, lineHeight: 20 },

  // Fields
  field: { gap: 6 },
  fieldLabel: { fontSize: 14, fontWeight: "600" },
  fieldLabelSm: { fontSize: 13, fontWeight: "600" },
  input: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  inputSm: { borderRadius: 10, borderBottomWidth: 1, paddingVertical: 8, fontSize: 14 },
  textarea: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, minHeight: 120 },
  textareaSm: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, minHeight: 80 },
  charCount: { fontSize: 11, textAlign: "right" as const, marginTop: 2 },
  row: { flexDirection: "row", gap: 12 },

  // Select
  selectBtn: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 13 },
  selectBtnText: { fontSize: 15 },

  // Chips
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5 },
  chipText: { fontSize: 13, fontWeight: "600" },
  chipSm: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, borderWidth: 1 },
  chipTextSm: { fontSize: 12, fontWeight: "600" },

  // Roles
  addBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  addBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  rolesList: { gap: 12 },
  roleCard: { borderRadius: 14, borderWidth: 1.5, overflow: "hidden" },
  roleHeader: { flexDirection: "row", alignItems: "center", padding: 14, gap: 10 },
  roleHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  roleNum: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  roleNumText: { fontSize: 14, fontWeight: "800" },
  roleName: { fontSize: 15, fontWeight: "700" },
  roleType: { fontSize: 12 },
  roleActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  roleActionBtn: { padding: 6 },
  roleEditor: { paddingHorizontal: 14, paddingBottom: 14, gap: 12, borderTopWidth: 1, borderTopColor: "#E5E7EB20" },
  compRow: { flexDirection: "row", gap: 12 },

  // Empty
  emptyState: { borderRadius: 16, borderWidth: 1.5, borderStyle: "dashed" as any, padding: 32, alignItems: "center", gap: 12 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  emptyDesc: { fontSize: 13, textAlign: "center" as const, lineHeight: 19 },
  emptyBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24, marginTop: 4 },
  emptyBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },

  // Summary
  rolesSummary: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 8 },
  summaryTitle: { fontSize: 14, fontWeight: "700" },
  summaryRow: { flexDirection: "row", justifyContent: "space-between" },
  summaryLabel: { fontSize: 13 },
  summaryValue: { fontSize: 13, fontWeight: "700" },

  // Requirements
  reqSection: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 8 },
  reqSectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  reqSectionTitle: { fontSize: 16, fontWeight: "700" },
  reqSectionDesc: { fontSize: 12, lineHeight: 18 },
  toggleGroup: { gap: 4, marginTop: 8 },
  toggleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 8 },
  toggleLabel: { fontSize: 14, fontWeight: "500" },

  // Questions
  questionCard: { borderRadius: 10, borderWidth: 1, padding: 12, gap: 8, marginTop: 8 },
  questionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  questionTypeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  questionTypeText: { fontSize: 11, fontWeight: "700" },
  questionActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  reqToggle: { fontSize: 12, fontWeight: "600" },
  removeQBtn: { padding: 4 },
  optionsList: { gap: 6, marginTop: 4 },
  optionInput: { borderBottomWidth: 1, paddingVertical: 6, fontSize: 13, paddingLeft: 12 },
  addOptionBtn: { paddingVertical: 6 },
  addOptionText: { fontSize: 12, fontWeight: "600" },
  addQuestionRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  addQuestionBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, borderWidth: 1 },
  addQuestionText: { fontSize: 12, fontWeight: "600" },

  // Preview
  previewCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 14 },
  previewHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  previewBadge: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  previewTitle: { fontSize: 18, fontWeight: "800" },
  previewMeta: { fontSize: 13, marginTop: 2 },
  previewSynopsis: { fontSize: 13, lineHeight: 19 },
  previewStats: { flexDirection: "row", gap: 8 },
  previewStat: { flex: 1, alignItems: "center", gap: 2 },
  previewStatNum: { fontSize: 16, fontWeight: "800" },
  previewStatLabel: { fontSize: 11 },
  previewRoles: { borderTopWidth: 1, paddingTop: 12, gap: 8 },
  previewRolesTitle: { fontSize: 14, fontWeight: "700" },
  previewRoleItem: { gap: 2 },
  previewRoleName: { fontSize: 14, fontWeight: "600" },
  previewRoleType: { fontSize: 12 },
  fullPreviewBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5 },
  fullPreviewText: { fontSize: 13, fontWeight: "700" },

  // Visibility
  visibilityOption: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 12, borderWidth: 1.5, marginTop: 8 },
  visLabel: { fontSize: 15, fontWeight: "600" },
  visDesc: { fontSize: 12, marginTop: 1 },
  radioOuter: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  radioInner: { width: 12, height: 12, borderRadius: 6 },

  // Timing
  timingRow: { flexDirection: "row", gap: 10, marginTop: 8 },
  timingOption: { flex: 1, alignItems: "center", gap: 6, padding: 14, borderRadius: 12, borderWidth: 1.5 },
  timingLabel: { fontSize: 13, fontWeight: "600" },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40, maxHeight: "80%" },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: "800" },
  modalClose: { padding: 8 },
  typeOption: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 14, paddingHorizontal: 16, borderRadius: 10 },
  typeOptionText: { fontSize: 16, fontWeight: "500" },

  // Preview Modal
  previewModalBody: { paddingBottom: 20, gap: 12 },
  previewModalTitle: { fontSize: 24, fontWeight: "800" },
  previewModalMeta: { fontSize: 14 },
  previewModalSynopsis: { fontSize: 15, lineHeight: 22 },
  previewModalBudget: { fontSize: 15, fontWeight: "700" },
  previewModalDeadline: { fontSize: 14, fontWeight: "600" },
  previewModalRole: { borderWidth: 1, borderRadius: 12, padding: 14, gap: 6 },
  previewModalRoleName: { fontSize: 16, fontWeight: "700" },
  previewModalRoleType: { fontSize: 13, fontWeight: "600" },
  previewModalRoleDesc: { fontSize: 13, lineHeight: 19 },
  previewModalRoleDetails: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  previewModalDetail: { fontSize: 12 },
  previewModalSubhead: { fontSize: 16, fontWeight: "700", marginBottom: 8 },
  previewModalQuestion: { fontSize: 14, lineHeight: 20 },

  // Bottom Bar
  bottomBar: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", gap: 12, paddingHorizontal: 16, paddingVertical: 12, paddingBottom: 32, borderTopWidth: 1 },
  navBtn: { paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5 },
  navBtnText: { fontSize: 15, fontWeight: "600" },
  navBtnPrimary: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 14 },
  navBtnPrimaryText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  boostNote: { marginTop: 12, padding: 12, borderRadius: 10, borderWidth: 1 },
});
