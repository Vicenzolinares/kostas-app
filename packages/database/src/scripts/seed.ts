import { db } from "../client";
import {
  users,
  projects,
  fabricInventory,
  itemsInventory,
  departments,
  productionStages,
} from "../schema";
// NOTE: seed script intentionally hashes its own admin password inline
// (bcryptjs) rather than depending on @kostas/auth, to avoid a circular
// package dependency (auth depends on database for the users table).
import bcrypt from "bcryptjs";

const DEPARTMENT_SEEDS: (typeof departments.$inferInsert)[] = [
  { key: "cutting", name: "Cutting", sortOrder: 1, capacityPerDay: 12 },
  { key: "sewing", name: "Sewing", sortOrder: 2, capacityPerDay: 8 },
  { key: "upholstery", name: "Upholstery", sortOrder: 3, capacityPerDay: 6 },
  { key: "frame_shop", name: "Frame Shop", sortOrder: 4, capacityPerDay: 5 },
  { key: "quality_check", name: "Quality Check", sortOrder: 5, capacityPerDay: 15 },
  { key: "delivery", name: "Delivery", sortOrder: 6, capacityPerDay: 10 },
];

async function main() {
  console.log("Seeding local database...");

  const passwordHash = await bcrypt.hash("password123", 10);

  const [admin] = await db
    .insert(users)
    .values({
      name: "Kostas Admin",
      email: "admin@kostas.local",
      passwordHash,
      role: "admin",
    })
    .onConflictDoNothing({ target: users.email })
    .returning();
  if (admin) {
    console.log(`Created admin user: ${admin.email} / password123`);
  } else {
    console.log("Admin user already exists, skipping.");
  }

  const [project] = await db
    .insert(projects)
    .values({
      name: "Smith Living Room Sofa",
      clientName: "Jane Smith",
      clientEmail: "jane.smith@example.com",
      status: "in_progress",
      description: "Reupholster 3-seat sofa and two accent chairs.",
    })
    .onConflictDoNothing()
    .returning();
  if (project) {
    console.log(`Created sample project: ${project.name}`);
  }

  const [fabric] = await db
    .insert(fabricInventory)
    .values({
      fabricCode: "FAB-0001",
      name: "Belgian Linen",
      mill: "Holland & Sherry",
      color: "Oatmeal",
      widthInches: "54",
      costPerYard: "42.50",
      yardsInStock: "120",
    })
    .onConflictDoNothing({ target: fabricInventory.fabricCode })
    .returning();
  if (fabric) {
    console.log(`Created sample fabric: ${fabric.name}`);
  }

  await db
    .insert(itemsInventory)
    .values({
      sku: "ITEM-0001",
      name: "Foam Cushion 24x24",
      category: "Cushions",
      quantity: 40,
      binLocation: "A1-01",
      reorderThreshold: 10,
    })
    .onConflictDoNothing({ target: itemsInventory.sku });

  const seededDepartments = await db
    .insert(departments)
    .values(DEPARTMENT_SEEDS)
    .onConflictDoNothing({ target: departments.key })
    .returning();
  if (seededDepartments.length) {
    console.log(`Created ${seededDepartments.length} departments.`);
  }

  if (project) {
    const allDepartments = await db.query.departments.findMany();
    const cutting = allDepartments.find((d) => d.key === "cutting");
    const sewing = allDepartments.find((d) => d.key === "sewing");
    if (cutting && sewing) {
      await db.insert(productionStages).values([
        {
          projectId: project.id,
          departmentId: cutting.id,
          status: "done",
          assignedTo: "Maria G.",
          completedAt: new Date(),
        },
        {
          projectId: project.id,
          departmentId: sewing.id,
          status: "in_progress",
          assignedTo: "Tom R.",
          startedAt: new Date(),
        },
      ]);
      console.log("Created sample production stages.");
    }
  }

  console.log("Seed complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
