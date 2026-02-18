import { useState } from "react";
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator } from "react-native";
import { Input, SectionHeader, Card, Divider } from "@/components/ui/design-system";
import { Typography, Spacing, Radius } from "@/constants/design-tokens";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

export type SelectTalentData = {
  selectedActorId: number | null;
  selectedActorName: string;
  inviteEmail: string;
};

interface Props {
  data: SelectTalentData;
  onChange: (d: Partial<SelectTalentData>) => void;
}

export function SelectTalentStep({ data, onChange }: Props) {
  const colors = useColors();
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<"search" | "invite">(data.inviteEmail ? "invite" : "search");

  const { data: actors, isLoading } = trpc.user.getActors.useQuery(
    undefined,
    { enabled: mode === "search" }
  );

  const filtered = actors?.filter((a: any) =>
    a.name?.toLowerCase().includes(search.toLowerCase()) ||
    a.email?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <View style={{ gap: Spacing.xl }}>
      <View>
        <Text style={[Typography.displaySm, { color: colors.foreground }]}>Select Talent</Text>
        <Text style={[Typography.bodySm, { color: colors.muted, marginTop: 4 }]}>
          Choose from your network or invite by email
        </Text>
      </View>

      {/* Mode Toggle */}
      <View style={{ flexDirection: "row", backgroundColor: colors.surface, borderRadius: Radius.md, padding: 3, borderWidth: 1, borderColor: colors.border }}>
        <TouchableOpacity
          onPress={() => setMode("search")}
          activeOpacity={0.7}
          style={{ flex: 1, paddingVertical: 10, borderRadius: Radius.sm, backgroundColor: mode === "search" ? colors.primary : "transparent", alignItems: "center" }}
        >
          <Text style={[Typography.labelMd, { color: mode === "search" ? "#fff" : colors.muted }]}>Search Directory</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setMode("invite")}
          activeOpacity={0.7}
          style={{ flex: 1, paddingVertical: 10, borderRadius: Radius.sm, backgroundColor: mode === "invite" ? colors.primary : "transparent", alignItems: "center" }}
        >
          <Text style={[Typography.labelMd, { color: mode === "invite" ? "#fff" : colors.muted }]}>Invite by Email</Text>
        </TouchableOpacity>
      </View>

      {mode === "search" ? (
        <View style={{ gap: Spacing.md }}>
          <Input
            placeholder="Search actors by name or email..."
            value={search}
            onChangeText={setSearch}
          />

          {data.selectedActorId && (
            <Card>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary + "20", alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ fontSize: 18 }}>🎭</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[Typography.h3, { color: colors.foreground }]}>{data.selectedActorName}</Text>
                  <Text style={[Typography.caption, { color: colors.success }]}>✓ Selected</Text>
                </View>
                <TouchableOpacity onPress={() => onChange({ selectedActorId: null, selectedActorName: "" })} activeOpacity={0.7}>
                  <Text style={[Typography.labelSm, { color: colors.error }]}>Remove</Text>
                </TouchableOpacity>
              </View>
            </Card>
          )}

          {isLoading && <ActivityIndicator size="small" color={colors.primary} />}

          {filtered.slice(0, 10).map((actor: any) => (
            <TouchableOpacity
              key={actor.id}
              onPress={() => onChange({ selectedActorId: actor.id, selectedActorName: actor.name || actor.email, inviteEmail: "" })}
              activeOpacity={0.7}
              style={{
                flexDirection: "row", alignItems: "center", gap: 12, padding: Spacing.md,
                borderRadius: Radius.md, backgroundColor: data.selectedActorId === actor.id ? colors.primary + "10" : colors.surface,
                borderWidth: 1, borderColor: data.selectedActorId === actor.id ? colors.primary : colors.border,
              }}
            >
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary + "15", alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 16 }}>🎭</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[Typography.h3, { color: colors.foreground }]}>{actor.name || "Unnamed"}</Text>
                <Text style={[Typography.caption, { color: colors.muted }]}>{actor.email}</Text>
              </View>
              {data.selectedActorId === actor.id && (
                <Text style={{ color: colors.success, fontSize: 16 }}>✓</Text>
              )}
            </TouchableOpacity>
          ))}

          {!isLoading && filtered.length === 0 && search.length > 0 && (
            <View style={{ alignItems: "center", padding: Spacing.xxl }}>
              <Text style={{ fontSize: 32 }}>🔍</Text>
              <Text style={[Typography.bodySm, { color: colors.muted, marginTop: 8 }]}>No actors found</Text>
              <TouchableOpacity onPress={() => setMode("invite")} activeOpacity={0.7} style={{ marginTop: 8 }}>
                <Text style={[Typography.labelMd, { color: colors.primary }]}>Invite by email instead</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ) : (
        <View style={{ gap: Spacing.lg }}>
          <Input
            label="Email Address"
            placeholder="actor@example.com"
            value={data.inviteEmail}
            onChangeText={(t) => onChange({ inviteEmail: t, selectedActorId: null, selectedActorName: "" })}
            keyboardType="email-address"
            helper="They'll receive an invitation to review and sign the contract"
          />
        </View>
      )}
    </View>
  );
}
