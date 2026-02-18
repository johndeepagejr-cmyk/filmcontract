/**
 * CSV Export utility for producer review data
 * Generates downloadable CSV from review notes and ratings.
 * © John dee page jr
 */
import { Platform, Share, Alert } from "react-native";

export interface CSVSubmissionRow {
  submissionId: number;
  actorName: string;
  actorEmail: string;
  status: string;
  actingRating: number;
  lookRating: number;
  voiceRating: number;
  chemistryRating: number;
  weightedAvg: number;
  tags: string[];
  producerNotes: string;
  timestampedNotesCount: number;
  submittedAt: string;
}

/**
 * Generate CSV content from submission review data
 */
export function generateReviewCSV(
  castingTitle: string,
  submissions: CSVSubmissionRow[],
): string {
  const headers = [
    "Submission ID",
    "Actor Name",
    "Actor Email",
    "Status",
    "Acting (35%)",
    "Look (25%)",
    "Voice (20%)",
    "Chemistry (20%)",
    "Weighted Average",
    "Tags",
    "Producer Notes",
    "Timestamped Notes Count",
    "Submitted At",
  ];

  const escapeCSV = (value: string): string => {
    if (value.includes(",") || value.includes('"') || value.includes("\n")) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const rows = submissions.map((s) =>
    [
      s.submissionId.toString(),
      escapeCSV(s.actorName),
      escapeCSV(s.actorEmail),
      s.status,
      s.actingRating.toString(),
      s.lookRating.toString(),
      s.voiceRating.toString(),
      s.chemistryRating.toString(),
      s.weightedAvg.toFixed(2),
      escapeCSV(s.tags.join("; ")),
      escapeCSV(s.producerNotes),
      s.timestampedNotesCount.toString(),
      s.submittedAt,
    ].join(",")
  );

  const metadata = [
    `# Casting Review Export`,
    `# Title: ${castingTitle}`,
    `# Exported: ${new Date().toISOString()}`,
    `# Total Submissions: ${submissions.length}`,
    `# Exported by: John dee page jr`,
    ``,
  ];

  return [...metadata, headers.join(","), ...rows].join("\n");
}

/**
 * Share CSV content via platform share sheet
 */
export async function shareCSV(
  castingTitle: string,
  csvContent: string,
): Promise<void> {
  try {
    if (Platform.OS === "web") {
      // Web: trigger download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${castingTitle.replace(/[^a-zA-Z0-9]/g, "_")}_review_export.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } else {
      // Native: use Share API
      await Share.share({
        message: csvContent,
        title: `${castingTitle} - Review Export`,
      });
    }
  } catch (error) {
    Alert.alert("Export Error", "Failed to export CSV. Please try again.");
  }
}

/**
 * Calculate weighted average from individual ratings
 */
export function calculateWeightedAverage(rating: {
  acting: number;
  look: number;
  voice: number;
  chemistry: number;
}): number {
  const weights = { acting: 0.35, look: 0.25, voice: 0.20, chemistry: 0.20 };
  const rated = Object.entries(rating).filter(([, val]) => val > 0);
  if (rated.length === 0) return 0;
  const totalWeight = rated.reduce((sum, [key]) => sum + weights[key as keyof typeof weights], 0);
  return rated.reduce((sum, [key, val]) => sum + (val * weights[key as keyof typeof weights]) / totalWeight, 0);
}
