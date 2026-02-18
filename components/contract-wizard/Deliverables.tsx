import { View, Text, Switch } from "react-native";
import { Input, SectionHeader, Chip, Card, Divider } from "@/components/ui/design-system";
import { Typography, Spacing } from "@/constants/design-tokens";
import { useColors } from "@/hooks/use-colors";

export type DeliverablesData = {
  callTime: string;
  wardrobeReqs: string;
  usageRights: string[];
  territory: string;
  usageTerm: string;
  exclusivity: boolean;
  creditBilling: string;
  specialProvisions: {
    nudity: boolean;
    stunts: boolean;
    minors: boolean;
    other: string;
  };
};

interface Props {
  data: DeliverablesData;
  onChange: (d: Partial<DeliverablesData>) => void;
}

const USAGE_RIGHTS = ["Theatrical", "Streaming", "Television", "Home Video", "Online/Digital", "Festival", "All Media"];
const TERRITORIES = ["domestic", "north_america", "worldwide", "custom"];
const TERRITORY_LABELS: Record<string, string> = { domestic: "Domestic (US)", north_america: "North America", worldwide: "Worldwide", custom: "Custom" };
const USAGE_TERMS = ["1_year", "3_years", "5_years", "perpetuity"];
const USAGE_TERM_LABELS: Record<string, string> = { "1_year": "1 Year", "3_years": "3 Years", "5_years": "5 Years", perpetuity: "In Perpetuity" };

export function DeliverablesStep({ data, onChange }: Props) {
  const colors = useColors();
  const accent = (colors as any).accent || "#C9963B";

  const toggleUsageRight = (right: string) => {
    const current = data.usageRights;
    if (current.includes(right)) {
      onChange({ usageRights: current.filter((r) => r !== right) });
    } else {
      onChange({ usageRights: [...current, right] });
    }
  };

  const updateProvisions = (key: keyof DeliverablesData["specialProvisions"], value: any) => {
    onChange({ specialProvisions: { ...data.specialProvisions, [key]: value } });
  };

  return (
    <View style={{ gap: Spacing.xl }}>
      <View>
        <Text style={[Typography.displaySm, { color: colors.foreground }]}>Deliverables & Details</Text>
        <Text style={[Typography.bodySm, { color: colors.muted, marginTop: 4 }]}>
          Specify usage rights, schedule, and special provisions
        </Text>
      </View>

      {/* Schedule */}
      <Input
        label="Call Time"
        placeholder="e.g., 6:00 AM"
        value={data.callTime}
        onChangeText={(t) => onChange({ callTime: t })}
        helper="Standard daily call time for the talent"
      />

      <Input
        label="Wardrobe Requirements"
        placeholder="Describe wardrobe needs..."
        value={data.wardrobeReqs}
        onChangeText={(t) => onChange({ wardrobeReqs: t })}
        multiline
        numberOfLines={3}
      />

      <Divider />

      {/* Usage Rights */}
      <View style={{ gap: Spacing.sm }}>
        <SectionHeader title="Usage Rights" subtitle="Select all that apply" />
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {USAGE_RIGHTS.map((right) => (
            <Chip key={right} label={right} selected={data.usageRights.includes(right)} onPress={() => toggleUsageRight(right)} />
          ))}
        </View>
      </View>

      {/* Territory */}
      <View style={{ gap: Spacing.sm }}>
        <SectionHeader title="Territory" />
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {TERRITORIES.map((t) => (
            <Chip key={t} label={TERRITORY_LABELS[t]} selected={data.territory === t} onPress={() => onChange({ territory: t })} />
          ))}
        </View>
      </View>

      {/* Usage Term */}
      <View style={{ gap: Spacing.sm }}>
        <SectionHeader title="Usage Term" />
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {USAGE_TERMS.map((t) => (
            <Chip key={t} label={USAGE_TERM_LABELS[t]} selected={data.usageTerm === t} onPress={() => onChange({ usageTerm: t })} />
          ))}
        </View>
      </View>

      {/* Exclusivity */}
      <Card>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View style={{ flex: 1 }}>
            <Text style={[Typography.labelMd, { color: colors.foreground }]}>Exclusivity Clause</Text>
            <Text style={[Typography.caption, { color: colors.muted }]}>Talent cannot work on competing projects during contract period</Text>
          </View>
          <Switch
            value={data.exclusivity}
            onValueChange={(v) => onChange({ exclusivity: v })}
            trackColor={{ false: colors.border, true: accent + "60" }}
            thumbColor={data.exclusivity ? accent : "#f4f3f4"}
          />
        </View>
      </Card>

      <Divider />

      {/* Credit Billing */}
      <Input
        label="Credit / Billing"
        placeholder='e.g., "Starring" or "Also Starring"'
        value={data.creditBilling}
        onChangeText={(t) => onChange({ creditBilling: t })}
        helper="How the talent will be credited in the production"
      />

      {/* Special Provisions */}
      <SectionHeader title="Special Provisions" subtitle="Requires additional consent" />
      <Card>
        <View style={{ gap: Spacing.md }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={[Typography.labelMd, { color: colors.foreground }]}>Nudity / Simulated Sex</Text>
            <Switch
              value={data.specialProvisions.nudity}
              onValueChange={(v) => updateProvisions("nudity", v)}
              trackColor={{ false: colors.border, true: colors.warning + "60" }}
              thumbColor={data.specialProvisions.nudity ? colors.warning : "#f4f3f4"}
            />
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={[Typography.labelMd, { color: colors.foreground }]}>Stunts / Hazardous Work</Text>
            <Switch
              value={data.specialProvisions.stunts}
              onValueChange={(v) => updateProvisions("stunts", v)}
              trackColor={{ false: colors.border, true: colors.warning + "60" }}
              thumbColor={data.specialProvisions.stunts ? colors.warning : "#f4f3f4"}
            />
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={[Typography.labelMd, { color: colors.foreground }]}>Minors Involved</Text>
            <Switch
              value={data.specialProvisions.minors}
              onValueChange={(v) => updateProvisions("minors", v)}
              trackColor={{ false: colors.border, true: colors.warning + "60" }}
              thumbColor={data.specialProvisions.minors ? colors.warning : "#f4f3f4"}
            />
          </View>
          <Input
            label="Other Provisions"
            placeholder="Any additional special requirements..."
            value={data.specialProvisions.other}
            onChangeText={(t) => updateProvisions("other", t)}
            multiline
            numberOfLines={2}
          />
        </View>
      </Card>
    </View>
  );
}
