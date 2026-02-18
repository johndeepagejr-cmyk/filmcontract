import { View, Text, TouchableOpacity } from "react-native";
import { Card, SectionHeader, Divider } from "@/components/ui/design-system";
import { Typography, Spacing } from "@/constants/design-tokens";
import { useColors } from "@/hooks/use-colors";
import type { WizardData } from "@/app/contract-wizard/index";

interface Props {
  data: WizardData;
  onEditSection: (step: number) => void;
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  const colors = useColors();
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 }}>
      <Text style={[Typography.caption, { color: colors.muted, flex: 1 }]}>{label}</Text>
      <Text style={[Typography.bodySm, { color: colors.foreground, flex: 1.5, textAlign: "right" }]}>{value || "—"}</Text>
    </View>
  );
}

function EditButton({ onPress }: { onPress: () => void }) {
  const colors = useColors();
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Text style={[Typography.labelSm, { color: colors.primary }]}>Edit</Text>
    </TouchableOpacity>
  );
}

const RATE_LABELS: Record<string, string> = { daily: "Daily Rate", weekly: "Weekly Rate", flat: "Flat Fee", per_episode: "Per Episode" };
const SCHEDULE_LABELS: Record<string, string> = { net_15: "Net 15", net_30: "Net 30", net_60: "Net 60", upon_completion: "Upon Completion" };
const TERRITORY_LABELS: Record<string, string> = { domestic: "Domestic (US)", north_america: "North America", worldwide: "Worldwide", custom: "Custom" };
const TERM_LABELS: Record<string, string> = { "1_year": "1 Year", "3_years": "3 Years", "5_years": "5 Years", perpetuity: "In Perpetuity" };

export function ReviewStep({ data, onEditSection }: Props) {
  const colors = useColors();
  const accent = (colors as any).accent || "#C9963B";

  return (
    <View style={{ gap: Spacing.xl }}>
      <View>
        <Text style={[Typography.displaySm, { color: colors.foreground }]}>Review Contract</Text>
        <Text style={[Typography.bodySm, { color: colors.muted, marginTop: 4 }]}>
          Review all details before sending
        </Text>
      </View>

      {/* Project Details */}
      <Card>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <Text style={[Typography.h2, { color: accent }]}>Project Details</Text>
          <EditButton onPress={() => onEditSection(0)} />
        </View>
        <ReviewRow label="Title" value={data.project.title} />
        <ReviewRow label="Type" value={data.project.type} />
        <ReviewRow label="Start Date" value={data.project.startDate} />
        <ReviewRow label="End Date" value={data.project.endDate} />
        <ReviewRow label="Location" value={data.project.location} />
        <ReviewRow label="Project Code" value={data.project.projectCode} />
      </Card>

      {/* Talent */}
      <Card>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <Text style={[Typography.h2, { color: accent }]}>Talent</Text>
          <EditButton onPress={() => onEditSection(1)} />
        </View>
        {data.talent.selectedActorId ? (
          <ReviewRow label="Selected Actor" value={data.talent.selectedActorName} />
        ) : (
          <ReviewRow label="Invite Email" value={data.talent.inviteEmail} />
        )}
      </Card>

      {/* Terms & Payment */}
      <Card>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <Text style={[Typography.h2, { color: accent }]}>Terms & Payment</Text>
          <EditButton onPress={() => onEditSection(2)} />
        </View>
        <ReviewRow label="Rate Type" value={RATE_LABELS[data.terms.rateType] || data.terms.rateType} />
        <ReviewRow label="Amount" value={data.terms.amount ? `$${data.terms.amount}` : "—"} />
        <ReviewRow label="Payment Schedule" value={SCHEDULE_LABELS[data.terms.paymentSchedule] || data.terms.paymentSchedule} />
        <ReviewRow label="Kill Fee" value={data.terms.killFee ? `${data.terms.killFee}%` : "—"} />
        <ReviewRow label="Overtime Rate" value={data.terms.overtimeRate ? `$${data.terms.overtimeRate}/hr` : "—"} />
        <Divider spacing={8} />
        <Text style={[Typography.caption, { color: colors.muted, marginBottom: 4 }]}>Covered Expenses</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
          {data.terms.expenses.travel && <View style={{ backgroundColor: colors.success + "15", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}><Text style={[Typography.caption, { color: colors.success }]}>Travel</Text></View>}
          {data.terms.expenses.wardrobe && <View style={{ backgroundColor: colors.success + "15", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}><Text style={[Typography.caption, { color: colors.success }]}>Wardrobe</Text></View>}
          {data.terms.expenses.perDiem && <View style={{ backgroundColor: colors.success + "15", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}><Text style={[Typography.caption, { color: colors.success }]}>{`Per Diem ($${data.terms.expenses.perDiemAmount || "0"}/day)`}</Text></View>}
          {!data.terms.expenses.travel && !data.terms.expenses.wardrobe && !data.terms.expenses.perDiem && (
            <Text style={[Typography.caption, { color: colors.muted }]}>None selected</Text>
          )}
        </View>
      </Card>

      {/* Deliverables */}
      <Card>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <Text style={[Typography.h2, { color: accent }]}>Deliverables & Details</Text>
          <EditButton onPress={() => onEditSection(3)} />
        </View>
        <ReviewRow label="Call Time" value={data.deliverables.callTime} />
        <ReviewRow label="Usage Rights" value={data.deliverables.usageRights.join(", ") || "—"} />
        <ReviewRow label="Territory" value={TERRITORY_LABELS[data.deliverables.territory] || data.deliverables.territory} />
        <ReviewRow label="Usage Term" value={TERM_LABELS[data.deliverables.usageTerm] || data.deliverables.usageTerm} />
        <ReviewRow label="Exclusivity" value={data.deliverables.exclusivity ? "Yes" : "No"} />
        <ReviewRow label="Credit / Billing" value={data.deliverables.creditBilling} />
        {(data.deliverables.specialProvisions.nudity || data.deliverables.specialProvisions.stunts || data.deliverables.specialProvisions.minors) && (
          <>
            <Divider spacing={8} />
            <Text style={[Typography.caption, { color: colors.warning, marginBottom: 4 }]}>Special Provisions</Text>
            {data.deliverables.specialProvisions.nudity && <Text style={[Typography.bodySm, { color: colors.foreground }]}>• Nudity / Simulated Sex</Text>}
            {data.deliverables.specialProvisions.stunts && <Text style={[Typography.bodySm, { color: colors.foreground }]}>• Stunts / Hazardous Work</Text>}
            {data.deliverables.specialProvisions.minors && <Text style={[Typography.bodySm, { color: colors.foreground }]}>• Minors Involved</Text>}
          </>
        )}
        {data.deliverables.specialProvisions.other ? (
          <>
            <Divider spacing={8} />
            <ReviewRow label="Other Provisions" value={data.deliverables.specialProvisions.other} />
          </>
        ) : null}
      </Card>
    </View>
  );
}
