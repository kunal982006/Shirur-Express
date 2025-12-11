import { db } from "./db";
import { serviceCategories, serviceProblems } from "@shared/schema";
import { eq } from "drizzle-orm";

const plumberProblems = [
    {
        device: "Tap & Mixer",
        issues: [
            "Water leaking from tap",
            "Low water pressure",
            "Tap not closing properly",
            "Mixer handle broken",
            "Water not coming out",
            "Rust colored water",
            "New tap installation",
        ],
    },
    {
        device: "Toilet",
        issues: [
            "Flush not working",
            "Water leaking from tank",
            "Toilet blocked/clogged",
            "Jet spray low pressure",
            "Seat cover broken",
            "Water overflowing",
            "New toilet installation",
        ],
    },
    {
        device: "Water Tank",
        issues: [
            "Tank overflowing",
            "Tank cleaning required",
            "Leakage from tank",
            "Ball valve broken",
            "Tank installation",
            "Pipe connection issue",
        ],
    },
    {
        device: "Basin & Sink",
        issues: [
            "Water draining slowly",
            "Sink clogged",
            "Pipe leaking underneath",
            "Sink installation",
            "Waste pipe replacement",
            "Bad smell from drain",
        ],
    },
    {
        device: "Pipe & Leakage",
        issues: [
            "Visible pipe leakage",
            "Dampness in wall",
            "Concealed pipe leak",
            "Main line blockage",
            "New pipe line installation",
            "Valve replacement",
        ],
    },
    {
        device: "Water Heater (Geyser)",
        issues: [
            "Water leakage from inlet/outlet",
            "Pressure valve issue",
            "Installation/Uninstallation",
            "Connection pipe burst",
        ],
    },
    {
        device: "Water Pump",
        issues: [
            "Motor running but no water",
            "Pump making loud noise",
            "Automatic switch issue",
            "Pump installation",
            "Foot valve replacement",
        ],
    },
];

async function seedPlumberProblems() {
    console.log("🔧 Seeding plumber problems...");

    try {
        // Get plumber category
        const plumberCategory = await db
            .select()
            .from(serviceCategories)
            .where(eq(serviceCategories.slug, "plumber"))
            .limit(1);

        if (plumberCategory.length === 0) {
            console.error(
                "❌ Plumber category not found. Please run the main seed script first.",
            );
            process.exit(1);
        }

        const categoryId = plumberCategory[0].id;

        // Delete existing plumber problems
        await db
            .delete(serviceProblems)
            .where(eq(serviceProblems.categoryId, categoryId));
        console.log("✅ Cleared existing plumber problems");

        // Insert device categories (parent problems)
        for (const problem of plumberProblems) {
            const [parentProblem] = await db
                .insert(serviceProblems)
                .values({
                    categoryId,
                    name: problem.device,
                    parentId: null,
                })
                .returning();

            console.log(`✅ Created device category: ${problem.device}`);

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

        console.log("✨ Plumber problems seeding completed successfully!");
    } catch (error) {
        console.error("❌ Error seeding plumber problems:", error);
        throw error;
    }
}

seedPlumberProblems()
    .then(() => {
        console.log("✅ Seed script completed");
        process.exit(0);
    })
    .catch((error) => {
        console.error("❌ Seed script failed:", error);
        process.exit(1);
    });
