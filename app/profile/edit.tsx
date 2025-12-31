import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { router } from "expo-router";
import { useState, useEffect } from "react";
import * as ImagePicker from "expo-image-picker";

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

export default function EditProfileScreen() {
  const { user } = useAuth();
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [eyeColor, setEyeColor] = useState("");
  const [hairColor, setHairColor] = useState("");
  const [website, setWebsite] = useState("");
  const [imdbUrl, setImdbUrl] = useState("");
  const [profilePhotoUrl, setProfilePhotoUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const { data: profile } = trpc.actorProfile.getMy.useQuery(undefined, {
    enabled: !!user,
  });

  const uploadPhoto = trpc.actorProfile.uploadPhoto.useMutation();

  const upsertProfile = trpc.actorProfile.upsert.useMutation({
    onSuccess: () => {
      Alert.alert("Success", "Profile updated successfully!");
      router.back();
    },
    onError: (error) => {
      Alert.alert("Error", error.message || "Failed to update profile");
    },
  });

  useEffect(() => {
    if (profile) {
      setBio(profile.bio || "");
      setLocation(profile.location || "");
      setYearsExperience(profile.yearsExperience?.toString() || "");
      setSelectedSpecialties((profile.specialties as string[]) || []);
      setHeight(profile.height || "");
      setWeight(profile.weight || "");
      setEyeColor(profile.eyeColor || "");
      setHairColor(profile.hairColor || "");
      setWebsite(profile.website || "");
      setImdbUrl(profile.imdbUrl || "");
      setProfilePhotoUrl(profile.profilePhotoUrl || "");
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [profile]);

  const pickImage = async () => {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please allow access to your photos to upload a profile picture");
      return;
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images" as any,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setUploadingPhoto(true);
      try {
        const { photoUrl } = await uploadPhoto.mutateAsync({
          base64Data: result.assets[0].base64,
          fileName: `profile-${Date.now()}.jpg`,
          mimeType: "image/jpeg",
        });
        setProfilePhotoUrl(photoUrl);
        Alert.alert("Success", "Photo uploaded! Don't forget to save your profile.");
      } catch (error: any) {
        Alert.alert("Error", error.message || "Failed to upload photo");
      } finally {
        setUploadingPhoto(false);
      }
    }
  };

  const toggleSpecialty = (specialty: string) => {
    if (selectedSpecialties.includes(specialty)) {
      setSelectedSpecialties(selectedSpecialties.filter((s) => s !== specialty));
    } else {
      setSelectedSpecialties([...selectedSpecialties, specialty]);
    }
  };

  const handleSave = () => {
    upsertProfile.mutate({
      bio,
      location,
      yearsExperience: yearsExperience ? parseInt(yearsExperience) : undefined,
      specialties: selectedSpecialties,
      height,
      weight,
      eyeColor,
      hairColor,
      website,
      imdbUrl,
      profilePhotoUrl: profilePhotoUrl || undefined,
    });
  };

  if (loading) {
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
            <Text className="text-2xl font-bold text-foreground">Edit Profile</Text>
            <TouchableOpacity
              onPress={handleSave}
              disabled={upsertProfile.isPending}
              className="bg-primary px-4 py-2 rounded-full active:opacity-80"
            >
              {upsertProfile.isPending ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text className="text-white font-semibold">Save</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Profile Photo */}
          <View className="gap-2 items-center">
            <Text className="text-base font-semibold text-foreground self-start">Profile Photo</Text>
            <TouchableOpacity
              onPress={pickImage}
              disabled={uploadingPhoto}
              className="items-center gap-3 active:opacity-70"
            >
              {profilePhotoUrl ? (
                <Image
                  source={{ uri: profilePhotoUrl }}
                  className="w-32 h-32 rounded-full"
                  style={{ backgroundColor: "#E5E7EB" }}
                />
              ) : (
                <View className="w-32 h-32 rounded-full bg-surface border-2 border-dashed border-border items-center justify-center">
                  <Text className="text-4xl">📷</Text>
                </View>
              )}
              {uploadingPhoto ? (
                <ActivityIndicator size="small" color="#1E40AF" />
              ) : (
                <Text className="text-sm text-primary font-semibold">
                  {profilePhotoUrl ? "Change Photo" : "Upload Photo"}
                </Text>
              )}
            </TouchableOpacity>
            <Text className="text-xs text-muted text-center">Square photo recommended (1:1 ratio)</Text>
          </View>

          {/* Bio */}
          <View className="gap-2">
            <Text className="text-base font-semibold text-foreground">Bio</Text>
            <TextInput
              value={bio}
              onChangeText={setBio}
              placeholder="Tell producers about yourself..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
              className="bg-surface border border-border rounded-xl p-4 text-foreground"
              style={{ textAlignVertical: "top" }}
            />
            <Text className="text-xs text-muted">{bio.length} / 1000 characters</Text>
          </View>

          {/* Location */}
          <View className="gap-2">
            <Text className="text-base font-semibold text-foreground">Location</Text>
            <TextInput
              value={location}
              onChangeText={setLocation}
              placeholder="e.g., Los Angeles, CA"
              placeholderTextColor="#9CA3AF"
              className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
            />
          </View>

          {/* Years of Experience */}
          <View className="gap-2">
            <Text className="text-base font-semibold text-foreground">Years of Experience</Text>
            <TextInput
              value={yearsExperience}
              onChangeText={setYearsExperience}
              placeholder="e.g., 5"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
              className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
            />
          </View>

          {/* Specialties */}
          <View className="gap-2">
            <Text className="text-base font-semibold text-foreground">Specialties</Text>
            <View className="flex-row flex-wrap gap-2">
              {SPECIALTIES.map((specialty) => (
                <TouchableOpacity
                  key={specialty}
                  onPress={() => toggleSpecialty(specialty)}
                  className={`px-4 py-2 rounded-full border ${
                    selectedSpecialties.includes(specialty)
                      ? "bg-primary border-primary"
                      : "bg-surface border-border"
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

          {/* Physical Attributes */}
          <View className="gap-4">
            <Text className="text-lg font-bold text-foreground">Physical Attributes</Text>
            
            <View className="flex-row gap-4">
              <View className="flex-1 gap-2">
                <Text className="text-base font-semibold text-foreground">Height</Text>
                <TextInput
                  value={height}
                  onChangeText={setHeight}
                  placeholder="e.g., 5'10''"
                  placeholderTextColor="#9CA3AF"
                  className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
                />
              </View>
              
              <View className="flex-1 gap-2">
                <Text className="text-base font-semibold text-foreground">Weight</Text>
                <TextInput
                  value={weight}
                  onChangeText={setWeight}
                  placeholder="e.g., 165 lbs"
                  placeholderTextColor="#9CA3AF"
                  className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
                />
              </View>
            </View>

            <View className="flex-row gap-4">
              <View className="flex-1 gap-2">
                <Text className="text-base font-semibold text-foreground">Eye Color</Text>
                <TextInput
                  value={eyeColor}
                  onChangeText={setEyeColor}
                  placeholder="e.g., Brown"
                  placeholderTextColor="#9CA3AF"
                  className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
                />
              </View>
              
              <View className="flex-1 gap-2">
                <Text className="text-base font-semibold text-foreground">Hair Color</Text>
                <TextInput
                  value={hairColor}
                  onChangeText={setHairColor}
                  placeholder="e.g., Black"
                  placeholderTextColor="#9CA3AF"
                  className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
                />
              </View>
            </View>
          </View>

          {/* Links */}
          <View className="gap-4">
            <Text className="text-lg font-bold text-foreground">Links</Text>
            
            <View className="gap-2">
              <Text className="text-base font-semibold text-foreground">Website</Text>
              <TextInput
                value={website}
                onChangeText={setWebsite}
                placeholder="https://yourwebsite.com"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
                keyboardType="url"
                className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
              />
            </View>

            <View className="gap-2">
              <Text className="text-base font-semibold text-foreground">IMDb Profile</Text>
              <TextInput
                value={imdbUrl}
                onChangeText={setImdbUrl}
                placeholder="https://www.imdb.com/name/..."
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
                keyboardType="url"
                className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
              />
            </View>
          </View>

          {/* Bottom spacing */}
          <View className="h-8" />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
