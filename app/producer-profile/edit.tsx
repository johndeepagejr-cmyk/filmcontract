import {
  ScrollView,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";

const SPECIALTY_OPTIONS = [
  "Feature Films",
  "Commercials",
  "TV Series",
  "Documentaries",
  "Music Videos",
  "Web Content",
  "Indie Films",
  "Corporate Videos",
];

export default function EditProducerProfileScreen() {
  const { data: profile, isLoading } = trpc.producerProfile.get.useQuery();
  const updateMutation = trpc.producerProfile.upsert.useMutation();
  const uploadPhotoMutation = trpc.producerProfile.uploadPhoto.useMutation();

  const [companyName, setCompanyName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [yearsInBusiness, setYearsInBusiness] = useState("");
  const [website, setWebsite] = useState("");
  const [awards, setAwards] = useState("");
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string | null>(null);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [notableProjects, setNotableProjects] = useState("");

  useEffect(() => {
    if (profile) {
      setCompanyName(profile.companyName || "");
      setBio(profile.bio || "");
      setLocation(profile.location || "");
      setYearsInBusiness(profile.yearsInBusiness?.toString() || "");
      setWebsite(profile.website || "");
      setAwards(profile.awards || "");
      setProfilePhotoUrl(profile.profilePhotoUrl);
      setCompanyLogoUrl(profile.companyLogoUrl);
      if (profile.specialties) {
        try {
          setSelectedSpecialties(JSON.parse(profile.specialties as string));
        } catch {
          setSelectedSpecialties([]);
        }
      }
      if (profile.notableProjects) {
        try {
          const projects = JSON.parse(profile.notableProjects as string);
          setNotableProjects(projects.join(", "));
        } catch {
          setNotableProjects("");
        }
      }
    }
  }, [profile]);

  const handlePickProfilePhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      uploadPhotoMutation.mutate(
        {
          base64: asset.base64 || "",
          filename: `profile-${Date.now()}.jpg`,
        },
        {
          onSuccess: (data) => {
            setProfilePhotoUrl(data.url);
            if (Platform.OS === "web") {
              alert("Profile photo uploaded successfully!");
            } else {
              Alert.alert("Success", "Profile photo uploaded successfully!");
            }
          },
          onError: (error) => {
            if (Platform.OS === "web") {
              alert(`Upload failed: ${error.message}`);
            } else {
              Alert.alert("Error", `Upload failed: ${error.message}`);
            }
          },
        }
      );
    }
  };

  const handlePickCompanyLogo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      uploadPhotoMutation.mutate(
        {
          base64: asset.base64 || "",
          filename: `logo-${Date.now()}.jpg`,
        },
        {
          onSuccess: (data) => {
            setCompanyLogoUrl(data.url);
            if (Platform.OS === "web") {
              alert("Company logo uploaded successfully!");
            } else {
              Alert.alert("Success", "Company logo uploaded successfully!");
            }
          },
          onError: (error) => {
            if (Platform.OS === "web") {
              alert(`Upload failed: ${error.message}`);
            } else {
              Alert.alert("Error", `Upload failed: ${error.message}`);
            }
          },
        }
      );
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
    const projectsArray = notableProjects
      .split(",")
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    updateMutation.mutate(
      {
        companyName: companyName.trim() || undefined,
        bio: bio.trim() || undefined,
        location: location.trim() || undefined,
        yearsInBusiness: yearsInBusiness ? parseInt(yearsInBusiness, 10) : undefined,
        website: website.trim() || undefined,
        awards: awards.trim() || undefined,
        profilePhotoUrl: profilePhotoUrl || undefined,
        companyLogoUrl: companyLogoUrl || undefined,
        specialties: selectedSpecialties.length > 0 ? selectedSpecialties : undefined,
        notableProjects: projectsArray.length > 0 ? projectsArray : undefined,
      },
      {
        onSuccess: () => {
          if (Platform.OS === "web") {
            alert("Profile updated successfully!");
          } else {
            Alert.alert("Success", "Profile updated successfully!");
          }
          router.back();
        },
        onError: (error) => {
          if (Platform.OS === "web") {
            alert(`Failed to update profile: ${error.message}`);
          } else {
            Alert.alert("Error", `Failed to update profile: ${error.message}`);
          }
        },
      }
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
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">Edit Producer Profile</Text>
            <Text className="text-base text-muted">
              Complete your profile to attract actors
            </Text>
          </View>

          {/* Profile Photo */}
          <View className="gap-2">
            <Text className="text-sm font-medium text-foreground">Profile Photo</Text>
            <View className="items-center gap-3">
              {profilePhotoUrl ? (
                <Image
                  source={{ uri: profilePhotoUrl }}
                  className="w-32 h-32 rounded-full"
                  style={{ backgroundColor: "#E5E7EB" }}
                />
              ) : (
                <View className="w-32 h-32 rounded-full bg-primary/20 items-center justify-center">
                  <Text className="text-4xl">📷</Text>
                </View>
              )}
              <TouchableOpacity
                onPress={handlePickProfilePhoto}
                className="bg-primary px-4 py-2 rounded-full active:opacity-80"
                disabled={uploadPhotoMutation.isPending}
              >
                {uploadPhotoMutation.isPending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text className="text-white font-semibold">
                    {profilePhotoUrl ? "Change Photo" : "Upload Photo"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Company Logo */}
          <View className="gap-2">
            <Text className="text-sm font-medium text-foreground">Company Logo</Text>
            <View className="items-center gap-3">
              {companyLogoUrl ? (
                <Image
                  source={{ uri: companyLogoUrl }}
                  className="w-32 h-32 rounded-lg"
                  style={{ backgroundColor: "#E5E7EB" }}
                />
              ) : (
                <View className="w-32 h-32 rounded-lg bg-surface border-2 border-border items-center justify-center">
                  <Text className="text-4xl">🏢</Text>
                </View>
              )}
              <TouchableOpacity
                onPress={handlePickCompanyLogo}
                className="bg-surface border border-primary px-4 py-2 rounded-full active:opacity-80"
                disabled={uploadPhotoMutation.isPending}
              >
                {uploadPhotoMutation.isPending ? (
                  <ActivityIndicator size="small" color="#1E40AF" />
                ) : (
                  <Text className="text-primary font-semibold">
                    {companyLogoUrl ? "Change Logo" : "Upload Logo"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Company Name */}
          <View className="gap-2">
            <Text className="text-sm font-medium text-foreground">Company Name</Text>
            <TextInput
              value={companyName}
              onChangeText={setCompanyName}
              placeholder="e.g., Skyline Productions"
              className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Bio */}
          <View className="gap-2">
            <Text className="text-sm font-medium text-foreground">Bio</Text>
            <TextInput
              value={bio}
              onChangeText={setBio}
              placeholder="Tell actors about your production company..."
              multiline
              numberOfLines={4}
              className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
              placeholderTextColor="#9CA3AF"
              style={{ minHeight: 100, textAlignVertical: "top" }}
            />
          </View>

          {/* Location */}
          <View className="gap-2">
            <Text className="text-sm font-medium text-foreground">Location</Text>
            <TextInput
              value={location}
              onChangeText={setLocation}
              placeholder="e.g., Los Angeles, CA"
              className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Years in Business */}
          <View className="gap-2">
            <Text className="text-sm font-medium text-foreground">Years in Business</Text>
            <TextInput
              value={yearsInBusiness}
              onChangeText={setYearsInBusiness}
              placeholder="e.g., 10"
              keyboardType="numeric"
              className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Website */}
          <View className="gap-2">
            <Text className="text-sm font-medium text-foreground">Website</Text>
            <TextInput
              value={website}
              onChangeText={setWebsite}
              placeholder="e.g., https://yourcompany.com"
              keyboardType="url"
              autoCapitalize="none"
              className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Specialties */}
          <View className="gap-2">
            <Text className="text-sm font-medium text-foreground">Specialties</Text>
            <View className="flex-row flex-wrap gap-2">
              {SPECIALTY_OPTIONS.map((specialty) => (
                <TouchableOpacity
                  key={specialty}
                  onPress={() => toggleSpecialty(specialty)}
                  className={`px-3 py-2 rounded-full ${
                    selectedSpecialties.includes(specialty)
                      ? "bg-primary"
                      : "bg-surface border border-border"
                  }`}
                  activeOpacity={0.7}
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

          {/* Notable Projects */}
          <View className="gap-2">
            <Text className="text-sm font-medium text-foreground">Notable Projects</Text>
            <TextInput
              value={notableProjects}
              onChangeText={setNotableProjects}
              placeholder="Enter project titles separated by commas"
              multiline
              numberOfLines={3}
              className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
              placeholderTextColor="#9CA3AF"
              style={{ minHeight: 80, textAlignVertical: "top" }}
            />
            <Text className="text-xs text-muted">
              Example: The Last Stand, Summer Dreams, City Lights
            </Text>
          </View>

          {/* Awards */}
          <View className="gap-2">
            <Text className="text-sm font-medium text-foreground">Awards & Recognition</Text>
            <TextInput
              value={awards}
              onChangeText={setAwards}
              placeholder="List any awards or recognition..."
              multiline
              numberOfLines={3}
              className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
              placeholderTextColor="#9CA3AF"
              style={{ minHeight: 80, textAlignVertical: "top" }}
            />
          </View>

          {/* Save Button */}
          <TouchableOpacity
            onPress={handleSave}
            className="bg-primary rounded-xl py-4 items-center active:opacity-80"
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text className="text-white text-lg font-bold">Save Profile</Text>
            )}
          </TouchableOpacity>

          <View className="h-8" />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
