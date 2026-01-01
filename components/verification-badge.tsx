import { View, Text } from "react-native";
import { useColors } from "@/hooks/use-colors";

interface VerificationBadgeProps {
  isVerified: boolean;
  trustScore?: number;
  size?: "small" | "medium" | "large";
  showScore?: boolean;
}

export function VerificationBadge({ 
  isVerified, 
  trustScore = 0, 
  size = "medium",
  showScore = false 
}: VerificationBadgeProps) {
  const colors = useColors();
  
  if (!isVerified) return null;
  
  const sizeStyles = {
    small: "w-4 h-4",
    medium: "w-6 h-6",
    large: "w-8 h-8",
  };
  
  const textSizes = {
    small: "text-xs",
    medium: "text-sm",
    large: "text-base",
  };
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return colors.success;
    if (score >= 60) return colors.warning;
    return colors.error;
  };
  
  return (
    <View className="flex-row items-center gap-1">
      {/* Checkmark Badge */}
      <View 
        className={`${sizeStyles[size]} rounded-full items-center justify-center`}
        style={{ backgroundColor: colors.primary }}
      >
        <Text className="text-background font-bold" style={{ fontSize: size === "small" ? 10 : size === "medium" ? 12 : 16 }}>
          ✓
        </Text>
      </View>
      
      {/* Trust Score */}
      {showScore && trustScore > 0 && (
        <View className="flex-row items-center">
          <Text 
            className={`${textSizes[size]} font-semibold`}
            style={{ color: getScoreColor(trustScore) }}
          >
            {trustScore}
          </Text>
          <Text className={`${textSizes[size]} text-muted ml-0.5`}>/100</Text>
        </View>
      )}
    </View>
  );
}

interface TrustScoreDisplayProps {
  trustScore: number;
  size?: "small" | "medium" | "large";
}

export function TrustScoreDisplay({ trustScore, size = "medium" }: TrustScoreDisplayProps) {
  const colors = useColors();
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return colors.success;
    if (score >= 60) return colors.warning;
    return colors.error;
  };
  
  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Building";
  };
  
  const barHeights = {
    small: "h-2",
    medium: "h-3",
    large: "h-4",
  };
  
  const textSizes = {
    small: "text-xs",
    medium: "text-sm",
    large: "text-base",
  };
  
  return (
    <View className="w-full">
      <View className="flex-row justify-between items-center mb-2">
        <Text className={`${textSizes[size]} font-semibold text-foreground`}>
          Trust Score
        </Text>
        <View className="flex-row items-center gap-2">
          <Text 
            className={`${size === "large" ? "text-2xl" : size === "medium" ? "text-xl" : "text-lg"} font-bold`}
            style={{ color: getScoreColor(trustScore) }}
          >
            {trustScore}
          </Text>
          <Text className={`${textSizes[size]} text-muted`}>
            {getScoreLabel(trustScore)}
          </Text>
        </View>
      </View>
      
      {/* Progress Bar */}
      <View className={`${barHeights[size]} bg-surface rounded-full overflow-hidden`}>
        <View 
          className={barHeights[size]}
          style={{ 
            width: `${trustScore}%`,
            backgroundColor: getScoreColor(trustScore)
          }}
        />
      </View>
      
      <Text className="text-xs text-muted mt-1">
        Based on contracts completed, ratings, and on-time performance
      </Text>
    </View>
  );
}
