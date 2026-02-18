import { View, Text } from "react-native";
import { Input, Card, Button } from "@/components/ui/design-system";
import { Typography, Spacing } from "@/constants/design-tokens";
import { useColors } from "@/hooks/use-colors";
import type { WizardData } from "@/app/contract-wizard/index";

interface Props {
  data: WizardData;
  customMessage: string;
  onChangeMessage: (msg: string) => void;
  sent: boolean;
  onSend: () => void;
  sending: boolean;
}

export function SendStep({ data, customMessage, onChangeMessage }: Props) {
  const colors = useColors();
  const accent = (colors as any).accent || "#C9963B";

  const recipient = data.talent.selectedActorName || data.talent.inviteEmail || "Recipient";

  return (
    <View style={{ gap: Spacing.xl }}>
      <View>
        <Text style={[Typography.displaySm, { color: colors.foreground }]}>Send Contract</Text>
        <Text style={[Typography.bodySm, { color: colors.muted, marginTop: 4 }]}>
          Add a personal message and send to {recipient}
        </Text>
      </View>

      {/* Summary Card */}
      <Card>
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={{ fontSize: 24 }}>🎬</Text>
            <View style={{ flex: 1 }}>
              <Text style={[Typography.h2, { color: colors.foreground }]}>{data.project.title}</Text>
              <Text style={[Typography.caption, { color: colors.muted }]}>{data.project.type}</Text>
            </View>
          </View>
          <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 4 }} />
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={[Typography.caption, { color: colors.muted }]}>To</Text>
            <Text style={[Typography.bodySm, { color: colors.foreground }]}>{recipient}</Text>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={[Typography.caption, { color: colors.muted }]}>Amount</Text>
            <Text style={[Typography.bodySm, { color: accent, fontWeight: "700" }]}>${data.terms.amount || "0"}</Text>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={[Typography.caption, { color: colors.muted }]}>Duration</Text>
            <Text style={[Typography.bodySm, { color: colors.foreground }]}>
              {data.project.startDate && data.project.endDate
                ? `${data.project.startDate} – ${data.project.endDate}`
                : "Dates TBD"}
            </Text>
          </View>
        </View>
      </Card>

      {/* Personal Message */}
      <Input
        label="Personal Message (Optional)"
        placeholder={`Hi ${recipient.split(" ")[0] || "there"},\n\nI'd love to have you on board for this project. Please review the contract details and let me know if you have any questions.\n\nBest regards`}
        value={customMessage}
        onChangeText={onChangeMessage}
        multiline
        numberOfLines={6}
      />

      {/* What Happens Next */}
      <Card>
        <Text style={[Typography.h3, { color: colors.foreground, marginBottom: 12 }]}>What happens next?</Text>
        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: "row", gap: 12, alignItems: "flex-start" }}>
            <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: accent + "20", alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontSize: 12, fontWeight: "700", color: accent }}>1</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[Typography.labelMd, { color: colors.foreground }]}>Contract Sent</Text>
              <Text style={[Typography.caption, { color: colors.muted }]}>{recipient} receives the contract via email and in-app notification</Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: 12, alignItems: "flex-start" }}>
            <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: accent + "20", alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontSize: 12, fontWeight: "700", color: accent }}>2</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[Typography.labelMd, { color: colors.foreground }]}>Review & Negotiate</Text>
              <Text style={[Typography.caption, { color: colors.muted }]}>They can accept, request changes, or decline</Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: 12, alignItems: "flex-start" }}>
            <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: accent + "20", alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontSize: 12, fontWeight: "700", color: accent }}>3</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[Typography.labelMd, { color: colors.foreground }]}>Digital Signature</Text>
              <Text style={[Typography.caption, { color: colors.muted }]}>Both parties sign electronically to finalize</Text>
            </View>
          </View>
        </View>
      </Card>
    </View>
  );
}
