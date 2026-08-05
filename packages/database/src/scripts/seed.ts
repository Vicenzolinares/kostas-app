import path from "node:path";
import { fileURLToPath } from "node:url";
import { sql } from "drizzle-orm";
import { db } from "../client";
import {
  users,
  projects,
  clientMeasurements,
  itemsInventory,
  fabricInventory,
  projectFabrics,
  hardwareInventory,
  hardwareScanEvents,
  workOrders,
  workOrderFabrics,
  calendarEvents,
  invoices,
  invoiceLineItems,
  transactions,
  emails,
  emailSyncState,
  photoReferences,
  photoSearches,
  departments,
  productionStages,
  designSubmissions,
  designComments,
  employeeActions,
} from "../schema";
// NOTE: seed script intentionally hashes its own admin password inline
// (bcryptjs) rather than depending on @kostas/auth, to avoid a circular
// package dependency (auth depends on database for the users table).
import bcrypt from "bcryptjs";
import { writeDemoImage } from "./demo-images";

/**
 * Local demo seed.
 *
 * This is deliberately a *connected* dataset, not a handful of rows: a
 * project has measurements, fabrics, work orders, invoices, payments,
 * emails, photos, calendar events and production stages that all point at
 * each other, so every module has something coherent to show during a
 * walkthrough. Empty modules read as "not built" even when they're
 * finished, which is what this exists to prevent.
 *
 * The script is destructive and idempotent: it truncates every demo table
 * first, so `pnpm db:seed` is also the "reset" command and can be run
 * repeatedly without unique-constraint errors.
 *
 * Nothing here contacts a paid service. Photo "AI matches" are precomputed
 * fixtures, invoices carry no Stripe ids, and emails are local rows — see
 * docs/PHASE_1_DEMO_STATUS.md.
 */

// --- helpers -------------------------------------------------------------

const DAY_MS = 86_400_000;
/** Dates are relative to run time so the calendar always has fresh events. */
const at = (days: number, hour = 9): Date => {
  const d = new Date(Date.now() + days * DAY_MS);
  d.setHours(hour, 0, 0, 0);
  return d;
};
/** numeric/decimal columns round-trip as strings in Drizzle. */
const money = (n: number): string => n.toFixed(2);

const currentDir = path.dirname(fileURLToPath(import.meta.url));
// packages/database/src/scripts -> repo root
const REPO_ROOT = path.resolve(currentDir, "..", "..", "..", "..");
// Matches apps/web's StorageProvider root (see apps/web/lib/storage.ts and
// the `apps/web/.local-storage/` entry in .gitignore).
const STORAGE_ROOT = path.join(REPO_ROOT, "apps", "web", ".local-storage");

// Every demo table, ordered arbitrarily — CASCADE handles dependencies.
const DEMO_TABLES = [
  "employee_actions",
  "design_comments",
  "design_submissions",
  "production_stages",
  "departments",
  "photo_searches",
  "photo_references",
  "email_sync_state",
  "emails",
  "transactions",
  "invoice_line_items",
  "invoices",
  "calendar_events",
  "work_order_fabrics",
  "work_orders",
  "hardware_scan_events",
  "hardware_inventory",
  "project_fabrics",
  "fabric_inventory",
  "items_inventory",
  "client_measurements",
  "projects",
  "dashboard_layouts",
  "sessions",
  "users",
];

async function resetTables(): Promise<void> {
  await db.execute(
    sql.raw(
      `TRUNCATE TABLE ${DEMO_TABLES.map((t) => `"${t}"`).join(", ")} RESTART IDENTITY CASCADE`,
    ),
  );
}

