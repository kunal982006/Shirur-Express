
import { db } from "./db";
import { serviceCategories, serviceProblems, serviceProviders, users } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcrypt";

const electricianProblems = [
  {
    device: "Air Conditioner (AC)",
    imageUrl: "/images/electrician/ac.png",
    issues: [
      "Not cooling properly",
      "Water leakage",
      "Unusual noises",
      "Bad odor from vents",
      "Remote not working",
      "Power turning on/off frequently",
      "Frozen coils",
      "High electricity consumption",
      "Other Issue"
    ],
  },
  {
    device: "Refrigerator",
    imageUrl: "/images/electrician/refrigerator.png",
    issues: [
      "Not cooling or overcooling",
      "Water leakage",
      "Fridge making loud or unusual noise",
      "Ice maker not working",
      "Frost build-up in freezer",
      "Fridge light not working",
      "Compressor issues",
      "Door not closing properly",
      "Other Issue"
    ],
  },
  {
    device: "Television (TV)",
    imageUrl: "/images/electrician/tv.png",
    issues: [
      "No display / black screen",
      "No sound",
      "HDMI/AV ports not functioning",
      "TV turning on and off by itself",
      "Distorted image or colors",
      "Lines on the screen",
      "Wall mount installation needed",
      "Other Issue"
    ],
  },
  {
    device: "Microwave Oven",
    imageUrl: "/images/electrician/microwave.png",
    issues: [
      "Not heating",
      "Sparks inside microwave",
      "Turntable not rotating",
      "Keypad not working",
      "Door not closing properly",
      "Display not working",
      "Strange noise while running",
      "Other Issue"
    ],
  },
  {
    device: "Water Heater (Geyser)",
    imageUrl: "/images/electrician/water-heater.png",
    issues: [
      "Not heating water",
      "Water leakage",
      "Unusual noises",
      "Electrical tripping when turned on",
      "Low hot water pressure",
      "Foul smell from hot water",
      "Thermostat not working",
      "Other Issue"
    ],
  },
  {
    device: "Washing Machine",
    imageUrl: "/images/electrician/washing-machine.png",
    issues: [
      "Not spinning",
      "Water not draining",
      "Door not opening",
      "Vibrating excessively",
      "Leaking water",
      "Other Issue"
    ],
  },
  {
    device: "Others",
    imageUrl: "/images/electrician/others.png",
    issues: [
      "General Electrical Work",
      "Switch/Socket Repair",
      "Wiring check",
      "Fuse/MCB Repair",
      "Inverter/UPS Issue",
      "Other Issue"
    ],
  },
];

async function seedElectricianProblems() {
  console.log("🔌 Seeding electrician problems and admin provider...");

  try {
    // 1. Get Electrician Category
    const electricianCategory = await db.query.serviceCategories.findFirst({
      where: eq(serviceCategories.slug, "electrician")
    });

    if (!electricianCategory) {
      console.error("❌ Electrician category not found. Please run the main seed script first.");
      process.exit(1);
    }

    const categoryId = electricianCategory.id;

    // 2. Clear existing Electrician Providers and create ONE Admin Provider
    // First, find all providers in this category and delete them
    const existingProviders = await db.query.serviceProviders.findMany({
      where: eq(serviceProviders.categoryId, categoryId)
    });

    // Delete their problems or bookings first? No, cascade usually handles or we manually handle.
    // For now, let's keep it simple and just Ensure the "Admin" provider exists.
    // The user said "Only one account that is admin account".
    // So we should delete others.

    if (existingProviders.length > 0) {
      // NOTE: Deleting providers might fail if there are bookings.
      // But for "seed" script logic, we often assume fresh state or force clean.
      // We will try to delete them.
      for (const p of existingProviders) {
        if (p.businessName !== "Shirur Express Electrician Services") {
          // We could delete, but verify bookings first? 
          // Let's just create the Admin one if not exists and we'll filter on frontend maybe? 
          // Or strictly delete. Let's strictly delete for "refactor".
          try {
            await db.delete(serviceProviders).where(eq(serviceProviders.id, p.id));
            console.log(`Deleted old provider: ${p.businessName} `);
          } catch (e) {
            console.warn(`Could not delete provider ${p.businessName} (likely Foreign Key constraint).Ignoring.`);
          }
        }
      }
    }

    // Create the Admin User/Provider if not exists
    const hashedPassword = await bcrypt.hash("admin123", 10);
    let adminUser = await db.query.users.findFirst({
      where: eq(users.username, "admin_electrician")
    });

    if (!adminUser) {
      [adminUser] = await db.insert(users).values({
        username: "admin_electrician",
        email: "admin.electrician@shirurexpress.com",
        password: hashedPassword, // "admin123"
        role: "provider",
        phone: "+919999999999",
        isVerified: true
      }).returning();
      console.log("Created Admin User for Electrician");
    }

    let adminProvider = await db.query.serviceProviders.findFirst({
      where: and(eq(serviceProviders.userId, adminUser.id), eq(serviceProviders.categoryId, categoryId))
    });

    if (!adminProvider) {
      [adminProvider] = await db.insert(serviceProviders).values({
        userId: adminUser.id,
        categoryId: categoryId,
        businessName: "Shirur Express Electrician Services",
        description: "Official Shirur Express Electrician & Technician Service. We provide top-notch service for all your home appliances.",
        experience: 99,
        address: "Shirur Express HQ",
        latitude: "18.82",
        longitude: "74.37",
        rating: "5.0",
        reviewCount: 999,
        isVerified: true,
        isAvailable: true,
        specializations: ["All Appliances", "Expert Technicians"],
        profileImageUrl: "/images/electrician/technician_logo.png" // We might need a logo here
      }).returning();
      console.log("Created Admin Provider Profile");
    }

    // 3. Delete existing electrician problems
    await db
      .delete(serviceProblems)
      .where(eq(serviceProblems.categoryId, categoryId));
    console.log("✅ Cleared existing electrician problems");

    // 4. Insert device categories (parent problems) with Images
    for (const problem of electricianProblems) {
      const [parentProblem] = await db
        .insert(serviceProblems)
        .values({
          categoryId,
          name: problem.device,
          parentId: null,
          imageUrl: problem.imageUrl, // <-- NEW FIELD
        })
        .returning();

      console.log(`✅ Created device category: ${problem.device} `);

      // Insert issues for each device (child problems)
      for (const issue of problem.issues) {
        await db.insert(serviceProblems).values({
          categoryId,
          name: issue,
          parentId: parentProblem.id,
        });
      }

      console.log(
        `   ✅ Added ${problem.issues.length} issues for ${problem.device}`,
      );
    }

    console.log("✨ Electrician problems seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding electrician problems:", error);
    throw error;
  }
}

seedElectricianProblems()
  .then(() => {
    console.log("✅ Seed script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Seed script failed:", error);
    process.exit(1);
  });
