/**
 * First Open Experience — Full-screen onboarding flow
 * 
 * Step 1: Welcome ("Welcome to FilmContract")
 * Step 2: Role Selection (Actor / Producer / Both)
 * Step 3: Home Tab Tour
 * Step 4: Contracts Tab Tour
 * Step 5: Network Tab Tour
 * Step 6: Profile Tab Tour
 * Final:  Completion with role-specific CTA
 * 
 * © 2025 John Dee Page Jr. All rights reserved.
 */

import { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Platform,
  StyleSheet,
  Image,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  FadeIn,
  FadeInUp,
  FadeInDown,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
  Easing,
  interpolate,
  runOnJS,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/use-colors";
import { Typography, Spacing, Radius } from "@/constants/design-tokens";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const STORAGE_KEY = "@filmcontract_first_open_done";

type SelectedRole = "actor" | "producer" | "both" | null;

interface FirstOpenExperienceProps {
  onComplete: (role: SelectedRole) => void;
}

// ─── Tab Tour Data ──────────────────────────────────────────────────────────

const TAB_TOURS = [
  {
    tabName: "Home",
    icon: "🏠",
    spotlight: "Find roles matched to your profile",
    description: "Browse casting calls, save favorites, apply with one tap",
    gradient: ["#1B2A4A", "#2D4A7A"],
  },
  {
    tabName: "Contracts",
    icon: "📄",
    spotlight: "Track your applications and active contracts",
    description: "View status, message producers, sign documents",
    gradient: ["#1A3A2A", "#2D6A4A"],
  },
  {
    tabName: "Network",
    icon: "🤝",
    spotlight: "Connect with casting directors",
    description: "Save contacts, message, build relationships",
    gradient: ["#3A1A4A", "#5A2D7A"],
  },
  {
    tabName: "Profile",
    icon: "👤",
    spotlight: "Your professional portfolio",
    description: "Add headshots, reel, credits, get verified",
    gradient: ["#4A2A1A", "#7A4A2D"],
  },
];

// ─── Dot Indicator ──────────────────────────────────────────────────────────

function DotIndicator({ total, current }: { total: number; current: number }) {
  const colors = useColors();
  const accent = (colors as any).accent || "#C9963B";

  return (
    <View style={styles.dotContainer}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            {
              backgroundColor: i === current ? accent : colors.border,
              width: i === current ? 24 : 8,
            },
          ]}
        />
      ))}
    </View>
  );
}

// ─── Step 1: Welcome Screen ─────────────────────────────────────────────────

