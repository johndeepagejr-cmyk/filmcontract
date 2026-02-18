import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Platform,
} from "react-native";
import { useOnboarding } from "@/context/OnboardingContext";
import { useColors } from "@/hooks/use-colors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface OnboardingTooltipProps {
  /** The screen name this tooltip is placed on */
  screen: string;
  /** Children to render (the target element) */
  children: React.ReactNode;
  /** Step ID this tooltip is associated with */
  stepId: string;
  /** Placement of the tooltip relative to the target */
  placement?: "top" | "bottom";
  /** Optional offset from the target */
  offsetY?: number;
}

/**
 * Wraps a target element and shows a tooltip overlay when the matching
 * onboarding step is active. Uses a pulsing highlight border + tooltip card.
 */
export function OnboardingTooltip({
  screen,
  children,
  stepId,
  placement = "bottom",
  offsetY = 8,
}: OnboardingTooltipProps) {
  const { currentStep, isActive } = useOnboarding();
  const isVisible = isActive && currentStep?.id === stepId;

  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 0, duration: 1000, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isVisible, pulseAnim]);

  if (!isVisible) {
    return <>{children}</>;
  }

  const borderOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 1],
  });

  return (
    <View style={styles.wrapper}>
      <Animated.View
        style={[
          styles.highlightBorder,
          { borderColor: "#0a7ea4", opacity: borderOpacity },
        ]}
      >
        {children}
      </Animated.View>
      {placement === "bottom" && <View style={{ height: offsetY }} />}
      <TooltipCard placement={placement} offsetY={offsetY} />
      {placement === "top" && <View style={{ height: offsetY }} />}
    </View>
  );
}

/**
 * The tooltip card with step info, navigation, and skip.
 */
function TooltipCard({ placement, offsetY }: { placement: "top" | "bottom"; offsetY: number }) {
  const colors = useColors();
  const {
    currentStep,
    currentStepIndex,
    totalSteps,
    nextStep,
    prevStep,
    skipOnboarding,
  } = useOnboarding();

  if (!currentStep) return null;

  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === totalSteps - 1;

  return (
    <View
      style={[
        styles.tooltipCard,
        {
          backgroundColor: colors.surface,
          borderColor: colors.primary,
          ...(placement === "top" ? { marginBottom: offsetY } : {}),
        },
      ]}
    >
      {/* Arrow */}
      <View
        style={[
          styles.arrow,
          placement === "top" ? styles.arrowBottom : styles.arrowTop,
          { borderBottomColor: placement === "bottom" ? colors.primary : "transparent", borderTopColor: placement === "top" ? colors.primary : "transparent" },
        ]}
      />

      {/* Step indicator */}
      <View style={styles.stepIndicatorRow}>
        <View style={styles.stepDots}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.stepDot,
                {
                  backgroundColor: i === currentStepIndex ? colors.primary : colors.border,
                  width: i === currentStepIndex ? 20 : 8,
                },
              ]}
            />
          ))}
        </View>
        <TouchableOpacity onPress={skipOnboarding} style={styles.skipBtn}>
          <Text style={[styles.skipText, { color: colors.muted }]}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <Text style={[styles.tooltipTitle, { color: colors.foreground }]}>
        {currentStep.title}
      </Text>
      <Text style={[styles.tooltipDesc, { color: colors.muted }]}>
        {currentStep.description}
      </Text>

      {/* Navigation */}
      <View style={styles.navRow}>
        {!isFirst ? (
          <TouchableOpacity
            onPress={prevStep}
            style={[styles.navBtn, styles.backBtn, { borderColor: colors.border }]}
          >
            <Text style={[styles.navBtnText, { color: colors.muted }]}>Back</Text>
          </TouchableOpacity>
        ) : (
          <View />
        )}
        <TouchableOpacity
          onPress={nextStep}
          style={[styles.navBtn, styles.nextBtn, { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.navBtnText, { color: "#fff" }]}>
            {isLast ? "Done" : "Next"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/**
 * A full-screen overlay version that doesn't wrap a target element.
 * Used when the tooltip needs to appear as a standalone modal-like overlay.
 */
export function OnboardingOverlay({ screen }: { screen: string }) {
  const colors = useColors();
  const {
    isActive,
    currentStep,
    currentStepIndex,
    totalSteps,
    nextStep,
    prevStep,
    skipOnboarding,
  } = useOnboarding();

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isActive && currentStep?.screen === screen) {
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    } else {
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    }
  }, [isActive, currentStep, screen, fadeAnim]);

  if (!isActive || !currentStep || currentStep.screen !== screen) {
    return null;
  }

  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === totalSteps - 1;

  return (
    <Animated.View
      style={[styles.overlayContainer, { opacity: fadeAnim }]}
      pointerEvents={isActive && currentStep?.screen === screen ? "auto" : "none"}
    >
      <View style={[styles.overlayCard, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
        {/* Step indicator */}
        <View style={styles.stepIndicatorRow}>
          <View style={styles.stepDots}>
            {Array.from({ length: totalSteps }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.stepDot,
                  {
                    backgroundColor: i === currentStepIndex ? colors.primary : colors.border,
                    width: i === currentStepIndex ? 20 : 8,
                  },
                ]}
              />
            ))}
          </View>
          <TouchableOpacity onPress={skipOnboarding} style={styles.skipBtn}>
            <Text style={[styles.skipText, { color: colors.muted }]}>Skip</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.overlayTitle, { color: colors.foreground }]}>
          {currentStep.title}
        </Text>
        <Text style={[styles.overlayDesc, { color: colors.muted }]}>
          {currentStep.description}
        </Text>

        <View style={styles.navRow}>
          {!isFirst ? (
            <TouchableOpacity
              onPress={prevStep}
              style={[styles.navBtn, styles.backBtn, { borderColor: colors.border }]}
            >
              <Text style={[styles.navBtnText, { color: colors.muted }]}>Back</Text>
            </TouchableOpacity>
          ) : (
            <View />
          )}
          <TouchableOpacity
            onPress={nextStep}
            style={[styles.navBtn, styles.nextBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.navBtnText, { color: "#fff" }]}>
              {isLast ? "Done" : "Next"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "relative",
    zIndex: 1000,
  },
  highlightBorder: {
    borderWidth: 2,
    borderRadius: 16,
    borderStyle: "dashed",
  },
  tooltipCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    marginHorizontal: 4,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
      web: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
    }),
  },
  arrow: {
    position: "absolute",
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    alignSelf: "center",
    left: 24,
  },
  arrowTop: {
    top: -8,
    borderBottomWidth: 8,
  },
  arrowBottom: {
    bottom: -8,
    borderTopWidth: 8,
  },
  stepIndicatorRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  stepDots: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  stepDot: {
    height: 8,
    borderRadius: 4,
  },
  skipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  skipText: {
    fontSize: 14,
    fontWeight: "600",
  },
  tooltipTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 4,
  },
  tooltipDesc: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  navBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 80,
    alignItems: "center",
  },
  backBtn: {
    borderWidth: 1,
  },
  nextBtn: {},
  navBtnText: {
    fontSize: 15,
    fontWeight: "700",
  },
  // Overlay styles
  overlayContainer: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  overlayCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
      },
      android: { elevation: 12 },
      web: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
      },
    }),
  },
  overlayTitle: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 6,
  },
  overlayDesc: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
  },
});
