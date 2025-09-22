CREATE TABLE "categories_indices" (
	"id" integer PRIMARY KEY NOT NULL,
	"category_name" text NOT NULL,
	"index_value" varchar(2) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "game_items" ALTER COLUMN "index" SET DATA TYPE varchar(2);--> statement-breakpoint
ALTER TABLE "portals" ADD COLUMN "portal_name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "portals" ADD COLUMN "file_name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "portals" ADD COLUMN "icon_file_name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "portals" ADD COLUMN "cell_count" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "portals" DROP COLUMN "name";--> statement-breakpoint
ALTER TABLE "portals" DROP COLUMN "icon";