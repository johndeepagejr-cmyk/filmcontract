import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from "react-native";
import { useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { router, useLocalSearchParams } from "expo-router";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";

type DetailTab = "details" | "requirements" | "production";

export default function CastingCallDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<DetailTab>("details");

  const castingId = parseInt(id || "0", 10);

  const { data: casting, isLoading } = trpc.casting.getById.useQuery(
    { id: castingId },
    { enabled: castingId > 0 }
  );

  const { data: submissions } = trpc.casting.getSubmissions.useQuery(
    { castingCallId: castingId },
    { enabled: castingId > 0 && user?.userRole === "producer" }
  );

  const submitMutation = trpc.casting.submit.useMutation({
    onSuccess: () => {
      Alert.alert("Success", "Your submission has been sent!");
    },
    onError: (err) => {
      Alert.alert("Error", err.message || "Failed to submit");
    },
  });

  const isProducer = user?.userRole === "producer";
  const isOwner = casting?.producerId === user?.id;

  const parseRoles = (rolesStr: string | null | undefined) => {
    if (!rolesStr) return [];
    try { return JSON.parse(rolesStr); } catch { return []; }
  };

  const roles = parseRoles(casting?.roles);

  const getDaysLeft = (deadline: string | Date | null | undefined) => {
    if (!deadline) return null;
    const diff = new Date(deadline).getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return "Expired";
    if (days === 0) return "Today";
    if (days === 1) return "1 day left";
    return `${days} days left`;
  };

  if (isLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  if (!casting) {
    return (
      <ScreenContainer className="items-center justify-center p-6">
        <Text style={styles.emptyIcon}>🎬</Text>
        <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Casting Call Not Found</Text>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colors.primary }]}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  const daysLeft = getDaysLeft(casting.deadline);
  const isExpired = daysLeft === "Expired";

  const handleQuickSubmit = () => {
    Alert.alert(
      "Submit Application",
      "Would you like to submit a quick application or record a self-tape?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Quick Apply",
          onPress: () => submitMutation.mutate({ castingCallId: castingId, notes: "Quick application" }),
        },
        {
          text: "Self-Tape",
          onPress: () => router.push(`/casting/self-tape?castingId=${castingId}` as any),
        },
      ]
    );
  };

  const tabs: { key: DetailTab; label: string }[] = [
    { key: "details", label: "Role Details" },
    { key: "requirements", label: "Requirements" },
    { key: "production", label: "Production" },
  ];

  const getSubmissionStatusColor = (status: string) => {
    switch (status) {
      case "shortlisted": return colors.success;
      case "reviewing": return colors.warning;
      case "rejected": return colors.error;
      case "hired": return colors.primary;
      default: return colors.muted;
    }
  };

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={[styles.hero, { backgroundColor: colors.primary + "10" }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.heroBack}>
            <IconSymbol name="arrow.left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <View style={styles.heroContent}>
            <View style={[styles.heroBadge, { backgroundColor: colors.primary + "20" }]}>
              <IconSymbol name="film" size={28} color={colors.primary} />
            </View>
            <Text style={[styles.heroTitle, { color: colors.foreground }]}>{casting.title}</Text>
            <Text style={[styles.heroProducer, { color: colors.muted }]}>
              {casting.producerName || "Production Company"}
            </Text>
            <View style={styles.heroMeta}>
              {casting.budget && (
                <View style={[styles.metaChip, { backgroundColor: colors.success + "15" }]}>
                  <IconSymbol name="dollarsign.circle" size={14} color={colors.success} />
                  <Text style={[styles.metaText, { color: colors.success }]}>
                    ${parseFloat(casting.budget).toLocaleString()}
                  </Text>
                </View>
              )}
              {daysLeft && (
                <View style={[styles.metaChip, { backgroundColor: isExpired ? colors.error + "15" : colors.warning + "15" }]}>
                  <IconSymbol name="calendar" size={14} color={isExpired ? colors.error : colors.warning} />
                  <Text style={[styles.metaText, { color: isExpired ? colors.error : colors.warning }]}>
                    {daysLeft}
                  </Text>
                </View>
              )}
              <View style={[styles.metaChip, { backgroundColor: colors.primary + "15" }]}>
                <Text style={[styles.metaText, { color: colors.primary }]}>
                  {casting.submissionCount || 0} submissions
                </Text>
              </View>
            </View>
            <Text style={[styles.postedDate, { color: colors.muted }]}>
              Posted {new Date(casting.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </Text>
          </View>
        </View>

        {/* Tab Bar */}
        <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[styles.tab, activeTab === tab.key && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, { color: activeTab === tab.key ? colors.primary : colors.muted }]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        <View style={styles.tabContent}>
          {activeTab === "details" && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Description</Text>
              <Text style={[styles.bodyText, { color: colors.muted }]}>{casting.description}</Text>

              {roles.length > 0 && (
                <>
                  <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 20 }]}>Roles</Text>
                  {roles.map((role: any, idx: number) => (
                    <View key={idx} style={[styles.roleCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      <Text style={[styles.roleName, { color: colors.foreground }]}>
                        {role.name || `Role ${idx + 1}`}
                      </Text>
                      {role.type && (
                        <View style={[styles.roleType, { backgroundColor: colors.primary + "12" }]}>
                          <Text style={[styles.roleTypeText, { color: colors.primary }]}>{role.type}</Text>
                        </View>
                      )}
                      {role.description && (
                        <Text style={[styles.roleDesc, { color: colors.muted }]}>{role.description}</Text>
                      )}
                      {role.age && <Text style={[styles.roleDetail, { color: colors.muted }]}>Age: {role.age}</Text>}
                      {role.gender && <Text style={[styles.roleDetail, { color: colors.muted }]}>Gender: {role.gender}</Text>}
                      {role.ethnicity && <Text style={[styles.roleDetail, { color: colors.muted }]}>Ethnicity: {role.ethnicity}</Text>}
                    </View>
                  ))}
                </>
              )}
            </View>
          )}

          {activeTab === "requirements" && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Submission Requirements</Text>
              <View style={styles.reqList}>
                <View style={styles.reqItem}>
                  <IconSymbol name="checkmark.circle.fill" size={18} color={colors.success} />
                  <Text style={[styles.reqText, { color: colors.foreground }]}>Self-tape or video audition</Text>
                </View>
                <View style={styles.reqItem}>
                  <IconSymbol name="checkmark.circle.fill" size={18} color={colors.success} />
                  <Text style={[styles.reqText, { color: colors.foreground }]}>Headshot and resume</Text>
                </View>
                <View style={styles.reqItem}>
                  <IconSymbol name="checkmark.circle.fill" size={18} color={colors.success} />
                  <Text style={[styles.reqText, { color: colors.foreground }]}>Slate with name, height, and location</Text>
                </View>
                {casting.deadline && (
                  <View style={styles.reqItem}>
                    <IconSymbol name="calendar" size={18} color={colors.warning} />
                    <Text style={[styles.reqText, { color: colors.foreground }]}>
                      Deadline: {new Date(casting.deadline).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {activeTab === "production" && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Production Information</Text>
              <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.muted }]}>Producer</Text>
                  <Text style={[styles.infoValue, { color: colors.foreground }]}>{casting.producerName || "N/A"}</Text>
                </View>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.muted }]}>Budget</Text>
                  <Text style={[styles.infoValue, { color: colors.foreground }]}>
                    {casting.budget ? `$${parseFloat(casting.budget).toLocaleString()}` : "TBD"}
                  </Text>
                </View>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.muted }]}>Status</Text>
                  <Text style={[styles.infoValue, { color: casting.status === "open" ? colors.success : colors.muted }]}>
                    {casting.status ? casting.status.charAt(0).toUpperCase() + casting.status.slice(1) : "Open"}
                  </Text>
                </View>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.muted }]}>Submissions</Text>
                  <Text style={[styles.infoValue, { color: colors.foreground }]}>{casting.submissionCount || 0}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Producer: Submissions list */}
          {isOwner && submissions && submissions.length > 0 && (
            <View style={[styles.section, { marginTop: 20 }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Submissions ({submissions.length})
              </Text>
              {submissions.map((sub: any) => (
                <View key={sub.id} style={[styles.submissionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.subHeader}>
                    <Text style={[styles.subName, { color: colors.foreground }]}>{sub.actorName || "Actor"}</Text>
                    <View style={[styles.subStatus, { backgroundColor: getSubmissionStatusColor(sub.status) + "18" }]}>
                      <Text style={[styles.subStatusText, { color: getSubmissionStatusColor(sub.status) }]}>
                        {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                      </Text>
                    </View>
                  </View>
                  {sub.notes && <Text style={[styles.subNotes, { color: colors.muted }]}>{sub.notes}</Text>}
                  <Text style={[styles.subDate, { color: colors.muted }]}>
                    {new Date(sub.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Sticky Footer - Submit Button (actors only) */}
      {!isProducer && !isExpired && (
        <View style={[styles.stickyFooter, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <TouchableOpacity
            onPress={handleQuickSubmit}
            style={[styles.submitBtn, { backgroundColor: colors.primary }]}
            activeOpacity={0.8}
            disabled={submitMutation.isPending}
          >
            {submitMutation.isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <IconSymbol name="camera.fill" size={20} color="#fff" />
                <Text style={styles.submitBtnText}>Submit Self-Tape</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hero: { paddingTop: 8, paddingBottom: 24, paddingHorizontal: 16 },
  heroBack: { padding: 4, marginBottom: 12 },
  heroContent: { alignItems: "center", gap: 8 },
  heroBadge: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  heroTitle: { fontSize: 22, fontWeight: "800", textAlign: "center" },
  heroProducer: { fontSize: 15 },
  heroMeta: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 4 },
  metaChip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  metaText: { fontSize: 13, fontWeight: "600" },
  postedDate: { fontSize: 12, marginTop: 4 },
  tabBar: { flexDirection: "row", borderBottomWidth: 1, paddingHorizontal: 16 },
  tab: { flex: 1, paddingVertical: 14, alignItems: "center" },
  tabText: { fontSize: 14, fontWeight: "600" },
  tabContent: { paddingHorizontal: 16, paddingTop: 16 },
  section: { gap: 12 },
  sectionTitle: { fontSize: 18, fontWeight: "700" },
  bodyText: { fontSize: 14, lineHeight: 22 },
  roleCard: { borderRadius: 12, padding: 14, borderWidth: 1, gap: 6 },
  roleName: { fontSize: 16, fontWeight: "700" },
  roleType: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  roleTypeText: { fontSize: 12, fontWeight: "600" },
  roleDesc: { fontSize: 13, lineHeight: 19 },
  roleDetail: { fontSize: 13 },
  reqList: { gap: 12 },
  reqItem: { flexDirection: "row", alignItems: "center", gap: 10 },
  reqText: { fontSize: 14, flex: 1 },
  infoCard: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14 },
  infoLabel: { fontSize: 14 },
  infoValue: { fontSize: 14, fontWeight: "600" },
  divider: { height: 1 },
  submissionCard: { borderRadius: 12, padding: 14, borderWidth: 1, gap: 6 },
  subHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  subName: { fontSize: 15, fontWeight: "600" },
  subStatus: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  subStatusText: { fontSize: 12, fontWeight: "600" },
  subNotes: { fontSize: 13 },
  subDate: { fontSize: 12 },
  stickyFooter: { position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: 16, paddingVertical: 12, paddingBottom: 32, borderTopWidth: 1 },
  submitBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16, borderRadius: 14 },
  submitBtnText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  emptyIcon: { fontSize: 48, marginBottom: 8 },
  emptyTitle: { fontSize: 20, fontWeight: "700", marginBottom: 8 },
  backButton: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, marginTop: 16 },
  backButtonText: { color: "#fff", fontWeight: "700" },
});
