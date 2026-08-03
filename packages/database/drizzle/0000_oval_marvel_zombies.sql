CREATE TYPE "public"."user_role" AS ENUM('admin', 'manager', 'sales', 'designer', 'shop_floor', 'employee');--> statement-breakpoint
CREATE TYPE "public"."project_status" AS ENUM('lead', 'quoted', 'approved', 'in_progress', 'quality_check', 'ready_for_delivery', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."project_fabric_status" AS ENUM('draft', 'ordered', 'received', 'cut', 'installed');--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "user_role" DEFAULT 'employee' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"client_name" text NOT NULL,
	"client_email" text,
	"client_phone" text,
	"status" "project_status" DEFAULT 'lead' NOT NULL,
	"description" text,
	"due_date" date,
	"budget" numeric(12, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client_measurements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"furniture_piece" text NOT NULL,
	"notes" text,
	"canvas_data" jsonb NOT NULL,
	"reference_photo_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "items_inventory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sku" text NOT NULL,
	"name" text NOT NULL,
	"category" text,
	"quantity" integer DEFAULT 0 NOT NULL,
	"unit" text DEFAULT 'ea' NOT NULL,
	"bin_location" text,
	"reorder_threshold" integer DEFAULT 0 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "items_inventory_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
CREATE TABLE "fabric_inventory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fabric_code" text NOT NULL,
	"name" text NOT NULL,
	"mill" text,
	"color" text,
	"pattern" text,
	"composition" text,
	"width_inches" numeric(6, 2),
	"cost_per_yard" numeric(10, 2),
	"yards_in_stock" numeric(10, 2) DEFAULT '0' NOT NULL,
	"yards_reserved" numeric(10, 2) DEFAULT '0' NOT NULL,
	"warehouse_location" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "fabric_inventory_fabric_code_unique" UNIQUE("fabric_code")
);
--> statement-breakpoint
CREATE TABLE "project_fabrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"fabric_id" uuid NOT NULL,
	"yards_required" numeric(10, 2) NOT NULL,
	"status" "project_fabric_status" DEFAULT 'draft' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dashboard_layouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"layout" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "dashboard_layouts_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_measurements" ADD CONSTRAINT "client_measurements_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_fabrics" ADD CONSTRAINT "project_fabrics_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_fabrics" ADD CONSTRAINT "project_fabrics_fabric_id_fabric_inventory_id_fk" FOREIGN KEY ("fabric_id") REFERENCES "public"."fabric_inventory"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard_layouts" ADD CONSTRAINT "dashboard_layouts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;