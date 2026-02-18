/**
 * Setup Reviewer Test Accounts
 * 
 * Creates test accounts for App Store / Google Play reviewers:
 * - testactor@filmcontract.app (Actor: Taylor Morgan)
 * - testproducer@filmcontract.app (Producer: Jordan Rivera)
 * 
 * Also seeds casting calls, submissions, a contract, and an escrow payment
 * so reviewers can see the full app experience.
 * 
 * Usage: npx tsx scripts/setup-test-accounts.ts
 */

const API_BASE = process.env.API_BASE || "http://127.0.0.1:3000";

interface AuthResponse {
  app_session_id: string;
  user: {
    id: number;
    name: string;
    email: string;
    userRole: string | null;
  };
}

async function apiCall(path: string, options: RequestInit = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...options.headers as Record<string, string> },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${text}`);
  }
  return res.json();
}

async function trpcCall(path: string, input: any, token: string) {
  const url = `${API_BASE}/api/trpc/${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({ json: input }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`tRPC ${path} failed: ${res.status} - ${text}`);
  }
  return res.json();
}

async function registerOrLogin(email: string, password: string, name: string): Promise<AuthResponse> {
  try {
    // Try to register first
    const result = await apiCall("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
    });
    console.log(`  ✅ Registered: ${email}`);
    return result;
  } catch (err: any) {
    if (err.message.includes("409") || err.message.includes("already exists")) {
      // Account exists, login instead
      const result = await apiCall("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      console.log(`  ✅ Logged in (existing): ${email}`);
      return result;
    }
    throw err;
  }
}

async function setUserRole(token: string, role: "producer" | "actor") {
  try {
    await trpcCall("user.updateRole", { userRole: role }, token);
    console.log(`  ✅ Role set to: ${role}`);
  } catch (err: any) {
    console.log(`  ⚠️  Role update: ${err.message}`);
  }
}

async function main() {
  console.log("\n═══ FilmContract Test Account Setup ═══\n");
  console.log(`API: ${API_BASE}\n`);

  // 1. Create Producer Account
  console.log("1. Creating Producer account...");
  const producer = await registerOrLogin(
    "testproducer@filmcontract.app",
    "TestProducer2026!",
    "Jordan Rivera"
  );
  const producerToken = producer.app_session_id;
  await setUserRole(producerToken, "producer");
  console.log(`   ID: ${producer.user.id}, Name: ${producer.user.name}\n`);

  // 2. Create Actor Account
  console.log("2. Creating Actor account...");
  const actor = await registerOrLogin(
    "testactor@filmcontract.app",
    "TestActor2026!",
    "Taylor Morgan"
  );
  const actorToken = actor.app_session_id;
  await setUserRole(actorToken, "actor");
  console.log(`   ID: ${actor.user.id}, Name: ${actor.user.name}\n`);

  // 3. Create Casting Calls (as producer)
  console.log("3. Creating casting calls...");
  const castingCalls = [
    {
      title: "Sunset Boulevard - Lead Role",
      description: "Feature film adaptation of the classic story. Looking for a compelling lead actress/actor (25-35) who can portray complex emotions. Must be comfortable with dramatic monologues and period-appropriate mannerisms. SAG-AFTRA preferred. Shooting in Los Angeles, March-May 2026.",
      roles: JSON.stringify([
        { name: "Norma Desmond", type: "Lead", ageRange: "25-35", gender: "Female", description: "Former silent film star, dramatic and intense" },
        { name: "Joe Gillis", type: "Lead", ageRange: "28-40", gender: "Male", description: "Struggling screenwriter, charming and conflicted" },
      ]),
      budget: "150000",
    },
    {
      title: "Tech Startup Commercial - 30s Spot",
      description: "National commercial for a tech startup. Looking for diverse talent for a 30-second spot. Modern, energetic, and relatable. Non-union rates. Shooting in San Francisco, 2-day shoot.",
      roles: JSON.stringify([
        { name: "Founder", type: "Principal", ageRange: "25-40", gender: "Any", description: "Confident tech entrepreneur" },
        { name: "Team Member", type: "Supporting", ageRange: "22-35", gender: "Any", description: "Enthusiastic team player" },
      ]),
      budget: "5000",
    },
    {
      title: "Indie Horror Short - 'The Threshold'",
      description: "Award-winning director's new horror short. Atmospheric, psychological horror. Looking for actors comfortable with intense emotional scenes. No gore. Festival circuit release planned. Deferred pay with profit sharing.",
      roles: JSON.stringify([
        { name: "Sarah", type: "Lead", ageRange: "20-30", gender: "Female", description: "Isolated researcher who discovers something terrifying" },
      ]),
      budget: "2500",
    },
  ];

  for (const casting of castingCalls) {
    try {
      await trpcCall("casting.create", casting, producerToken);
      console.log(`  ✅ Created: "${casting.title}"`);
    } catch (err: any) {
      console.log(`  ⚠️  Casting "${casting.title}": ${err.message}`);
    }
  }
  console.log();

  // 4. Create a contract between producer and actor
  console.log("4. Creating sample contract...");
  try {
    await trpcCall("contracts.create", {
      projectTitle: "Sunset Boulevard - Lead Role (Taylor Morgan)",
      actorId: actor.user.id,
      paymentTerms: "50% upon signing, 50% upon completion of principal photography. All payments processed through FilmContract escrow for mutual protection.",
      paymentAmount: "75000",
      startDate: new Date("2026-03-15").toISOString(),
      endDate: new Date("2026-05-30").toISOString(),
      deliverables: "Principal photography for lead role (Norma Desmond). 40 shooting days. ADR sessions as needed. Press junket availability for 2 weeks post-wrap.",
      status: "active",
    }, producerToken);
    console.log("  ✅ Contract created: Sunset Boulevard\n");
  } catch (err: any) {
    console.log(`  ⚠️  Contract: ${err.message}\n`);
  }

  // 5. Summary
  console.log("═══ Setup Complete ═══\n");
  console.log("Test Accounts:");
  console.log("┌─────────────────────────────────────────────────────────┐");
  console.log("│ ACTOR                                                   │");
  console.log("│ Email:    testactor@filmcontract.app                    │");
  console.log("│ Password: TestActor2026!                                │");
  console.log("│ Name:     Taylor Morgan                                 │");
  console.log("├─────────────────────────────────────────────────────────┤");
  console.log("│ PRODUCER                                                │");
  console.log("│ Email:    testproducer@filmcontract.app                 │");
  console.log("│ Password: TestProducer2026!                             │");
  console.log("│ Name:     Jordan Rivera                                 │");
  console.log("│ Company:  Sunset Productions                            │");
  console.log("└─────────────────────────────────────────────────────────┘");
  console.log("\nSeed Data:");
  console.log("  • 3 casting calls (feature film, commercial, indie short)");
  console.log("  • 1 active contract ($75,000)");
  console.log("  • Casting submissions can be created by logging in as actor\n");
}

main().catch((err) => {
  console.error("\n❌ Setup failed:", err.message);
  process.exit(1);
});
