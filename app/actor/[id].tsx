import { useState } from "react";
import {
  ScrollView,
  Text,
  View,
  ActivityIndicator,
  Pressable,
  Alert,
  Platform,
  StyleSheet,
  Linking,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { Stack, useLocalSearchParams, router } from "expo-router";
import { useColors } from "@/hooks/use-colors";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/hooks/use-auth";

export default function ActorDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const actorUserId = parseInt(id || "0", 10);
  const colors = useColors();
  const { user } = useAuth();
  const [messageSending, setMessageSending] = useState(false);

  const { data: profile, isLoading: profileLoading } =
    trpc.profilesDetail.get.useQuery(
      { userId: actorUserId },
      { enabled: !!actorUserId }
    );

  const startConversation = trpc.messaging.startConversation.useMutation();

  const handleMessage = async () => {
    if (!user) {
      Alert.alert("Sign In Required", "Please sign in to send messages.");
      return;
    }
    if (user.id === actorUserId) {
      Alert.alert("Oops", "You can't message yourself.");
      return;
    }

    setMessageSending(true);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    try {
      const conversation = await startConversation.mutateAsync({
        recipientId: actorUserId,
      });
      router.push(`/messages/${conversation.id}` as any);
    } catch (error) {
      Alert.alert("Error", "Could not start conversation. Please try again.");
    } finally {
      setMessageSending(false);
    }
  };

  const handleCall = () => {
    if (!profile?.phoneNumber) {
      Alert.alert("No Phone Number", "This actor hasn't added a phone number yet.");
      return;
    }
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    // Open the phone dialer
    const phoneUrl = `tel:${profile.phoneNumber}`;
    if (Platform.OS === "web") {
      window.open(phoneUrl, "_blank");
    } else {
      Linking.openURL(phoneUrl).catch(() => {
        Alert.alert("Error", "Unable to open phone dialer.");
      });
    }
  };

  if (profileLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <Stack.Screen options={{ title: "Actor Profile" }} />
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  if (!profile) {
    return (
      <ScreenContainer className="p-6">
        <Stack.Screen options={{ title: "Actor Not Found" }} />
        <Text className="text-lg text-muted text-center">Actor not found</Text>
      </ScreenContainer>
    );
  }

  const initials = (profile.name || "A")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <ScreenContainer>
      <Stack.Screen
        options={{
          title: profile.name || "Actor Profile",
          headerShown: true,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.foreground,
        }}
      />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* Cover Photo / Header */}
        <View
          style={[styles.coverPhoto, { backgroundColor: colors.primary + "20" }]}
        >
          {profile.coverPhotoUrl ? (
            <Image
              source={{ uri: profile.coverPhotoUrl }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
            />
          ) : (
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: colors.primary,
                  opacity: 0.15,
                },
              ]}
            />
          )}
        </View>

        {/* Profile Photo + Name */}
        <View style={styles.profileSection}>
          <View
            style={[
              styles.avatarContainer,
              { borderColor: colors.background },
            ]}
          >
            {profile.profilePhotoUrl ? (
              <Image
                source={{ uri: profile.profilePhotoUrl }}
                style={styles.avatar}
                contentFit="cover"
              />
            ) : (
              <View
                style={[
                  styles.avatar,
                  { backgroundColor: colors.primary + "30" },
                ]}
              >
                <Text
                  style={[styles.avatarText, { color: colors.primary }]}
                >
                  {initials}
                </Text>
              </View>
            )}
          </View>

          <Text style={[styles.name, { color: colors.foreground }]}>
            {profile.name || "Actor"}
          </Text>
          {profile.location && (
            <Text style={[styles.location, { color: colors.muted }]}>
              📍 {profile.location}
            </Text>
          )}
        </View>

        {/* Facebook-style Action Buttons */}
        <View style={styles.actionRow}>
          <Pressable
            onPress={handleMessage}
            disabled={messageSending}
            style={({ pressed }) => [
              styles.primaryButton,
              { backgroundColor: colors.primary },
              pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
              messageSending && { opacity: 0.6 },
            ]}
          >
            <Text style={styles.primaryButtonIcon}>💬</Text>
            <Text style={styles.primaryButtonText}>
              {messageSending ? "Opening..." : "Message"}
            </Text>
          </Pressable>

          <Pressable
            onPress={handleCall}
            style={({ pressed }) => [
              styles.secondaryButton,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
              pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
            ]}
          >
            <Text style={styles.secondaryButtonIcon}>📞</Text>
            <Text
              style={[styles.secondaryButtonText, { color: colors.foreground }]}
            >
              Call
            </Text>
          </Pressable>
        </View>

        {/* Bio Section */}
        {profile.bio && (
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>
              About
            </Text>
            <Text style={[styles.cardBody, { color: colors.muted }]}>
              {profile.bio}
            </Text>
          </View>
        )}

        {/* Details Section */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>
            Details
          </Text>

          {profile.yearsExperience !== undefined && profile.yearsExperience !== null && (
            <DetailRow
              label="Experience"
              value={`${profile.yearsExperience} years`}
              colors={colors}
            />
          )}
          {profile.height && (
            <DetailRow label="Height" value={profile.height} colors={colors} />
          )}
          {profile.weight && (
            <DetailRow label="Weight" value={profile.weight} colors={colors} />
          )}
          {profile.eyeColor && (
            <DetailRow label="Eyes" value={profile.eyeColor} colors={colors} />
          )}
          {profile.hairColor && (
            <DetailRow label="Hair" value={profile.hairColor} colors={colors} />
          )}
          {profile.website && (
            <DetailRow label="Website" value={profile.website} colors={colors} />
          )}
          {profile.imdbUrl && (
            <DetailRow label="IMDb" value={profile.imdbUrl} colors={colors} />
          )}
        </View>

        {/* Specialties */}
        {profile.specialties && profile.specialties.length > 0 && (
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>
              Specialties
            </Text>
            <View style={styles.tagsRow}>
              {profile.specialties.map((specialty: string, index: number) => (
                <View
                  key={index}
                  style={[
                    styles.tag,
                    { backgroundColor: colors.primary + "15" },
                  ]}
                >
                  <Text style={[styles.tagText, { color: colors.primary }]}>
                    {specialty}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Bottom spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

function DetailRow({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: any;
}) {
  return (
    <View style={styles.detailRow}>
      <Text style={[styles.detailLabel, { color: colors.muted }]}>
        {label}
      </Text>
      <Text style={[styles.detailValue, { color: colors.foreground }]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  coverPhoto: {
    height: 160,
    width: "100%",
  },
  profileSection: {
    alignItems: "center",
    marginTop: -50,
    paddingHorizontal: 20,
  },
  avatarContainer: {
    borderWidth: 4,
    borderRadius: 55,
    marginBottom: 12,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 36,
    fontWeight: "700",
  },
  name: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
  },
  location: {
    fontSize: 15,
    marginTop: 4,
  },
  actionRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 10,
    marginTop: 16,
    marginBottom: 20,
  },
  primaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  primaryButtonIcon: {
    fontSize: 18,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  secondaryButtonIcon: {
    fontSize: 18,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },
  cardBody: {
    fontSize: 15,
    lineHeight: 22,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  detailLabel: {
    fontSize: 15,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: "500",
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tagText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
