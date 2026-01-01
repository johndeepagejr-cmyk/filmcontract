import { View, Text, TouchableOpacity, ScrollView, TextInput, Modal } from "react-native";
import { useState } from "react";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

interface AdvancedFiltersProps {
  filterType: "actor" | "producer";
  onApplyFilters: (filters: any) => void;
  initialFilters?: any;
}

const SPECIALTIES = [
  "Drama", "Comedy", "Action", "Horror", "Thriller", "Romance", 
  "Sci-Fi", "Voice-Over", "Commercial", "Theater", "Feature Films",
  "Indie Films", "Documentaries", "TV Series", "Web Content", "Music Videos"
];

const LOCATIONS = [
  "Los Angeles, CA", "New York, NY", "Atlanta, GA", "Austin, TX",
  "Chicago, IL", "San Francisco, CA", "Seattle, WA", "Nashville, TN"
];

export function AdvancedFilters({ filterType, onApplyFilters, initialFilters }: AdvancedFiltersProps) {
  const colors = useColors();
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>(initialFilters?.specialties || []);
  const [selectedLocations, setSelectedLocations] = useState<string[]>(initialFilters?.locations || []);
  const [minExperience, setMinExperience] = useState<number>(initialFilters?.minExperience || 0);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [presetName, setPresetName] = useState("");
  
  const { data: savedPresets } = trpc.filterPresets.list.useQuery({ filterType });
  const savePreset = trpc.filterPresets.save.useMutation();
  const deletePreset = trpc.filterPresets.delete.useMutation();
  const utils = trpc.useUtils();
  
  const toggleSpecialty = (specialty: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedSpecialties(prev =>
      prev.includes(specialty)
        ? prev.filter(s => s !== specialty)
        : [...prev, specialty]
    );
  };
  
  const toggleLocation = (location: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedLocations(prev =>
      prev.includes(location)
        ? prev.filter(l => l !== location)
        : [...prev, location]
    );
  };
  
  const handleApplyFilters = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onApplyFilters({
      specialties: selectedSpecialties,
      locations: selectedLocations,
      minExperience,
    });
  };
  
  const handleClearFilters = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedSpecialties([]);
    setSelectedLocations([]);
    setMinExperience(0);
    onApplyFilters({});
  };
  
  const handleSavePreset = async () => {
    if (!presetName.trim()) return;
    
    await savePreset.mutateAsync({
      name: presetName,
      filterType,
      filters: JSON.stringify({
        specialties: selectedSpecialties,
        locations: selectedLocations,
        minExperience,
      }),
    });
    
    utils.filterPresets.list.invalidate();
    setShowSaveModal(false);
    setPresetName("");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };
  
  const handleLoadPreset = (preset: any) => {
    const filters = JSON.parse(preset.filters);
    setSelectedSpecialties(filters.specialties || []);
    setSelectedLocations(filters.locations || []);
    setMinExperience(filters.minExperience || 0);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };
  
  const handleDeletePreset = async (id: number) => {
    await deletePreset.mutateAsync({ id });
    utils.filterPresets.list.invalidate();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };
  
  return (
    <ScrollView className="flex-1 p-4">
      {/* Saved Presets */}
      {savedPresets && savedPresets.length > 0 && (
        <View className="mb-6">
          <Text className="text-lg font-semibold text-foreground mb-3">Saved Filters</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {savedPresets.map((preset) => (
              <View key={preset.id} className="mr-2 bg-surface rounded-lg p-3 border border-border">
                <TouchableOpacity onPress={() => handleLoadPreset(preset)}>
                  <Text className="text-sm font-semibold text-foreground mb-1">{preset.name}</Text>
                  <Text className="text-xs text-muted">Tap to load</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="mt-2"
                  onPress={() => handleDeletePreset(preset.id)}
                >
                  <Text className="text-xs text-error">Delete</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
      
      {/* Specialties Filter */}
      <View className="mb-6">
        <Text className="text-lg font-semibold text-foreground mb-3">Specialties</Text>
        <View className="flex-row flex-wrap">
          {SPECIALTIES.map((specialty) => (
            <TouchableOpacity
              key={specialty}
              className={`mr-2 mb-2 px-4 py-2 rounded-full border ${
                selectedSpecialties.includes(specialty)
                  ? "bg-primary border-primary"
                  : "bg-surface border-border"
              }`}
              onPress={() => toggleSpecialty(specialty)}
            >
              <Text
                className={`text-sm ${
                  selectedSpecialties.includes(specialty)
                    ? "text-background font-semibold"
                    : "text-foreground"
                }`}
              >
                {specialty}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      {/* Locations Filter */}
      <View className="mb-6">
        <Text className="text-lg font-semibold text-foreground mb-3">Locations</Text>
        <View className="flex-row flex-wrap">
          {LOCATIONS.map((location) => (
            <TouchableOpacity
              key={location}
              className={`mr-2 mb-2 px-4 py-2 rounded-full border ${
                selectedLocations.includes(location)
                  ? "bg-primary border-primary"
                  : "bg-surface border-border"
              }`}
              onPress={() => toggleLocation(location)}
            >
              <Text
                className={`text-sm ${
                  selectedLocations.includes(location)
                    ? "text-background font-semibold"
                    : "text-foreground"
                }`}
              >
                {location}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      {/* Experience Filter */}
      {filterType === "actor" && (
        <View className="mb-6">
          <Text className="text-lg font-semibold text-foreground mb-3">
            Minimum Experience: {minExperience} years
          </Text>
          <View className="flex-row items-center">
            <TouchableOpacity
              className="bg-surface px-4 py-2 rounded-lg border border-border"
              onPress={() => setMinExperience(Math.max(0, minExperience - 1))}
            >
              <Text className="text-foreground font-semibold">-</Text>
            </TouchableOpacity>
            <Text className="mx-4 text-xl font-semibold text-foreground">{minExperience}</Text>
            <TouchableOpacity
              className="bg-surface px-4 py-2 rounded-lg border border-border"
              onPress={() => setMinExperience(Math.min(20, minExperience + 1))}
            >
              <Text className="text-foreground font-semibold">+</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      {/* Action Buttons */}
      <View className="flex-row gap-2 mb-4">
        <TouchableOpacity
          className="flex-1 bg-primary px-6 py-3 rounded-lg"
          onPress={handleApplyFilters}
        >
          <Text className="text-background font-semibold text-center">Apply Filters</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          className="flex-1 bg-surface px-6 py-3 rounded-lg border border-border"
          onPress={handleClearFilters}
        >
          <Text className="text-foreground font-semibold text-center">Clear All</Text>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity
        className="bg-surface px-6 py-3 rounded-lg border border-border mb-8"
        onPress={() => setShowSaveModal(true)}
      >
        <Text className="text-foreground font-semibold text-center">Save Current Filters</Text>
      </TouchableOpacity>
      
      {/* Save Preset Modal */}
      <Modal visible={showSaveModal} transparent animationType="fade">
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-background p-6 rounded-lg w-80">
            <Text className="text-xl font-semibold text-foreground mb-4">Save Filter Preset</Text>
            
            <TextInput
              className="bg-surface text-foreground p-3 rounded-lg border border-border mb-4"
              placeholder="Preset name..."
              placeholderTextColor={colors.muted}
              value={presetName}
              onChangeText={setPresetName}
            />
            
            <View className="flex-row gap-2">
              <TouchableOpacity
                className="flex-1 bg-primary px-6 py-3 rounded-lg"
                onPress={handleSavePreset}
              >
                <Text className="text-background font-semibold text-center">Save</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                className="flex-1 bg-surface px-6 py-3 rounded-lg border border-border"
                onPress={() => setShowSaveModal(false)}
              >
                <Text className="text-foreground font-semibold text-center">Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
