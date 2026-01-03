import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, TextInput, TouchableOpacity, FlatList, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useAuth } from '@/hooks/use-auth';
import { trpc } from '@/lib/trpc';

/**
 * Credits Manager Screen - allows actors to add and manage their film/TV credits
 */
export default function CreditsManagerScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [credits, setCredits] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    role: '',
    creditType: 'film' as const,
    year: new Date().getFullYear(),
    director: '',
    description: '',
    imdbUrl: '',
  });

  // Fetch credits on mount
  useEffect(() => {
    if (!user) return;
    
    const fetchCredits = async () => {
      try {
        const userCredits = await trpc.profiles.getCredits.query({
          userId: user.id,
        });
        setCredits(userCredits);
      } catch (error) {
        console.error('Error fetching credits:', error);
      }
    };

    fetchCredits();
  }, [user]);

  const handleAddCredit = async () => {
    if (!formData.title.trim() || !formData.role.trim()) {
      Alert.alert('Error', 'Please fill in title and role');
      return;
    }

    setLoading(true);
    try {
      await trpc.profiles.addCredit.mutate(formData);
      
      // Reset form
      setFormData({
        title: '',
        role: '',
        creditType: 'film',
        year: new Date().getFullYear(),
        director: '',
        description: '',
        imdbUrl: '',
      });
      setShowForm(false);
      
      // Refresh credits list
      const userCredits = await trpc.profiles.getCredits.query({
        userId: user!.id,
      });
      setCredits(userCredits);
      Alert.alert('Success', 'Credit added successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to add credit');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const creditTypes = ['film', 'tv', 'theater', 'commercial', 'web'] as const;

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="p-4">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-foreground mb-2">Acting Credits</Text>
          <Text className="text-sm text-muted">Showcase your film, TV, and theater work</Text>
        </View>

        {/* Add Credit Button */}
        {!showForm && (
          <TouchableOpacity
            className="bg-primary rounded-lg p-4 items-center mb-6"
            onPress={() => setShowForm(true)}
          >
            <Text className="text-background font-semibold text-lg">+ Add Credit</Text>
          </TouchableOpacity>
        )}

        {/* Add Credit Form */}
        {showForm && (
          <View className="bg-surface rounded-lg p-4 mb-6 border border-border">
            <Text className="text-lg font-semibold text-foreground mb-3">Add New Credit</Text>
            
            <TextInput
              className="bg-background border border-border rounded-lg p-3 text-foreground mb-3"
              placeholder="Project Title"
              placeholderTextColor="#999"
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
            />

            <TextInput
              className="bg-background border border-border rounded-lg p-3 text-foreground mb-3"
              placeholder="Character/Role Name"
              placeholderTextColor="#999"
              value={formData.role}
              onChangeText={(text) => setFormData({ ...formData, role: text })}
            />

            <View className="mb-3">
              <Text className="text-sm text-muted mb-2">Credit Type</Text>
              <View className="flex-row gap-2">
                {creditTypes.map((type) => (
                  <TouchableOpacity
                    key={type}
                    className={`flex-1 p-2 rounded-lg border ${
                      formData.creditType === type
                        ? 'bg-primary border-primary'
                        : 'bg-background border-border'
                    }`}
                    onPress={() => setFormData({ ...formData, creditType: type })}
                  >
                    <Text
                      className={`text-xs font-semibold text-center ${
                        formData.creditType === type ? 'text-background' : 'text-foreground'
                      }`}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TextInput
              className="bg-background border border-border rounded-lg p-3 text-foreground mb-3"
              placeholder="Director Name (optional)"
              placeholderTextColor="#999"
              value={formData.director}
              onChangeText={(text) => setFormData({ ...formData, director: text })}
            />

            <TextInput
              className="bg-background border border-border rounded-lg p-3 text-foreground mb-3"
              placeholder="Year (optional)"
              placeholderTextColor="#999"
              keyboardType="numeric"
              value={formData.year.toString()}
              onChangeText={(text) => setFormData({ ...formData, year: parseInt(text) || new Date().getFullYear() })}
            />

            <TextInput
              className="bg-background border border-border rounded-lg p-3 text-foreground mb-3"
              placeholder="Description (optional)"
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
            />

            <View className="flex-row gap-2">
              <TouchableOpacity
                className="flex-1 bg-primary rounded-lg p-3 items-center"
                onPress={handleAddCredit}
                disabled={loading}
              >
                <Text className="text-background font-semibold">
                  {loading ? 'Adding...' : 'Add Credit'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-surface border border-border rounded-lg p-3 items-center"
                onPress={() => setShowForm(false)}
              >
                <Text className="text-foreground font-semibold">Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Credits List */}
        <View>
          <Text className="text-lg font-semibold text-foreground mb-3">Your Credits</Text>
          {credits.length === 0 ? (
            <View className="bg-surface rounded-lg p-4 border border-border">
              <Text className="text-muted text-center">No credits added yet</Text>
            </View>
          ) : (
            <FlatList
              scrollEnabled={false}
              data={credits}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <View className="bg-surface rounded-lg p-4 mb-3 border border-border">
                  <Text className="text-base font-semibold text-foreground">{item.title}</Text>
                  <Text className="text-sm text-primary mt-1">{item.role}</Text>
                  <View className="flex-row justify-between mt-2">
                    <Text className="text-xs text-muted">
                      {item.creditType.charAt(0).toUpperCase() + item.creditType.slice(1)}
                    </Text>
                    {item.year && <Text className="text-xs text-muted">{item.year}</Text>}
                  </View>
                  {item.director && (
                    <Text className="text-xs text-muted mt-1">Director: {item.director}</Text>
                  )}
                </View>
              )}
            />
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
