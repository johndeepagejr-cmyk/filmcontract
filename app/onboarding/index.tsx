import { useState, useRef } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, FlatList, Dimensions, Platform, Alert, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { Button, Card, Input, Chip, Divider } from "@/components/ui/design-system";
import { Typography, Spacing, Radius } from "@/constants/design-tokens";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import * as Haptics from "expo-haptics";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, FadeIn, FadeInUp } from "react-native-reanimated";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type OnboardingData = {
  role: "producer" | "actor" | null;
  imdbUrl: string;
  unionStatus: "sag" | "non_union" | "fi_core" | null;
  unionId: string;
  bio: string;
  skills: string[];
  location: string;
  agency: string;
};

const INITIAL_DATA: OnboardingData = {
  role: null,
  imdbUrl: "",
  unionStatus: null,
  unionId: "",
  bio: "",
  skills: [],
  location: "",
  agency: "",
};

const SKILL_OPTIONS = [
  "Drama", "Comedy", "Action", "Voice Acting", "Improv",
  "Stage Combat", "Dance", "Singing", "Accents/Dialects",
  "Stunts", "Mocap", "Hosting", "Modeling",
];

export default function OnboardingScreen() {
  const colors = useColors();
  const accent = (colors as any).accent || "#C9963B";
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingData>(INITIAL_DATA);
  const [saving, setSaving] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const updateRole = trpc.user.updateRole.useMutation();

  const STEPS = [
    { title: "Choose Your Role", subtitle: "How will you use Film Contract?" },
    { title: "IMDb Profile", subtitle: "Connect your industry presence" },
    { title: "Union Status", subtitle: "Verify your membership" },
    { title: "Build Your Profile", subtitle: "Stand out to the industry" },
  ];

  const progress = (step + 1) / STEPS.length;

  const canProceed = () => {
    switch (step) {
      case 0: return data.role !== null;
      case 1: return true; // IMDb is optional
      case 2: return true; // Union is optional
      case 3: return true; // Profile is optional
      default: return true;
    }
  };

  const handleNext = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      // Complete onboarding
      setSaving(true);
      try {
        if (data.role) {
          await updateRole.mutateAsync({ userRole: data.role });
        }
        router.replace("/(tabs)");
      } catch (e: any) {
        Alert.alert("Error", e.message || "Failed to save profile");
      } finally {
        setSaving(false);
      }
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const toggleSkill = (skill: string) => {
    if (data.skills.includes(skill)) {
      setData({ ...data, skills: data.skills.filter((s) => s !== skill) });
    } else {
      setData({ ...data, skills: [...data.skills, skill] });
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <Animated.View entering={FadeInUp.duration(300)} style={{ gap: Spacing.xl }}>
            {/* Producer Card */}
            <TouchableOpacity
              onPress={() => {
                setData({ ...data, role: "producer" });
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }}
              activeOpacity={0.8}
            >
              <View style={[styles.roleCard, {
                backgroundColor: data.role === "producer" ? accent + "10" : colors.surface,
                borderColor: data.role === "producer" ? accent : colors.border,
                borderWidth: data.role === "producer" ? 2 : 1,
              }]}>
                <Text style={{ fontSize: 40 }}>🎬</Text>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={[Typography.h2, { color: data.role === "producer" ? accent : colors.foreground }]}>Producer</Text>
                  <Text style={[Typography.bodySm, { color: colors.muted }]}>
                    Create and manage contracts, find talent, organize productions
                  </Text>
                </View>
                {data.role === "producer" && (
                  <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: accent, alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ color: "#fff", fontWeight: "800", fontSize: 14 }}>✓</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>

            {/* Actor Card */}
            <TouchableOpacity
              onPress={() => {
                setData({ ...data, role: "actor" });
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }}
              activeOpacity={0.8}
            >
              <View style={[styles.roleCard, {
                backgroundColor: data.role === "actor" ? accent + "10" : colors.surface,
                borderColor: data.role === "actor" ? accent : colors.border,
                borderWidth: data.role === "actor" ? 2 : 1,
              }]}>
                <Text style={{ fontSize: 40 }}>🎭</Text>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={[Typography.h2, { color: data.role === "actor" ? accent : colors.foreground }]}>Actor</Text>
                  <Text style={[Typography.bodySm, { color: colors.muted }]}>
                    Browse casting calls, submit self-tapes, manage contracts
                  </Text>
                </View>
                {data.role === "actor" && (
                  <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: accent, alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ color: "#fff", fontWeight: "800", fontSize: 14 }}>✓</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </Animated.View>
        );

      case 1:
        return (
          <Animated.View entering={FadeInUp.duration(300)} style={{ gap: Spacing.xl }}>
            <Card>
              <View style={{ alignItems: "center", gap: 12, paddingVertical: 8 }}>
                <Text style={{ fontSize: 48 }}>🎥</Text>
                <Text style={[Typography.h3, { color: colors.foreground, textAlign: "center" }]}>
                  Connect Your IMDb Profile
                </Text>
                <Text style={[Typography.bodySm, { color: colors.muted, textAlign: "center" }]}>
                  Link your IMDb page to verify your credits and build trust with collaborators
                </Text>
              </View>
            </Card>
            <Input
              label="IMDb Profile URL"
              placeholder="https://www.imdb.com/name/nm..."
              value={data.imdbUrl}
              onChangeText={(t) => setData({ ...data, imdbUrl: t })}
              helper="Optional — you can add this later in your profile settings"
            />
            <View style={{ backgroundColor: colors.surface, borderRadius: Radius.md, padding: Spacing.md }}>
              <Text style={[Typography.caption, { color: colors.muted }]}>
                💡 Having an IMDb profile increases your visibility and credibility on the platform. Verified profiles get a badge.
              </Text>
            </View>
          </Animated.View>
        );

      case 2:
        return (
          <Animated.View entering={FadeInUp.duration(300)} style={{ gap: Spacing.xl }}>
            <View style={{ gap: Spacing.md }}>
              <Text style={[Typography.labelMd, { color: colors.foreground }]}>Union Membership</Text>
              <View style={{ gap: 10 }}>
                {([
                  { key: "sag", label: "SAG-AFTRA", desc: "Screen Actors Guild member" },
                  { key: "fi_core", label: "Financial Core", desc: "Fi-Core status" },
                  { key: "non_union", label: "Non-Union", desc: "Not currently a union member" },
                ] as const).map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    onPress={() => {
                      setData({ ...data, unionStatus: option.key });
                      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={{
                      flexDirection: "row", alignItems: "center", gap: 12,
                      padding: 16, borderRadius: Radius.md,
                      backgroundColor: data.unionStatus === option.key ? accent + "10" : colors.surface,
                      borderWidth: data.unionStatus === option.key ? 2 : 1,
                      borderColor: data.unionStatus === option.key ? accent : colors.border,
                    }}>
                      <View style={{
                        width: 22, height: 22, borderRadius: 11,
                        borderWidth: 2,
                        borderColor: data.unionStatus === option.key ? accent : colors.border,
                        backgroundColor: data.unionStatus === option.key ? accent : "transparent",
                        alignItems: "center", justifyContent: "center",
                      }}>
                        {data.unionStatus === option.key && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#fff" }} />}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[Typography.labelMd, { color: colors.foreground }]}>{option.label}</Text>
                        <Text style={[Typography.caption, { color: colors.muted }]}>{option.desc}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {data.unionStatus === "sag" && (
              <Input
                label="SAG-AFTRA Member ID"
                placeholder="Enter your member ID"
                value={data.unionId}
                onChangeText={(t) => setData({ ...data, unionId: t })}
                helper="Used for verification — kept confidential"
              />
            )}
          </Animated.View>
        );

      case 3:
        return (
          <Animated.View entering={FadeInUp.duration(300)} style={{ gap: Spacing.xl }}>
            <Input
              label="Bio"
              placeholder="Tell the industry about yourself..."
              value={data.bio}
              onChangeText={(t) => setData({ ...data, bio: t })}
              multiline
              numberOfLines={4}
              helper={`${data.bio.length}/500 characters`}
            />

            <Input
              label="Location"
              placeholder="e.g., Los Angeles, CA"
              value={data.location}
              onChangeText={(t) => setData({ ...data, location: t })}
            />

            <Input
              label="Agency / Representation"
              placeholder="e.g., CAA, WME, or Independent"
              value={data.agency}
              onChangeText={(t) => setData({ ...data, agency: t })}
              helper="Optional"
            />

            {data.role === "actor" && (
              <View style={{ gap: Spacing.sm }}>
                <Text style={[Typography.labelMd, { color: colors.foreground }]}>Skills & Specialties</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {SKILL_OPTIONS.map((skill) => (
                    <Chip
                      key={skill}
                      label={skill}
                      selected={data.skills.includes(skill)}
                      onPress={() => toggleSkill(skill)}
                    />
                  ))}
                </View>
              </View>
            )}
          </Animated.View>
        );

      default:
        return null;
    }
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Progress Bar */}
        <View style={{ paddingHorizontal: Spacing.lg, paddingTop: Spacing.md }}>
          <View style={{ height: 4, backgroundColor: colors.surface, borderRadius: 2, overflow: "hidden" }}>
            <Animated.View style={{
              height: "100%",
              width: `${progress * 100}%`,
              backgroundColor: accent,
              borderRadius: 2,
            }} />
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
            <Text style={[Typography.caption, { color: colors.muted }]}>Step {step + 1} of {STEPS.length}</Text>
            {step > 0 && (
              <TouchableOpacity onPress={handleBack} activeOpacity={0.7}>
                <Text style={[Typography.labelSm, { color: colors.primary }]}>Back</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Header */}
        <View style={{ paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.md }}>
          <Text style={[Typography.displaySm, { color: colors.foreground }]}>{STEPS[step].title}</Text>
          <Text style={[Typography.bodySm, { color: colors.muted, marginTop: 4 }]}>{STEPS[step].subtitle}</Text>
        </View>

        {/* Content */}
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderStep()}
        </ScrollView>

        {/* Footer */}
        <View style={{
          paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
          borderTopWidth: 1, borderTopColor: colors.border,
          backgroundColor: colors.background,
        }}>
          <Button
            title={step === STEPS.length - 1 ? "Complete Setup" : "Continue"}
            onPress={handleNext}
            variant="accent"
            fullWidth
            disabled={!canProceed()}
            loading={saving}
          />
          {step < STEPS.length - 1 && (
            <TouchableOpacity
              onPress={() => {
                setStep(step + 1);
              }}
              activeOpacity={0.7}
              style={{ alignSelf: "center", marginTop: 12 }}
            >
              <Text style={[Typography.labelSm, { color: colors.muted }]}>Skip for now</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  roleCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    padding: 20,
    borderRadius: 16,
  },
});
