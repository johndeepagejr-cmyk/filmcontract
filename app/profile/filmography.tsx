import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { router } from "expo-router";
import { useState } from "react";

const PROJECT_TYPES = [
  { value: "feature_film", label: "Feature Film" },
  { value: "short_film", label: "Short Film" },
  { value: "tv_series", label: "TV Series" },
  { value: "commercial", label: "Commercial" },
  { value: "theater", label: "Theater" },
  { value: "voice_over", label: "Voice-Over" },
  { value: "other", label: "Other" },
] as const;

export default function FilmographyScreen() {
  const { user } = useAuth();
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState("");
  const [role, setRole] = useState("");
  const [year, setYear] = useState("");
  const [description, setDescription] = useState("");
  const [projectType, setProjectType] = useState<typeof PROJECT_TYPES[number]["value"]>("feature_film");
  const [director, setDirector] = useState("");
  const [productionCompany, setProductionCompany] = useState("");

  const { data: films, isLoading, refetch } = trpc.actorProfile.getFilms.useQuery(
    { userId: user?.id || 0 },
    { enabled: !!user }
  );

  const addFilm = trpc.actorProfile.addFilm.useMutation({
    onSuccess: () => {
      Alert.alert("Success", "Film added to your filmography!");
      setShowAddForm(false);
      resetForm();
      refetch();
    },
    onError: (error) => {
      Alert.alert("Error", error.message || "Failed to add film");
    },
  });

  const deleteFilm = trpc.actorProfile.deleteFilm.useMutation({
    onSuccess: () => {
      Alert.alert("Success", "Film removed from filmography");
      refetch();
    },
    onError: (error) => {
      Alert.alert("Error", error.message || "Failed to delete film");
    },
  });

  const resetForm = () => {
    setTitle("");
    setRole("");
    setYear("");
    setDescription("");
    setProjectType("feature_film");
    setDirector("");
    setProductionCompany("");
  };

  const handleAddFilm = () => {
    if (!title || !role || !year) {
      Alert.alert("Error", "Please fill in title, role, and year");
      return;
    }

    addFilm.mutate({
      title,
      role,
      year: parseInt(year),
      description: description || undefined,
      projectType,
      director: director || undefined,
      productionCompany: productionCompany || undefined,
    });
  };

  const handleDeleteFilm = (filmId: number, filmTitle: string) => {
    Alert.alert(
      "Delete Film",
      `Are you sure you want to remove "${filmTitle}" from your filmography?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteFilm.mutate({ filmId }) },
      ]
    );
  };

  if (isLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color="#1E40AF" />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 gap-6">
          {/* Header */}
          <View className="flex-row items-center justify-between">
            <TouchableOpacity onPress={() => router.back()} className="active:opacity-70">
              <Text className="text-lg text-primary font-semibold">← Back</Text>
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-foreground">Filmography</Text>
            <TouchableOpacity
              onPress={() => setShowAddForm(!showAddForm)}
              className="bg-primary px-4 py-2 rounded-full active:opacity-80"
            >
              <Text className="text-white font-semibold">{showAddForm ? "Cancel" : "+ Add"}</Text>
            </TouchableOpacity>
          </View>

          {/* Add Film Form */}
          {showAddForm && (
            <View className="bg-surface border border-border rounded-2xl p-6 gap-4">
              <Text className="text-xl font-bold text-foreground">Add Film</Text>

              <View className="gap-2">
                <Text className="text-base font-semibold text-foreground">Title *</Text>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Film/Show Title"
                  placeholderTextColor="#9CA3AF"
                  className="bg-background border border-border rounded-xl px-4 py-3 text-foreground"
                />
              </View>

              <View className="gap-2">
                <Text className="text-base font-semibold text-foreground">Role *</Text>
                <TextInput
                  value={role}
                  onChangeText={setRole}
                  placeholder="Character name or role"
                  placeholderTextColor="#9CA3AF"
                  className="bg-background border border-border rounded-xl px-4 py-3 text-foreground"
                />
              </View>

              <View className="gap-2">
                <Text className="text-base font-semibold text-foreground">Year *</Text>
                <TextInput
                  value={year}
                  onChangeText={setYear}
                  placeholder="2024"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  className="bg-background border border-border rounded-xl px-4 py-3 text-foreground"
                />
              </View>

              <View className="gap-2">
                <Text className="text-base font-semibold text-foreground">Project Type</Text>
                <View className="flex-row flex-wrap gap-2">
                  {PROJECT_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type.value}
                      onPress={() => setProjectType(type.value)}
                      className={`px-4 py-2 rounded-full border ${
                        projectType === type.value
                          ? "bg-primary border-primary"
                          : "bg-background border-border"
                      } active:opacity-70`}
                    >
                      <Text
                        className={`text-sm font-semibold ${
                          projectType === type.value ? "text-white" : "text-foreground"
                        }`}
                      >
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View className="gap-2">
                <Text className="text-base font-semibold text-foreground">Description</Text>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Brief description of your role..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={3}
                  className="bg-background border border-border rounded-xl p-4 text-foreground"
                  style={{ textAlignVertical: "top" }}
                />
              </View>

              <View className="gap-2">
                <Text className="text-base font-semibold text-foreground">Director</Text>
                <TextInput
                  value={director}
                  onChangeText={setDirector}
                  placeholder="Director name"
                  placeholderTextColor="#9CA3AF"
                  className="bg-background border border-border rounded-xl px-4 py-3 text-foreground"
                />
              </View>

              <View className="gap-2">
                <Text className="text-base font-semibold text-foreground">Production Company</Text>
                <TextInput
                  value={productionCompany}
                  onChangeText={setProductionCompany}
                  placeholder="Production company name"
                  placeholderTextColor="#9CA3AF"
                  className="bg-background border border-border rounded-xl px-4 py-3 text-foreground"
                />
              </View>

              <TouchableOpacity
                onPress={handleAddFilm}
                disabled={addFilm.isPending}
                className="bg-primary py-4 rounded-xl items-center active:opacity-80"
              >
                {addFilm.isPending ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text className="text-white font-bold text-lg">Add to Filmography</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Films List */}
          <View className="gap-4">
            <Text className="text-lg font-bold text-foreground">
              Your Films ({films?.length || 0})
            </Text>

            {films && films.length > 0 ? (
              films.map((film) => (
                <View
                  key={film.id}
                  className="bg-surface border border-border rounded-2xl p-6 gap-3"
                >
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1">
                      <Text className="text-xl font-bold text-foreground">{film.title}</Text>
                      <Text className="text-base text-muted mt-1">
                        {film.role} • {film.year}
                      </Text>
                      <View className="mt-2 bg-primary/10 px-3 py-1 rounded-full self-start">
                        <Text className="text-sm font-semibold text-primary">
                          {PROJECT_TYPES.find((t) => t.value === film.projectType)?.label ||
                            film.projectType}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDeleteFilm(film.id, film.title)}
                      className="p-2 active:opacity-70"
                    >
                      <Text className="text-error font-semibold">Delete</Text>
                    </TouchableOpacity>
                  </View>

                  {film.description && (
                    <Text className="text-base text-foreground leading-6">{film.description}</Text>
                  )}

                  {(film.director || film.productionCompany) && (
                    <View className="gap-1">
                      {film.director && (
                        <Text className="text-sm text-muted">Director: {film.director}</Text>
                      )}
                      {film.productionCompany && (
                        <Text className="text-sm text-muted">
                          Production: {film.productionCompany}
                        </Text>
                      )}
                    </View>
                  )}
                </View>
              ))
            ) : (
              <View className="bg-surface border border-border rounded-2xl p-8 items-center">
                <Text className="text-base text-muted text-center">
                  No films added yet. Tap "+ Add" to add your first film!
                </Text>
              </View>
            )}
          </View>

          {/* Bottom spacing */}
          <View className="h-8" />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
