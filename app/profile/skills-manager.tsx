import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, TextInput, TouchableOpacity, FlatList, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useAuth } from '@/hooks/use-auth';
import { trpc } from '@/lib/trpc';

/**
 * Skills Manager Screen - allows actors to add, edit, and manage their professional skills
 */
export default function SkillsManagerScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [skills, setSkills] = useState<any[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [proficiency, setProficiency] = useState<'beginner' | 'intermediate' | 'advanced' | 'expert'>('intermediate');
  const [loading, setLoading] = useState(false);

  // Fetch skills on mount
  useEffect(() => {
    if (!user) return;
    
    const fetchSkills = async () => {
      try {
        const userSkills = await trpc.profiles.getSkills.query({
          userId: user.id,
        });
        setSkills(userSkills);
      } catch (error) {
        console.error('Error fetching skills:', error);
      }
    };

    fetchSkills();
  }, [user]);

  const handleAddSkill = async () => {
    if (!newSkill.trim()) {
      Alert.alert('Error', 'Please enter a skill');
      return;
    }

    setLoading(true);
    try {
      await trpc.profiles.addSkill.mutate({
        skill: newSkill,
        proficiency,
      });
      setNewSkill('');
      setProficiency('intermediate');
      
      // Refresh skills list
      const userSkills = await trpc.profiles.getSkills.query({
        userId: user!.id,
      });
      setSkills(userSkills);
      Alert.alert('Success', 'Skill added successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to add skill');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const proficiencyLevels = ['beginner', 'intermediate', 'advanced', 'expert'] as const;

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="p-4">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-foreground mb-2">Professional Skills</Text>
          <Text className="text-sm text-muted">Add your acting and technical skills</Text>
        </View>

        {/* Add Skill Form */}
        <View className="bg-surface rounded-lg p-4 mb-6 border border-border">
          <Text className="text-lg font-semibold text-foreground mb-3">Add New Skill</Text>
          
          <TextInput
            className="bg-background border border-border rounded-lg p-3 text-foreground mb-3"
            placeholder="e.g., Sword Fighting, Horseback Riding"
            placeholderTextColor="#999"
            value={newSkill}
            onChangeText={setNewSkill}
          />

          <View className="mb-3">
            <Text className="text-sm text-muted mb-2">Proficiency Level</Text>
            <View className="flex-row gap-2">
              {proficiencyLevels.map((level) => (
                <TouchableOpacity
                  key={level}
                  className={`flex-1 p-2 rounded-lg border ${
                    proficiency === level
                      ? 'bg-primary border-primary'
                      : 'bg-background border-border'
                  }`}
                  onPress={() => setProficiency(level)}
                >
                  <Text
                    className={`text-xs font-semibold text-center ${
                      proficiency === level ? 'text-background' : 'text-foreground'
                    }`}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            className="bg-primary rounded-lg p-3 items-center"
            onPress={handleAddSkill}
            disabled={loading}
          >
            <Text className="text-background font-semibold">
              {loading ? 'Adding...' : 'Add Skill'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Skills List */}
        <View>
          <Text className="text-lg font-semibold text-foreground mb-3">Your Skills</Text>
          {skills.length === 0 ? (
            <View className="bg-surface rounded-lg p-4 border border-border">
              <Text className="text-muted text-center">No skills added yet</Text>
            </View>
          ) : (
            <FlatList
              scrollEnabled={false}
              data={skills}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <View className="bg-surface rounded-lg p-4 mb-3 border border-border">
                  <View className="flex-row justify-between items-center">
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-foreground">{item.skill}</Text>
                      <Text className="text-sm text-muted mt-1">
                        {item.proficiency.charAt(0).toUpperCase() + item.proficiency.slice(1)}
                      </Text>
                    </View>
                    <View className="bg-primary rounded-full w-8 h-8 items-center justify-center">
                      <Text className="text-background font-bold">✓</Text>
                    </View>
                  </View>
                </View>
              )}
            />
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
