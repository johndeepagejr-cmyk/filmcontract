import { Text, View, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Platform } from "react-native";
import { Image } from "expo-image";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { router } from "expo-router";
import { useColors } from "@/hooks/use-colors";
import { useState, useMemo, useEffect } from "react";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { QuickActionsMenu, type QuickAction } from "@/components/quick-actions-menu";
import { CustomHeader } from "@/components/custom-header";

const FILTERS_STORAGE_KEY = "@producers_directory_filters";

export default function ProducersDirectoryScreen() {
  const colors = useColors();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [locationFilter, setLocationFilter] = useState("");
  const [filtersLoaded, setFiltersLoaded] = useState(false);
  const [quickActionsVisible, setQuickActionsVisible] = useState(false);
  const [selectedProducer, setSelectedProducer] = useState<any>(null);

  // Load saved filters on mount
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const saved = await AsyncStorage.getItem(FILTERS_STORAGE_KEY);
        if (saved) {
          const filters = JSON.parse(saved);
          setSearchQuery(filters.searchQuery || "");
          setSelectedSpecialties(filters.selectedSpecialties || []);
          setLocationFilter(filters.locationFilter || "");
        }
      } catch (error) {
        console.error("Failed to load filters:", error);
      } finally {
        setFiltersLoaded(true);
      }
    };
    loadFilters();
  }, []);

  // Save filters whenever they change
  useEffect(() => {
    if (!filtersLoaded) return;
    const saveFilters = async () => {
      try {
        await AsyncStorage.setItem(
          FILTERS_STORAGE_KEY,
          JSON.stringify({ searchQuery, selectedSpecialties, locationFilter })
        );
      } catch (error) {
        console.error("Failed to save filters:", error);
      }
    };
    saveFilters();
  }, [searchQuery, selectedSpecialties, locationFilter, filtersLoaded]);
  
  const { data: producers, isLoading } = trpc.reputation.getAllProducers.useQuery();
  const { data: producerProfiles } = trpc.producers.getAllProducers.useQuery();
  const { data: favorites } = trpc.favorites.list.useQuery();
  const addFavorite = trpc.favorites.add.useMutation();
  const removeFavorite = trpc.favorites.remove.useMutation();
  const utils = trpc.useUtils();

  const specialtyOptions = [
    "Feature Films",
    "Commercials",
    "TV Series",
    "Documentaries",
    "Music Videos",
    "Web Content",
    "Indie Films",
    "Corporate Videos",
  ];

  const toggleSpecialty = (specialty: string) => {
    if (selectedSpecialties.includes(specialty)) {
      setSelectedSpecialties(selectedSpecialties.filter((s) => s !== specialty));
    } else {
      setSelectedSpecialties([...selectedSpecialties, specialty]);
    }
  };

  // Merge producer reputation with profile data
  const enrichedProducers = useMemo(() => {
    if (!producers || !producerProfiles) return producers || [];
    
    return producers.map((producer) => {
      const profile = producerProfiles.find((p) => p.userId === producer.producerId);
      return {
        ...producer,
        profile,
      };
    });
  }, [producers, producerProfiles]);

  // Filter producers
  const filteredProducers = useMemo(() => {
    if (!enrichedProducers) return [];

    return enrichedProducers.filter((producer) => {
      // Search query filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = producer.producerName.toLowerCase().includes(query);
        const matchesCompany = producer.profile?.companyName?.toLowerCase().includes(query);
        if (!matchesName && !matchesCompany) return false;
      }

      // Location filter
      if (locationFilter && producer.profile?.location) {
        if (!producer.profile.location.toLowerCase().includes(locationFilter.toLowerCase())) {
          return false;
        }
      }

      // Specialty filter
      if (selectedSpecialties.length > 0 && producer.profile?.specialties) {
        const producerSpecialties = JSON.parse(producer.profile.specialties as string);
        const hasMatchingSpecialty = selectedSpecialties.some((s) =>
          producerSpecialties.includes(s)
        );
        if (!hasMatchingSpecialty) return false;
      }

      return true;
    });
  }, [enrichedProducers, searchQuery, locationFilter, selectedSpecialties]);

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const stars = [];

    for (let i = 0; i < fullStars; i++) {
      stars.push("★");
    }
    if (hasHalfStar) {
      stars.push("½");
    }
    while (stars.length < 5) {
      stars.push("☆");
    }

    return stars.join("");
  };

  if (isLoading) {
    return (
      <View className="flex-1" style={{ backgroundColor: colors.background }}>
        <CustomHeader title="Producer Directory" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <CustomHeader title="Producer Directory" />
      <ScrollView className="flex-1">
        <View className="p-6 gap-4">
          <View className="gap-2">
            <Text className="text-2xl font-bold text-foreground">Producer Directory</Text>
            <Text className="text-muted">
              Browse production companies and find the right fit for your project
            </Text>
          </View>

          {/* Search Bar */}
          <TextInput
            placeholder="Search by company name..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="bg-surface px-4 py-3 rounded-xl text-foreground"
            placeholderTextColor="#9CA3AF"
          />

          {/* Location Filter */}
          <TextInput
            placeholder="Filter by location..."
            value={locationFilter}
            onChangeText={setLocationFilter}
            className="bg-surface px-4 py-3 rounded-xl text-foreground"
            placeholderTextColor="#9CA3AF"
          />

          {/* Specialty Filters */}
          <View className="gap-3">
            <Text className="text-sm font-semibold text-muted">Filter by Specialties</Text>
            <View className="flex-row flex-wrap gap-2">
              {specialtyOptions.map((specialty) => (
                <TouchableOpacity
                  key={specialty}
                  onPress={() => toggleSpecialty(specialty)}
                  className={`px-4 py-2 rounded-full ${
                    selectedSpecialties.includes(specialty)
                      ? "bg-primary"
                      : "bg-surface"
                  }`}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      selectedSpecialties.includes(specialty)
                        ? "text-white"
                        : "text-foreground"
                    }`}
                  >
                    {specialty}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Results Count */}
          <Text className="text-sm text-muted">
            {filteredProducers?.length || 0} {filteredProducers?.length === 1 ? "producer" : "producers"} found
          </Text>

          {filteredProducers && filteredProducers.length > 0 ? (
            <View className="gap-4">
              {filteredProducers.map((producer) => (
                <TouchableOpacity
                  key={producer.producerId}
                  onPress={() => router.push(`/producer/${producer.producerId}`)}
                  onLongPress={() => {
                    if (Platform.OS !== "web") {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    }
                    setSelectedProducer(producer);
                    setQuickActionsVisible(true);
                  }}
                  className="bg-surface rounded-xl p-4 gap-3"
                  style={{ opacity: 1 }}
                  activeOpacity={0.7}
                  delayLongPress={500}
                >
                  <View className="flex-row items-center gap-3">
                    {producer.profile?.companyLogoUrl ? (
                      <Image
                        source={{ uri: producer.profile.companyLogoUrl }}
                        className="w-16 h-16 rounded-xl"
                        contentFit="cover"
                      />
                    ) : (
                      <View className="w-16 h-16 rounded-full bg-primary items-center justify-center">
                        <Text className="text-2xl font-bold text-background">
                          {producer.producerName.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}

                    <View className="flex-1 gap-1">
                      <View className="flex-row items-center justify-between">
                        <Text className="text-lg font-semibold text-foreground">
                          {producer.profile?.companyName || producer.producerName}
                        </Text>
                        <TouchableOpacity
                          onPress={async (e) => {
                            e.stopPropagation();
                            if (Platform.OS !== "web") {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            }
                            const isFavorited = favorites?.some(
                              (f) => f.favoritedUserId === producer.producerId
                            );
                            if (isFavorited) {
                              await removeFavorite.mutateAsync({
                                favoritedUserId: producer.producerId,
                              });
                            } else {
                              await addFavorite.mutateAsync({
                                favoritedUserId: producer.producerId,
                                type: "producer",
                              });
                            }
                            utils.favorites.list.invalidate();
                          }}
                          className="active:opacity-70 p-2"
                        >
                          <Text className="text-2xl">
                            {favorites?.some((f) => f.favoritedUserId === producer.producerId)
                              ? "❤️"
                              : "🤍"}
                          </Text>
                        </TouchableOpacity>
                      </View>
                      {producer.profile?.location && (
                        <Text className="text-sm text-muted">📍 {producer.profile.location}</Text>
                      )}
                      <View className="flex-row items-center gap-2">
                        <Text className="text-warning">
                          {renderStars(producer.averageRating)}
                        </Text>
                        <Text className="text-sm text-muted">
                          {producer.averageRating.toFixed(1)}
                        </Text>
                        <Text className="text-sm text-muted">
                          ({producer.totalReviews} review{producer.totalReviews !== 1 ? "s" : ""})
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View className="flex-row gap-4">
                    <View className="flex-1">
                      <Text className="text-sm text-muted">Contracts</Text>
                      <Text className="text-lg font-semibold text-foreground">
                        {producer.totalContracts}
                      </Text>
                    </View>

                    <View className="flex-1">
                      <Text className="text-sm text-muted">Completion</Text>
                      <Text className="text-lg font-semibold text-success">
                        {producer.completionRate}%
                      </Text>
                    </View>

                    <View className="flex-1">
                      <Text className="text-sm text-muted">On-Time Pay</Text>
                      <Text className="text-lg font-semibold text-success">
                        {producer.onTimePaymentRate}%
                      </Text>
                    </View>
                  </View>

                  {producer.totalReviews > 0 && (
                    <View className="pt-2 border-t border-border">
                      <Text className="text-sm text-primary">
                        {producer.wouldWorkAgainRate}% would work with this producer again
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View className="bg-surface rounded-xl p-6 items-center">
              <Text className="text-muted text-center">
                No producers found. Be the first to create contracts!
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <QuickActionsMenu
        visible={quickActionsVisible}
        onClose={() => setQuickActionsVisible(false)}
        title={selectedProducer?.profile?.companyName || selectedProducer?.producerName}
        actions={[
          {
            label: "View Profile",
            icon: "👤",
            onPress: () => router.push(`/producer/${selectedProducer?.producerId}`),
          },
          {
            label: "View Projects",
            icon: "🎬",
            onPress: () => router.push(`/producer/${selectedProducer?.producerId}`),
          },
          {
            label: favorites?.some((f) => f.favoritedUserId === selectedProducer?.producerId)
              ? "Remove from Favorites"
              : "Add to Favorites",
            icon: favorites?.some((f) => f.favoritedUserId === selectedProducer?.producerId)
              ? "💔"
              : "❤️",
            onPress: async () => {
              const isFavorited = favorites?.some(
                (f) => f.favoritedUserId === selectedProducer?.producerId
              );
              if (isFavorited) {
                await removeFavorite.mutateAsync({
                  favoritedUserId: selectedProducer?.producerId,
                });
              } else {
                await addFavorite.mutateAsync({
                  favoritedUserId: selectedProducer?.producerId,
                  type: "producer",
                });
              }
              utils.favorites.list.invalidate();
            },
            destructive: favorites?.some((f) => f.favoritedUserId === selectedProducer?.producerId),
          },
        ]}
      />
    </View>
  );
}
