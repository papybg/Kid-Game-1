import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Game Portals
export const portals = pgTable("portals", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  icon: text("icon").notNull(),
  layouts: jsonb("layouts").notNull().$type<string[]>(),
  difficulty: text("difficulty").notNull(),
  isLocked: boolean("is_locked").default(false),
  createdAt: timestamp("created_at").default(sql`now()`),
});

// Game Items/Themes
export const gameItems = pgTable("game_items", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  image: text("image").notNull(),
  index: integer("index").notNull(),
  category: text("category"),
  createdAt: timestamp("created_at").default(sql`now()`),
});

// Game Layouts
export const gameLayouts = pgTable("game_layouts", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  backgroundLarge: text("background_large").notNull(),
  backgroundSmall: text("background_small").notNull(),
  slots: jsonb("slots").notNull().$type<Array<{
    index: number[];
    position: { top: string; left: string };
    diameter: string;
  }>>(),
  createdAt: timestamp("created_at").default(sql`now()`),
});

// User Progress
export const userProgress = pgTable("user_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  portalId: varchar("portal_id").notNull(),
  layoutId: varchar("layout_id").notNull(),
  completedAt: timestamp("completed_at").default(sql`now()`),
  score: integer("score").default(0),
  timeSpent: integer("time_spent").default(0), // in seconds
  sessionData: jsonb("session_data"),
});

// Game Settings
export const gameSettings = pgTable("game_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  soundEnabled: boolean("sound_enabled").default(true),
  musicEnabled: boolean("music_enabled").default(true),
  effectsEnabled: boolean("effects_enabled").default(true),
  themeMode: text("theme_mode").default("light"),
  difficulty: text("difficulty").default("medium"),
  autoSave: boolean("auto_save").default(true),
  updatedAt: timestamp("updated_at").default(sql`now()`),
});

// Insert schemas
export const insertPortalSchema = createInsertSchema(portals);
export const insertGameItemSchema = createInsertSchema(gameItems);
export const insertGameLayoutSchema = createInsertSchema(gameLayouts);
export const insertUserProgressSchema = createInsertSchema(userProgress);
export const insertGameSettingsSchema = createInsertSchema(gameSettings);

// Types
export type Portal = typeof portals.$inferSelect;
export type GameItem = typeof gameItems.$inferSelect;
export type GameLayout = typeof gameLayouts.$inferSelect;
export type UserProgress = typeof userProgress.$inferSelect;
export type GameSettings = typeof gameSettings.$inferSelect;

export type InsertPortal = z.infer<typeof insertPortalSchema>;
export type InsertGameItem = z.infer<typeof insertGameItemSchema>;
export type InsertGameLayout = z.infer<typeof insertGameLayoutSchema>;
export type InsertUserProgress = z.infer<typeof insertUserProgressSchema>;
export type InsertGameSettings = z.infer<typeof insertGameSettingsSchema>;

// Game-specific types
export interface GameSlot {
  index: number[];
  position: { top: string; left: string };
  diameter: string;
}

export interface GameState {
  currentPortal: Portal | null;
  currentLayout: GameLayout | null;
  isPlaying: boolean;
  isPaused: boolean;
  availableSlots: GameSlot[];
  activeSlot: GameSlot | null;
  choiceItems: GameItem[];
  usedItems: number[];
  score: number;
  startTime: number;
}

export interface FeedbackMessage {
  type: 'success' | 'error';
  message: string;
  isVisible: boolean;
}
