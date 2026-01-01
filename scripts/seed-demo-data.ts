import { db } from "../server/db";
import { users, actorProfiles, producerProfiles, contracts, actorReputation, producerReputation, portfolioPhotos, filmography } from "../drizzle/schema";

const SAMPLE_PRODUCERS = [
  { name: "Sarah Mitchell", email: "sarah@silverstudios.com", company: "Silver Screen Studios", specialty: "Feature Films", location: "Los Angeles, CA" },
  { name: "James Rodriguez", email: "james@indiefilms.com", company: "Indie Vision Productions", specialty: "Indie Films", location: "Austin, TX" },
  { name: "Emily Chen", email: "emily@commercialking.com", company: "Commercial Kings", specialty: "Commercials", location: "New York, NY" },
  { name: "Michael Thompson", email: "michael@docuworld.com", company: "Documentary World", specialty: "Documentaries", location: "San Francisco, CA" },
  { name: "Lisa Anderson", email: "lisa@tvnetwork.com", company: "Prime Time Productions", specialty: "TV Series", location: "Los Angeles, CA" },
  { name: "David Park", email: "david@webmedia.com", company: "Digital Media Co", specialty: "Web Content", location: "Seattle, WA" },
  { name: "Rachel Green", email: "rachel@musicvideo.com", company: "Rhythm & Vision", specialty: "Music Videos", location: "Nashville, TN" },
  { name: "Tom Wilson", email: "tom@corporatepro.com", company: "Corporate Media Solutions", specialty: "Corporate Videos", location: "Chicago, IL" },
];

const SAMPLE_ACTORS = [
  { name: "Alex Johnson", email: "alex.actor@gmail.com", specialty: "Drama", experience: 8, bio: "Versatile dramatic actor with theater background" },
  { name: "Maria Garcia", email: "maria.g@acting.com", specialty: "Comedy", experience: 5, bio: "Stand-up comedian turned film actor" },
  { name: "Chris Lee", email: "chris.lee@talent.com", specialty: "Action", experience: 10, bio: "Stunt performer and action specialist" },
  { name: "Jessica Brown", email: "jess.brown@actors.com", specialty: "Horror", experience: 6, bio: "Scream queen with cult following" },
  { name: "Ryan Davis", email: "ryan.d@film.com", specialty: "Thriller", experience: 7, bio: "Method actor specializing in psychological roles" },
  { name: "Sophia Martinez", email: "sophia.m@talent.com", specialty: "Romance", experience: 4, bio: "Romantic lead with classical training" },
  { name: "Daniel Kim", email: "daniel.kim@acting.com", specialty: "Sci-Fi", experience: 9, bio: "Tech-savvy actor perfect for futuristic roles" },
  { name: "Olivia White", email: "olivia.w@voiceover.com", specialty: "Voice-Over", experience: 12, bio: "Award-winning voice actor for animation and commercials" },
  { name: "Marcus Johnson", email: "marcus.j@commercial.com", specialty: "Commercial", experience: 3, bio: "Fresh face perfect for brand campaigns" },
  { name: "Emma Taylor", email: "emma.t@theater.com", specialty: "Theater", experience: 15, bio: "Broadway veteran transitioning to film" },
  { name: "Jake Miller", email: "jake.m@improv.com", specialty: "Improv", experience: 5, bio: "Improv comedian with quick wit" },
  { name: "Ava Wilson", email: "ava.w@musical.com", specialty: "Musical", experience: 8, bio: "Triple threat: singer, dancer, actor" },
];

const CONTRACT_TEMPLATES = [
  { role: "Lead Actor", type: "Feature Film", rate: 50000, days: 45 },
  { role: "Supporting Role", type: "TV Series", rate: 15000, days: 20 },
  { role: "Day Player", type: "Commercial", rate: 2500, days: 1 },
  { role: "Background Actor", type: "Feature Film", rate: 200, days: 3 },
  { role: "Featured Extra", type: "TV Series", rate: 350, days: 5 },
  { role: "Voice Actor", type: "Animation", rate: 5000, days: 2 },
  { role: "Stunt Double", type: "Action Film", rate: 8000, days: 10 },
  { role: "Principal Actor", type: "Commercial", rate: 7500, days: 2 },
];

