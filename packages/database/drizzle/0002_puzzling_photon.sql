-- Shop-board display fields (module 16).
ALTER TABLE "production_stages" ADD COLUMN "tasks" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "production_stages" ADD COLUMN "blocked_reason" text;--> statement-breakpoint
ALTER TABLE "production_stages" ADD COLUMN "is_rush" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "production_stages" ADD COLUMN "due_date" timestamp with time zone;--> statement-breakpoint

-- Department keys move from process steps (cutting/sewing/...) to the
-- physical shop rooms shown on the department TVs. Drizzle's generated
-- version dropped and recreated the enum with a bare USING cast, which
-- fails on any existing row: none of the old values exist in the new type.
--
-- Instead, migrate the data. `cutting` and `sewing` both happen in the
-- Seamstress Room, so cutting's stages are reassigned to sewing's
-- department before the now-duplicate row is removed (departments.key is
-- UNIQUE, so two rows can't both become 'seamstress').
UPDATE "production_stages" ps
SET "department_id" = sewing."id"
FROM "departments" cutting, "departments" sewing
WHERE ps."department_id" = cutting."id"
  AND cutting."key" = 'cutting'
  AND sewing."key" = 'sewing';--> statement-breakpoint

DELETE FROM "departments" WHERE "key" = 'cutting';--> statement-breakpoint

ALTER TABLE "public"."departments" ALTER COLUMN "key" SET DATA TYPE text;--> statement-breakpoint

UPDATE "departments" SET "key" = 'seamstress', "name" = 'Seamstress Room' WHERE "key" = 'sewing';--> statement-breakpoint
UPDATE "departments" SET "key" = 'carpentry', "name" = 'Carpentry Room' WHERE "key" = 'frame_shop';--> statement-breakpoint
UPDATE "departments" SET "key" = 'warehouse', "name" = 'Warehouse' WHERE "key" = 'delivery';--> statement-breakpoint
UPDATE "departments" SET "key" = 'office', "name" = 'In The Office' WHERE "key" = 'quality_check';--> statement-breakpoint
UPDATE "departments" SET "name" = 'Upholstery Room' WHERE "key" = 'upholstery';--> statement-breakpoint

-- Any key not covered above (none expected) would break the cast below;
-- drop those stages and rows rather than fail the migration mid-way.
DELETE FROM "production_stages" WHERE "department_id" IN (
  SELECT "id" FROM "departments"
  WHERE "key" NOT IN ('seamstress', 'upholstery', 'carpentry', 'paint', 'warehouse', 'office')
);--> statement-breakpoint
DELETE FROM "departments"
WHERE "key" NOT IN ('seamstress', 'upholstery', 'carpentry', 'paint', 'warehouse', 'office');--> statement-breakpoint

DROP TYPE "public"."department_key";--> statement-breakpoint
CREATE TYPE "public"."department_key" AS ENUM('seamstress', 'upholstery', 'carpentry', 'paint', 'warehouse', 'office');--> statement-breakpoint
ALTER TABLE "public"."departments" ALTER COLUMN "key" SET DATA TYPE "public"."department_key" USING "key"::"public"."department_key";
