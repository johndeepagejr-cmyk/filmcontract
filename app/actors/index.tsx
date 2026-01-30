import { Text, View, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { router } from "expo-router";
import { useColors } from "@/hooks/use-colors";
import { useState, useMemo, useEffect } from "react";
import * as Haptics from "expo-haptics";
import { Platform, Linking, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { QuickActionsMenu, type QuickAction } from "@/components/quick-actions-menu";
import { CustomHeader } from "@/components/custom-header";

const SPECIALTIES = [
  "Drama",
  "Comedy",
  "Action",
  "Horror",
  "Thriller",
  "Romance",
  "Sci-Fi",
  "Voice-Over",
  "Commercial",
  "Theater",
  "Improv",
  "Musical",
];

const FILTERS_STORAGE_KEY = "@actors_directory_filters";

export default function ActorsDirectoryScreen() {
  const colors = useColors();
  const { data: actors, isLoading } = trpc.actorReputation.getAllActors.useQuery();
  const { data: favorites } = trpc.favorites.list.useQuery();
  const addFavorite = trpc.favorites.add.useMutation();
  const removeFavorite = trpc.favorites.remove.useMutation();
  const utils = trpc.useUtils();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [minExperience, setMinExperience] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [filtersLoaded, setFiltersLoaded] = useState(false);
  const [quickActionsVisible, setQuickActionsVisible] = useState(false);
  const [selectedActor, setSelectedActor] = useState<any>(null);

  // Load saved filters on mount
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const saved = await AsyncStorage.getItem(FILTERS_STORAGE_KEY);
        if (saved) {
          const filters = JSON.parse(saved);
          setSearchQuery(filters.searchQuery || "");
          setSelectedSpecialties(filters.selectedSpecialties || []);
          setMinExperience(filters.minExperience || "");
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
          JSON.stringify({ searchQuery, selectedSpecialties, minExperience })
        );
      } catch (error) {
        console.error("Failed to save filters:", error);
      }
    };
    saveFilters();
  }, [searchQuery, selectedSpecialties, minExperience, filtersLoaded]);

  const toggleSpecialty = (specialty: string) => {
    if (selectedSpecialties.includes(specialty)) {
      setSelectedSpecialties(selectedSpecialties.filter((s) => s !== specialty));
    } else {
      setSelectedSpecialties([...selectedSpecialties, specialty]);
    }
  };

  const clearFilters = async () => {
    setSearchQuery("");
    setSelectedSpecialties([]);
    setMinExperience("");
    try {
      await AsyncStorage.removeItem(FILTERS_STORAGE_KEY);
    } catch (error) {
      console.error("Failed to clear filters:", error);
    }
  };

  const filteredActors = useMemo(() => {
    if (!actors) return [];

    return actors.filter((actor) => {
      // Text search
      if (searchQuery && !actor.actorName.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Specialty filter (check if actor has ANY of the selected specialties)
      if (selectedSpecialties.length > 0 && actor.specialties) {
        const actorSpecialties = actor.specialties as string[];
        const hasMatchingSpecialty = selectedSpecialties.some((s) =>
          actorSpecialties.includes(s)
        );
        if (!hasMatchingSpecialty) return false;
      }

      // Experience filter
      if (minExperience && actor.yearsExperience) {
        if (actor.yearsExperience < parseInt(minExperience)) {
          return false;
        }
      }

      return true;
    });
  }, [actors, searchQuery, selectedSpecialties, minExperience]);

  const activeFilterCount = (
    (searchQuery ? 1 : 0) +
    selectedSpecialties.length +
    (minExperience ? 1 : 0)
  );

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
        <CustomHeader title="Actor Directory" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <CustomHeader title="Actor Directory" />
      <ScrollView className="flex-1">
        <View className="p-6 gap-4">
          <View className="gap-2">
            <Text className="text-2xl font-bold text-foreground">Find Actors</Text>
            <Text className="text-muted">
              Browse actor profiles and reputation to find the perfect talent for your project
            </Text>
          </View>

          {/* Search Bar */}
          <View className="gap-2">
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by name..."
              placeholderTextColor="#9CA3AF"
              className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
            />
          </View>

          {/* Filter Toggle */}
          <View className="flex-row items-center justify-between">
            <TouchableOpacity
              onPress={() => setShowFilters(!showFilters)}
              className="flex-row items-center gap-2 active:opacity-70"
            >
              <Text className="text-base font-semibold text-primary">
                {showFilters ? "▼" : "▶"} Filters
              </Text>
              {activeFilterCount > 0 && (
                <View className="bg-primary px-2 py-1 rounded-full">
                  <Text className="text-xs font-bold text-white">{activeFilterCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            {activeFilterCount > 0 && (
              <TouchableOpacity onPress={clearFilters} className="active:opacity-70">
                <Text className="text-sm text-error font-semibold">Clear All</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Filters */}
          {showFilters && (
            <View className="bg-surface border border-border rounded-xl p-4 gap-4">
              {/* Specialties Filter */}
              <View className="gap-2">
                <Text className="text-base font-semibold text-foreground">Specialties</Text>
                <View className="flex-row flex-wrap gap-2">
                  {SPECIALTIES.map((specialty) => (
                    <TouchableOpacity
                      key={specialty}
                      onPress={() => toggleSpecialty(specialty)}
                      className={`px-3 py-2 rounded-full border ${
                        selectedSpecialties.includes(specialty)
                          ? "bg-primary border-primary"
                          : "bg-background border-border"
                      } active:opacity-70`}
                    >
                      <Text
                        className={`text-sm font-semibold ${
                          selectedSpecialties.includes(specialty) ? "text-white" : "text-foreground"
                        }`}
                      >
                        {specialty}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Experience Filter */}
              <View className="gap-2">
                <Text className="text-base font-semibold text-foreground">Minimum Experience</Text>
                <TextInput
                  value={minExperience}
                  onChangeText={setMinExperience}
                  placeholder="e.g., 5 years"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  className="bg-background border border-border rounded-xl px-4 py-3 text-foreground"
                />
              </View>
            </View>
          )}

          {/* Results Count */}
          <Text className="text-sm text-muted">
            {filteredActors.length} actor{filteredActors.length !== 1 ? "s" : ""} found
          </Text>

          {filteredActors && filteredActors.length > 0 ? (
            <View className="gap-4">
              {filteredActors.map((actor) => (
                <TouchableOpacity
                  key={actor.actorId}
                  onPress={() => router.push(`/actor/${actor.actorId}`)}
                  onLongPress={() => {
                    if (Platform.OS !== "web") {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    }
                    setSelectedActor(actor);
                    setQuickActionsVisible(true);
                  }}
                  className="bg-surface rounded-xl p-4 gap-3"
                  style={{ opacity: 1 }}
                  activeOpacity={0.7}
                  delayLongPress={500}
                >
                  <View className="flex-row items-center gap-3">
                    {actor.profilePhotoUrl ? (
                      <Image
                        source={{ uri: actor.profilePhotoUrl }}
                        className="w-16 h-16 rounded-full"
                        style={{ backgroundColor: "#E5E7EB" }}
                      />
                    ) : (
                      <View className="w-16 h-16 rounded-full bg-success items-center justify-center">
                        <Text className="text-2xl font-bold text-background">
                          {actor.actorName.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}

                    <View className="flex-1 gap-1">
                      <View className="flex-row items-center justify-between">
                        <Text className="text-lg font-semibold text-foreground">
                          {actor.actorName}
                        </Text>
                        <TouchableOpacity
                          onPress={async (e) => {
                            e.stopPropagation();
                            if (Platform.OS !== "web") {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            }
                            const isFavorited = favorites?.some(
                              (f) => f.favoritedUserId === actor.actorId
                            );
                            if (isFavorited) {
                              await removeFavorite.mutateAsync({
                                favoritedUserId: actor.actorId,
                              });
                            } else {
                              await addFavorite.mutateAsync({
                                favoritedUserId: actor.actorId,
                                type: "actor",
                              });
                            }
                            utils.favorites.list.invalidate();
                          }}
                          className="active:opacity-70 p-2"
                        >
                          <Text className="text-2xl">
                            {favorites?.some((f) => f.favoritedUserId === actor.actorId)
                              ? "❤️"
                              : "🤍"}
                          </Text>
                        </TouchableOpacity>
                      </View>
                      {actor.location && (
                        <Text className="text-sm text-muted">📍 {actor.location}</Text>
                      )}
                      <View className="flex-row items-center gap-2">
                        <Text className="text-warning">
                          {renderStars(actor.averageRating)}
                        </Text>
                        <Text className="text-sm text-muted">
                          {actor.averageRating.toFixed(1)}
                        </Text>
                        <Text className="text-sm text-muted">
                          ({actor.totalReviews} review{actor.totalReviews !== 1 ? "s" : ""})
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Specialties */}
                  {actor.specialties && (() => {
                    try {
                      const specialtiesArray = typeof actor.specialties === 'string' ? JSON.parse(actor.specialties) : actor.specialties;
                      if (!Array.isArray(specialtiesArray) || specialtiesArray.length === 0) return null;
                      return (
                        <View className="flex-row flex-wrap gap-2">
                          {specialtiesArray.slice(0, 3).map((specialty, idx) => (
                            <View key={idx} className="bg-primary/10 px-2 py-1 rounded-full">
                              <Text className="text-xs font-semibold text-primary">{specialty}</Text>
                            </View>
                          ))}
                          {specialtiesArray.length > 3 && (
                            <View className="bg-border px-2 py-1 rounded-full">
                              <Text className="text-xs font-semibold text-muted">
                                +{specialtiesArray.length - 3} more
                              </Text>
                            </View>
                          )}
                        </View>
                      );
                    } catch {
                      return null;
                    }
                  })()}

                  <View className="flex-row gap-4">
                    <View className="flex-1">
                      <Text className="text-sm text-muted">Contracts</Text>
                      <Text className="text-lg font-semibold text-foreground">
                        {actor.totalContracts}
                      </Text>
                    </View>

                    <View className="flex-1">
                      <Text className="text-sm text-muted">Completion</Text>
                      <Text className="text-lg font-semibold text-success">
                        {actor.completionRate}%
                      </Text>
                    </View>

                    <View className="flex-1">
                      <Text className="text-sm text-muted">Professionalism</Text>
                      <Text className="text-lg font-semibold text-warning">
                        {actor.professionalismRating.toFixed(1)}
                      </Text>
                    </View>
                  </View>

                  {actor.totalReviews > 0 && (
                    <View className="pt-2 border-t border-border">
                      <Text className="text-sm text-primary">
                        {actor.wouldHireAgainRate}% of producers would hire this actor again
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View className="bg-surface rounded-xl p-6 items-center">
              <Text className="text-muted text-center">
                No actors found. Actors will appear here once they join!
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <QuickActionsMenu
        visible={quickActionsVisible}
        onClose={() => setQuickActionsVisible(false)}
        title={selectedActor?.actorName}
        actions={[
          {
            label: "Send Message",
            icon: "💬",
            onPress: () => {
              router.push({
                pathname: "/messages/new",
                params: { recipientId: selectedActor?.actorId?.toString(), name: selectedActor?.actorName || "Actor" },
              });
            },
          },
          {
            label: "Call Actor",
            icon: "📞",
            onPress: async () => {
              // Get actor's phone number from their profile
              const actorPhone = selectedActor?.phoneNumber;
              if (actorPhone) {
                const phoneUrl = `tel:${actorPhone.replace(/[^0-9+]/g, '')}`;
                const canOpen = await Linking.canOpenURL(phoneUrl);
                if (canOpen) {
                  await Linking.openURL(phoneUrl);
                } else {
                  Alert.alert("Cannot Open Phone", "Unable to open phone dialer on this device.");
                }
              } else {
                Alert.alert(
                  "Phone Number Not Available",
                  "This actor hasn't added their phone number yet. Try sending them a message instead.",
                  [{ text: "OK" }]
                );
              }
            },
          },
          {
            label: "View Profile",
            icon: "👤",
            onPress: () => router.push(`/actor/${selectedActor?.actorId}`),
          },
          {
            label: "View Portfolio",
            icon: "📸",
            onPress: () => router.push(`/portfolio/${selectedActor?.actorId}`),
          },
          {
            label: "Create Contract",
            icon: "📝",
            onPress: () => router.push("/contracts/create"),
          },
          {
            label: favorites?.some((f) => f.favoritedUserId === selectedActor?.actorId)
              ? "Remove from Favorites"
              : "Add to Favorites",
            icon: favorites?.some((f) => f.favoritedUserId === selectedActor?.actorId)
              ? "💔"
              : "❤️",
            onPress: async () => {
              const isFavorited = favorites?.some(
                (f) => f.favoritedUserId === selectedActor?.actorId
              );
              if (isFavorited) {
                await removeFavorite.mutateAsync({
                  favoritedUserId: selectedActor?.actorId,
                });
              } else {
                await addFavorite.mutateAsync({
                  favoritedUserId: selectedActor?.actorId,
                  type: "actor",
                });
              }
              utils.favorites.list.invalidate();
            },
            destructive: favorites?.some((f) => f.favoritedUserId === selectedActor?.actorId),
          },
        ]}
      />
    </View>
  );
}