async function seedDemoData() {
  console.log("🌱 Starting demo data seeding...");

  try {
    // Create producer users and profiles
    console.log("Creating producers...");
    const producerIds: number[] = [];
    
    for (const producer of SAMPLE_PRODUCERS) {
      const [user] = await db.insert(users).values({
        name: producer.name,
        email: producer.email,
        userRole: "producer",
        isVerified: true,
        openId: `demo_producer_${Date.now()}_${Math.random()}`,
      }).returning();
      
      producerIds.push(user.id);

      await db.insert(producerProfiles).values({
        userId: user.id,
        companyName: producer.company,
        bio: `Experienced ${producer.specialty.toLowerCase()} producer based in ${producer.location}`,
        location: producer.location,
        website: `https://${producer.company.toLowerCase().replace(/\s+/g, '')}.com`,
        specialties: [producer.specialty],
      });

      await db.insert(producerReputation).values({
        producerId: user.id,
        totalContracts: Math.floor(Math.random() * 50) + 10,
        completedContracts: Math.floor(Math.random() * 40) + 8,
        avgRating: (Math.random() * 1.5 + 3.5).toFixed(1),
        onTimePaymentRate: Math.floor(Math.random() * 20) + 80,
        wouldWorkAgainRate: Math.floor(Math.random() * 25) + 75,
      });
    }

    // Create actor users and profiles
    console.log("Creating actors...");
    const actorIds: number[] = [];
    
    for (const actor of SAMPLE_ACTORS) {
      const [user] = await db.insert(users).values({
        name: actor.name,
        email: actor.email,
        userRole: "actor",
        isVerified: true,
        openId: `demo_actor_${Date.now()}_${Math.random()}`,
      }).returning();
      
      actorIds.push(user.id);

      await db.insert(actorProfiles).values({
        userId: user.id,
        bio: actor.bio,
        specialties: [actor.specialty],
        yearsOfExperience: actor.experience,
        location: ["Los Angeles, CA", "New York, NY", "Atlanta, GA"][Math.floor(Math.random() * 3)],
        height: `${Math.floor(Math.random() * 12) + 60}"`,
        weight: `${Math.floor(Math.random() * 60) + 120} lbs`,
        eyeColor: ["Brown", "Blue", "Green", "Hazel"][Math.floor(Math.random() * 4)],
        hairColor: ["Black", "Brown", "Blonde", "Red"][Math.floor(Math.random() * 4)],
      });

      await db.insert(actorReputation).values({
        actorId: user.id,
        totalContracts: Math.floor(Math.random() * 40) + 5,
        completedContracts: Math.floor(Math.random() * 35) + 4,
        avgRating: (Math.random() * 1.5 + 3.5).toFixed(1),
        onTimeRate: Math.floor(Math.random() * 20) + 80,
        professionalismScore: (Math.random() * 1.5 + 3.5).toFixed(1),
        wouldHireAgainRate: Math.floor(Math.random() * 25) + 75,
      });

      // Add filmography
      const filmCount = Math.floor(Math.random() * 5) + 2;
      for (let i = 0; i < filmCount; i++) {
        await db.insert(filmography).values({
          actorId: user.id,
          title: ["The Last Stand", "City Lights", "Dark Waters", "Summer Dreams", "Breaking Point", "Silent Echo"][Math.floor(Math.random() * 6)],
          role: ["Lead", "Supporting", "Featured"][Math.floor(Math.random() * 3)],
          year: 2020 + Math.floor(Math.random() * 5),
          type: ["Feature Film", "TV Series", "Commercial", "Short Film"][Math.floor(Math.random() * 4)],
        });
      }
    }

    // Create contracts
    console.log("Creating contracts...");
    const statuses = ["pending", "active", "completed", "cancelled"];
    const contractCount = 30;

    for (let i = 0; i < contractCount; i++) {
      const producerId = producerIds[Math.floor(Math.random() * producerIds.length)];
      const actorId = actorIds[Math.floor(Math.random() * actorIds.length)];
      const template = CONTRACT_TEMPLATES[Math.floor(Math.random() * CONTRACT_TEMPLATES.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 60) - 30);
      
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + template.days);

      await db.insert(contracts).values({
        producerId,
        actorId,
        projectTitle: `${template.type} Project ${i + 1}`,
        role: template.role,
        startDate,
        endDate,
        paymentAmount: template.rate.toString(),
        paymentTerms: "Net 30",
        status,
        terms: `Standard ${template.type} contract for ${template.role} role. Includes ${template.days} days of shooting.`,
        producerSigned: status !== "pending",
        actorSigned: status === "active" || status === "completed",
        producerSignedAt: status !== "pending" ? new Date(startDate.getTime() - 86400000) : null,
        actorSignedAt: (status === "active" || status === "completed") ? new Date(startDate.getTime() - 43200000) : null,
      });
    }

    console.log("✅ Demo data seeding completed!");
    console.log(`Created ${producerIds.length} producers, ${actorIds.length} actors, and ${contractCount} contracts`);
    
  } catch (error) {
    console.error("❌ Error seeding demo data:", error);
    throw error;
  }
}

// Run the seed function
seedDemoData()
  .then(() => {
    console.log("Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
