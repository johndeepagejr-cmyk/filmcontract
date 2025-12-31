import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Share } from "react-native";
import { Image } from "expo-image";
import { ScreenContainer } from "@/components/screen-container";
import { useLocalSearchParams } from "expo-router";
import { trpc } from "@/lib/trpc";
import { GridLayout, MasonryLayout, CarouselLayout } from "@/components/portfolio-layouts";

export default function PublicPortfolioScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const userIdNum = parseInt(userId as string, 10);

  const { data: actorProfile, isLoading: actorLoading } = trpc.actorProfile.getProfile.useQuery(
    { userId: userIdNum },
    { enabled: !!userIdNum }
  );

  const { data: producerProfile, isLoading: producerLoading } = trpc.producerProfile.getProfile.useQuery(
    { userId: userIdNum },
    { enabled: !!userIdNum }
  );

  const { data: portfolioPhotos } = trpc.portfolioPhotos.getPhotos.useQuery(
    { userId: userIdNum },
    { enabled: !!userIdNum }
  );

  const { data: films } = trpc.actorProfile.getFilms.useQuery(
    { userId: userIdNum },
    { enabled: !!userIdNum && !!actorProfile }
  );

  const isLoading = actorLoading || producerLoading;
  const profile = actorProfile || producerProfile;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${profile?.bio || "this"} portfolio on FilmContract!`,
        url: `https://8081-ia6sbgycqgi78h1m3wxmm-268d213c.us2.manus.computer/public-portfolio/${userId}`,
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  if (isLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color="#1E40AF" />
      </ScreenContainer>
    );
  }

  if (!profile) {
    return (
      <ScreenContainer className="items-center justify-center p-6">
        <Text className="text-2xl mb-2">🎬</Text>
        <Text className="text-xl font-bold text-foreground mb-2">Profile Not Found</Text>
        <Text className="text-base text-muted text-center">
          This user hasn't created their profile yet.
        </Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 gap-6">
          {/* Header with Share Button */}
          <View className="flex-row items-center justify-between">
            <Text className="text-3xl font-bold text-foreground">Public Portfolio</Text>
            <TouchableOpacity
              onPress={handleShare}
              className="bg-primary px-4 py-2 rounded-full active:opacity-80"
            >
              <Text className="text-white font-semibold">Share</Text>
            </TouchableOpacity>
          </View>

          {/* Profile Photo */}
          {profile.profilePhotoUrl && (
            <View className="items-center">
              <Image
                source={{ uri: profile.profilePhotoUrl }}
                className="w-32 h-32 rounded-full"
                contentFit="cover"
              />
            </View>
          )}

          {/* Basic Info */}
          <View className="bg-surface rounded-2xl p-6 gap-4">
            {actorProfile && (
              <>
                <View>
                  <Text className="text-sm text-muted mb-1">Name</Text>
                  <Text className="text-lg font-semibold text-foreground">
                    {actorProfile.stageName || "Actor"}
                  </Text>
                </View>
                {actorProfile.location && (
                  <View>
                    <Text className="text-sm text-muted mb-1">Location</Text>
                    <Text className="text-base text-foreground">{actorProfile.location}</Text>
                  </View>
                )}
                {actorProfile.yearsOfExperience && (
                  <View>
                    <Text className="text-sm text-muted mb-1">Experience</Text>
                    <Text className="text-base text-foreground">
                      {actorProfile.yearsOfExperience} years
                    </Text>
                  </View>
                )}
              </>
            )}

            {producerProfile && (
              <>
                <View>
                  <Text className="text-sm text-muted mb-1">Company</Text>
                  <Text className="text-lg font-semibold text-foreground">
                    {producerProfile.companyName || "Production Company"}
                  </Text>
                </View>
                {producerProfile.location && (
                  <View>
                    <Text className="text-sm text-muted mb-1">Location</Text>
                    <Text className="text-base text-foreground">{producerProfile.location}</Text>
                  </View>
                )}
                {producerProfile.yearsInBusiness && (
                  <View>
                    <Text className="text-sm text-muted mb-1">Years in Business</Text>
                    <Text className="text-base text-foreground">
                      {producerProfile.yearsInBusiness} years
                    </Text>
                  </View>
                )}
              </>
            )}

            {profile.bio && (
              <View>
                <Text className="text-sm text-muted mb-1">Bio</Text>
                <Text className="text-base text-foreground leading-relaxed">{profile.bio}</Text>
              </View>
            )}
          </View>

          {/* Specialties */}
          {profile.specialties && profile.specialties.length > 0 && (
            <View className="bg-surface rounded-2xl p-6 gap-3">
              <Text className="text-lg font-semibold text-foreground">Specialties</Text>
              <View className="flex-row flex-wrap gap-2">
                {profile.specialties.map((specialty, index) => (
                  <View key={index} className="bg-primary/10 px-4 py-2 rounded-full">
                    <Text className="text-primary font-medium">{specialty}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Filmography (Actors only) */}
          {films && films.length > 0 && (
            <View className="bg-surface rounded-2xl p-6 gap-4">
              <Text className="text-lg font-semibold text-foreground">Filmography</Text>
              {films.map((film) => (
                <View key={film.id} className="border-b border-border pb-4 last:border-0">
                  <Text className="text-base font-semibold text-foreground">{film.projectTitle}</Text>
                  <Text className="text-sm text-muted">{film.role}</Text>
                  {film.year && <Text className="text-sm text-muted">{film.year}</Text>}
                </View>
              ))}
            </View>
          )}

          {/* Portfolio Photos with Theme */}
          {portfolioPhotos && portfolioPhotos.length > 0 && (
            <View className="gap-4">
              <Text className="text-lg font-semibold text-foreground">Portfolio</Text>
              {profile.portfolioTheme === "masonry" && (
                <MasonryLayout photos={portfolioPhotos} />
              )}
              {profile.portfolioTheme === "carousel" && (
                <CarouselLayout photos={portfolioPhotos} />
              )}
              {(profile.portfolioTheme === "grid" || !profile.portfolioTheme) && (
                <GridLayout photos={portfolioPhotos} />
              )}
            </View>
          )}

          {/* Footer */}
          <View className="items-center py-6">
            <Text className="text-sm text-muted">Powered by FilmContract</Text>
            <Text className="text-xs text-muted">© 2024-2025 John Dee Page Jr</Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
