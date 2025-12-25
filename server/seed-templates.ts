import { eq } from "drizzle-orm";
import { contractTemplates } from "@/drizzle/schema";

// Import getDb from db.ts
import { getDb } from "./db";

const defaultTemplates = [
  {
    name: "Feature Film Contract",
    description: "Standard contract for feature film productions",
    category: "feature_film" as const,
    defaultPaymentTerms: "50% upfront, 25% at principal photography completion, 25% upon final delivery",
    defaultDeliverables: "Complete performance for all scheduled shooting days, participation in promotional activities as agreed, attendance at premiere events",
    isSystemTemplate: true,
  },
  {
    name: "Commercial Contract",
    description: "Contract for commercial and advertising work",
    category: "commercial" as const,
    defaultPaymentTerms: "Full payment upon completion of shoot",
    defaultDeliverables: "On-camera performance for commercial shoot, up to 2 takes per scene, availability for one reshoot day if needed",
    isSystemTemplate: true,
  },
  {
    name: "Voice-Over Contract",
    description: "Contract for voice-over and dubbing work",
    category: "voice_over" as const,
    defaultPaymentTerms: "Payment upon delivery of final recordings",
    defaultDeliverables: "Voice recording for specified script, up to 3 revision rounds, delivery in agreed audio format",
    isSystemTemplate: true,
  },
  {
    name: "TV Series Contract",
    description: "Contract for television series work",
    category: "tv_series" as const,
    defaultPaymentTerms: "Per-episode payment, paid within 30 days of episode completion",
    defaultDeliverables: "Performance for all scenes in contracted episodes, availability for reshoots, participation in table reads and rehearsals",
    isSystemTemplate: true,
  },
];

async function seedTemplates() {
  const db = await getDb();
  if (!db) {
    console.error("Database not available");
    return;
  }

  try {
    // Check if templates already exist
    const existing = await db.select().from(contractTemplates).where(eq(contractTemplates.isSystemTemplate, true));
    
    if (existing.length > 0) {
      console.log("System templates already exist, skipping seed");
      return;
    }

    // Insert default templates
    for (const template of defaultTemplates) {
      await db.insert(contractTemplates).values(template);
    }

    console.log(`Successfully seeded ${defaultTemplates.length} contract templates`);
  } catch (error) {
    console.error("Error seeding templates:", error);
  }
}

// Run if called directly
if (require.main === module) {
  seedTemplates().then(() => process.exit(0));
}

export { seedTemplates };
