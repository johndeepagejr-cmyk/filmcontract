import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Share } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { router } from "expo-router";
import { AppFooter } from "@/components/app-footer";
import { NotificationSettings } from "@/components/notification-settings";

export default function ProfileScreen() {
  const { user, isAuthenticated, logout, loading: authLoading } = useAuth();

  const { data: contracts, isLoading: contractsLoading } = trpc.contracts.list.useQuery(
    undefined,
    {
      enabled: isAuthenticated && !!user?.userRole,
    }
  );

  const { data: actorProfile } = trpc.actorProfile.getMy.useQuery(undefined, {
    enabled: isAuthenticated && user?.userRole === "actor",
  });

  const { data: producerProfile } = trpc.producerProfile.get.useQuery(undefined, {
    enabled: isAuthenticated && user?.userRole === "producer",
  });

  const { data: films } = trpc.actorProfile.getFilms.useQuery(
    { userId: user?.id || 0 },
    { enabled: isAuthenticated && user?.userRole === "actor" && !!user?.id }
  );

  const { data: portfolioPhotos } = trpc.portfolioPhotos.getMy.useQuery(undefined, {
    enabled: isAuthenticated && !!user?.id,
  });

  const handleLogout = async () => {
    await logout();
    router.replace("/");
  };

  const handleSharePortfolio = async () => {
    if (!user?.id) return;
    try {
      await Share.share({
        message: `Check out my FilmContract portfolio!`,
        url: `https://8081-ia6sbgycqgi78h1m3wxmm-268d213c.us2.manus.computer/public-portfolio/${user.id}`,
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  if (!isAuthenticated && !authLoading) {
    return (
      <ScreenContainer className="p-6 items-center justify-center">
        <Text className="text-lg text-muted text-center">Please sign in to view your profile</Text>
      </ScreenContainer>
    );
  }

  if (authLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color="#1E40AF" />
      </ScreenContainer>
    );
  }

  const activeContracts = contracts?.filter((c) => c.status === "active").length || 0;
  const totalContracts = contracts?.length || 0;

  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 gap-6">
          {/* Header */}
          <View className="flex-row items-center justify-between">
            <View className="flex-1 gap-2">
              <View className="flex-row items-center gap-2">
                <Text className="text-2xl font-bold text-foreground">{user?.name}</Text>
                {user?.isVerified && (
                  <View className="bg-primary rounded-full px-2 py-1">
                    <Text className="text-white text-xs font-bold">✓ VERIFIED</Text>
                  </View>
                )}
              </View>
              <Text className="text-base text-muted">{user?.email}</Text>
            </View>
            <TouchableOpacity
              onPress={handleSharePortfolio}
              className="bg-primary px-4 py-2 rounded-full active:opacity-80"
            >
              <Text className="text-white font-semibold">Share</Text>
            </TouchableOpacity>
          </View>

          {/* User Info Card */}
          <View className="bg-surface rounded-2xl p-6 gap-4">
            {user?.userRole === "actor" && (
              <TouchableOpacity
                onPress={() => router.push("/profile/edit")}
                className="absolute top-4 right-4 bg-primary px-4 py-2 rounded-full active:opacity-80"
              >
                <Text className="text-white font-semibold text-sm">Edit Profile</Text>
              </TouchableOpacity>
            )}
            {user?.userRole === "producer" && (
              <TouchableOpacity
                onPress={() => router.push("/producer-profile/edit")}
                className="absolute top-4 right-4 bg-primary px-4 py-2 rounded-full active:opacity-80"
              >
                <Text className="text-white font-semibold text-sm">Edit Profile</Text>
              </TouchableOpacity>
            )}
            {user?.userRole === "actor" && actorProfile?.profilePhotoUrl && (
              <View className="items-center mb-2">
                <Image
                  source={{ uri: actorProfile.profilePhotoUrl }}
                  className="w-24 h-24 rounded-full"
                  style={{ backgroundColor: "#E5E7EB" }}
                />
              </View>
            )}
            {user?.userRole === "producer" && producerProfile?.profilePhotoUrl && (
              <View className="items-center mb-2">
                <Image
                  source={{ uri: producerProfile.profilePhotoUrl }}
                  className="w-24 h-24 rounded-full"
                  style={{ backgroundColor: "#E5E7EB" }}
                />
              </View>
            )}
            <View className="gap-1">
              <Text className="text-sm font-medium text-muted">Name</Text>
              <Text className="text-lg font-semibold text-foreground">
                {user?.name || "Not set"}
              </Text>
            </View>

            <View className="h-px bg-border" />

            <View className="gap-1">
              <Text className="text-sm font-medium text-muted">Email</Text>
              <Text className="text-lg font-semibold text-foreground">
                {user?.email || "Not set"}
              </Text>
            </View>

            <View className="h-px bg-border" />

            <View className="gap-1">
              <Text className="text-sm font-medium text-muted">Role</Text>
              <View className="flex-row items-center gap-2">
                <Text className="text-2xl">{user?.userRole === "producer" ? "🎬" : "🎭"}</Text>
                <Text className="text-lg font-semibold text-foreground capitalize">
                  {user?.userRole || "Not set"}
                </Text>
              </View>
            </View>
          </View>

          {/* Actor Profile Info */}
          {user?.userRole === "actor" && actorProfile && (
            <View className="bg-surface rounded-2xl p-6 gap-4">
              <View className="flex-row items-center justify-between">
                <Text className="text-lg font-bold text-foreground">About Me</Text>
                <TouchableOpacity
                  onPress={() => router.push("/profile/edit")}
                  className="active:opacity-70"
                >
                  <Text className="text-sm text-primary font-semibold">Edit</Text>
                </TouchableOpacity>
              </View>

              {actorProfile.bio && (
                <Text className="text-base text-foreground leading-6">{actorProfile.bio}</Text>
              )}

              {actorProfile.location && (
                <View className="flex-row items-center gap-2">
                  <Text className="text-base text-muted">📍 {actorProfile.location}</Text>
                </View>
              )}

              {actorProfile.yearsExperience && (
                <View className="flex-row items-center gap-2">
                  <Text className="text-base text-muted">
                    🎬 {actorProfile.yearsExperience} years experience
                  </Text>
                </View>
              )}

              {actorProfile.specialties && (actorProfile.specialties as string[]).length > 0 && (
                <View className="gap-2">
                  <Text className="text-sm font-semibold text-muted">Specialties</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {(actorProfile.specialties as string[]).map((specialty) => (
                      <View key={specialty} className="bg-primary/10 px-3 py-1 rounded-full">
                        <Text className="text-sm font-semibold text-primary">{specialty}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {(actorProfile.height || actorProfile.weight || actorProfile.eyeColor || actorProfile.hairColor) && (
                <View className="gap-2">
                  <Text className="text-sm font-semibold text-muted">Physical Attributes</Text>
                  <View className="flex-row flex-wrap gap-4">
                    {actorProfile.height && (
                      <Text className="text-sm text-foreground">Height: {actorProfile.height}</Text>
                    )}
                    {actorProfile.weight && (
                      <Text className="text-sm text-foreground">Weight: {actorProfile.weight}</Text>
                    )}
                    {actorProfile.eyeColor && (
                      <Text className="text-sm text-foreground">Eyes: {actorProfile.eyeColor}</Text>
                    )}
                    {actorProfile.hairColor && (
                      <Text className="text-sm text-foreground">Hair: {actorProfile.hairColor}</Text>
                    )}
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Producer Profile Info */}
          {user?.userRole === "producer" && producerProfile && (
            <View className="bg-surface rounded-2xl p-6 gap-4">
              <View className="flex-row items-center justify-between">
                <Text className="text-lg font-bold text-foreground">Company Info</Text>
                <TouchableOpacity
                  onPress={() => router.push("/producer-profile/edit")}
                  className="active:opacity-70"
                >
                  <Text className="text-sm text-primary font-semibold">Edit</Text>
                </TouchableOpacity>
              </View>

              {producerProfile.companyName && (
                <View className="gap-1">
                  <Text className="text-sm font-semibold text-muted">Company Name</Text>
                  <Text className="text-base text-foreground font-semibold">
                    {producerProfile.companyName}
                  </Text>
                </View>
              )}

              {producerProfile.bio && (
                <Text className="text-base text-foreground leading-6">{producerProfile.bio}</Text>
              )}

              {producerProfile.location && (
                <View className="flex-row items-center gap-2">
                  <Text className="text-base text-muted">📍 {producerProfile.location}</Text>
                </View>
              )}

              {producerProfile.yearsInBusiness && (
                <View className="flex-row items-center gap-2">
                  <Text className="text-base text-muted">
                    🎬 {producerProfile.yearsInBusiness} years in business
                  </Text>
                </View>
              )}

              {producerProfile.website && (
                <View className="flex-row items-center gap-2">
                  <Text className="text-base text-primary">🌐 {producerProfile.website}</Text>
                </View>
              )}

              {producerProfile.specialties && JSON.parse(producerProfile.specialties as string).length > 0 && (
                <View className="gap-2">
                  <Text className="text-sm font-semibold text-muted">Specialties</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {JSON.parse(producerProfile.specialties as string).map((specialty: string) => (
                      <View key={specialty} className="bg-primary/10 px-3 py-1 rounded-full">
                        <Text className="text-sm font-semibold text-primary">{specialty}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {producerProfile.notableProjects && JSON.parse(producerProfile.notableProjects as string).length > 0 && (
                <View className="gap-2">
                  <Text className="text-sm font-semibold text-muted">Notable Projects</Text>
                  <View className="gap-1">
                    {JSON.parse(producerProfile.notableProjects as string).map((project: string, index: number) => (
                      <Text key={index} className="text-sm text-foreground">
                        • {project}
                      </Text>
                    ))}
                  </View>
                </View>
              )}

              {producerProfile.awards && (
                <View className="gap-2">
                  <Text className="text-sm font-semibold text-muted">Awards & Recognition</Text>
                  <Text className="text-sm text-foreground">{producerProfile.awards}</Text>
                </View>
              )}
            </View>
          )}

          {/* Portfolio Photos */}
          <View className="bg-surface rounded-2xl p-6 gap-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-bold text-foreground">
                Portfolio Photos ({portfolioPhotos?.length || 0})
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/portfolio/photos")}
                className="bg-primary px-4 py-2 rounded-full active:opacity-80"
              >
                <Text className="text-white font-semibold text-sm">Manage</Text>
              </TouchableOpacity>
            </View>

            {portfolioPhotos && portfolioPhotos.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-2">
                <View className="flex-row gap-3 px-2">
                  {portfolioPhotos.slice(0, 5).map((photo) => (
                    <Image
                      key={photo.id}
                      source={{ uri: photo.photoUrl }}
                      className="w-32 h-32 rounded-xl"
                      contentFit="cover"
                    />
                  ))}
                </View>
              </ScrollView>
            ) : (
              <Text className="text-sm text-muted">No photos added yet</Text>
            )}
          </View>

          {/* Filmography */}
          {user?.userRole === "actor" && (
            <View className="bg-surface rounded-2xl p-6 gap-4">
              <View className="flex-row items-center justify-between">
                <Text className="text-lg font-bold text-foreground">
                  Filmography ({films?.length || 0})
                </Text>
                <TouchableOpacity
                  onPress={() => router.push("/profile/filmography")}
                  className="bg-primary px-4 py-2 rounded-full active:opacity-80"
                >
                  <Text className="text-white font-semibold text-sm">Manage</Text>
                </TouchableOpacity>
              </View>

              {films && films.length > 0 ? (
                <View className="gap-3">
                  {films.slice(0, 3).map((film) => (
                    <View key={film.id} className="gap-1">
                      <Text className="text-base font-semibold text-foreground">{film.title}</Text>
                      <Text className="text-sm text-muted">
                        {film.role} • {film.year}
                      </Text>
                    </View>
                  ))}
                  {films.length > 3 && (
                    <TouchableOpacity
                      onPress={() => router.push("/profile/filmography")}
                      className="active:opacity-70"
                    >
                      <Text className="text-sm text-primary font-semibold">
                        View all {films.length} films →
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <Text className="text-sm text-muted">No films added yet</Text>
              )}
            </View>
          )}

          {/* Statistics Card */}
          <View className="bg-surface rounded-2xl p-6 gap-4">
            <Text className="text-lg font-bold text-foreground">Contract Statistics</Text>

            {contractsLoading ? (
              <ActivityIndicator size="small" color="#1E40AF" />
            ) : (
              <>
                <View className="flex-row justify-between items-center">
                  <Text className="text-sm text-muted">Total Contracts</Text>
                  <Text className="text-2xl font-bold text-foreground">{totalContracts}</Text>
                </View>

                <View className="h-px bg-border" />

                <View className="flex-row justify-between items-center">
                  <Text className="text-sm text-muted">Active Contracts</Text>
                  <Text className="text-2xl font-bold text-success">{activeContracts}</Text>
                </View>
              </>
            )}
          </View>

          {/* Notification Settings */}
          <NotificationSettings />

          {/* Support Developer Button */}
          <TouchableOpacity
            onPress={() => router.push("/donate")}
            className="bg-success px-6 py-4 rounded-xl items-center active:opacity-80 mt-4"
          >
            <Text className="text-white text-lg font-semibold">☕ Support Developer</Text>
          </TouchableOpacity>

          {/* Logout Button */}
          <TouchableOpacity
            onPress={handleLogout}
            className="bg-error px-6 py-4 rounded-xl items-center active:opacity-80"
          >
            <Text className="text-white text-lg font-semibold">Sign Out</Text>
          </TouchableOpacity>

          {/* Footer */}
          <AppFooter />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
