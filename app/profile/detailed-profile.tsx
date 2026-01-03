import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useAuth } from '@/hooks/use-auth';
import { trpc } from '@/lib/trpc';

/**
 * Detailed Profile Screen - allows actors to edit their comprehensive profile
 * Includes bio, physical attributes, location, and willingness to relocate
 */
export default function DetailedProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    bio: '',
    height: '',
    weight: '',
    eyeColor: '',
    hairColor: '',
    ethnicity: '',
    age: '',
    ageRange: '',
    gender: 'male' as const,
    location: '',
    baseLocation: '',
    willingToRelocate: false,
  });

  // Fetch current profile data
  useEffect(() => {
    if (!user) return;
    
    const fetchProfile = async () => {
      try {
        const profile = await trpc.profiles.getActorProfile.query({
          userId: user.id,
        });
        if (profile) {
          setFormData(profile);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    fetchProfile();
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      await trpc.profiles.updateActorProfile.mutate(formData);
      Alert.alert('Success', 'Profile updated successfully');
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="p-4">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-foreground mb-2">Edit Profile</Text>
          <Text className="text-sm text-muted">Complete your professional profile</Text>
        </View>

        {/* Bio Section */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-foreground mb-2">Professional Bio</Text>
          <TextInput
            className="bg-surface border border-border rounded-lg p-3 text-foreground"
            placeholder="Tell us about yourself..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
            value={formData.bio}
            onChangeText={(text) => setFormData({ ...formData, bio: text })}
          />
        </View>

        {/* Physical Attributes */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-foreground mb-3">Physical Attributes</Text>
          
          <View className="flex-row gap-3 mb-3">
            <View className="flex-1">
              <Text className="text-sm text-muted mb-1">Height</Text>
              <TextInput
                className="bg-surface border border-border rounded-lg p-2 text-foreground"
                placeholder="e.g., 5 feet 10 inches"
                placeholderTextColor="#999"
                value={formData.height}
                onChangeText={(text) => setFormData({ ...formData, height: text })}
              />
            </View>
            <View className="flex-1">
              <Text className="text-sm text-muted mb-1">Weight</Text>
              <TextInput
                className="bg-surface border border-border rounded-lg p-2 text-foreground"
                placeholder="e.g., 180 lbs"
                placeholderTextColor="#999"
                value={formData.weight}
                onChangeText={(text) => setFormData({ ...formData, weight: text })}
              />
            </View>
          </View>

          <View className="flex-row gap-3 mb-3">
            <View className="flex-1">
              <Text className="text-sm text-muted mb-1">Eye Color</Text>
              <TextInput
                className="bg-surface border border-border rounded-lg p-2 text-foreground"
                placeholder="e.g., Brown"
                placeholderTextColor="#999"
                value={formData.eyeColor}
                onChangeText={(text) => setFormData({ ...formData, eyeColor: text })}
              />
            </View>
            <View className="flex-1">
              <Text className="text-sm text-muted mb-1">Hair Color</Text>
              <TextInput
                className="bg-surface border border-border rounded-lg p-2 text-foreground"
                placeholder="e.g., Black"
                placeholderTextColor="#999"
                value={formData.hairColor}
                onChangeText={(text) => setFormData({ ...formData, hairColor: text })}
              />
            </View>
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1">
              <Text className="text-sm text-muted mb-1">Age</Text>
              <TextInput
                className="bg-surface border border-border rounded-lg p-2 text-foreground"
                placeholder="e.g., 28"
                placeholderTextColor="#999"
                keyboardType="numeric"
                value={formData.age}
                onChangeText={(text) => setFormData({ ...formData, age: text })}
              />
            </View>
            <View className="flex-1">
              <Text className="text-sm text-muted mb-1">Age Range</Text>
              <TextInput
                className="bg-surface border border-border rounded-lg p-2 text-foreground"
                placeholder="e.g., 25 to 35"
                placeholderTextColor="#999"
                value={formData.ageRange}
                onChangeText={(text) => setFormData({ ...formData, ageRange: text })}
              />
            </View>
          </View>
        </View>

        {/* Location Section */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-foreground mb-3">Location</Text>
          
          <View className="mb-3">
            <Text className="text-sm text-muted mb-1">Current Location</Text>
            <TextInput
              className="bg-surface border border-border rounded-lg p-2 text-foreground"
              placeholder="e.g., Los Angeles, CA"
              placeholderTextColor="#999"
              value={formData.location}
              onChangeText={(text) => setFormData({ ...formData, location: text })}
            />
          </View>

          <View className="mb-3">
            <Text className="text-sm text-muted mb-1">Base Location</Text>
            <TextInput
              className="bg-surface border border-border rounded-lg p-2 text-foreground"
              placeholder="e.g., New York, NY"
              placeholderTextColor="#999"
              value={formData.baseLocation}
              onChangeText={(text) => setFormData({ ...formData, baseLocation: text })}
            />
          </View>

          {/* Willing to Relocate */}
          <TouchableOpacity
            className={`p-3 rounded-lg border ${
              formData.willingToRelocate
                ? 'bg-primary border-primary'
                : 'bg-surface border-border'
            }`}
            onPress={() => setFormData({ ...formData, willingToRelocate: !formData.willingToRelocate })}
          >
            <Text className={formData.willingToRelocate ? 'text-background font-semibold' : 'text-foreground'}>
              ✓ Willing to Relocate
            </Text>
          </TouchableOpacity>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          className="bg-primary rounded-lg p-4 items-center mb-4"
          onPress={handleSaveProfile}
          disabled={loading}
        >
          <Text className="text-background font-semibold text-lg">
            {loading ? 'Saving...' : 'Save Profile'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}
