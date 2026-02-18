import React, { createContext, useContext, useCallback, useEffect, useState, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Types ──────────────────────────────────────────────────────────────────

export type OnboardingRole = "actor" | "producer";

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  /** Which screen this step appears on */
  screen: string;
  /** Order within the flow */
  order: number;
}

/** Actor onboarding: 5 steps */
export const ACTOR_STEPS: OnboardingStep[] = [
  {
    id: "actor_casting_feed",
    title: "Find Casting Calls",
    description: "Browse open casting calls from producers. Swipe through roles that match your talent.",
    screen: "home",
    order: 0,
  },
  {
    id: "actor_submit_tape",
    title: "Submit Your First Tape",
    description: "Tap any casting call to view details, then hit Submit to send your audition tape.",
    screen: "home",
    order: 1,
  },
  {
    id: "actor_track_submissions",
    title: "Track Your Applications",
    description: "Check your submission status here — see which ones are shortlisted or hired.",
    screen: "home",
    order: 2,
  },
  {
    id: "actor_contracts",
    title: "Manage Your Contracts",
    description: "View and sign contracts, track payments, and manage your active gigs.",
    screen: "contracts",
    order: 3,
  },
  {
    id: "actor_profile",
    title: "Build Your Profile",
    description: "Add your headshot, bio, and reel to stand out to producers.",
    screen: "profile",
    order: 4,
  },
];

/** Producer onboarding: 5 steps */
export const PRODUCER_STEPS: OnboardingStep[] = [
  {
    id: "producer_post_casting",
    title: "Post a Casting Call",
    description: "Tap 'Post Casting' to create your first casting call and start finding talent.",
    screen: "home",
    order: 0,
  },
  {
    id: "producer_review_submissions",
    title: "Review Submissions",
    description: "When actors apply, their submissions appear in your casting pipeline. Review and shortlist here.",
    screen: "home",
    order: 1,
  },
  {
    id: "producer_hire_pay",
    title: "Hire & Pay Securely",
    description: "Hire talent directly and process payments through secure escrow.",
    screen: "home",
    order: 2,
  },
  {
    id: "producer_contracts",
    title: "Manage Contracts",
    description: "Create, send, and track contracts with your talent. Everything in one place.",
    screen: "contracts",
    order: 3,
  },
  {
    id: "producer_network",
    title: "Grow Your Network",
    description: "Discover actors, view profiles, and build your talent network.",
    screen: "network",
    order: 4,
  },
];

const STORAGE_KEY = "@filmcontract_onboarding";

interface OnboardingState {
  /** Whether onboarding has been completed for this role */
  completed: boolean;
  /** Whether onboarding was skipped */
  skipped: boolean;
  /** Index of the current step (within the role's steps array) */
  currentStepIndex: number;
  /** Which role this onboarding is for */
  role: OnboardingRole | null;
  /** Timestamp of completion/skip */
  completedAt: string | null;
}

