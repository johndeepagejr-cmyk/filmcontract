import { useState, useCallback, useMemo } from "react";
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { Stepper, Button, Divider } from "@/components/ui/design-system";
import { Typography, Spacing } from "@/constants/design-tokens";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import * as Haptics from "expo-haptics";

import { ProjectDetailsStep, type ProjectDetailsData } from "@/components/contract-wizard/ProjectDetails";
import { SelectTalentStep, type SelectTalentData } from "@/components/contract-wizard/SelectTalent";
import { TermsPaymentStep, type TermsPaymentData } from "@/components/contract-wizard/TermsPayment";
import { DeliverablesStep, type DeliverablesData } from "@/components/contract-wizard/Deliverables";
import { ReviewStep } from "@/components/contract-wizard/Review";
import { SendStep } from "@/components/contract-wizard/Send";

const STEPS = ["Project", "Talent", "Terms", "Details", "Review", "Send"];

export type WizardData = {
  project: ProjectDetailsData;
  talent: SelectTalentData;
  terms: TermsPaymentData;
  deliverables: DeliverablesData;
};

const defaultData: WizardData = {
  project: { title: "", type: "Feature Film", startDate: "", endDate: "", location: "", projectCode: "" },
  talent: { selectedActorId: null, selectedActorName: "", inviteEmail: "" },
  terms: { rateType: "daily", amount: "", paymentSchedule: "net_30", killFee: "", expenses: { travel: false, wardrobe: false, perDiem: false, perDiemAmount: "" }, overtimeRate: "" },
  deliverables: { callTime: "", wardrobeReqs: "", usageRights: [], territory: "domestic", usageTerm: "1_year", exclusivity: false, creditBilling: "", specialProvisions: { nudity: false, stunts: false, minors: false, other: "" } },
};

