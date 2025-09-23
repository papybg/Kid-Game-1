ALTER TABLE "game_layouts" ADD COLUMN "slots_desktop" jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "game_layouts" ADD COLUMN "slots_mobile" jsonb;--> statement-breakpoint
ALTER TABLE "game_layouts" DROP COLUMN "slots";