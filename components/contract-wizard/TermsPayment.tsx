import { View, Text, TouchableOpacity, Switch } from "react-native";
import { Input, SectionHeader, Chip, Card, Divider } from "@/components/ui/design-system";
import { Typography, Spacing, Radius } from "@/constants/design-tokens";
import { useColors } from "@/hooks/use-colors";

export type TermsPaymentData = {
  rateType: "daily" | "weekly" | "flat" | "per_episode";
  amount: string;
  paymentSchedule: "net_15" | "net_30" | "net_60" | "upon_completion";
  killFee: string;
  expenses: {
    travel: boolean;
    wardrobe: boolean;
    perDiem: boolean;
    perDiemAmount: string;
  };
  overtimeRate: string;
};

interface Props {
  data: TermsPaymentData;
  onChange: (d: Partial<TermsPaymentData>) => void;
}

const RATE_TYPES = [
  { key: "daily" as const, label: "Daily Rate" },
  { key: "weekly" as const, label: "Weekly Rate" },
  { key: "flat" as const, label: "Flat Fee" },
  { key: "per_episode" as const, label: "Per Episode" },
];

const PAYMENT_SCHEDULES = [
  { key: "net_15" as const, label: "Net 15" },
  { key: "net_30" as const, label: "Net 30" },
  { key: "net_60" as const, label: "Net 60" },
  { key: "upon_completion" as const, label: "Upon Completion" },
];

export function TermsPaymentStep({ data, onChange }: Props) {
  const colors = useColors();
  const accent = (colors as any).accent || "#C9963B";

  const updateExpenses = (key: keyof TermsPaymentData["expenses"], value: any) => {
    onChange({ expenses: { ...data.expenses, [key]: value } });
  };

  return (
    <View style={{ gap: Spacing.xl }}>
      <View>
        <Text style={[Typography.displaySm, { color: colors.foreground }]}>Terms & Payment</Text>
        <Text style={[Typography.bodySm, { color: colors.muted, marginTop: 4 }]}>
          Define compensation and payment schedule
        </Text>
      </View>

      {/* Rate Type */}
      <View style={{ gap: Spacing.sm }}>
        <SectionHeader title="Rate Type" />
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {RATE_TYPES.map((rt) => (
            <Chip key={rt.key} label={rt.label} selected={data.rateType === rt.key} onPress={() => onChange({ rateType: rt.key })} />
          ))}
        </View>
      </View>

      {/* Amount */}
      <Input
        label="Amount ($)"
        placeholder="0.00"
        value={data.amount}
        onChangeText={(t) => onChange({ amount: t })}
        keyboardType="decimal-pad"
        required
      />

      {/* Payment Schedule */}
      <View style={{ gap: Spacing.sm }}>
        <SectionHeader title="Payment Schedule" />
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {PAYMENT_SCHEDULES.map((ps) => (
            <Chip key={ps.key} label={ps.label} selected={data.paymentSchedule === ps.key} onPress={() => onChange({ paymentSchedule: ps.key })} />
          ))}
        </View>
      </View>

      <Divider />

      {/* Kill Fee */}
      <Input
        label="Kill Fee (%)"
        placeholder="e.g., 50"
        value={data.killFee}
        onChangeText={(t) => onChange({ killFee: t })}
        keyboardType="numeric"
        helper="Percentage of total fee paid if production is cancelled"
      />

      {/* Overtime Rate */}
      <Input
        label="Overtime Rate ($/hr)"
        placeholder="e.g., 150"
        value={data.overtimeRate}
        onChangeText={(t) => onChange({ overtimeRate: t })}
        keyboardType="decimal-pad"
        helper="Hourly rate for work beyond standard hours"
      />

      <Divider />

      {/* Expenses */}
      <SectionHeader title="Covered Expenses" />
      <Card>
        <View style={{ gap: Spacing.md }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View>
              <Text style={[Typography.labelMd, { color: colors.foreground }]}>Travel</Text>
              <Text style={[Typography.caption, { color: colors.muted }]}>Flights, ground transport</Text>
            </View>
            <Switch
              value={data.expenses.travel}
              onValueChange={(v) => updateExpenses("travel", v)}
              trackColor={{ false: colors.border, true: accent + "60" }}
              thumbColor={data.expenses.travel ? accent : "#f4f3f4"}
            />
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View>
              <Text style={[Typography.labelMd, { color: colors.foreground }]}>Wardrobe</Text>
              <Text style={[Typography.caption, { color: colors.muted }]}>Costume & clothing</Text>
            </View>
            <Switch
              value={data.expenses.wardrobe}
              onValueChange={(v) => updateExpenses("wardrobe", v)}
              trackColor={{ false: colors.border, true: accent + "60" }}
              thumbColor={data.expenses.wardrobe ? accent : "#f4f3f4"}
            />
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View>
              <Text style={[Typography.labelMd, { color: colors.foreground }]}>Per Diem</Text>
              <Text style={[Typography.caption, { color: colors.muted }]}>Daily meal & incidental allowance</Text>
            </View>
            <Switch
              value={data.expenses.perDiem}
              onValueChange={(v) => updateExpenses("perDiem", v)}
              trackColor={{ false: colors.border, true: accent + "60" }}
              thumbColor={data.expenses.perDiem ? accent : "#f4f3f4"}
            />
          </View>
          {data.expenses.perDiem && (
            <Input
              label="Per Diem Amount ($/day)"
              placeholder="e.g., 75"
              value={data.expenses.perDiemAmount}
              onChangeText={(t) => updateExpenses("perDiemAmount", t)}
              keyboardType="decimal-pad"
            />
          )}
        </View>
      </Card>
    </View>
  );
}