export default function ContractWizardScreen() {
  const colors = useColors();
  const router = useRouter();
  const params = useLocalSearchParams<{
    actorName?: string;
    actorId?: string;
    actorEmail?: string;
    projectTitle?: string;
    projectType?: string;
    amount?: string;
    rateType?: string;
  }>();

  // Pre-fill from Hire action or other sources
  const initialData: WizardData = useMemo(() => {
    const d = { ...defaultData };
    if (params.actorName) d.talent = { ...d.talent, selectedActorName: params.actorName, selectedActorId: params.actorId ? parseInt(params.actorId, 10) : null, inviteEmail: params.actorEmail || "" };
    if (params.projectTitle) d.project = { ...d.project, title: params.projectTitle, type: params.projectType || "Feature Film" };
    if (params.amount) d.terms = { ...d.terms, amount: params.amount, rateType: (params.rateType as any) || "flat" };
    return d;
  }, []);

  const [step, setStep] = useState(params.actorName ? 1 : 0);
  const [data, setData] = useState<WizardData>(initialData);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [customMessage, setCustomMessage] = useState("");

  const createContract = trpc.contracts.create.useMutation();

  const updateProject = useCallback((d: Partial<ProjectDetailsData>) => {
    setData(prev => ({ ...prev, project: { ...prev.project, ...d } }));
  }, []);
  const updateTalent = useCallback((d: Partial<SelectTalentData>) => {
    setData(prev => ({ ...prev, talent: { ...prev.talent, ...d } }));
  }, []);
  const updateTerms = useCallback((d: Partial<TermsPaymentData>) => {
    setData(prev => ({ ...prev, terms: { ...prev.terms, ...d } }));
  }, []);
  const updateDeliverables = useCallback((d: Partial<DeliverablesData>) => {
    setData(prev => ({ ...prev, deliverables: { ...prev.deliverables, ...d } }));
  }, []);

  const canAdvance = (): boolean => {
    switch (step) {
      case 0: return !!data.project.title && !!data.project.type;
      case 1: return !!data.talent.selectedActorId || !!data.talent.inviteEmail;
      case 2: return !!data.terms.amount;
      case 3: return true;
      case 4: return true;
      case 5: return true;
      default: return false;
    }
  };

  const next = () => {
    if (step < STEPS.length - 1) {
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setStep(s => s + 1);
    }
  };

  const prev = () => {
    if (step > 0) setStep(s => s - 1);
  };

  const handleSend = async () => {
    setSending(true);
    try {
      const payload = {
        projectTitle: data.project.title,
        actorId: data.talent.selectedActorId || 0,
        paymentTerms: `${data.terms.rateType}: $${data.terms.amount} (${data.terms.paymentSchedule})`,
        paymentAmount: data.terms.amount || undefined,
        startDate: data.project.startDate || undefined,
        endDate: data.project.endDate || undefined,
        deliverables: [
          data.deliverables.usageRights.join(", "),
          `Territory: ${data.deliverables.territory}`,
          `Credit: ${data.deliverables.creditBilling}`,
          data.deliverables.exclusivity ? "Exclusivity clause" : "",
        ].filter(Boolean).join(" | "),
        status: "active" as const,
      };
      await createContract.mutateAsync(payload as any);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSent(true);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to send contract");
    } finally {
      setSending(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0: return <ProjectDetailsStep data={data.project} onChange={updateProject} />;
      case 1: return <SelectTalentStep data={data.talent} onChange={updateTalent} />;
      case 2: return <TermsPaymentStep data={data.terms} onChange={updateTerms} />;
      case 3: return <DeliverablesStep data={data.deliverables} onChange={updateDeliverables} />;
      case 4: return <ReviewStep data={data} onEditSection={(s: number) => setStep(s)} />;
      case 5: return <SendStep data={data} customMessage={customMessage} onChangeMessage={setCustomMessage} sent={sent} onSend={handleSend} sending={sending} />;
      default: return null;
    }
  };

  if (sent) {
    return (
      <ScreenContainer className="p-6" edges={["top", "bottom", "left", "right"]}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: 20 }}>
          <Text style={{ fontSize: 60 }}>🎬</Text>
          <Text style={[Typography.displaySm, { color: colors.foreground, textAlign: "center" }]}>Contract Sent!</Text>
          <Text style={[Typography.bodyMd, { color: colors.muted, textAlign: "center", maxWidth: 280 }]}>
            Your contract has been sent to {data.talent.selectedActorName || data.talent.inviteEmail}. You'll be notified when they respond.
          </Text>
          <View style={{ gap: 12, width: "100%", maxWidth: 300, marginTop: 12 }}>
            <Button title="View Contract" onPress={() => router.back()} variant="primary" fullWidth />
            <Button title="Create Another" onPress={() => { setData(defaultData); setStep(0); setSent(false); setCustomMessage(""); }} variant="secondary" fullWidth />
          </View>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        {/* Header */}
        <View style={{ paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, paddingBottom: Spacing.md }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.lg }}>
            <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
              <Text style={[Typography.bodyMd, { color: colors.primary }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[Typography.h2, { color: colors.foreground }]}>New Contract</Text>
            <View style={{ width: 50 }} />
          </View>
          <Stepper steps={STEPS} currentStep={step} onStepPress={(s) => s <= step && setStep(s)} />
        </View>

        <Divider spacing={0} />

        {/* Step Content */}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 100 }} keyboardShouldPersistTaps="handled">
          {renderStep()}
        </ScrollView>

        {/* Footer Navigation */}
        <View style={{ flexDirection: "row", gap: 12, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.background }}>
          {step > 0 && (
            <Button title="Back" onPress={prev} variant="ghost" size="lg" />
          )}
          <View style={{ flex: 1 }}>
            {step < STEPS.length - 1 ? (
              <Button title="Continue" onPress={next} disabled={!canAdvance()} variant="accent" size="lg" fullWidth />
            ) : (
              <Button title="Send Contract" onPress={handleSend} loading={sending} variant="accent" size="lg" fullWidth />
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

// Need to import TouchableOpacity for the header
import { TouchableOpacity } from "react-native";
