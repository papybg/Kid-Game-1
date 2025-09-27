CREATE TABLE "game_variants" (
	"id" varchar PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"display_name" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "game_items" ALTER COLUMN "id" SET DATA TYPE serial;--> statement-breakpoint
ALTER TABLE "game_items" ALTER COLUMN "image" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "game_items" ADD COLUMN "audio" text;--> statement-breakpoint
ALTER TABLE "portals" ADD COLUMN "variant_settings" jsonb NOT NULL;