async function main() {
  console.log("Resetting demo tables...");
  await resetTables();

  console.log("Seeding local demo data...");

  // --- people ------------------------------------------------------------
  // One shared hash: every demo account uses `password123`, and bcryptjs is
  // slow enough that hashing per-user is a noticeable delay for no benefit.
  const passwordHash = await bcrypt.hash("password123", 10);
  // Kiosk PINs for the shop-floor accounts (mockup deck p17). Same shared
  // value for the same reason as the password above; only the accounts that
  // actually stand at the shop tablet get one, so the office accounts keep
  // a null pin_hash and can't be signed into from the kiosk grid at all.
  const pinHash = await bcrypt.hash("1234", 10);

  const [victoria, kostas, maria, tom, elena, priya, andre, sofia, amber] =
    await db
      .insert(users)
      .values([
        {
          name: "Victoria Alvarez",
          email: "admin@kostas.local",
          passwordHash,
          role: "admin",
        },
        {
          name: "Kostas Georgiou",
          email: "kostas@kostas.local",
          passwordHash,
          role: "manager",
        },
        {
          name: "Maria Gallardo",
          pinHash,
          email: "maria@kostas.local",
          passwordHash,
          role: "shop_floor",
        },
        {
          name: "Tom Rivera",
          pinHash,
          email: "tom@kostas.local",
          passwordHash,
          role: "shop_floor",
        },
        // Internal design lead — office staff, not a portal user. The
        // `designer` role is reserved for external design firms (see below),
        // since that role is what grants access to the Designer Portal and
        // nothing else.
        {
          name: "Elena Duarte",
          email: "elena@kostas.local",
          passwordHash,
          role: "manager",
        },
        {
          name: "Priya Raman",
          email: "priya@kostas.local",
          passwordHash,
          role: "sales",
        },
        {
          name: "Andre Boateng",
          pinHash,
          email: "andre@kostas.local",
          passwordHash,
          role: "shop_floor",
        },
        // External design firms. These accounts only ever see the Designer
        // Portal — never the office app — which is what the mockup's
        // "separate from the employee view" requirement means in practice.
        {
          name: "Sofia Marchetti",
          email: "sofia@studio-marchetti.com",
          passwordHash,
          role: "designer",
        },
        {
          name: "Amber Lewis",
          email: "amber@amberinteriors.example.com",
          passwordHash,
          role: "designer",
        },
      ])
      .returning();

  if (
    !victoria ||
    !kostas ||
    !maria ||
    !tom ||
    !elena ||
    !priya ||
    !andre ||
    !sofia ||
    !amber
  ) {
    throw new Error("Failed to seed users.");
  }
  console.log(
    `  users: 9 (office login: ${victoria.email} · designer login: ${sofia.email} — password123)`,
  );

  // --- projects ----------------------------------------------------------
  const [
    whitmore,
    chen,
    harborview,
    delgado,
    ashford,
    bellweather,
    novak,
    kingsley,
    torres,
    vance,
  ] = await db
    .insert(projects)
    .values([
      {
        name: "Whitmore Estate — Living Room Suite",
        clientName: "Eleanor Whitmore",
        clientEmail: "eleanor.whitmore@example.com",
        clientPhone: "(203) 555-0142",
        status: "completed",
        description:
          "Full reupholstery of a 3-seat sofa, two wingbacks and an ottoman in the west drawing room.",
        dueDate: at(-12),
        budget: money(18400),
      },
      {
        name: "Chen Residence — Sectional Reupholstery",
        clientName: "David Chen",
        clientEmail: "david.chen@example.com",
        clientPhone: "(415) 555-0198",
        status: "in_progress",
        description:
          "6-piece modular sectional, performance bouclé, pet-resistant treatment requested.",
        dueDate: at(18),
        budget: money(12750),
      },
      {
        name: "Harborview Hotel — Lobby Seating (24 chairs)",
        clientName: "Harborview Hospitality Group",
        clientEmail: "procurement@harborviewhotels.example.com",
        clientPhone: "(617) 555-0110",
        status: "in_progress",
        description:
          "Contract job: 24 lobby armchairs re-covered in commercial-grade wool. Staged in 3 batches of 8.",
        dueDate: at(34),
        budget: money(41200),
      },
      {
        name: "Delgado Dining Chairs (8)",
        clientName: "Marisol Delgado",
        clientEmail: "marisol.delgado@example.com",
        clientPhone: "(305) 555-0176",
        status: "quality_check",
        description:
          "Eight Chippendale-style dining chairs, seat pads only, silk damask supplied by client's designer.",
        dueDate: at(6),
        budget: money(5600),
      },
      {
        name: "Ashford Loft — Window Treatments",
        clientName: "Priya Ashford",
        clientEmail: "priya.ashford@example.com",
        clientPhone: "(646) 555-0133",
        status: "approved",
        description:
          "Nine floor-to-ceiling windows: lined drapery panels plus roman shades in the study.",
        dueDate: at(45),
        budget: money(9800),
      },
      {
        name: "Bellweather Clinic — Waiting Room",
        clientName: "Bellweather Medical",
        clientEmail: "facilities@bellweather.example.com",
        clientPhone: "(781) 555-0164",
        status: "quoted",
        description:
          "14 waiting-room chairs in antimicrobial vinyl. Quote issued, awaiting board approval.",
        dueDate: at(60),
        budget: money(15300),
      },
      {
        name: "Novak Antique Settee Restoration",
        clientName: "Josef Novak",
        clientEmail: "josef.novak@example.com",
        clientPhone: "(312) 555-0187",
        status: "in_progress",
        description:
          "1890s walnut settee. Eight-way hand-tied springs, horsehair pad rebuild, original frame retained.",
        dueDate: at(27),
        budget: money(7450),
      },
      {
        name: "Kingsley Residence — Master Bedroom Headboard",
        clientName: "Amara Kingsley",
        clientEmail: "amara.kingsley@example.com",
        clientPhone: "(404) 555-0155",
        status: "ready_for_delivery",
        description:
          "Custom channel-tufted king headboard, wall-mounted with French cleat.",
        dueDate: at(3),
        budget: money(3900),
      },
      {
        name: "Torres Outdoor Cushion Set",
        clientName: "Ricardo Torres",
        clientEmail: "ricardo.torres@example.com",
        clientPhone: "(602) 555-0129",
        status: "lead",
        description:
          "Inbound enquiry: 10 outdoor cushions in solution-dyed acrylic. Site visit not yet scheduled.",
        dueDate: at(75),
        budget: money(2400),
      },
      {
        name: "Vance Library — Leather Wingbacks (4)",
        clientName: "Gregory Vance",
        clientEmail: "gregory.vance@example.com",
        clientPhone: "(206) 555-0171",
        status: "cancelled",
        description:
          "Cancelled by client after leather quote came in above budget. Retained for pipeline reporting.",
        dueDate: at(-30),
        budget: money(11000),
      },
    ])
    .returning();

  const allProjects = [
    whitmore,
    chen,
    harborview,
    delgado,
    ashford,
    bellweather,
    novak,
    kingsley,
    torres,
    vance,
  ];
  if (allProjects.some((p) => !p)) throw new Error("Failed to seed projects.");
  console.log(`  projects: ${allProjects.length}`);

  // --- fabrics -----------------------------------------------------------
  // `hex` isn't a schema column — it drives the generated swatch PNG below
  // and is not persisted; `color` holds the human-readable name.
  const fabricSeeds = [
    {
      fabricCode: "FAB-1001",
      name: "Belgian Linen",
      mill: "Holland & Sherry",
      color: "Oatmeal",
      pattern: "Plain weave",
      composition: "100% Linen",
      widthInches: "54",
      costPerYard: "42.50",
      yardsInStock: "128",
      yardsReserved: "24",
      warehouseLocation: "A1-01",
      hex: "#D9CDB8",
    },
    {
      fabricCode: "FAB-1002",
      name: "Velvet Mohair",
      mill: "Pierre Frey",
      color: "Emerald",
      pattern: "Solid pile",
      composition: "68% Mohair, 32% Cotton",
      widthInches: "55",
      costPerYard: "138.00",
      yardsInStock: "41",
      yardsReserved: "12",
      warehouseLocation: "A1-04",
      hex: "#1F6F5C",
    },
    {
      fabricCode: "FAB-1003",
      name: "Herringbone Wool",
      mill: "Romo",
      color: "Slate",
      pattern: "Herringbone",
      composition: "90% Wool, 10% Nylon",
      widthInches: "56",
      costPerYard: "76.00",
      yardsInStock: "212",
      yardsReserved: "96",
      warehouseLocation: "A2-02",
      hex: "#5A6470",
    },
    {
      fabricCode: "FAB-1004",
      name: "Performance Bouclé",
      mill: "Kravet",
      color: "Ivory",
      pattern: "Bouclé",
      composition: "100% Polyester",
      widthInches: "54",
      costPerYard: "58.25",
      yardsInStock: "86",
      yardsReserved: "38",
      warehouseLocation: "A2-05",
      hex: "#EDE6DA",
    },
    {
      fabricCode: "FAB-1005",
      name: "Italian Leather Hide",
      mill: "Moore & Giles",
      color: "Cognac",
      pattern: "Full grain",
      composition: "100% Leather",
      widthInches: "0",
      costPerYard: "310.00",
      yardsInStock: "6",
      yardsReserved: "0",
      warehouseLocation: "B1-01",
      hex: "#8B4A2B",
    },
    {
      fabricCode: "FAB-1006",
      name: "Solution-Dyed Acrylic",
      mill: "Sunbrella",
      color: "Marine Blue",
      pattern: "Plain",
      composition: "100% Acrylic",
      widthInches: "54",
      costPerYard: "38.00",
      yardsInStock: "164",
      yardsReserved: "0",
      warehouseLocation: "B1-03",
      hex: "#26456E",
    },
    {
      fabricCode: "FAB-1007",
      name: "Silk Damask",
      mill: "Scalamandré",
      color: "Champagne",
      pattern: "Damask",
      composition: "62% Silk, 38% Viscose",
      widthInches: "50",
      costPerYard: "245.00",
      yardsInStock: "9",
      yardsReserved: "8",
      warehouseLocation: "B2-01",
      hex: "#E3D2A5",
    },
    {
      fabricCode: "FAB-1008",
      name: "Cotton Canvas",
      mill: "Perennials",
      color: "Chalk",
      pattern: "Canvas",
      composition: "100% Cotton",
      widthInches: "54",
      costPerYard: "31.75",
      yardsInStock: "240",
      yardsReserved: "16",
      warehouseLocation: "B2-04",
      hex: "#F2F0EA",
    },
    {
      fabricCode: "FAB-1009",
      name: "Chenille Weave",
      mill: "Schumacher",
      color: "Terracotta",
      pattern: "Chenille",
      composition: "54% Viscose, 46% Cotton",
      widthInches: "55",
      costPerYard: "92.00",
      yardsInStock: "58",
      yardsReserved: "20",
      warehouseLocation: "C1-02",
      hex: "#B4562F",
    },
    {
      fabricCode: "FAB-1010",
      name: "Linen Blend Stripe",
      mill: "Thibaut",
      color: "Indigo",
      pattern: "Awning stripe",
      composition: "70% Linen, 30% Cotton",
      widthInches: "54",
      costPerYard: "64.50",
      yardsInStock: "73",
      yardsReserved: "9",
      warehouseLocation: "C1-05",
      hex: "#2E3A64",
    },
  ];

  const insertedFabrics = await db
    .insert(fabricInventory)
    .values(fabricSeeds.map(({ hex: _hex, ...row }) => row))
    .returning();
  const fabricByCode = new Map(insertedFabrics.map((f) => [f.fabricCode, f]));
  console.log(`  fabrics: ${insertedFabrics.length}`);

  // --- items -------------------------------------------------------------
  const itemSeeds = [
    {
      sku: "ITEM-0001",
      name: 'Foam Cushion Core 24"x24"',
      category: "Cushions",
      quantity: 48,
      unit: "ea",
      binLocation: "A1-01",
      reorderThreshold: 12,
      sortOrder: 1,
    },
    {
      sku: "ITEM-0002",
      name: "High-Resilience Foam Sheet 2in",
      category: "Foam",
      quantity: 22,
      unit: "sheet",
      binLocation: "A1-02",
      reorderThreshold: 8,
      sortOrder: 2,
    },
    {
      sku: "ITEM-0003",
      name: "Dacron Wrap Batting",
      category: "Batting",
      quantity: 6,
      unit: "roll",
      binLocation: "A1-03",
      reorderThreshold: 10,
      sortOrder: 3,
    },
    {
      sku: "ITEM-0004",
      name: "Jute Webbing 3.5in",
      category: "Webbing",
      quantity: 31,
      unit: "roll",
      binLocation: "A2-01",
      reorderThreshold: 10,
      sortOrder: 4,
    },
    {
      sku: "ITEM-0005",
      name: "Down/Feather Blend Insert 20in",
      category: "Cushions",
      quantity: 17,
      unit: "ea",
      binLocation: "A2-02",
      reorderThreshold: 6,
      sortOrder: 5,
    },
    {
      sku: "ITEM-0006",
      name: "Cambric Dust Cover",
      category: "Linings",
      quantity: 4,
      unit: "roll",
      binLocation: "A2-03",
      reorderThreshold: 8,
      sortOrder: 6,
    },
    {
      sku: "ITEM-0007",
      name: "Horsehair Pad (restoration)",
      category: "Restoration",
      quantity: 3,
      unit: "bale",
      binLocation: "B1-01",
      reorderThreshold: 2,
      sortOrder: 7,
    },
    {
      sku: "ITEM-0008",
      name: "Edge Roll 1in",
      category: "Trims",
      quantity: 26,
      unit: "roll",
      binLocation: "B1-02",
      reorderThreshold: 8,
      sortOrder: 8,
    },
    {
      sku: "ITEM-0009",
      name: "Welt Cord 5/32in",
      category: "Trims",
      quantity: 55,
      unit: "roll",
      binLocation: "B1-03",
      reorderThreshold: 15,
      sortOrder: 9,
    },
    {
      sku: "ITEM-0010",
      name: "Burlap 10oz",
      category: "Linings",
      quantity: 19,
      unit: "roll",
      binLocation: "B2-01",
      reorderThreshold: 6,
      sortOrder: 10,
    },
    {
      sku: "ITEM-0011",
      name: "Sinuous Spring 9ga",
      category: "Springs",
      quantity: 9,
      unit: "box",
      binLocation: "B2-02",
      reorderThreshold: 12,
      sortOrder: 11,
    },
    {
      sku: "ITEM-0012",
      name: "Memory Foam Topper 1in",
      category: "Foam",
      quantity: 14,
      unit: "sheet",
      binLocation: "B2-03",
      reorderThreshold: 5,
      sortOrder: 12,
    },
  ];
  const insertedItems = await db
    .insert(itemsInventory)
    .values(itemSeeds)
    .returning();
  const itemBySku = new Map(insertedItems.map((i) => [i.sku, i]));
  const lowStockItems = insertedItems.filter(
    (i) => i.quantity <= i.reorderThreshold,
  ).length;
  console.log(
    `  items: ${insertedItems.length} (${lowStockItems} at/below reorder threshold)`,
  );

  // --- hardware ----------------------------------------------------------
  const insertedHardware = await db
    .insert(hardwareInventory)
    .values([
      {
        sku: "HW-2001",
        barcode: "0712345000019",
        name: 'Tapered Walnut Leg 6"',
        category: "Legs",
        quantity: 64,
        unit: "ea",
        binLocation: "C1-01",
        reorderThreshold: 20,
        supplier: "Osborne Wood",
        costPerUnit: "11.40",
      },
      {
        sku: "HW-2002",
        barcode: "0712345000026",
        name: "Antique Brass Nailhead Trim",
        category: "Trim",
        quantity: 8,
        unit: "roll",
        binLocation: "C1-02",
        reorderThreshold: 15,
        supplier: "DecoNail Supply",
        costPerUnit: "23.75",
      },
      {
        sku: "HW-2003",
        barcode: "0712345000033",
        name: "Upholstery Staples 22ga (5000ct)",
        category: "Fasteners",
        quantity: 41,
        unit: "box",
        binLocation: "C1-03",
        reorderThreshold: 10,
        supplier: "Duo-Fast",
        costPerUnit: "9.10",
      },
      {
        sku: "HW-2004",
        barcode: "0712345000040",
        name: "Eight-Way Tie Spring 8in",
        category: "Springs",
        quantity: 12,
        unit: "ea",
        binLocation: "C2-01",
        reorderThreshold: 24,
        supplier: "Hartco",
        costPerUnit: "4.85",
      },
      {
        sku: "HW-2005",
        barcode: "0712345000057",
        name: "Invisible Zipper 22in",
        category: "Closures",
        quantity: 130,
        unit: "ea",
        binLocation: "C2-02",
        reorderThreshold: 40,
        supplier: "YKK",
        costPerUnit: "1.35",
      },
      {
        sku: "HW-2006",
        barcode: "0712345000064",
        name: "Furniture Glide, Felt 1in",
        category: "Glides",
        quantity: 210,
        unit: "ea",
        binLocation: "C2-03",
        reorderThreshold: 50,
        supplier: "Shepherd",
        costPerUnit: "0.42",
      },
      {
        sku: "HW-2007",
        barcode: "0712345000071",
        name: "French Cleat, Steel 18in",
        category: "Mounting",
        quantity: 5,
        unit: "ea",
        binLocation: "C3-01",
        reorderThreshold: 8,
        supplier: "Hangman",
        costPerUnit: "14.20",
      },
      {
        sku: "HW-2008",
        barcode: "0712345000088",
        name: "Tufting Button Blank 36L",
        category: "Trim",
        quantity: 340,
        unit: "ea",
        binLocation: "C3-02",
        reorderThreshold: 100,
        supplier: "Handy Button",
        costPerUnit: "0.28",
      },
      {
        sku: "HW-2009",
        barcode: "0712345000095",
        name: "Swivel Base Plate 25in",
        category: "Mounting",
        quantity: 3,
        unit: "ea",
        binLocation: "C3-03",
        reorderThreshold: 6,
        supplier: "Imperial",
        costPerUnit: "38.90",
      },
      {
        sku: "HW-2010",
        barcode: "0712345000101",
        name: "Chair Frame Corner Block",
        category: "Frame",
        quantity: 88,
        unit: "ea",
        binLocation: "C3-04",
        reorderThreshold: 25,
        supplier: "Osborne Wood",
        costPerUnit: "2.15",
      },
    ])
    .returning();
  const hardwareBySku = new Map(insertedHardware.map((h) => [h.sku, h]));
  const lowStockHardware = insertedHardware.filter(
    (h) => h.quantity <= h.reorderThreshold,
  ).length;
  console.log(
    `  hardware: ${insertedHardware.length} (${lowStockHardware} at/below reorder threshold)`,
  );

  // Scan history so the hardware audit log isn't empty.
  await db.insert(hardwareScanEvents).values([
    {
      hardwareId: hardwareBySku.get("HW-2003")!.id,
      type: "scan_out",
      quantityDelta: -4,
      scannedCode: "0712345000033",
      note: "Pulled for Harborview batch 2",
      createdAt: at(-4, 8),
    },
    {
      hardwareId: hardwareBySku.get("HW-2001")!.id,
      type: "scan_out",
      quantityDelta: -8,
      scannedCode: "0712345000019",
      note: "Chen sectional legs",
      createdAt: at(-3, 10),
    },
    {
      hardwareId: hardwareBySku.get("HW-2004")!.id,
      type: "scan_out",
      quantityDelta: -12,
      scannedCode: "0712345000040",
      note: "Novak settee spring rebuild",
      createdAt: at(-3, 14),
    },
    {
      hardwareId: hardwareBySku.get("HW-2005")!.id,
      type: "scan_in",
      quantityDelta: 100,
      scannedCode: "0712345000057",
      note: "YKK restock delivery",
      createdAt: at(-2, 9),
    },
    {
      hardwareId: hardwareBySku.get("HW-2002")!.id,
      type: "scan_out",
      quantityDelta: -2,
      scannedCode: "0712345000026",
      note: "Whitmore wingback trim",
      createdAt: at(-2, 15),
    },
    {
      hardwareId: hardwareBySku.get("HW-2009")!.id,
      type: "adjustment",
      quantityDelta: -1,
      scannedCode: null,
      note: "Damaged in transit — written off",
      createdAt: at(-1, 11),
    },
    {
      hardwareId: hardwareBySku.get("HW-2008")!.id,
      type: "scan_out",
      quantityDelta: -36,
      scannedCode: "0712345000088",
      note: "Kingsley headboard tufting",
      createdAt: at(-1, 13),
    },
  ]);

  // --- project fabrics ---------------------------------------------------
  await db.insert(projectFabrics).values([
    {
      projectId: whitmore!.id,
      fabricId: fabricByCode.get("FAB-1001")!.id,
      yardsRequired: "38.50",
      status: "installed",
      notes: "Sofa and ottoman. Railroaded.",
    },
    {
      projectId: whitmore!.id,
      fabricId: fabricByCode.get("FAB-1002")!.id,
      yardsRequired: "14.00",
      status: "installed",
      notes: "Two wingbacks, pile running down.",
    },
    {
      projectId: chen!.id,
      fabricId: fabricByCode.get("FAB-1004")!.id,
      yardsRequired: "46.00",
      status: "cut",
      notes: "Pet-resistant finish applied by mill.",
    },
    {
      projectId: harborview!.id,
      fabricId: fabricByCode.get("FAB-1003")!.id,
      yardsRequired: "96.00",
      status: "received",
      notes: "Contract grade, 100k double rubs. Batch 1 of 3 cut.",
    },
    {
      projectId: delgado!.id,
      fabricId: fabricByCode.get("FAB-1007")!.id,
      yardsRequired: "8.00",
      status: "installed",
      notes: "Client-supplied (COM). Handle with care — silk.",
    },
    {
      projectId: ashford!.id,
      fabricId: fabricByCode.get("FAB-1010")!.id,
      yardsRequired: "62.00",
      status: "ordered",
      notes: "Drapery panels, 9 windows. Lining ordered separately.",
    },
    {
      projectId: novak!.id,
      fabricId: fabricByCode.get("FAB-1009")!.id,
      yardsRequired: "12.50",
      status: "cut",
      notes: "Period-appropriate chenille per conservator's note.",
    },
    {
      projectId: kingsley!.id,
      fabricId: fabricByCode.get("FAB-1002")!.id,
      yardsRequired: "9.00",
      status: "installed",
      notes: "Channel tufting, 14 channels.",
    },
    {
      projectId: torres!.id,
      fabricId: fabricByCode.get("FAB-1006")!.id,
      yardsRequired: "16.00",
      status: "draft",
      notes: "Quote stage — yardage estimated from photos.",
    },
    {
      projectId: bellweather!.id,
      fabricId: fabricByCode.get("FAB-1008")!.id,
      yardsRequired: "34.00",
      status: "draft",
      notes: "Pending board approval.",
    },
  ]);

  // --- departments & production stages -----------------------------------
  const insertedDepartments = await db
    .insert(departments)
    .values([
      {
        key: "seamstress",
        name: "Seamstress Room",
        sortOrder: 1,
        capacityPerDay: 10,
      },
      {
        key: "upholstery",
        name: "Upholstery Room",
        sortOrder: 2,
        capacityPerDay: 6,
      },
      {
        key: "carpentry",
        name: "Carpentry Room",
        sortOrder: 3,
        capacityPerDay: 5,
      },
      {
        key: "paint",
        name: "Paint Department",
        sortOrder: 4,
        capacityPerDay: 8,
      },
      { key: "warehouse", name: "Warehouse", sortOrder: 5, capacityPerDay: 12 },
      {
        key: "office",
        name: "In The Office",
        sortOrder: 6,
        capacityPerDay: 15,
      },
    ])
    .returning();
  const dept = new Map(insertedDepartments.map((d) => [d.key, d]));

  // Every department TV needs all three of its columns populated —
  // "Working Now" (in_progress), "Up Next" (queued) and "Needs Attention"
  // (blocked) — so each of the six screens is worth looking at, not just
  // the busiest one. Task labels carry both languages: they're shop-floor
  // content the office writes per job, not static UI strings.
  const task = (id: string, en: string, es: string, done = false) => ({
    id,
    en,
    es,
    done,
  });

  const stageRows: (typeof productionStages.$inferInsert)[] = [
    // --- Seamstress Room -------------------------------------------------
    {
      projectId: chen!.id,
      departmentId: dept.get("seamstress")!.id,
      status: "in_progress",
      assignedTo: "Tom Rivera",
      startedAt: at(-2, 8),
      dueDate: at(2),
      isRush: true,
      notes: "Boxing and welt on seat cushions.",
      tasks: [
        task("s1", "Cut Fabric", "Cortar Tela", true),
        task("s2", "Sew Seat Cushions", "Coser Cojines de Asiento", true),
        task("s3", "Sew Back Cushions", "Coser Cojines de Respaldo"),
        task("s4", "Install Zippers", "Colocar Cierres"),
      ],
    },
    {
      projectId: delgado!.id,
      departmentId: dept.get("seamstress")!.id,
      status: "in_progress",
      assignedTo: "Maria Gallardo",
      startedAt: at(-1, 9),
      dueDate: at(1),
      tasks: [
        task("s5", "Cut Silk Damask", "Cortar Damasco de Seda", true),
        task("s6", "Centre Pattern on Pads", "Centrar Patrón en Cojines", true),
        task("s7", "Final Stitch", "Costura Final"),
      ],
    },
    {
      projectId: harborview!.id,
      departmentId: dept.get("seamstress")!.id,
      status: "queued",
      assignedTo: "Tom Rivera",
      dueDate: at(5),
    },
    {
      projectId: ashford!.id,
      departmentId: dept.get("seamstress")!.id,
      status: "queued",
      assignedTo: "Maria Gallardo",
      dueDate: at(8),
    },
    {
      projectId: bellweather!.id,
      departmentId: dept.get("seamstress")!.id,
      status: "blocked",
      assignedTo: "Tom Rivera",
      blockedReason: "office_approval",
      notes: "Quote not approved by the clinic board yet.",
    },
    {
      projectId: whitmore!.id,
      departmentId: dept.get("seamstress")!.id,
      status: "done",
      assignedTo: "Tom Rivera",
      startedAt: at(-18, 8),
      completedAt: at(-16, 12),
    },

    // --- Upholstery Room --------------------------------------------------
    {
      projectId: novak!.id,
      departmentId: dept.get("upholstery")!.id,
      status: "in_progress",
      assignedTo: "Andre Boateng",
      startedAt: at(-1, 9),
      dueDate: at(3),
      notes: "Eight-way hand tie in progress — slow by design.",
      tasks: [
        task("u1", "Strip Old Fabric", "Quitar Tela Vieja", true),
        task("u2", "Replace Foam", "Reemplazar Espuma", true),
        task("u3", "Upholster Arms", "Tapizar Brazos"),
        task("u4", "Upholster Back", "Tapizar Respaldo"),
        task("u5", "Final Inspection", "Inspección Final"),
      ],
    },
    {
      projectId: chen!.id,
      departmentId: dept.get("upholstery")!.id,
      status: "in_progress",
      assignedTo: "Maria Gallardo",
      startedAt: at(0, 8),
      dueDate: at(4),
      tasks: [
        task("u6", "Attach Cushion Foam", "Colocar Espuma", true),
        task("u7", "Upholster Seat Deck", "Tapizar Asiento"),
        task("u8", "Detailing", "Detalles"),
      ],
    },
    {
      projectId: harborview!.id,
      departmentId: dept.get("upholstery")!.id,
      status: "queued",
      assignedTo: "Andre Boateng",
      dueDate: at(6),
    },
    {
      projectId: torres!.id,
      departmentId: dept.get("upholstery")!.id,
      status: "queued",
      assignedTo: "Maria Gallardo",
      dueDate: at(9),
    },
    {
      projectId: delgado!.id,
      departmentId: dept.get("upholstery")!.id,
      status: "blocked",
      assignedTo: "Andre Boateng",
      blockedReason: "fabric",
      notes: "Client-supplied silk short by 2 yards.",
    },
    {
      projectId: kingsley!.id,
      departmentId: dept.get("upholstery")!.id,
      status: "done",
      assignedTo: "Maria Gallardo",
      startedAt: at(-5, 8),
      completedAt: at(-3, 14),
    },

    // --- Carpentry Room ---------------------------------------------------
    {
      projectId: novak!.id,
      departmentId: dept.get("carpentry")!.id,
      status: "in_progress",
      assignedTo: "Andre Boateng",
      startedAt: at(-2, 8),
      dueDate: at(2),
      tasks: [
        task("c1", "Repair Frame", "Reparar Estructura", true),
        task("c2", "Reinforce Joints", "Reforzar Uniones", true),
        task("c3", "Replace Legs", "Reemplazar Patas"),
      ],
    },
    {
      projectId: kingsley!.id,
      departmentId: dept.get("carpentry")!.id,
      status: "queued",
      assignedTo: "Andre Boateng",
      dueDate: at(4),
    },
    {
      projectId: torres!.id,
      departmentId: dept.get("carpentry")!.id,
      status: "queued",
      assignedTo: "Andre Boateng",
      dueDate: at(7),
    },
    {
      projectId: harborview!.id,
      departmentId: dept.get("carpentry")!.id,
      status: "blocked",
      assignedTo: "Andre Boateng",
      blockedReason: "hardware",
      notes: "Waiting on replacement corner blocks (HW-2010) for 3 frames.",
    },
    {
      projectId: whitmore!.id,
      departmentId: dept.get("carpentry")!.id,
      status: "done",
      assignedTo: "Andre Boateng",
      startedAt: at(-20, 8),
      completedAt: at(-18, 16),
    },

    // --- Paint Department -------------------------------------------------
    {
      projectId: novak!.id,
      departmentId: dept.get("paint")!.id,
      status: "in_progress",
      assignedTo: "Elena Duarte",
      startedAt: at(0, 9),
      dueDate: at(3),
      tasks: [
        task("p1", "Sand Frame", "Lijar Estructura", true),
        task("p2", "Prime", "Imprimar"),
        task("p3", "Topcoat", "Capa Final"),
        task("p4", "Cure / Dry", "Secado"),
      ],
    },
    {
      projectId: kingsley!.id,
      departmentId: dept.get("paint")!.id,
      status: "queued",
      assignedTo: "Elena Duarte",
      dueDate: at(5),
    },
    {
      projectId: torres!.id,
      departmentId: dept.get("paint")!.id,
      status: "blocked",
      assignedTo: "Elena Duarte",
      blockedReason: "materials",
      notes: "Outdoor-grade sealer on order.",
    },

    // --- Warehouse --------------------------------------------------------
    {
      projectId: harborview!.id,
      departmentId: dept.get("warehouse")!.id,
      status: "in_progress",
      assignedTo: "Kostas Georgiou",
      startedAt: at(0, 7),
      dueDate: at(1),
      isRush: true,
      tasks: [
        task("w1", "Pull Fabric", "Sacar Tela", true),
        task("w2", "Pull Foam", "Sacar Espuma", true),
        task("w3", "Pull Hardware", "Sacar Herrajes"),
        task("w4", "Stage for Delivery", "Preparar para Entrega"),
      ],
    },
    {
      projectId: kingsley!.id,
      departmentId: dept.get("warehouse")!.id,
      status: "queued",
      assignedTo: "Kostas Georgiou",
      dueDate: at(3),
      notes: "Scheduled for install Thursday.",
    },
    {
      projectId: ashford!.id,
      departmentId: dept.get("warehouse")!.id,
      status: "blocked",
      assignedTo: "Kostas Georgiou",
      blockedReason: "fabric",
      notes: "Drapery linen still in transit from Thibaut.",
    },
    {
      projectId: whitmore!.id,
      departmentId: dept.get("warehouse")!.id,
      status: "done",
      assignedTo: "Kostas Georgiou",
      startedAt: at(-13, 8),
      completedAt: at(-12, 13),
    },

    // --- In The Office ----------------------------------------------------
    {
      projectId: delgado!.id,
      departmentId: dept.get("office")!.id,
      status: "in_progress",
      assignedTo: "Victoria Alvarez",
      startedAt: at(0, 8),
      dueDate: at(1),
      notes: "Checking seat pad alignment on all 8.",
      tasks: [
        task("o1", "Final QC Walkthrough", "Inspección Final", true),
        task("o2", "Photograph for Records", "Fotografiar para Archivo"),
        task("o3", "Issue Invoice", "Emitir Factura"),
      ],
    },
    {
      projectId: bellweather!.id,
      departmentId: dept.get("office")!.id,
      status: "queued",
      assignedTo: "Priya Raman",
      dueDate: at(6),
    },
    {
      projectId: ashford!.id,
      departmentId: dept.get("office")!.id,
      status: "blocked",
      assignedTo: "Priya Raman",
      blockedReason: "office_approval",
      notes: "Awaiting client sign-off on stripe direction.",
    },
    {
      projectId: whitmore!.id,
      departmentId: dept.get("office")!.id,
      status: "done",
      assignedTo: "Victoria Alvarez",
      startedAt: at(-16, 8),
      completedAt: at(-15, 11),
    },
  ];

  await db.insert(productionStages).values(stageRows);
  console.log(
    `  departments: ${insertedDepartments.length}, production stages: ${stageRows.length}`,
  );

  // --- work orders -------------------------------------------------------
  const insertedWorkOrders = await db
    .insert(workOrders)
    .values([
      {
        orderNumber: "WO-1001",
        projectId: whitmore!.id,
        type: "reupholstery",
        status: "completed",
        assignedToId: maria!.id,
        createdById: victoria!.id,
        dueDate: at(-14),
        specifications: {
          furniturePieces: ["3-seat sofa", "Wingback chair (x2)", "Ottoman"],
          constructionNotes:
            "Retain original down-blend seat inserts; replace all webbing.",
          measurementReferenceIds: [],
          specialInstructions:
            "Client requests welt in contrast Emerald mohair.",
        },
      },
      {
        orderNumber: "WO-1002",
        projectId: chen!.id,
        type: "reupholstery",
        status: "in_production",
        assignedToId: tom!.id,
        createdById: victoria!.id,
        dueDate: at(16),
        specifications: {
          furniturePieces: ["Modular sectional (6 pieces)"],
          constructionNotes: "Pet-resistant bouclé; double-stitch all seams.",
          measurementReferenceIds: [],
          specialInstructions:
            "Client has two large dogs — reinforce seat decks.",
        },
      },
      {
        orderNumber: "WO-1003",
        projectId: harborview!.id,
        type: "reupholstery",
        status: "in_production",
        assignedToId: maria!.id,
        createdById: kostas!.id,
        dueDate: at(30),
        specifications: {
          furniturePieces: ["Lobby armchair (x8) — batch 1"],
          constructionNotes:
            "Contract spec: 100k double-rub wool, CAL 117 compliant.",
          measurementReferenceIds: [],
          specialInstructions:
            "Hotel requires all work staged after 10pm for batch delivery.",
        },
      },
      {
        orderNumber: "WO-1004",
        projectId: harborview!.id,
        type: "reupholstery",
        status: "approved",
        assignedToId: andre!.id,
        createdById: kostas!.id,
        dueDate: at(38),
        specifications: {
          furniturePieces: ["Lobby armchair (x8) — batch 2"],
          constructionNotes: "Identical spec to WO-1003.",
          measurementReferenceIds: [],
          specialInstructions: "",
        },
      },
      {
        orderNumber: "WO-1005",
        projectId: delgado!.id,
        type: "cushion_only",
        status: "completed",
        assignedToId: tom!.id,
        createdById: priya!.id,
        dueDate: at(-2),
        specifications: {
          furniturePieces: ["Dining chair seat pad (x8)"],
          constructionNotes:
            "COM silk damask — client supplied, no substitutions.",
          measurementReferenceIds: [],
          specialInstructions: "Pattern match centred on each pad.",
        },
      },
      {
        orderNumber: "WO-1006",
        projectId: novak!.id,
        type: "repair",
        status: "in_production",
        assignedToId: andre!.id,
        createdById: victoria!.id,
        dueDate: at(25),
        specifications: {
          furniturePieces: ["Antique walnut settee (1890s)"],
          constructionNotes:
            "Eight-way hand-tied springs. Horsehair pad rebuild. Do not strip original frame finish.",
          measurementReferenceIds: [],
          specialInstructions:
            "Conservator sign-off required before final cover.",
        },
      },
      {
        orderNumber: "WO-1007",
        projectId: kingsley!.id,
        type: "custom_build",
        status: "completed",
        assignedToId: maria!.id,
        createdById: priya!.id,
        dueDate: at(-1),
        specifications: {
          furniturePieces: ["King channel-tufted headboard"],
          constructionNotes:
            "14 channels, 3in foam over 1/2in ply, French cleat mount.",
          measurementReferenceIds: [],
          specialInstructions:
            "Confirm wall stud spacing on site before install.",
        },
      },
      {
        orderNumber: "WO-1008",
        projectId: ashford!.id,
        type: "custom_build",
        status: "pending_approval",
        assignedToId: elena!.id,
        createdById: priya!.id,
        dueDate: at(42),
        specifications: {
          furniturePieces: ["Drapery panel (x9)", "Roman shade (x2)"],
          constructionNotes: "Blackout lining in bedroom windows only.",
          measurementReferenceIds: [],
          specialInstructions: "Awaiting client sign-off on stripe direction.",
        },
      },
      {
        orderNumber: "WO-1009",
        projectId: bellweather!.id,
        type: "reupholstery",
        status: "draft",
        assignedToId: null,
        createdById: priya!.id,
        dueDate: at(58),
        specifications: {
          furniturePieces: ["Waiting room chair (x14)"],
          constructionNotes: "Antimicrobial vinyl, sealed seams.",
          measurementReferenceIds: [],
          specialInstructions:
            "Draft only — quote not yet approved by clinic board.",
        },
      },
      {
        orderNumber: "WO-1010",
        projectId: vance!.id,
        type: "frame_only",
        status: "cancelled",
        assignedToId: null,
        createdById: victoria!.id,
        dueDate: at(-28),
        specifications: {
          furniturePieces: ["Leather wingback frame (x4)"],
          constructionNotes: "Cancelled before production.",
          measurementReferenceIds: [],
          specialInstructions: "",
        },
      },
    ])
    .returning();
  const woByNumber = new Map(insertedWorkOrders.map((w) => [w.orderNumber, w]));
  console.log(`  work orders: ${insertedWorkOrders.length}`);

  await db.insert(workOrderFabrics).values([
    {
      workOrderId: woByNumber.get("WO-1001")!.id,
      fabricId: fabricByCode.get("FAB-1001")!.id,
      yardsAllocated: "38.5",
      cutNotes: "Railroad the sofa body panels.",
      sortOrder: 0,
    },
    {
      workOrderId: woByNumber.get("WO-1001")!.id,
      fabricId: fabricByCode.get("FAB-1002")!.id,
      yardsAllocated: "14",
      cutNotes: "Pile direction down on both wingbacks.",
      sortOrder: 1,
    },
    {
      workOrderId: woByNumber.get("WO-1002")!.id,
      fabricId: fabricByCode.get("FAB-1004")!.id,
      yardsAllocated: "46",
      cutNotes: "Cut decks 2in oversize for tuck.",
      sortOrder: 0,
    },
    {
      workOrderId: woByNumber.get("WO-1003")!.id,
      fabricId: fabricByCode.get("FAB-1003")!.id,
      yardsAllocated: "32",
      cutNotes: "Batch 1 only — 8 chairs.",
      sortOrder: 0,
    },
    {
      workOrderId: woByNumber.get("WO-1005")!.id,
      fabricId: fabricByCode.get("FAB-1007")!.id,
      yardsAllocated: "8",
      cutNotes: "Centre the damask motif on each pad.",
      sortOrder: 0,
    },
    {
      workOrderId: woByNumber.get("WO-1006")!.id,
      fabricId: fabricByCode.get("FAB-1009")!.id,
      yardsAllocated: "12.5",
      cutNotes: "Match period weave direction.",
      sortOrder: 0,
    },
    {
      workOrderId: woByNumber.get("WO-1007")!.id,
      fabricId: fabricByCode.get("FAB-1002")!.id,
      yardsAllocated: "9",
      cutNotes: "One continuous panel per channel where possible.",
      sortOrder: 0,
    },
  ]);

  // --- client measurements ----------------------------------------------
  // canvasData matches MeasurementCanvas in @kostas/shared/schemas.
  const measurementCanvas = (
    label: string,
    w: number,
    h: number,
    d: number,
  ) => ({
    width: 640,
    height: 420,
    backgroundImageUrl: null,
    points: [
      { id: "p1", x: 80, y: 60, label: `${label} — outside width` },
      { id: "p2", x: 560, y: 60, label: `${w}"` },
      { id: "p3", x: 80, y: 360, label: `Height ${h}"` },
    ],
    lines: [
      { id: "l1", points: [80, 60, 560, 60], label: "Width", valueInches: w },
      { id: "l2", points: [80, 60, 80, 360], label: "Height", valueInches: h },
      { id: "l3", points: [80, 360, 300, 400], label: "Depth", valueInches: d },
    ],
  });

  // Illustrated measurement sheets (deck p4). Values are inches, matching
  // the deck's own sample numbers, so the sofa sheet reads like a real one
  // straight after seeding rather than a grid of blanks.
  const sofaSheet = (
    w: number,
    d: number,
    h: number,
    seatW: number,
    seatD: number,
    seatH: number,
  ) => ({
    kind: "sofa" as const,
    unit: "in" as const,
    entries: [
      { key: "overallWidth", value: w },
      { key: "overallDepth", value: d },
      { key: "overallHeight", value: h },
      { key: "seatWidth", value: seatW },
      { key: "seatDepth", value: seatD },
      { key: "seatHeight", value: seatH },
      { key: "armWidth", value: 12 },
      { key: "legHeight", value: 4 },
      { key: "clearanceNeeded", value: 36 },
    ],
  });

  const windowSheet = (w: number, h: number) => ({
    kind: "window" as const,
    unit: "in" as const,
    entries: [
      { key: "windowWidth", value: w },
      { key: "windowHeight", value: h },
      { key: "rodWidth", value: w + 12 },
      { key: "rodHeight", value: h + 12 },
      { key: "curtainLength", value: h + 14 },
      { key: "stackBack", value: 8 },
      { key: "reveal", value: 6 },
    ],
  });

  await db.insert(clientMeasurements).values([
    {
      projectId: whitmore!.id,
      furniturePiece: "3-seat sofa",
      notes: "Original frame square; no racking. Arms 26in from floor.",
      canvasData: measurementCanvas("Sofa", 84, 34, 38),
      sheets: [sofaSheet(96, 40, 34, 72, 24, 18)],
    },
    {
      projectId: whitmore!.id,
      furniturePiece: "Wingback chair",
      notes: "Pair. Right chair has a loose front rail — flag to frame shop.",
      canvasData: measurementCanvas("Wingback", 32, 45, 34),
      sheets: [sofaSheet(32, 34, 45, 21, 22, 19)],
    },
    {
      projectId: chen!.id,
      furniturePiece: "Sectional — chaise module",
      notes: "Chaise is left-facing as viewed from seated position.",
      canvasData: measurementCanvas("Chaise", 68, 33, 62),
      sheets: [sofaSheet(68, 62, 33, 60, 38, 17)],
    },
    {
      projectId: novak!.id,
      furniturePiece: "Antique settee",
      notes:
        "Measured before strip-down. Serpentine back — see photo reference.",
      canvasData: measurementCanvas("Settee", 58, 38, 27),
      sheets: [sofaSheet(58, 27, 38, 46, 20, 16)],
    },
    {
      projectId: kingsley!.id,
      furniturePiece: "King headboard",
      notes: "Wall-mount height confirmed at 54in to top edge.",
      canvasData: measurementCanvas("Headboard", 80, 58, 4),
      sheets: [],
    },
    {
      projectId: ashford!.id,
      furniturePiece: "Study window",
      notes:
        "Nine windows; this is the tallest. Measure twice — plaster is uneven.",
      canvasData: measurementCanvas("Window", 48, 108, 6),
      sheets: [windowSheet(78, 84)],
    },
  ]);

  // --- calendar ----------------------------------------------------------
  await db.insert(calendarEvents).values([
    {
      title: "Kingsley headboard install",
      type: "delivery_installation",
      start: at(3, 9),
      end: at(3, 12),
      projectId: kingsley!.id,
      workOrderId: woByNumber.get("WO-1007")!.id,
      assignedToId: kostas!.id,
      location: "1408 Peachtree Rd, Atlanta",
      notes: "Bring French cleat and stud finder.",
    },
    {
      title: "Delgado final QC walkthrough",
      type: "quality_check",
      start: at(1, 14),
      end: at(1, 15),
      projectId: delgado!.id,
      assignedToId: victoria!.id,
      location: "Workshop — QC bench",
    },
    {
      title: "Torres site visit & measure",
      type: "measurement_appointment",
      start: at(5, 10),
      end: at(5, 12),
      projectId: torres!.id,
      assignedToId: priya!.id,
      location: "22 Camelback Dr, Phoenix",
      notes: "Outdoor set — check sun exposure for fabric spec.",
    },
    {
      title: "Harborview batch 2 fabric delivery",
      type: "fabric_delivery",
      start: at(2, 8),
      end: at(2, 9),
      projectId: harborview!.id,
      assignedToId: maria!.id,
      location: "Loading dock",
      notes: "96 yards herringbone wool — inspect for flaws on arrival.",
    },
    {
      title: "Chen sectional — upholstery block",
      type: "production",
      start: at(4, 8),
      end: at(4, 17),
      projectId: chen!.id,
      workOrderId: woByNumber.get("WO-1002")!.id,
      assignedToId: andre!.id,
      location: "Bay 3",
    },
    {
      title: "Ashford drapery — client sign-off call",
      type: "other",
      start: at(1, 11),
      end: at(1, 12),
      projectId: ashford!.id,
      assignedToId: priya!.id,
      notes: "Confirm stripe direction before cutting.",
    },
    {
      title: "Novak conservator review",
      type: "quality_check",
      start: at(8, 13),
      end: at(8, 15),
      projectId: novak!.id,
      assignedToId: andre!.id,
      location: "Workshop — restoration bench",
    },
    {
      title: "Harborview batch 1 night install",
      type: "delivery_installation",
      start: at(11, 22),
      end: at(12, 2),
      projectId: harborview!.id,
      workOrderId: woByNumber.get("WO-1003")!.id,
      assignedToId: kostas!.id,
      location: "Harborview Hotel lobby",
      notes: "Hotel requires after-hours access — badge from front desk.",
    },
    {
      title: "Weekly production planning",
      type: "other",
      start: at(2, 8),
      end: at(2, 9),
      assignedToId: victoria!.id,
      rrule: "FREQ=WEEKLY;BYDAY=MO",
      location: "Office",
      notes: "Recurring — reviews all open work orders.",
    },
    {
      title: "Bellweather quote follow-up",
      type: "other",
      start: at(6, 15),
      end: at(6, 16),
      projectId: bellweather!.id,
      assignedToId: priya!.id,
    },
    {
      title: "Whitmore delivery (completed)",
      type: "delivery_installation",
      start: at(-12, 9),
      end: at(-12, 13),
      projectId: whitmore!.id,
      assignedToId: kostas!.id,
      location: "Whitmore Estate",
    },
    {
      title: "Chen measurement appointment (completed)",
      type: "measurement_appointment",
      start: at(-20, 10),
      end: at(-20, 12),
      projectId: chen!.id,
      assignedToId: priya!.id,
    },
  ]);
  console.log("  calendar events: 12");

  // --- finance -----------------------------------------------------------
  const insertedInvoices = await db
    .insert(invoices)
    .values([
      {
        invoiceNumber: "INV-2001",
        projectId: whitmore!.id,
        clientName: "Eleanor Whitmore",
        clientEmail: "eleanor.whitmore@example.com",
        status: "paid",
        subtotal: money(17200),
        taxRate: "0.0700",
        taxAmount: money(1204),
        total: money(18404),
        amountPaid: money(18404),
        dueDate: at(-18),
        notes: "Paid in full on delivery.",
      },
      {
        invoiceNumber: "INV-2002",
        projectId: chen!.id,
        clientName: "David Chen",
        clientEmail: "david.chen@example.com",
        status: "partially_paid",
        subtotal: money(11900),
        taxRate: "0.0700",
        taxAmount: money(833),
        total: money(12733),
        amountPaid: money(6366.5),
        dueDate: at(12),
        notes: "50% deposit received; balance due on completion.",
      },
      {
        invoiceNumber: "INV-2003",
        projectId: harborview!.id,
        clientName: "Harborview Hospitality Group",
        clientEmail: "procurement@harborviewhotels.example.com",
        status: "partially_paid",
        subtotal: money(38500),
        taxRate: "0.0700",
        taxAmount: money(2695),
        total: money(41195),
        amountPaid: money(13731.67),
        dueDate: at(20),
        notes: "Contract terms: thirds on each batch delivery.",
      },
      {
        invoiceNumber: "INV-2004",
        projectId: delgado!.id,
        clientName: "Marisol Delgado",
        clientEmail: "marisol.delgado@example.com",
        status: "sent",
        subtotal: money(5200),
        taxRate: "0.0700",
        taxAmount: money(364),
        total: money(5564),
        amountPaid: money(0),
        dueDate: at(14),
        notes: "Labour only — client supplied fabric (COM).",
      },
      {
        invoiceNumber: "INV-2005",
        projectId: novak!.id,
        clientName: "Josef Novak",
        clientEmail: "josef.novak@example.com",
        status: "overdue",
        subtotal: money(3500),
        taxRate: "0.0700",
        taxAmount: money(245),
        total: money(3745),
        amountPaid: money(0),
        dueDate: at(-9),
        notes: "Restoration deposit. Second reminder sent.",
      },
      {
        invoiceNumber: "INV-2006",
        projectId: kingsley!.id,
        clientName: "Amara Kingsley",
        clientEmail: "amara.kingsley@example.com",
        status: "paid",
        subtotal: money(3650),
        taxRate: "0.0700",
        taxAmount: money(255.5),
        total: money(3905.5),
        amountPaid: money(3905.5),
        dueDate: at(-4),
      },
      {
        invoiceNumber: "INV-2007",
        projectId: ashford!.id,
        clientName: "Priya Ashford",
        clientEmail: "priya.ashford@example.com",
        status: "sent",
        subtotal: money(9100),
        taxRate: "0.0700",
        taxAmount: money(637),
        total: money(9737),
        amountPaid: money(0),
        dueDate: at(28),
        notes: "Deposit invoice — 40% to release fabric order.",
      },
      {
        invoiceNumber: "INV-2008",
        projectId: bellweather!.id,
        clientName: "Bellweather Medical",
        clientEmail: "facilities@bellweather.example.com",
        status: "draft",
        subtotal: money(14300),
        taxRate: "0.0700",
        taxAmount: money(1001),
        total: money(15301),
        amountPaid: money(0),
        dueDate: at(52),
        notes: "Draft — do not send until board approves.",
      },
      {
        invoiceNumber: "INV-2009",
        projectId: harborview!.id,
        clientName: "Harborview Hospitality Group",
        clientEmail: "procurement@harborviewhotels.example.com",
        status: "overdue",
        subtotal: money(4200),
        taxRate: "0.0700",
        taxAmount: money(294),
        total: money(4494),
        amountPaid: money(0),
        dueDate: at(-6),
        notes: "Change order: 4 additional chairs added mid-contract.",
      },
      {
        invoiceNumber: "INV-2010",
        projectId: vance!.id,
        clientName: "Gregory Vance",
        clientEmail: "gregory.vance@example.com",
        status: "void",
        subtotal: money(10500),
        taxRate: "0.0700",
        taxAmount: money(735),
        total: money(11235),
        amountPaid: money(0),
        dueDate: at(-24),
        notes: "Voided — project cancelled before production.",
      },
    ])
    .returning();
  const invByNumber = new Map(
    insertedInvoices.map((i) => [i.invoiceNumber, i]),
  );

  await db.insert(invoiceLineItems).values([
    {
      invoiceId: invByNumber.get("INV-2001")!.id,
      description: "Reupholstery labour — 3-seat sofa",
      quantity: "1",
      unitPrice: money(6800),
      sortOrder: 0,
    },
    {
      invoiceId: invByNumber.get("INV-2001")!.id,
      description: "Reupholstery labour — wingback chair",
      quantity: "2",
      unitPrice: money(2400),
      sortOrder: 1,
    },
    {
      invoiceId: invByNumber.get("INV-2001")!.id,
      description: "Belgian Linen (FAB-1001)",
      quantity: "38.5",
      unitPrice: money(42.5),
      sortOrder: 2,
    },
    {
      invoiceId: invByNumber.get("INV-2001")!.id,
      description: "Velvet Mohair (FAB-1002)",
      quantity: "14",
      unitPrice: money(138),
      sortOrder: 3,
    },
    {
      invoiceId: invByNumber.get("INV-2002")!.id,
      description: "Sectional reupholstery — 6 modules",
      quantity: "1",
      unitPrice: money(9250),
      sortOrder: 0,
    },
    {
      invoiceId: invByNumber.get("INV-2002")!.id,
      description: "Performance Bouclé (FAB-1004)",
      quantity: "46",
      unitPrice: money(58.25),
      sortOrder: 1,
    },
    {
      invoiceId: invByNumber.get("INV-2003")!.id,
      description: "Contract reupholstery — lobby armchair",
      quantity: "24",
      unitPrice: money(1300),
      sortOrder: 0,
    },
    {
      invoiceId: invByNumber.get("INV-2003")!.id,
      description: "Herringbone Wool (FAB-1003)",
      quantity: "96",
      unitPrice: money(76),
      sortOrder: 1,
    },
    {
      invoiceId: invByNumber.get("INV-2004")!.id,
      description: "Seat pad rebuild — dining chair",
      quantity: "8",
      unitPrice: money(650),
      sortOrder: 0,
    },
    {
      invoiceId: invByNumber.get("INV-2005")!.id,
      description: "Antique settee restoration — deposit",
      quantity: "1",
      unitPrice: money(3500),
      sortOrder: 0,
    },
    {
      invoiceId: invByNumber.get("INV-2006")!.id,
      description: "Custom channel-tufted headboard",
      quantity: "1",
      unitPrice: money(2408),
      sortOrder: 0,
    },
    {
      invoiceId: invByNumber.get("INV-2006")!.id,
      description: "Velvet Mohair (FAB-1002)",
      quantity: "9",
      unitPrice: money(138),
      sortOrder: 1,
    },
    {
      invoiceId: invByNumber.get("INV-2007")!.id,
      description: "Drapery panels — fabrication",
      quantity: "9",
      unitPrice: money(720),
      sortOrder: 0,
    },
    {
      invoiceId: invByNumber.get("INV-2007")!.id,
      description: "Roman shades — fabrication",
      quantity: "2",
      unitPrice: money(1310),
      sortOrder: 1,
    },
    {
      invoiceId: invByNumber.get("INV-2008")!.id,
      description: "Waiting room chair reupholstery",
      quantity: "14",
      unitPrice: money(950),
      sortOrder: 0,
    },
    {
      invoiceId: invByNumber.get("INV-2009")!.id,
      description: "Change order — 4 additional chairs",
      quantity: "4",
      unitPrice: money(1050),
      sortOrder: 0,
    },
    {
      invoiceId: invByNumber.get("INV-2010")!.id,
      description: "Leather wingback frame rebuild",
      quantity: "4",
      unitPrice: money(2625),
      sortOrder: 0,
    },
  ]);

  // Payment history. `stripe*` ids stay null: no Stripe object was ever
  // created for these, and pretending otherwise would be misleading.
  await db.insert(transactions).values([
    {
      invoiceId: invByNumber.get("INV-2001")!.id,
      type: "payment",
      status: "succeeded",
      amount: money(9202),
      description: "Deposit — bank transfer",
      occurredAt: at(-34),
    },
    {
      invoiceId: invByNumber.get("INV-2001")!.id,
      type: "payment",
      status: "succeeded",
      amount: money(9202),
      description: "Balance on delivery — cheque",
      occurredAt: at(-12),
    },
    {
      invoiceId: invByNumber.get("INV-2002")!.id,
      type: "payment",
      status: "succeeded",
      amount: money(6366.5),
      description: "50% deposit — bank transfer",
      occurredAt: at(-21),
    },
    {
      invoiceId: invByNumber.get("INV-2003")!.id,
      type: "payment",
      status: "succeeded",
      amount: money(13731.67),
      description: "Batch 1 of 3 — contract terms",
      occurredAt: at(-15),
    },
    {
      invoiceId: invByNumber.get("INV-2006")!.id,
      type: "payment",
      status: "succeeded",
      amount: money(3905.5),
      description: "Paid in full on completion",
      occurredAt: at(-4),
    },
    {
      invoiceId: invByNumber.get("INV-2004")!.id,
      type: "payment",
      status: "pending",
      amount: money(5564),
      description: "Awaiting client transfer",
      occurredAt: at(-1),
    },
    {
      invoiceId: invByNumber.get("INV-2005")!.id,
      type: "payment",
      status: "failed",
      amount: money(3745),
      description: "Card declined — client notified",
      occurredAt: at(-7),
    },
    {
      invoiceId: invByNumber.get("INV-2001")!.id,
      type: "refund",
      status: "succeeded",
      amount: money(-240),
      description: "Goodwill credit — delivery delay",
      occurredAt: at(-11),
    },
    {
      invoiceId: invByNumber.get("INV-2003")!.id,
      type: "adjustment",
      status: "succeeded",
      amount: money(-500),
      description: "Contract discount applied",
      occurredAt: at(-14),
    },
  ]);
  console.log(
    `  invoices: ${insertedInvoices.length} (paid/sent/partially paid/overdue/draft/void), transactions: 9`,
  );

  // --- emails ------------------------------------------------------------
  // Local demo rows. `imapUid`/`imapFolder` mimic what a real sync writes so
  // the UI's folder/threading affordances have something to work with.
  await db.insert(emails).values([
    {
      messageId: "<demo-0001@kostas.local>",
      direction: "inbound",
      fromAddress: "david.chen@example.com",
      toAddresses: ["studio@kostas.local"],
      subject: "Re: Sectional fabric — final choice",
      bodyText:
        "We went back and forth but the ivory bouclé is the one. Please proceed.",
      bodyHtml:
        "<p>We went back and forth but the ivory bouclé is the one. Please proceed.</p><p>— David</p>",
      projectId: chen!.id,
      isRead: false,
      imapUid: "10241",
      imapFolder: "INBOX",
      receivedAt: at(-1, 8),
    },
    {
      messageId: "<demo-0002@kostas.local>",
      direction: "inbound",
      fromAddress: "procurement@harborviewhotels.example.com",
      toAddresses: ["studio@kostas.local"],
      ccAddresses: ["kostas@kostas.local"],
      subject: "Batch 2 access window — revised",
      bodyText:
        "Front desk can badge your team in from 10pm Thursday. Confirm headcount.",
      bodyHtml:
        "<p>Front desk can badge your team in from 10pm Thursday. Please confirm headcount.</p>",
      projectId: harborview!.id,
      isRead: false,
      imapUid: "10242",
      imapFolder: "INBOX",
      receivedAt: at(-1, 14),
      attachments: [
        {
          filename: "harborview-access-form.pdf",
          contentType: "application/pdf",
          sizeBytes: 184320,
          storageKey: "demo/email/harborview-access-form.pdf",
        },
      ],
    },
    {
      messageId: "<demo-0003@kostas.local>",
      direction: "inbound",
      fromAddress: "marisol.delgado@example.com",
      toAddresses: ["studio@kostas.local"],
      subject: "Silk damask — handling note from my designer",
      bodyText: "Her only ask is that the motif is centred on every pad.",
      bodyHtml:
        "<p>Her only ask is that the motif is centred on every pad. She's particular!</p>",
      projectId: delgado!.id,
      isRead: true,
      imapUid: "10230",
      imapFolder: "INBOX",
      receivedAt: at(-4, 11),
    },
    {
      messageId: "<demo-0004@kostas.local>",
      direction: "outbound",
      fromAddress: "studio@kostas.local",
      toAddresses: ["marisol.delgado@example.com"],
      subject: "Re: Silk damask — handling note from my designer",
      bodyText:
        "Noted — we've flagged it on the work order. Pattern will be centred.",
      bodyHtml:
        "<p>Noted — we've flagged it on WO-1005. Every pad will be centred on the motif.</p>",
      projectId: delgado!.id,
      isRead: true,
      imapFolder: "Sent",
      receivedAt: at(-4, 12),
    },
    {
      messageId: "<demo-0005@kostas.local>",
      direction: "inbound",
      fromAddress: "josef.novak@example.com",
      toAddresses: ["studio@kostas.local"],
      subject: "Settee — deposit invoice",
      bodyText:
        "Apologies, the card on file expired. Sending a transfer this week.",
      bodyHtml:
        "<p>Apologies — the card on file expired. I'll send a transfer this week.</p>",
      projectId: novak!.id,
      isRead: false,
      imapUid: "10238",
      imapFolder: "INBOX",
      receivedAt: at(-5, 9),
    },
    {
      messageId: "<demo-0006@kostas.local>",
      direction: "outbound",
      fromAddress: "studio@kostas.local",
      toAddresses: ["josef.novak@example.com"],
      subject: "Reminder: INV-2005 now overdue",
      bodyText: "Following up on the restoration deposit invoice.",
      bodyHtml:
        "<p>Just following up on INV-2005 — the restoration deposit is now past due.</p>",
      projectId: novak!.id,
      isRead: true,
      imapFolder: "Sent",
      receivedAt: at(-2, 10),
    },
    {
      messageId: "<demo-0007@kostas.local>",
      direction: "inbound",
      fromAddress: "eleanor.whitmore@example.com",
      toAddresses: ["studio@kostas.local"],
      subject: "Thank you — the room looks wonderful",
      bodyText: "The suite arrived Tuesday and it is beyond what we imagined.",
      bodyHtml:
        "<p>The suite arrived Tuesday and it is beyond what we imagined. Thank you all.</p>",
      projectId: whitmore!.id,
      isRead: true,
      imapUid: "10201",
      imapFolder: "INBOX",
      receivedAt: at(-11, 16),
    },
    {
      messageId: "<demo-0008@kostas.local>",
      direction: "inbound",
      fromAddress: "priya.ashford@example.com",
      toAddresses: ["studio@kostas.local"],
      subject: "Stripe direction — vertical please",
      bodyText: "Confirming vertical stripe on all nine panels.",
      bodyHtml:
        "<p>Confirming: vertical stripe on all nine panels. Horizontal on the roman shades.</p>",
      projectId: ashford!.id,
      isRead: false,
      imapUid: "10245",
      imapFolder: "INBOX",
      receivedAt: at(0, 9),
      attachments: [
        {
          filename: "ashford-window-elevations.pdf",
          contentType: "application/pdf",
          sizeBytes: 402816,
          storageKey: "demo/email/ashford-window-elevations.pdf",
        },
      ],
    },
    {
      messageId: "<demo-0009@kostas.local>",
      direction: "inbound",
      fromAddress: "facilities@bellweather.example.com",
      toAddresses: ["studio@kostas.local"],
      subject: "Quote received — board reviews the 14th",
      bodyText: "Thanks for the quote. It goes to the board on the 14th.",
      bodyHtml:
        "<p>Thanks for the quote — it goes to the board on the 14th. I'll revert straight after.</p>",
      projectId: bellweather!.id,
      isRead: true,
      imapUid: "10236",
      imapFolder: "INBOX",
      receivedAt: at(-6, 13),
    },
    {
      messageId: "<demo-0010@kostas.local>",
      direction: "inbound",
      fromAddress: "ricardo.torres@example.com",
      toAddresses: ["studio@kostas.local"],
      subject: "Outdoor cushions — 10 pieces",
      bodyText:
        "Found you through a neighbour. Ten outdoor cushions, full sun.",
      bodyHtml:
        "<p>Found you through a neighbour. I need ten outdoor cushions — the patio gets full sun all afternoon.</p>",
      projectId: torres!.id,
      isRead: false,
      imapUid: "10246",
      imapFolder: "INBOX",
      receivedAt: at(0, 11),
    },
    {
      messageId: "<demo-0011@kostas.local>",
      direction: "inbound",
      fromAddress: "orders@hollandsherry.example.com",
      toAddresses: ["studio@kostas.local"],
      subject: "Shipment confirmation — 96yd herringbone",
      bodyText: "Your order has shipped and is due Thursday.",
      bodyHtml:
        "<p>Your order of 96 yards (Herringbone Wool, Slate) has shipped, arriving Thursday.</p>",
      projectId: harborview!.id,
      isRead: true,
      imapUid: "10240",
      imapFolder: "INBOX",
      receivedAt: at(-3, 7),
    },
    {
      messageId: "<demo-0012@kostas.local>",
      direction: "outbound",
      fromAddress: "studio@kostas.local",
      toAddresses: ["amara.kingsley@example.com"],
      subject: "Headboard ready — install Thursday?",
      bodyText: "The headboard is finished and passed QC.",
      bodyHtml:
        "<p>The headboard is finished and through QC. Does Thursday morning work for install?</p>",
      projectId: kingsley!.id,
      isRead: true,
      imapFolder: "Sent",
      receivedAt: at(-1, 15),
    },
    {
      messageId: "<demo-0013@kostas.local>",
      direction: "inbound",
      fromAddress: "amara.kingsley@example.com",
      toAddresses: ["studio@kostas.local"],
      subject: "Re: Headboard ready — install Thursday?",
      bodyText: "Thursday morning is perfect. Someone will be home from 8.",
      bodyHtml:
        "<p>Thursday morning is perfect — someone will be home from 8am.</p>",
      projectId: kingsley!.id,
      isRead: false,
      imapUid: "10247",
      imapFolder: "INBOX",
      receivedAt: at(0, 7),
    },
    {
      messageId: "<demo-0014@kostas.local>",
      direction: "inbound",
      fromAddress: "sofia@studio-marchetti.com",
      toAddresses: ["studio@kostas.local"],
      subject: "Ashford — revised elevations attached",
      bodyText: "Small change to the study window heights.",
      bodyHtml:
        "<p>Small change to the study window heights — revised elevations attached.</p>",
      projectId: ashford!.id,
      isRead: true,
      imapUid: "10243",
      imapFolder: "INBOX",
      receivedAt: at(-2, 16),
      attachments: [
        {
          filename: "ashford-rev-b.pdf",
          contentType: "application/pdf",
          sizeBytes: 296960,
          storageKey: "demo/email/ashford-rev-b.pdf",
        },
      ],
    },
  ]);

  // Sync state reflecting demo mode rather than a real IMAP session.
  await db.insert(emailSyncState).values([
    {
      folder: "INBOX",
      lastUid: "10247",
      status: "synced",
      lastSyncedAt: at(0, 12),
      lastError: null,
    },
    {
      folder: "Sent",
      lastUid: "4120",
      status: "synced",
      lastSyncedAt: at(0, 12),
      lastError: null,
    },
  ]);
  console.log("  emails: 14 (unread/attachments/sent, all project-linked)");

  // --- photo references & mocked AI searches -----------------------------
  // Real PNG swatches are written to the local storage root so the review UI
  // renders actual images. No embeddings are generated: `embedding` stays
  // null because that requires the OPENAI_API_KEY-backed provider. The
  // "AI matches" below are precomputed fixtures, not model output.
  const photoSeeds = [
    {
      key: "demo/photos/fabric-belgian-linen.png",
      hex: "#D9CDB8",
      label: "Belgian Linen — Oatmeal",
      fabricCode: "FAB-1001",
    },
    {
      key: "demo/photos/fabric-velvet-mohair.png",
      hex: "#1F6F5C",
      label: "Velvet Mohair — Emerald",
      fabricCode: "FAB-1002",
    },
    {
      key: "demo/photos/fabric-herringbone-wool.png",
      hex: "#5A6470",
      label: "Herringbone Wool — Slate",
      fabricCode: "FAB-1003",
    },
    {
      key: "demo/photos/fabric-performance-boucle.png",
      hex: "#EDE6DA",
      label: "Performance Bouclé — Ivory",
      fabricCode: "FAB-1004",
    },
    {
      key: "demo/photos/fabric-italian-leather.png",
      hex: "#8B4A2B",
      label: "Italian Leather — Cognac",
      fabricCode: "FAB-1005",
    },
    {
      key: "demo/photos/fabric-silk-damask.png",
      hex: "#E3D2A5",
      label: "Silk Damask — Champagne",
      fabricCode: "FAB-1007",
    },
    {
      key: "demo/photos/fabric-chenille-weave.png",
      hex: "#B4562F",
      label: "Chenille Weave — Terracotta",
      fabricCode: "FAB-1009",
    },
    {
      key: "demo/photos/fabric-linen-stripe.png",
      hex: "#2E3A64",
      label: "Linen Blend Stripe — Indigo",
      fabricCode: "FAB-1010",
    },
    {
      key: "demo/photos/item-foam-cushion.png",
      hex: "#C9C4BB",
      label: 'Foam Cushion Core 24"x24"',
      sku: "ITEM-0001",
    },
    {
      key: "demo/photos/item-down-insert.png",
      hex: "#DCD8D0",
      label: "Down/Feather Blend Insert",
      sku: "ITEM-0005",
    },
  ];

  await Promise.all(
    photoSeeds.map((p) => writeDemoImage(STORAGE_ROOT, p.key, p.hex)),
  );

  const insertedPhotoRefs = await db
    .insert(photoReferences)
    .values(
      photoSeeds.map((p) => ({
        storageKey: p.key,
        label: p.label,
        fabricId: p.fabricCode ? fabricByCode.get(p.fabricCode)!.id : null,
        itemId: p.sku ? itemBySku.get(p.sku)!.id : null,
        embedding: null,
      })),
    )
    .returning();
  const refByKey = new Map(insertedPhotoRefs.map((r) => [r.storageKey, r]));

  const candidate = (storageKey: string, similarity: number) => {
    const ref = refByKey.get(storageKey)!;
    return {
      referenceId: ref.id,
      label: ref.label,
      storageKey: ref.storageKey,
      itemId: ref.itemId,
      fabricId: ref.fabricId,
      similarity,
    };
  };

  // Three searches covering the states the review UI can be in: a strong
  // match awaiting review, a confirmed match, and a genuine no-match that
  // exercises the manual-tagging path.
  await writeDemoImage(
    STORAGE_ROOT,
    "demo/searches/search-client-swatch.png",
    "#D6C9B4",
  );
  await writeDemoImage(
    STORAGE_ROOT,
    "demo/searches/search-emerald-chair.png",
    "#20705D",
  );
  await writeDemoImage(
    STORAGE_ROOT,
    "demo/searches/search-unknown-weave.png",
    "#7A5C3E",
  );

  await db.insert(photoSearches).values([
    {
      storageKey: "demo/searches/search-client-swatch.png",
      status: "matched",
      embedding: null,
      confidenceScore: "0.9420",
      topMatches: JSON.stringify([
        candidate("demo/photos/fabric-belgian-linen.png", 0.942),
        candidate("demo/photos/fabric-performance-boucle.png", 0.781),
        candidate("demo/photos/fabric-silk-damask.png", 0.664),
      ]),
      createdAt: at(-1, 10),
    },
    {
      storageKey: "demo/searches/search-emerald-chair.png",
      status: "confirmed",
      embedding: null,
      confidenceScore: "0.9680",
      confirmedMatchId: refByKey.get("demo/photos/fabric-velvet-mohair.png")!
        .id,
      topMatches: JSON.stringify([
        candidate("demo/photos/fabric-velvet-mohair.png", 0.968),
        candidate("demo/photos/fabric-chenille-weave.png", 0.612),
      ]),
      createdAt: at(-3, 14),
    },
    {
      storageKey: "demo/searches/search-unknown-weave.png",
      status: "no_match",
      embedding: null,
      confidenceScore: "0.4110",
      topMatches: JSON.stringify([
        candidate("demo/photos/fabric-italian-leather.png", 0.411),
        candidate("demo/photos/fabric-chenille-weave.png", 0.388),
      ]),
      createdAt: at(-2, 9),
    },
  ]);
  console.log(
    `  photo references: ${insertedPhotoRefs.length}, searches: 3 (matched/confirmed/no-match)`,
  );

  // --- designer portal ---------------------------------------------------
  const tiptapDoc = (text: string) => ({
    type: "doc",
    content: [{ type: "paragraph", content: [{ type: "text", text }] }],
  });

  const insertedSubmissions = await db
    .insert(designSubmissions)
    .values([
      // Submissions are raised by the office (submittedById) and assigned to
      // an external design firm for approval (designerId) — that assignment
      // is what the Designer Portal filters on, so each firm only ever sees
      // its own work.
      {
        projectId: ashford!.id,
        submittedById: elena!.id,
        designerId: sofia!.id,
        title: "Ashford Loft — drapery elevations Rev B",
        status: "designer_review",
        fileKeys: ["demo/photos/fabric-linen-stripe.png"],
      },
      {
        projectId: chen!.id,
        submittedById: elena!.id,
        designerId: sofia!.id,
        title: "Chen sectional — bouclé and welt detail",
        status: "designer_review",
        fileKeys: ["demo/photos/fabric-performance-boucle.png"],
      },
      {
        projectId: harborview!.id,
        submittedById: victoria!.id,
        designerId: amber!.id,
        title: "Harborview lobby — contract fabric spec",
        status: "changes_requested",
        fileKeys: ["demo/photos/fabric-herringbone-wool.png"],
      },
      {
        projectId: novak!.id,
        submittedById: elena!.id,
        designerId: amber!.id,
        title: "Novak settee — period fabric proposal",
        status: "production",
        fileKeys: ["demo/photos/fabric-chenille-weave.png"],
      },
      {
        projectId: whitmore!.id,
        submittedById: elena!.id,
        designerId: sofia!.id,
        title: "Whitmore suite — final scheme",
        status: "completed",
        fileKeys: ["demo/photos/fabric-velvet-mohair.png"],
      },
      {
        projectId: kingsley!.id,
        submittedById: priya!.id,
        designerId: sofia!.id,
        title: "Kingsley headboard — channel tufting layout",
        status: "approved",
        fileKeys: ["demo/photos/fabric-velvet-mohair.png"],
      },
      {
        projectId: delgado!.id,
        submittedById: priya!.id,
        designerId: amber!.id,
        title: "Delgado dining chairs — silk damask placement",
        status: "designer_review",
        fileKeys: ["demo/photos/fabric-silk-damask.png"],
      },
      // Unassigned draft: sits in the office view only, never in a portal.
      {
        projectId: torres!.id,
        submittedById: priya!.id,
        designerId: null,
        title: "Torres outdoor — initial concept",
        status: "draft",
        fileKeys: [],
      },
    ])
    .returning();

  await db.insert(designComments).values([
    {
      submissionId: insertedSubmissions[0]!.id,
      authorId: elena!.id,
      bodyJson: tiptapDoc(
        "Stripe direction reads well vertically. Can we see the roman shade detail at 1:10?",
      ),
      createdAt: at(-2, 11),
    },
    {
      submissionId: insertedSubmissions[0]!.id,
      authorId: sofia!.id,
      bodyJson: tiptapDoc(
        "Adding the shade detail now — will repost as Rev C.",
      ),
      createdAt: at(-2, 13),
    },
    {
      submissionId: insertedSubmissions[2]!.id,
      authorId: elena!.id,
      bodyJson: tiptapDoc(
        "Wool spec is below the 100k double-rub contract requirement. Please respec before we order.",
      ),
      createdAt: at(-5, 10),
    },
    {
      submissionId: insertedSubmissions[3]!.id,
      authorId: elena!.id,
      bodyJson: tiptapDoc(
        "Conservator approved the chenille. Released to production.",
      ),
      createdAt: at(-6, 9),
    },
    {
      submissionId: insertedSubmissions[1]!.id,
      authorId: elena!.id,
      bodyJson: tiptapDoc(
        "Approved. Welt in contrast as discussed on the call.",
      ),
      createdAt: at(-8, 15),
    },
  ]);
  console.log(
    `  design submissions: ${insertedSubmissions.length}, comments: 5`,
  );

  // --- employee portal activity -----------------------------------------
  // Deliberately relative to *now* rather than to a wall-clock hour. The
  // portal derives every hours figure by pairing these clock events, so a
  // fixed `at(0, 7)` seeded before 7am put today's clock-in in the future
  // and the whole dashboard read zero. Yesterday is a closed pair; today is
  // an open one, which is what makes the running timer show real elapsed
  // time whenever the demo is seeded.
  const hoursAgo = (h: number): Date =>
    new Date(Date.now() - h * 60 * 60 * 1000);
  const yesterdayShift = (person: string) => 24 + (person === "andre" ? 7 : 8);

  await db.insert(employeeActions).values([
    // Yesterday: a full closed shift each, so "this week" has real hours.
    {
      clientId: "demo-act-0001",
      userId: maria!.id,
      projectId: harborview!.id,
      type: "clock_in",
      payload: { source: "kiosk" },
      occurredAt: hoursAgo(yesterdayShift("maria") + 8),
    },
    {
      clientId: "demo-act-0002",
      userId: maria!.id,
      projectId: harborview!.id,
      type: "photo_upload",
      payload: { caption: "Batch 2 cut layout" },
      photoKey: "demo/photos/fabric-herringbone-wool.png",
      occurredAt: hoursAgo(yesterdayShift("maria") + 3),
    },
    {
      clientId: "demo-act-0003",
      userId: maria!.id,
      projectId: harborview!.id,
      type: "clock_out",
      payload: { source: "kiosk" },
      occurredAt: hoursAgo(yesterdayShift("maria")),
    },
    {
      clientId: "demo-act-0004",
      userId: tom!.id,
      projectId: delgado!.id,
      type: "clock_in",
      payload: { source: "kiosk" },
      occurredAt: hoursAgo(yesterdayShift("tom") + 8),
    },
    {
      clientId: "demo-act-0005",
      userId: tom!.id,
      projectId: delgado!.id,
      type: "task_note",
      payload: { note: "All 8 pads centred on motif — ready for QC." },
      occurredAt: hoursAgo(yesterdayShift("tom") + 2),
    },
    {
      clientId: "demo-act-0006",
      userId: tom!.id,
      projectId: delgado!.id,
      type: "clock_out",
      payload: { source: "kiosk" },
      occurredAt: hoursAgo(yesterdayShift("tom")),
    },
    {
      clientId: "demo-act-0007",
      userId: andre!.id,
      projectId: novak!.id,
      type: "clock_in",
      payload: { source: "mobile" },
      occurredAt: hoursAgo(yesterdayShift("andre") + 7),
    },
    {
      clientId: "demo-act-0008",
      userId: andre!.id,
      projectId: novak!.id,
      type: "clock_out",
      payload: { source: "mobile" },
      occurredAt: hoursAgo(yesterdayShift("andre")),
    },
    // Today: still on the clock, so the portal's timer is genuinely running.
    {
      clientId: "demo-act-0009",
      userId: maria!.id,
      projectId: harborview!.id,
      type: "clock_in",
      payload: { source: "kiosk" },
      occurredAt: hoursAgo(3),
    },
    {
      clientId: "demo-act-0010",
      userId: tom!.id,
      projectId: chen!.id,
      type: "clock_in",
      payload: { source: "kiosk" },
      occurredAt: hoursAgo(2.5),
    },
    {
      clientId: "demo-act-0011",
      userId: tom!.id,
      projectId: chen!.id,
      type: "task_note",
      payload: { note: "Seat cushion boxing done on 4 of 6 modules." },
      occurredAt: hoursAgo(1),
    },
    {
      clientId: "demo-act-0012",
      userId: andre!.id,
      projectId: novak!.id,
      type: "clock_in",
      payload: { source: "mobile" },
      occurredAt: hoursAgo(2),
    },
    {
      clientId: "demo-act-0013",
      userId: andre!.id,
      projectId: harborview!.id,
      type: "task_note",
      payload: { note: "Frame shop blocked — corner blocks short by 3." },
      occurredAt: hoursAgo(0.5),
    },
  ]);
  console.log("  employee actions: 13");

  console.log(
    "\nSeed complete — local demo data only, no external services contacted.",
  );
  console.log(`Storage swatches written to ${STORAGE_ROOT}`);
  console.log("Login: admin@kostas.local / password123");
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
