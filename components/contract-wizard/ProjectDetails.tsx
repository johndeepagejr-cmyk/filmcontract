import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Input, SectionHeader, Chip } from "@/components/ui/design-system";
import { Typography, Spacing, ProjectTypes } from "@/constants/design-tokens";
import { useColors } from "@/hooks/use-colors";

export type ProjectDetailsData = {
  title: string;
  type: string;
  startDate: string;
  endDate: string;
  location: string;
  projectCode: string;
};

interface Props {
  data: ProjectDetailsData;
  onChange: (d: Partial<ProjectDetailsData>) => void;
}

export function ProjectDetailsStep({ data, onChange }: Props) {
  const colors = useColors();

  return (
    <View style={{ gap: Spacing.xl }}>
      <View>
        <Text style={[Typography.displaySm, { color: colors.foreground }]}>Project Details</Text>
        <Text style={[Typography.bodySm, { color: colors.muted, marginTop: 4 }]}>
          Tell us about your production
        </Text>
      </View>

      <Input
        label="Project Title"
        placeholder="e.g., The Last Sunset"
        value={data.title}
        onChangeText={(t) => onChange({ title: t })}
        required
      />

      <View style={{ gap: Spacing.sm }}>
        <SectionHeader title="Project Type" />
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {ProjectTypes.map((type) => (
            <Chip
              key={type}
              label={type}
              selected={data.type === type}
              onPress={() => onChange({ type })}
            />
          ))}
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Input
            label="Start Date"
            placeholder="MM/DD/YYYY"
            value={data.startDate}
            onChangeText={(t) => onChange({ startDate: t })}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Input
            label="End Date"
            placeholder="MM/DD/YYYY"
            value={data.endDate}
            onChangeText={(t) => onChange({ endDate: t })}
          />
        </View>
      </View>

      <Input
        label="Location"
        placeholder="e.g., Los Angeles, CA"
        value={data.location}
        onChangeText={(t) => onChange({ location: t })}
      />

      <Input
        label="Project Code"
        placeholder="e.g., TLS-2026"
        value={data.projectCode}
        onChangeText={(t) => onChange({ projectCode: t })}
        helper="Internal reference code for tracking"
      />
    </View>
  );
}
