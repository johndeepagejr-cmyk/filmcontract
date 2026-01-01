import { Modal, View, Text, TouchableOpacity, Pressable, Dimensions } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

const ONBOARDING_STORAGE_KEY = "@onboarding_completed";

interface OnboardingStep {
  title: string;
  description: string;
  icon: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    title: "Welcome to FilmContract",
    description: "Create and manage transparent contracts between producers and actors. Let's show you around!",
    icon: "🎬",
  },
  {
    title: "Find Talent or Producers",
    description: "Browse the directory to discover actors or producers. Use filters to find the perfect match for your project.",
    icon: "🔍",
  },
  {
    title: "Create Contracts",
    description: "Tap the Create tab to draft new contracts. Set terms, payment details, and get digital signatures from both parties.",
    icon: "📝",
  },
  {
    title: "Build Your Portfolio",
    description: "Upload photos, add filmography, and showcase your work. Your profile is your digital resume in the film industry.",
    icon: "📸",
  },
  {
    title: "Track Analytics",
    description: "View your portfolio views, contract statistics, and payment trends. Data-driven insights to grow your career or business.",
    icon: "📊",
  },
];

interface OnboardingTutorialProps {
  onComplete: () => void;
}

export function OnboardingTutorial({ onComplete }: OnboardingTutorialProps) {
  const colors = useColors();
  const [visible, setVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const { width } = Dimensions.get("window");

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const completed = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (!completed) {
        setVisible(true);
      }
    } catch (error) {
      console.error("Failed to check onboarding status:", error);
    }
  };

  const handleNext = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await completeOnboarding();
  };

  const handleComplete = async () => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    await completeOnboarding();
  };

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
      setVisible(false);
      onComplete();
    } catch (error) {
      console.error("Failed to save onboarding status:", error);
    }
  };

  if (!visible) return null;

  const step = ONBOARDING_STEPS[currentStep];
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleSkip}
      statusBarTranslucent
    >
      <Pressable
        className="flex-1 bg-black/80 justify-center items-center p-6"
        onPress={handleSkip}
      >
        <Pressable
          className="bg-background rounded-3xl p-8 gap-6 w-full max-w-md"
          style={{ backgroundColor: colors.background, maxWidth: Math.min(width - 48, 400) }}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Icon */}
          <View className="items-center">
            <Text className="text-7xl mb-4">{step.icon}</Text>
          </View>

          {/* Content */}
          <View className="gap-3">
            <Text className="text-2xl font-bold text-foreground text-center">
              {step.title}
            </Text>
            <Text className="text-base text-muted text-center leading-relaxed">
              {step.description}
            </Text>
          </View>

          {/* Progress Dots */}
          <View className="flex-row justify-center gap-2">
            {ONBOARDING_STEPS.map((_, index) => (
              <View
                key={index}
                className={`h-2 rounded-full ${
                  index === currentStep ? "w-8 bg-primary" : "w-2 bg-border"
                }`}
                style={{
                  backgroundColor: index === currentStep ? colors.primary : colors.border,
                }}
              />
            ))}
          </View>

          {/* Buttons */}
          <View className="gap-3">
            <TouchableOpacity
              onPress={handleNext}
              className="bg-primary py-4 rounded-xl active:opacity-80"
              style={{ backgroundColor: colors.primary }}
            >
              <Text className="text-white text-center font-bold text-lg">
                {isLastStep ? "Get Started" : "Next"}
              </Text>
            </TouchableOpacity>

            {!isLastStep && (
              <TouchableOpacity
                onPress={handleSkip}
                className="py-3 active:opacity-70"
              >
                <Text className="text-muted text-center font-semibold">
                  Skip Tutorial
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