interface OnboardingContextValue {
  /** Whether onboarding is active (visible) */
  isActive: boolean;
  /** The current step to show, or null if not active */
  currentStep: OnboardingStep | null;
  /** All steps for the current role */
  steps: OnboardingStep[];
  /** Current step index */
  currentStepIndex: number;
  /** Total steps count */
  totalSteps: number;
  /** Start onboarding for a given role */
  startOnboarding: (role: OnboardingRole) => void;
  /** Advance to the next step */
  nextStep: () => void;
  /** Go back to the previous step */
  prevStep: () => void;
  /** Skip the entire onboarding */
  skipOnboarding: () => void;
  /** Check if onboarding was completed or skipped for a role */
  isOnboardingDone: (role: OnboardingRole) => boolean;
  /** Reset onboarding for a role (for testing) */
  resetOnboarding: (role: OnboardingRole) => void;
  /** Whether the system is still loading from storage */
  loading: boolean;
  /** Get the step ID that should be highlighted on a given screen */
  getActiveStepForScreen: (screen: string) => OnboardingStep | null;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [states, setStates] = useState<Record<string, OnboardingState>>({});
  const [activeRole, setActiveRole] = useState<OnboardingRole | null>(null);
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);

  // Load from AsyncStorage on mount
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          setStates(JSON.parse(raw));
        }
      } catch (e) {
        console.warn("[Onboarding] Failed to load state:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Persist to AsyncStorage whenever states change
  const persist = useCallback(async (newStates: Record<string, OnboardingState>) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newStates));
    } catch (e) {
      console.warn("[Onboarding] Failed to persist state:", e);
    }
  }, []);

  const getStepsForRole = useCallback((role: OnboardingRole): OnboardingStep[] => {
    return role === "actor" ? ACTOR_STEPS : PRODUCER_STEPS;
  }, []);

  const isOnboardingDone = useCallback((role: OnboardingRole): boolean => {
    const state = states[role];
    return state?.completed || state?.skipped || false;
  }, [states]);

  const startOnboarding = useCallback((role: OnboardingRole) => {
    if (isOnboardingDone(role)) return;
    const existing = states[role];
    if (!existing) {
      const newState: OnboardingState = {
        completed: false,
        skipped: false,
        currentStepIndex: 0,
        role,
        completedAt: null,
      };
      const updated = { ...states, [role]: newState };
      setStates(updated);
      persist(updated);
    }
    setActiveRole(role);
  }, [states, isOnboardingDone, persist]);

  const nextStep = useCallback(() => {
    if (!activeRole) return;
    const steps = getStepsForRole(activeRole);
    const state = states[activeRole];
    if (!state) return;

    const nextIndex = state.currentStepIndex + 1;
    if (nextIndex >= steps.length) {
      // Completed all steps
      const updated = {
        ...states,
        [activeRole]: {
          ...state,
          completed: true,
          currentStepIndex: nextIndex,
          completedAt: new Date().toISOString(),
        },
      };
      setStates(updated);
      persist(updated);
      setActiveRole(null);
    } else {
      const updated = {
        ...states,
        [activeRole]: { ...state, currentStepIndex: nextIndex },
      };
      setStates(updated);
      persist(updated);
    }
  }, [activeRole, states, getStepsForRole, persist]);

  const prevStep = useCallback(() => {
    if (!activeRole) return;
    const state = states[activeRole];
    if (!state || state.currentStepIndex <= 0) return;

    const updated = {
      ...states,
      [activeRole]: { ...state, currentStepIndex: state.currentStepIndex - 1 },
    };
    setStates(updated);
    persist(updated);
  }, [activeRole, states, persist]);

  const skipOnboarding = useCallback(() => {
    if (!activeRole) return;
    const state = states[activeRole] || {
      completed: false,
      skipped: false,
      currentStepIndex: 0,
      role: activeRole,
      completedAt: null,
    };
    const updated = {
      ...states,
      [activeRole]: {
        ...state,
        skipped: true,
        completedAt: new Date().toISOString(),
      },
    };
    setStates(updated);
    persist(updated);
    setActiveRole(null);
  }, [activeRole, states, persist]);

  const resetOnboarding = useCallback((role: OnboardingRole) => {
    const updated = { ...states };
    delete updated[role];
    setStates(updated);
    persist(updated);
    if (activeRole === role) setActiveRole(null);
  }, [states, activeRole, persist]);

  const steps = activeRole ? getStepsForRole(activeRole) : [];
  const currentStepIndex = activeRole ? (states[activeRole]?.currentStepIndex ?? 0) : 0;
  const currentStep = activeRole && !isOnboardingDone(activeRole) ? (steps[currentStepIndex] ?? null) : null;

  const getActiveStepForScreen = useCallback((screen: string): OnboardingStep | null => {
    if (!activeRole || !currentStep) return null;
    if (currentStep.screen === screen) return currentStep;
    return null;
  }, [activeRole, currentStep]);

  return (
    <OnboardingContext.Provider
      value={{
        isActive: !!activeRole && !!currentStep,
        currentStep,
        steps,
        currentStepIndex,
        totalSteps: steps.length,
        startOnboarding,
        nextStep,
        prevStep,
        skipOnboarding,
        isOnboardingDone,
        resetOnboarding,
        loading,
        getActiveStepForScreen,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding(): OnboardingContextValue {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error("useOnboarding must be used within <OnboardingProvider>");
  }
  return ctx;
}
