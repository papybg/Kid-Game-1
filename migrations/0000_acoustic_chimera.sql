CREATE TABLE "game_items" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"image" text NOT NULL,
	"index" text NOT NULL,
	"category" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "game_layouts" (
	"id" varchar PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"background_large" text NOT NULL,
	"background_small" text NOT NULL,
	"slots" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "game_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sound_enabled" boolean DEFAULT true,
	"music_enabled" boolean DEFAULT true,
	"effects_enabled" boolean DEFAULT true,
	"theme_mode" text DEFAULT 'light',
	"difficulty" text DEFAULT 'medium',
	"auto_save" boolean DEFAULT true,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "portals" (
	"id" varchar PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"icon" text NOT NULL,
	"layouts" jsonb NOT NULL,
	"difficulty" text NOT NULL,
	"is_locked" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_progress" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"portal_id" varchar NOT NULL,
	"layout_id" varchar NOT NULL,
	"completed_at" timestamp DEFAULT now(),
	"score" integer DEFAULT 0,
	"time_spent" integer DEFAULT 0,
	"session_data" jsonb
);