function WelcomeStep({ onNext }: { onNext: () => void }) {
  const colors = useColors();
  const accent = (colors as any).accent || "#C9963B";
  const insets = useSafeAreaInsets();

  return (
    <Animated.View
      entering={FadeIn.duration(500)}
      style={[styles.fullScreen, { backgroundColor: colors.background }]}
    >
      <View style={[styles.stepContent, { paddingTop: insets.top + 60 }]}>
        {/* Logo / Icon area */}
        <Animated.View entering={FadeInUp.delay(200).duration(600)} style={styles.welcomeIconWrap}>
          <View style={[styles.welcomeIconCircle, { backgroundColor: accent + "15" }]}>
            <Text style={styles.welcomeEmoji}>🎬</Text>
          </View>
        </Animated.View>

        {/* Title */}
        <Animated.View entering={FadeInUp.delay(400).duration(600)} style={{ alignItems: "center" }}>
          <Text style={[styles.welcomeTitle, { color: colors.foreground }]}>
            Welcome to
          </Text>
          <Text style={[styles.welcomeTitleBold, { color: accent }]}>
            FilmContract
          </Text>
        </Animated.View>

        {/* Subtitle */}
        <Animated.View entering={FadeInUp.delay(600).duration(600)} style={{ alignItems: "center" }}>
          <Text style={[styles.welcomeSubtitle, { color: colors.muted }]}>
            Find casting calls, submit self-tapes, get hired
          </Text>
        </Animated.View>

        {/* Feature pills */}
        <Animated.View entering={FadeInUp.delay(800).duration(600)} style={styles.featurePills}>
          {["Casting Calls", "Self-Tapes", "Contracts", "Payments"].map((label, i) => (
            <View key={label} style={[styles.pill, { backgroundColor: accent + "12", borderColor: accent + "30" }]}>
              <Text style={[styles.pillText, { color: accent }]}>{label}</Text>
            </View>
          ))}
        </Animated.View>
      </View>

      {/* CTA */}
      <Animated.View
        entering={FadeInDown.delay(1000).duration(600)}
        style={[styles.bottomCTA, { paddingBottom: insets.bottom + 24 }]}
      >
        <TouchableOpacity
          onPress={() => {
            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onNext();
          }}
          activeOpacity={0.85}
          style={[styles.ctaButton, { backgroundColor: accent }]}
        >
          <Text style={styles.ctaText}>Get Started</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

// ─── Step 2: Role Selection ─────────────────────────────────────────────────

function RoleSelectionStep({
  selectedRole,
  onSelectRole,
  onNext,
}: {
  selectedRole: SelectedRole;
  onSelectRole: (role: SelectedRole) => void;
  onNext: () => void;
}) {
  const colors = useColors();
  const accent = (colors as any).accent || "#C9963B";
  const insets = useSafeAreaInsets();

  const roles: { key: SelectedRole; emoji: string; title: string; desc: string }[] = [
    {
      key: "actor",
      emoji: "🎭",
      title: "I am an Actor",
      desc: "Browse casting calls, submit self-tapes, manage contracts and get paid for your work",
    },
    {
      key: "producer",
      emoji: "🎬",
      title: "I am a Producer",
      desc: "Post casting calls, review submissions, hire talent and manage production contracts",
    },
    {
      key: "both",
      emoji: "⭐",
      title: "Both",
      desc: "Access all features — cast talent for your projects and audition for others",
    },
  ];

  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      style={[styles.fullScreen, { backgroundColor: colors.background }]}
    >
      <View style={[styles.stepContent, { paddingTop: insets.top + 40 }]}>
        <Animated.View entering={FadeInUp.delay(100).duration(400)}>
          <Text style={[styles.stepTitle, { color: colors.foreground }]}>Choose Your Role</Text>
          <Text style={[styles.stepSubtitle, { color: colors.muted }]}>
            How will you use FilmContract?
          </Text>
        </Animated.View>

        <View style={{ gap: 14, marginTop: 32 }}>
          {roles.map((role, i) => {
            const isSelected = selectedRole === role.key;
            return (
              <Animated.View key={role.key} entering={FadeInUp.delay(200 + i * 100).duration(400)}>
                <TouchableOpacity
                  onPress={() => {
                    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    onSelectRole(role.key);
                  }}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.roleCard,
                      {
                        backgroundColor: isSelected ? accent + "10" : colors.surface,
                        borderColor: isSelected ? accent : colors.border,
                        borderWidth: isSelected ? 2 : 1,
                      },
                    ]}
                  >
                    <Text style={{ fontSize: 36 }}>{role.emoji}</Text>
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text
                        style={[
                          Typography.h2,
                          { color: isSelected ? accent : colors.foreground },
                        ]}
                      >
                        {role.title}
                      </Text>
                      <Text style={[Typography.bodySm, { color: colors.muted }]}>{role.desc}</Text>
                    </View>
                    {isSelected && (
                      <View
                        style={[styles.checkCircle, { backgroundColor: accent }]}
                      >
                        <Text style={styles.checkMark}>✓</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>
      </View>

      {/* CTA */}
      <Animated.View
        entering={FadeInDown.delay(600).duration(400)}
        style={[styles.bottomCTA, { paddingBottom: insets.bottom + 24 }]}
      >
        <TouchableOpacity
          onPress={() => {
            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onNext();
          }}
          activeOpacity={0.85}
          disabled={!selectedRole}
          style={[
            styles.ctaButton,
            { backgroundColor: accent, opacity: selectedRole ? 1 : 0.4 },
          ]}
        >
          <Text style={styles.ctaText}>Continue</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

// ─── Steps 3–6: Tab Tour Spotlight ──────────────────────────────────────────

function TabTourStep({
  tour,
  stepNumber,
  totalSteps,
  onNext,
}: {
  tour: (typeof TAB_TOURS)[number];
  stepNumber: number;
  totalSteps: number;
  onNext: () => void;
}) {
  const colors = useColors();
  const accent = (colors as any).accent || "#C9963B";
  const insets = useSafeAreaInsets();

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      style={[styles.fullScreen, { backgroundColor: colors.background }]}
    >
      <View style={[styles.stepContent, { paddingTop: insets.top + 40 }]}>
        {/* Step indicator */}
        <Animated.View entering={FadeInUp.delay(100).duration(300)}>
          <Text style={[Typography.labelSm, { color: colors.muted, textTransform: "uppercase", letterSpacing: 1.5 }]}>
            Tab Tour · {stepNumber} of {totalSteps}
          </Text>
        </Animated.View>

        {/* Tab icon + name */}
        <Animated.View entering={FadeInUp.delay(200).duration(400)} style={styles.tourIconWrap}>
          <View style={[styles.tourIconCircle, { backgroundColor: accent + "15" }]}>
            <Text style={{ fontSize: 56 }}>{tour.icon}</Text>
          </View>
          <Text style={[styles.tourTabName, { color: colors.foreground }]}>{tour.tabName}</Text>
        </Animated.View>

        {/* Spotlight text */}
        <Animated.View entering={FadeInUp.delay(400).duration(400)} style={styles.spotlightWrap}>
          <View style={[styles.spotlightCard, { backgroundColor: accent + "08", borderColor: accent + "25" }]}>
            <View style={[styles.spotlightAccent, { backgroundColor: accent }]} />
            <View style={{ flex: 1, gap: 8 }}>
              <Text style={[Typography.h1, { color: colors.foreground }]}>{tour.spotlight}</Text>
              <Text style={[Typography.bodyMd, { color: colors.muted, lineHeight: 22 }]}>
                {tour.description}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Mock tab bar preview */}
        <Animated.View entering={FadeInUp.delay(600).duration(400)} style={{ marginTop: 32 }}>
          <View style={[styles.mockTabBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {TAB_TOURS.map((t, i) => {
              const isActive = t.tabName === tour.tabName;
              return (
                <View key={t.tabName} style={styles.mockTab}>
                  <Text style={{ fontSize: 22, opacity: isActive ? 1 : 0.35 }}>{t.icon}</Text>
                  <Text
                    style={[
                      Typography.caption,
                      { color: isActive ? accent : colors.muted, fontWeight: isActive ? "700" : "400" },
                    ]}
                  >
                    {t.tabName}
                  </Text>
                  {isActive && <View style={[styles.activeTabDot, { backgroundColor: accent }]} />}
                </View>
              );
            })}
          </View>
        </Animated.View>
      </View>

      {/* CTA */}
      <Animated.View
        entering={FadeInDown.delay(500).duration(400)}
        style={[styles.bottomCTA, { paddingBottom: insets.bottom + 24 }]}
      >
        <TouchableOpacity
          onPress={() => {
            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onNext();
          }}
          activeOpacity={0.85}
          style={[styles.ctaButton, { backgroundColor: accent }]}
        >
          <Text style={styles.ctaText}>Next</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            // Skip tour entirely — jump to completion
            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onNext();
          }}
          activeOpacity={0.7}
          style={{ marginTop: 12, alignSelf: "center" }}
        >
          <Text style={[Typography.labelSm, { color: colors.muted }]}>Skip Tour</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

// ─── Final: Completion Screen ───────────────────────────────────────────────

function CompletionStep({
  selectedRole,
  onFinish,
}: {
  selectedRole: SelectedRole;
  onFinish: () => void;
}) {
  const colors = useColors();
  const accent = (colors as any).accent || "#C9963B";
  const insets = useSafeAreaInsets();

  const ctaLabel =
    selectedRole === "producer"
      ? "Post a Role"
      : selectedRole === "both"
        ? "Explore FilmContract"
        : "Explore Casting Calls";

  return (
    <Animated.View
      entering={FadeIn.duration(500)}
      style={[styles.fullScreen, { backgroundColor: colors.background }]}
    >
      <View style={[styles.stepContent, { paddingTop: insets.top + 80, alignItems: "center" }]}>
        {/* Celebration icon */}
        <Animated.View entering={FadeInUp.delay(200).duration(600)}>
          <View style={[styles.completionIconCircle, { backgroundColor: accent + "15" }]}>
            <Text style={{ fontSize: 64 }}>🎉</Text>
          </View>
        </Animated.View>

        {/* Title */}
        <Animated.View entering={FadeInUp.delay(400).duration(600)} style={{ alignItems: "center", marginTop: 32 }}>
          <Text style={[styles.completionTitle, { color: colors.foreground }]}>You're ready!</Text>
          <Text style={[styles.completionSubtitle, { color: colors.muted }]}>
            {selectedRole === "producer"
              ? "Start posting roles and discovering talent for your next production."
              : selectedRole === "both"
                ? "You have full access to casting, contracts, and networking."
                : "Start browsing casting calls and land your next role."}
          </Text>
        </Animated.View>

        {/* Quick stats */}
        <Animated.View entering={FadeInUp.delay(600).duration(600)} style={styles.quickStats}>
          {[
            { label: "Casting Calls", value: "100+", icon: "🎬" },
            { label: "Active Producers", value: "50+", icon: "🎥" },
            { label: "Contracts Signed", value: "500+", icon: "📝" },
          ].map((stat) => (
            <View key={stat.label} style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={{ fontSize: 24 }}>{stat.icon}</Text>
              <Text style={[Typography.h2, { color: accent }]}>{stat.value}</Text>
              <Text style={[Typography.caption, { color: colors.muted }]}>{stat.label}</Text>
            </View>
          ))}
        </Animated.View>
      </View>

      {/* CTA */}
      <Animated.View
        entering={FadeInDown.delay(800).duration(600)}
        style={[styles.bottomCTA, { paddingBottom: insets.bottom + 24 }]}
      >
        <TouchableOpacity
          onPress={() => {
            if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onFinish();
          }}
          activeOpacity={0.85}
          style={[styles.ctaButton, { backgroundColor: accent }]}
        >
          <Text style={styles.ctaText}>{ctaLabel}</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function FirstOpenExperience({ onComplete }: FirstOpenExperienceProps) {
  const [step, setStep] = useState(0); // 0=welcome, 1=role, 2-5=tour, 6=completion
  const [selectedRole, setSelectedRole] = useState<SelectedRole>(null);
  const colors = useColors();

  // Total steps: welcome(0) + role(1) + 4 tours(2-5) + completion(6) = 7
  const TOTAL_DOTS = 7;

  const goNext = useCallback(() => {
    setStep((prev) => prev + 1);
  }, []);

  const handleFinish = useCallback(async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
        completed: true,
        role: selectedRole,
        completedAt: new Date().toISOString(),
      }));
    } catch (e) {
      console.warn("[FirstOpen] Failed to persist:", e);
    }
    onComplete(selectedRole);
  }, [selectedRole, onComplete]);

  const renderStep = () => {
    switch (step) {
      case 0:
        return <WelcomeStep onNext={goNext} />;
      case 1:
        return (
          <RoleSelectionStep
            selectedRole={selectedRole}
            onSelectRole={setSelectedRole}
            onNext={goNext}
          />
        );
      case 2:
      case 3:
      case 4:
      case 5:
        return (
          <TabTourStep
            tour={TAB_TOURS[step - 2]}
            stepNumber={step - 1}
            totalSteps={4}
            onNext={goNext}
          />
        );
      case 6:
        return <CompletionStep selectedRole={selectedRole} onFinish={handleFinish} />;
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {renderStep()}
      {/* Dot indicator at bottom-center, above CTA */}
      <View style={styles.dotOverlay}>
        <DotIndicator total={TOTAL_DOTS} current={step} />
      </View>
    </View>
  );
}

// ─── Static helper to check if first open is done ───────────────────────────

export async function isFirstOpenDone(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      return data.completed === true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function resetFirstOpen(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  fullScreen: {
    flex: 1,
  },
  stepContent: {
    flex: 1,
    paddingHorizontal: 24,
  },

  // Welcome
  welcomeIconWrap: {
    alignItems: "center",
    marginBottom: 32,
  },
  welcomeIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  welcomeEmoji: {
    fontSize: 56,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: "400",
    lineHeight: 34,
  },
  welcomeTitleBold: {
    fontSize: 36,
    fontWeight: "800",
    lineHeight: 44,
    letterSpacing: -0.5,
  },
  welcomeSubtitle: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    marginTop: 12,
    paddingHorizontal: 20,
  },
  featurePills: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
    marginTop: 32,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 13,
    fontWeight: "600",
  },

  // Role Selection
  roleCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 18,
    borderRadius: 16,
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  checkMark: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 14,
  },
  stepTitle: {
    fontSize: 26,
    fontWeight: "700",
    lineHeight: 32,
  },
  stepSubtitle: {
    fontSize: 15,
    lineHeight: 21,
    marginTop: 6,
  },

  // Tab Tour
  tourIconWrap: {
    alignItems: "center",
    marginTop: 40,
    gap: 12,
  },
  tourIconCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: "center",
    justifyContent: "center",
  },
  tourTabName: {
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  spotlightWrap: {
    marginTop: 32,
  },
  spotlightCard: {
    flexDirection: "row",
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    gap: 16,
  },
  spotlightAccent: {
    width: 4,
    borderRadius: 2,
    alignSelf: "stretch",
  },
  mockTabBar: {
    flexDirection: "row",
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  mockTab: {
    flex: 1,
    alignItems: "center",
    gap: 4,
    position: "relative",
  },
  activeTabDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 2,
  },

  // Completion
  completionIconCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    alignItems: "center",
    justifyContent: "center",
  },
  completionTitle: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  completionSubtitle: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    marginTop: 12,
    paddingHorizontal: 16,
  },
  quickStats: {
    flexDirection: "row",
    gap: 12,
    marginTop: 40,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    gap: 6,
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1,
  },

  // CTA
  bottomCTA: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  ctaButton: {
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },

  // Dots
  dotContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotOverlay: {
    position: "absolute",
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: "center",
  },
});
