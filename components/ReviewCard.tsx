import { View, Text, StyleSheet } from "react-native";
import { Card } from "@/components/ui/design-system";
import { Typography, Spacing, Radius } from "@/constants/design-tokens";
import { useColors } from "@/hooks/use-colors";
import { BadgeRow } from "./VerificationBadge";

interface Review {
  id: number;
  reviewerName: string;
  reviewerRole: "producer" | "actor";
  rating: number;
  comment: string;
  projectTitle: string;
  createdAt: string;
  badges?: ("verified" | "imdb" | "sag" | "pro" | "studio" | "top_rated")[];
}

interface Props {
  review: Review;
}

function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  const colors = useColors();
  const accent = (colors as any).accent || "#C9963B";
  return (
    <View style={{ flexDirection: "row", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Text key={star} style={{ fontSize: size, color: star <= rating ? accent : colors.border }}>
          ★
        </Text>
      ))}
    </View>
  );
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function ReviewCard({ review }: Props) {
  const colors = useColors();
  const accent = (colors as any).accent || "#C9963B";

  return (
    <Card>
      <View style={{ gap: 12 }}>
        {/* Header */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <View style={{ flexDirection: "row", gap: 10, alignItems: "center", flex: 1 }}>
            <View style={[styles.avatar, { backgroundColor: accent + "15" }]}>
              <Text style={{ fontSize: 16, color: accent, fontWeight: "700" }}>
                {review.reviewerName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={[Typography.labelMd, { color: colors.foreground }]} numberOfLines={1}>
                  {review.reviewerName}
                </Text>
                {review.badges && review.badges.length > 0 && (
                  <BadgeRow badges={review.badges} size="sm" />
                )}
              </View>
              <Text style={[Typography.caption, { color: colors.muted }]}>
                {review.reviewerRole === "producer" ? "Producer" : "Actor"}
              </Text>
            </View>
          </View>
          <StarRating rating={review.rating} />
        </View>

        {/* Project */}
        <View style={{
          backgroundColor: colors.surface,
          paddingHorizontal: 10, paddingVertical: 6,
          borderRadius: Radius.sm, alignSelf: "flex-start",
        }}>
          <Text style={[Typography.caption, { color: colors.muted }]}>
            🎬 {review.projectTitle}
          </Text>
        </View>

        {/* Comment */}
        <Text style={[Typography.bodySm, { color: colors.foreground, lineHeight: 20 }]}>
          {review.comment}
        </Text>

        {/* Date */}
        <Text style={[Typography.caption, { color: colors.muted }]}>
          {formatDate(review.createdAt)}
        </Text>
      </View>
    </Card>
  );
}

export function ReviewSummary({ averageRating, totalReviews }: { averageRating: number; totalReviews: number }) {
  const colors = useColors();
  const accent = (colors as any).accent || "#C9963B";

  return (
    <View style={[styles.summary, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[Typography.displayLg, { color: accent }]}>{averageRating.toFixed(1)}</Text>
      <StarRating rating={Math.round(averageRating)} size={18} />
      <Text style={[Typography.caption, { color: colors.muted }]}>{totalReviews} review{totalReviews !== 1 ? "s" : ""}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: "center", justifyContent: "center",
  },
  summary: {
    alignItems: "center", gap: 4,
    padding: 16, borderRadius: 12,
    borderWidth: 1,
  },
});
