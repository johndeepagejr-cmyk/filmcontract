import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, TouchableOpacity, FlatList, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useAuth } from '@/hooks/use-auth';
import { trpc } from '@/lib/trpc';

/**
 * Availability Calendar Screen - allows actors to set their availability and blocking dates
 */
export default function AvailabilityCalendarScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [availability, setAvailability] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [formData, setFormData] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    availabilityStatus: 'available' as const,
    reason: '',
  });

  // Fetch availability on mount
  useEffect(() => {
    if (!user) return;
    
    const fetchAvailability = async () => {
      try {
        const userAvailability = await trpc.profiles.getAvailability.query({
          userId: user.id,
        });
        setAvailability(userAvailability);
      } catch (error) {
        console.error('Error fetching availability:', error);
      }
    };

    fetchAvailability();
  }, [user]);

  const handleSetAvailability = async () => {
    if (!formData.startDate || !formData.endDate) {
      Alert.alert('Error', 'Please select start and end dates');
      return;
    }

    setLoading(true);
    try {
      await trpc.profiles.setAvailability.mutate(formData);
      
      // Reset form
      setFormData({
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        availabilityStatus: 'available',
        reason: '',
      });
      setShowForm(false);
      
      // Refresh availability list
      const userAvailability = await trpc.profiles.getAvailability.query({
        userId: user!.id,
      });
      setAvailability(userAvailability);
      Alert.alert('Success', 'Availability updated');
    } catch (error) {
      Alert.alert('Error', 'Failed to update availability');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const availabilityStatuses = ['available', 'unavailable', 'tentative'] as const;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-success';
      case 'unavailable':
        return 'bg-error';
      case 'tentative':
        return 'bg-warning';
      default:
        return 'bg-muted';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="p-4">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-foreground mb-2">Availability Calendar</Text>
          <Text className="text-sm text-muted">Set your availability and blocking dates</Text>
        </View>

        {/* Add Availability Button */}
        {!showForm && (
          <TouchableOpacity
            className="bg-primary rounded-lg p-4 items-center mb-6"
            onPress={() => setShowForm(true)}
          >
            <Text className="text-background font-semibold text-lg">+ Add Availability Block</Text>
          </TouchableOpacity>
        )}

        {/* Add Availability Form */}
        {showForm && (
          <View className="bg-surface rounded-lg p-4 mb-6 border border-border">
            <Text className="text-lg font-semibold text-foreground mb-3">Set Availability</Text>
            
            <View className="mb-3">
              <Text className="text-sm text-muted mb-2">Start Date</Text>
              <TouchableOpacity className="bg-background border border-border rounded-lg p-3">
                <Text className="text-foreground">{formData.startDate}</Text>
              </TouchableOpacity>
            </View>

            <View className="mb-3">
              <Text className="text-sm text-muted mb-2">End Date</Text>
              <TouchableOpacity className="bg-background border border-border rounded-lg p-3">
                <Text className="text-foreground">{formData.endDate}</Text>
              </TouchableOpacity>
            </View>

            <View className="mb-3">
              <Text className="text-sm text-muted mb-2">Status</Text>
              <View className="flex-row gap-2">
                {availabilityStatuses.map((status) => (
                  <TouchableOpacity
                    key={status}
                    className={`flex-1 p-2 rounded-lg border ${
                      formData.availabilityStatus === status
                        ? 'bg-primary border-primary'
                        : 'bg-background border-border'
                    }`}
                    onPress={() => setFormData({ ...formData, availabilityStatus: status })}
                  >
                    <Text
                      className={`text-xs font-semibold text-center ${
                        formData.availabilityStatus === status ? 'text-background' : 'text-foreground'
                      }`}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View className="mb-3">
              <Text className="text-sm text-muted mb-2">Reason (optional)</Text>
              <TouchableOpacity className="bg-background border border-border rounded-lg p-3">
                <Text className="text-foreground">{formData.reason || 'On set, Vacation, Audition...'}</Text>
              </TouchableOpacity>
            </View>

            <View className="flex-row gap-2">
              <TouchableOpacity
                className="flex-1 bg-primary rounded-lg p-3 items-center"
                onPress={handleSetAvailability}
                disabled={loading}
              >
                <Text className="text-background font-semibold">
                  {loading ? 'Saving...' : 'Save'}
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

        {/* Availability List */}
        <View>
          <Text className="text-lg font-semibold text-foreground mb-3">Your Availability</Text>
          {availability.length === 0 ? (
            <View className="bg-surface rounded-lg p-4 border border-border">
              <Text className="text-muted text-center">No availability blocks set</Text>
            </View>
          ) : (
            <FlatList
              scrollEnabled={false}
              data={availability}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <View className="bg-surface rounded-lg p-4 mb-3 border border-border">
                  <View className="flex-row items-center gap-3">
                    <View className={`w-3 h-3 rounded-full ${getStatusColor(item.availabilityStatus)}`} />
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-foreground">
                        {formatDate(item.startDate)} - {formatDate(item.endDate)}
                      </Text>
                      <Text className="text-sm text-muted mt-1">
                        {item.availabilityStatus.charAt(0).toUpperCase() + item.availabilityStatus.slice(1)}
                      </Text>
                      {item.reason && (
                        <Text className="text-xs text-muted mt-1">{item.reason}</Text>
                      )}
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
