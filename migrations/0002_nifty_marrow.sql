CREATE TYPE "public"."item_count_rule" AS ENUM('equals_cells', 'cells_plus_two');--> statement-breakpoint
ALTER TABLE "portals" ADD COLUMN "min_cells" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "portals" ADD COLUMN "max_cells" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "portals" ADD COLUMN "item_count_rule" "item_count_rule" NOT NULL;