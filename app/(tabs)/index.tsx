import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator, RefreshControl, StyleSheet, FlatList } from "react-native";
import { useState, useCallback, useMemo } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { LoginScreen } from "@/components/auth/login-screen";
import { RoleSelectionScreen } from "@/components/auth/role-selection-screen";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { router } from "expo-router";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";

// ─── Actor Home: Casting Feed ───────────────────────────────────────────────
function ActorHome({ user, colors }: { user: any; colors: any }) {
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>("all");

  const { data: castings, isLoading, refetch } = trpc.casting.listOpen.useQuery(
    undefined,
    { enabled: true }
  );

  const { data: contracts } = trpc.contracts.list.useQuery(undefined, { enabled: true });
  const { data: unreadCount } = trpc.messaging.getUnreadCount.useQuery(undefined, { enabled: true });
  const { data: mySubmissions } = trpc.casting.mySubmissions.useQuery(undefined, { enabled: true });

  const submissionCount = mySubmissions?.length || 0;
  const shortlistedCount = mySubmissions?.filter((s: any) => s.status === "shortlisted").length || 0;
  const hiredCount = mySubmissions?.filter((s: any) => s.status === "hired").length || 0;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const activeContracts = contracts?.filter((c: any) => c.status === "active") || [];
  const pendingContracts = contracts?.filter((c: any) => c.status === "pending") || [];
  const unreadMessages = unreadCount?.count || 0;

  const filters = [
    { key: "all", label: "All Roles" },
    { key: "film", label: "Film" },
    { key: "tv", label: "TV" },
    { key: "commercial", label: "Commercial" },
    { key: "voice_over", label: "Voice Over" },
  ];

  return (
    <ScreenContainer className="p-0">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Header */}
        <View style={styles.headerSection}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.greeting, { color: colors.foreground }]}>
                {getGreeting()}, {user.name?.split(" ")[0] || "there"}
              </Text>
              <Text style={[styles.subtitle, { color: colors.muted }]}>
                Discover casting opportunities
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push("/earnings" as any)}
              style={[styles.iconBtn, { backgroundColor: colors.surface, marginRight: 8 }]}
            >
              <IconSymbol name="dollarsign.circle" size={20} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/notifications" as any)}
              style={[styles.iconBtn, { backgroundColor: colors.surface, marginRight: 8 }]}
            >
              <IconSymbol name="bell.fill" size={20} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/messages" as any)}
              style={[styles.iconBtn, { backgroundColor: colors.surface }]}
            >
              <IconSymbol name="paperplane.fill" size={20} color={colors.primary} />
              {unreadMessages > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.error }]}>
                  <Text style={styles.badgeText}>{unreadMessages > 9 ? "9+" : unreadMessages}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Quick Stats */}
          <View style={styles.quickStats}>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/contracts" as any)}
              style={[styles.statChip, { backgroundColor: colors.success + "15" }]}
            >
              <Text style={[styles.statNum, { color: colors.success }]}>{activeContracts.length}</Text>
              <Text style={[styles.statLabel, { color: colors.success }]}>Active</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/contracts" as any)}
              style={[styles.statChip, { backgroundColor: colors.warning + "15" }]}
            >
              <Text style={[styles.statNum, { color: colors.warning }]}>{pendingContracts.length}</Text>
              <Text style={[styles.statLabel, { color: colors.warning }]}>Pending</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/messages" as any)}
              style={[styles.statChip, { backgroundColor: colors.primary + "15" }]}
            >
              <Text style={[styles.statNum, { color: colors.primary }]}>{unreadMessages}</Text>
              <Text style={[styles.statLabel, { color: colors.primary }]}>Messages</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/casting/my-submissions" as any)}
              style={[styles.statChip, { backgroundColor: "#8B5CF6" + "15" }]}
            >
              <Text style={[styles.statNum, { color: "#8B5CF6" }]}>{submissionCount}</Text>
              <Text style={[styles.statLabel, { color: "#8B5CF6" }]}>Applied</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Filter Bar */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          {filters.map((f) => (
            <TouchableOpacity
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={[
                styles.filterChip,
                { borderColor: colors.border },
                filter === f.key && { backgroundColor: colors.primary, borderColor: colors.primary },
              ]}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterText, { color: filter === f.key ? "#fff" : colors.muted }]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* My Submissions Summary */}
        {submissionCount > 0 && (
          <TouchableOpacity
            onPress={() => router.push("/casting/my-submissions" as any)}
            style={[styles.submissionsBanner, { backgroundColor: colors.surface, borderColor: colors.border }]}
            activeOpacity={0.7}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.submissionsBannerTitle, { color: colors.foreground }]}>My Submissions</Text>
              <Text style={[styles.submissionsBannerSub, { color: colors.muted }]}>
                {submissionCount} total{shortlistedCount > 0 ? ` · ${shortlistedCount} shortlisted` : ""}{hiredCount > 0 ? ` · ${hiredCount} hired` : ""}
              </Text>
            </View>
            <IconSymbol name="chevron.right" size={16} color={colors.muted} />
          </TouchableOpacity>
        )}

        {/* Casting Feed */}
        <View style={styles.feedSection}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Open Casting Calls</Text>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              {[1, 2, 3].map((i) => (
                <View key={i} style={[styles.skeletonCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={[styles.skeletonLine, { backgroundColor: colors.border, width: "70%" }]} />
                  <View style={[styles.skeletonLine, { backgroundColor: colors.border, width: "50%", height: 12 }]} />
                  <View style={[styles.skeletonLine, { backgroundColor: colors.border, width: "90%", height: 10 }]} />
                </View>
              ))}
            </View>
          ) : castings?.items && castings.items.length > 0 ? (
            <View style={{ gap: 12 }}>
              {castings.items.map((casting: any) => (
                <TouchableOpacity
                  key={casting.id}
                  onPress={() => router.push(`/casting/${casting.id}` as any)}
                  style={[styles.castingCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  activeOpacity={0.7}
                >
                  <View style={styles.castingCardHeader}>
                    <View style={[styles.castingTypeBadge, { backgroundColor: colors.primary + "15" }]}>
                      <Text style={[styles.castingTypeText, { color: colors.primary }]}>
                        {casting.projectType || "Film"}
                      </Text>
                    </View>
                    {casting.deadline && (
                      <Text style={[styles.deadlineText, { color: colors.warning }]}>
                        Deadline: {new Date(casting.deadline).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                  <Text style={[styles.castingTitle, { color: colors.foreground }]} numberOfLines={1}>
                    {casting.title}
                  </Text>
                  <Text style={[styles.castingCompany, { color: colors.muted }]} numberOfLines={1}>
                    {casting.producerName || "Production Company"}
                  </Text>
                  <Text style={[styles.castingDesc, { color: colors.muted }]} numberOfLines={2}>
                    {casting.description}
                  </Text>
                  <View style={styles.castingFooter}>
                    {casting.budget && (
                      <View style={[styles.budgetChip, { backgroundColor: colors.success + "15" }]}>
                        <Text style={[styles.budgetText, { color: colors.success }]}>${casting.budget}</Text>
                      </View>
                    )}
                    <View style={{ flex: 1 }} />
                    <Text style={[styles.applyText, { color: colors.primary }]}>View Details →</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={[styles.emptyState, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={styles.emptyIcon}>🎬</Text>
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Casting Calls Yet</Text>
              <Text style={[styles.emptyDesc, { color: colors.muted }]}>
                New casting opportunities will appear here. Check back soon!
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

// ─── Producer Home: Dashboard ───────────────────────────────────────────────
function ProducerHome({ user, colors }: { user: any; colors: any }) {
  const [refreshing, setRefreshing] = useState(false);

  const { data: contracts, isLoading: contractsLoading, refetch: refetchContracts } = trpc.contracts.list.useQuery(
    undefined,
    { enabled: true }
  );
  const { data: unreadCount } = trpc.messaging.getUnreadCount.useQuery(undefined, { enabled: true });
  const { data: currentSub } = trpc.subscription.getCurrent.useQuery(undefined, { enabled: true });
  const { data: castings } = trpc.casting.listOpen.useQuery(undefined, { enabled: true });
  const { data: myCastings } = trpc.casting.listMine.useQuery(undefined, { enabled: true });
  const { data: analytics } = trpc.casting.getAnalytics.useQuery(undefined, { enabled: true });
  const { refresh } = useAuth();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    await refetchContracts();
    setRefreshing(false);
  }, [refresh, refetchContracts]);

  const activeContracts = contracts?.filter((c: any) => c.status === "active") || [];
  const pendingContracts = contracts?.filter((c: any) => c.status === "pending") || [];
  const draftContracts = contracts?.filter((c: any) => c.status === "draft") || [];
  const completedContracts = contracts?.filter((c: any) => c.status === "completed") || [];
  const totalContracts = contracts?.length || 0;
  const unreadMessages = unreadCount?.count || 0;

  return (
    <ScreenContainer className="p-0">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Header */}
        <View style={styles.headerSection}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.greeting, { color: colors.foreground }]}>
                {getGreeting()}, {user.name?.split(" ")[0] || "there"}
              </Text>
              <Text style={[styles.subtitle, { color: colors.muted }]}>
                Manage your productions
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push("/payments" as any)}
              style={[styles.iconBtn, { backgroundColor: colors.surface, marginRight: 8 }]}
            >
              <IconSymbol name="dollarsign.circle" size={20} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/notifications" as any)}
              style={[styles.iconBtn, { backgroundColor: colors.surface, marginRight: 8 }]}
            >
              <IconSymbol name="bell.fill" size={20} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/messages" as any)}
              style={[styles.iconBtn, { backgroundColor: colors.surface }]}
            >
              <IconSymbol name="paperplane.fill" size={20} color={colors.primary} />
              {unreadMessages > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.error }]}>
                  <Text style={styles.badgeText}>{unreadMessages > 9 ? "9+" : unreadMessages}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.dashboardContent}>
          {/* Upgrade Banner */}
          {currentSub && currentSub.plan === "free" && (
            <TouchableOpacity
              onPress={() => router.push("/subscription" as any)}
              style={[styles.upgradeBanner, { backgroundColor: colors.primary }]}
              activeOpacity={0.8}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.upgradeTitle}>Upgrade to Pro</Text>
                <Text style={styles.upgradeDesc}>Unlimited contracts, templates & more</Text>
              </View>
              <IconSymbol name="chevron.right" size={20} color="#fff" />
            </TouchableOpacity>
          )}

          {/* Contract Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.statCardNum, { color: colors.foreground }]}>{totalContracts}</Text>
              <Text style={[styles.statCardLabel, { color: colors.muted }]}>Contracts</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.statCardNum, { color: colors.success }]}>{activeContracts.length}</Text>
              <Text style={[styles.statCardLabel, { color: colors.muted }]}>Active</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.statCardNum, { color: colors.warning }]}>{pendingContracts.length}</Text>
              <Text style={[styles.statCardLabel, { color: colors.muted }]}>Pending</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.statCardNum, { color: colors.primary }]}>{completedContracts.length}</Text>
              <Text style={[styles.statCardLabel, { color: colors.muted }]}>Done</Text>
            </View>
          </View>

          {/* Casting Analytics */}
          {analytics && analytics.totalCastings > 0 && (
            <View style={[styles.analyticsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.analyticsTitle, { color: colors.foreground }]}>Casting Analytics</Text>
              <View style={styles.analyticsRow}>
                <View style={styles.analyticsItem}>
                  <Text style={[styles.analyticsNum, { color: colors.primary }]}>{analytics.totalCastings}</Text>
                  <Text style={[styles.analyticsLabel, { color: colors.muted }]}>Castings</Text>
                </View>
                <View style={styles.analyticsItem}>
                  <Text style={[styles.analyticsNum, { color: colors.success }]}>{analytics.openCastings}</Text>
                  <Text style={[styles.analyticsLabel, { color: colors.muted }]}>Open</Text>
                </View>
                <View style={styles.analyticsItem}>
                  <Text style={[styles.analyticsNum, { color: colors.warning }]}>{analytics.totalSubmissions}</Text>
                  <Text style={[styles.analyticsLabel, { color: colors.muted }]}>Applicants</Text>
                </View>
                <View style={styles.analyticsItem}>
                  <Text style={[styles.analyticsNum, { color: "#8B5CF6" }]}>{analytics.hiredCount}</Text>
                  <Text style={[styles.analyticsLabel, { color: colors.muted }]}>Hired</Text>
                </View>
              </View>
            </View>
          )}

          {/* Quick Actions */}
          <View style={styles.quickActionsSection}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Quick Actions</Text>
            <View style={styles.actionGrid}>
              <TouchableOpacity
                onPress={() => router.push("/create-contract" as any)}
                style={[styles.actionCard, { backgroundColor: colors.primary }]}
                activeOpacity={0.8}
              >
                <IconSymbol name="doc.text.fill" size={24} color="#fff" />
                <Text style={styles.actionCardTitle}>New Contract</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push("/casting/create" as any)}
                style={[styles.actionCard, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}
                activeOpacity={0.8}
              >
                <IconSymbol name="megaphone.fill" size={24} color={colors.primary} />
                <Text style={[styles.actionCardTitle, { color: colors.foreground }]}>Post Casting</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push("/templates" as any)}
                style={[styles.actionCard, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}
                activeOpacity={0.8}
              >
                <IconSymbol name="doc.on.doc.fill" size={24} color={colors.primary} />
                <Text style={[styles.actionCardTitle, { color: colors.foreground }]}>Templates</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push("/casting" as any)}
                style={[styles.actionCard, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}
                activeOpacity={0.8}
              >
                <IconSymbol name="person.2.fill" size={24} color={colors.primary} />
                <Text style={[styles.actionCardTitle, { color: colors.foreground }]}>Browse Talent</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* My Casting Calls */}
          {myCastings && myCastings.length > 0 && (
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>My Casting Calls</Text>
                <TouchableOpacity onPress={() => router.push("/casting" as any)}>
                  <Text style={[styles.seeAll, { color: colors.primary }]}>See All</Text>
                </TouchableOpacity>
              </View>
              {myCastings.slice(0, 4).map((casting: any) => (
                <TouchableOpacity
                  key={casting.id}
                  onPress={() => router.push(`/casting/submissions?castingId=${casting.id}&title=${encodeURIComponent(casting.title)}` as any)}
                  style={[styles.castingListItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  activeOpacity={0.7}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.listItemTitle, { color: colors.foreground }]} numberOfLines={1}>{casting.title}</Text>
                    <View style={styles.castingListMeta}>
                      <Text style={[styles.listItemSub, { color: colors.muted }]}>
                        {casting.submissionCount || 0} applicants
                      </Text>
                      <View style={[styles.castingStatusDot, { backgroundColor: casting.status === "open" ? colors.success : colors.muted }]} />
                      <Text style={[styles.listItemSub, { color: casting.status === "open" ? colors.success : colors.muted }]}>
                        {casting.status === "open" ? "Open" : "Closed"}
                      </Text>
                    </View>
                    {/* Pipeline mini-bar */}
                    {casting.pipeline && Object.keys(casting.pipeline).length > 0 && (
                      <View style={styles.miniPipeline}>
                        {casting.pipeline.submitted > 0 && (
                          <View style={[styles.miniPipelineChip, { backgroundColor: colors.muted + "15" }]}>
                            <Text style={[styles.miniPipelineText, { color: colors.muted }]}>{casting.pipeline.submitted} new</Text>
                          </View>
                        )}
                        {casting.pipeline.shortlisted > 0 && (
                          <View style={[styles.miniPipelineChip, { backgroundColor: colors.success + "15" }]}>
                            <Text style={[styles.miniPipelineText, { color: colors.success }]}>{casting.pipeline.shortlisted} shortlisted</Text>
                          </View>
                        )}
                        {casting.pipeline.hired > 0 && (
                          <View style={[styles.miniPipelineChip, { backgroundColor: colors.primary + "15" }]}>
                            <Text style={[styles.miniPipelineText, { color: colors.primary }]}>{casting.pipeline.hired} hired</Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                  <IconSymbol name="chevron.right" size={16} color={colors.muted} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Recent Contracts */}
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent Contracts</Text>
              <TouchableOpacity onPress={() => router.push("/(tabs)/contracts" as any)}>
                <Text style={[styles.seeAll, { color: colors.primary }]}>See All</Text>
              </TouchableOpacity>
            </View>

            {contractsLoading ? (
              <View style={[styles.loadingCard, { backgroundColor: colors.surface }]}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : contracts && contracts.length > 0 ? (
              contracts.slice(0, 5).map((contract: any) => (
                <TouchableOpacity
                  key={contract.id}
                  onPress={() => router.push(`/contract/${contract.id}` as any)}
                  style={[styles.listItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  activeOpacity={0.7}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.listItemTitle, { color: colors.foreground }]} numberOfLines={1}>
                      {contract.projectTitle}
                    </Text>
                    <Text style={[styles.listItemSub, { color: colors.muted }]}>
                      {contract.actorName || "No actor assigned"} · {contract.status}
                    </Text>
                  </View>
                  <View style={[styles.statusDot, {
                    backgroundColor: contract.status === "active" ? colors.success
                      : contract.status === "pending" ? colors.warning
                      : contract.status === "completed" ? colors.primary
                      : colors.muted
                  }]} />
                </TouchableOpacity>
              ))
            ) : (
              <View style={[styles.emptyState, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={styles.emptyIcon}>📄</Text>
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Contracts Yet</Text>
                <Text style={[styles.emptyDesc, { color: colors.muted }]}>
                  Create your first contract to get started
                </Text>
                <TouchableOpacity
                  onPress={() => router.push("/create-contract" as any)}
                  style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
                >
                  <Text style={styles.emptyBtnText}>Create Contract</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

// ─── Main Home Screen ───────────────────────────────────────────────────────
export default function HomeScreen() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const colors = useColors();

  if (authLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-base text-muted mt-4">Loading...</Text>
      </ScreenContainer>
    );
  }

  if (!isAuthenticated || !user) {
    return <LoginScreen />;
  }

  if (!user.userRole) {
    return <RoleSelectionScreen />;
  }

  if (user.userRole === "producer") {
    return <ProducerHome user={user} colors={colors} />;
  }

  return <ActorHome user={user} colors={colors} />;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const styles = StyleSheet.create({
  headerSection: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, gap: 12 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  greeting: { fontSize: 26, fontWeight: "800" },
  subtitle: { fontSize: 15, marginTop: 2 },
  iconBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  badge: { position: "absolute", top: -2, right: -2, minWidth: 18, height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "800" },
  quickStats: { flexDirection: "row", gap: 10 },
  statChip: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: "center", gap: 2 },
  statNum: { fontSize: 22, fontWeight: "800" },
  statLabel: { fontSize: 11, fontWeight: "600" },
  filterBar: { marginBottom: 12 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  filterText: { fontSize: 13, fontWeight: "600" },
  feedSection: { paddingHorizontal: 16, gap: 12 },
  sectionTitle: { fontSize: 18, fontWeight: "700" },
  castingCard: { borderRadius: 16, padding: 16, borderWidth: 1, gap: 6 },
  castingCardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  castingTypeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  castingTypeText: { fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
  deadlineText: { fontSize: 11, fontWeight: "600" },
  castingTitle: { fontSize: 17, fontWeight: "700" },
  castingCompany: { fontSize: 13 },
  castingDesc: { fontSize: 13, lineHeight: 18 },
  castingFooter: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  budgetChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  budgetText: { fontSize: 12, fontWeight: "700" },
  applyText: { fontSize: 13, fontWeight: "600" },
  emptyState: { borderRadius: 16, padding: 32, borderWidth: 1, alignItems: "center", gap: 8, borderStyle: "dashed" },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { fontSize: 17, fontWeight: "700" },
  emptyDesc: { fontSize: 13, textAlign: "center", lineHeight: 18 },
  emptyBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, marginTop: 8 },
  emptyBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  loadingContainer: { gap: 12 },
  skeletonCard: { borderRadius: 16, padding: 16, borderWidth: 1, gap: 10 },
  skeletonLine: { height: 16, borderRadius: 4 },
  // Producer styles
  dashboardContent: { paddingHorizontal: 16, gap: 20, paddingTop: 8 },
  upgradeBanner: { borderRadius: 16, padding: 16, flexDirection: "row", alignItems: "center" },
  upgradeTitle: { color: "#fff", fontWeight: "700", fontSize: 16 },
  upgradeDesc: { color: "rgba(255,255,255,0.8)", fontSize: 13, marginTop: 2 },
  statsGrid: { flexDirection: "row", gap: 10 },
  statCard: { flex: 1, borderRadius: 14, padding: 14, borderWidth: 1, alignItems: "center", gap: 2 },
  statCardNum: { fontSize: 24, fontWeight: "800" },
  statCardLabel: { fontSize: 11, fontWeight: "600" },
  quickActionsSection: { gap: 12 },
  actionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  actionCard: { width: "48%", borderRadius: 14, padding: 16, alignItems: "center", gap: 8 },
  actionCardTitle: { color: "#fff", fontSize: 13, fontWeight: "700" },
  sectionBlock: { gap: 10 },
  sectionHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  seeAll: { fontSize: 14, fontWeight: "600" },
  listItem: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 12, borderWidth: 1, gap: 12 },
  listItemTitle: { fontSize: 15, fontWeight: "600" },
  listItemSub: { fontSize: 12, marginTop: 2 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  loadingCard: { borderRadius: 14, padding: 24, alignItems: "center" },
  submissionsBanner: { flexDirection: "row", alignItems: "center", marginHorizontal: 16, padding: 14, borderRadius: 14, borderWidth: 1, gap: 12, marginBottom: 4 },
  submissionsBannerTitle: { fontSize: 15, fontWeight: "700" },
  submissionsBannerSub: { fontSize: 12, marginTop: 2 },
  analyticsCard: { borderRadius: 14, padding: 16, borderWidth: 1, gap: 12 },
  analyticsTitle: { fontSize: 16, fontWeight: "700" },
  analyticsRow: { flexDirection: "row", justifyContent: "space-between" },
  analyticsItem: { alignItems: "center", flex: 1 },
  analyticsNum: { fontSize: 24, fontWeight: "800" },
  analyticsLabel: { fontSize: 11, fontWeight: "600", marginTop: 2 },
  castingListItem: { padding: 14, borderRadius: 12, borderWidth: 1, gap: 6, flexDirection: "row", alignItems: "center" },
  castingListMeta: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
  castingStatusDot: { width: 6, height: 6, borderRadius: 3 },
  miniPipeline: { flexDirection: "row", gap: 6, marginTop: 4 },
  miniPipelineChip: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  miniPipelineText: { fontSize: 10, fontWeight: "600" },
});
