import { db } from "./db";
import { eq } from "drizzle-orm";
import {
  type Portal,
  type GameItem,
  type GameLayout,
  type UserProgress,
  type GameSettings,
  type InsertPortal,
  type InsertGameItem,
  type InsertGameLayout,
  type InsertUserProgress,
  type InsertGameSettings,
  portals,
  gameItems,
  gameLayouts,
  userProgress,
  gameSettings,
} from "../shared/schema";

export class DbStorage {
  // Portals
  async getPortals(): Promise<Portal[]> {
    return await db.select().from(portals);
  }

  async getPortal(id: string): Promise<Portal | undefined> {
    const result = await db.select().from(portals).where(eq(portals.id, id));
    return result[0];
  }

  async createPortal(portal: InsertPortal): Promise<Portal> {
    const result = await db.insert(portals).values(portal).returning();
    return result[0];
  }

  // Game Items
  async getGameItems(): Promise<GameItem[]> {
    return await db.select().from(gameItems);
  }

  async getGameItem(id: number): Promise<GameItem | undefined> {
    const result = await db.select().from(gameItems).where(eq(gameItems.id, id));
    return result[0];
  }

  async createGameItem(item: InsertGameItem): Promise<GameItem> {
    const result = await db.insert(gameItems).values(item).returning();
    return result[0];
  }

  // Game Layouts
  async getGameLayouts(): Promise<GameLayout[]> {
    return await db.select().from(gameLayouts);
  }

  async getGameLayout(id: string): Promise<GameLayout | undefined> {
    const result = await db.select().from(gameLayouts).where(eq(gameLayouts.id, id));
    return result[0];
  }

  async createGameLayout(layout: InsertGameLayout): Promise<GameLayout> {
    const result = await db.insert(gameLayouts).values(layout).returning();
    return result[0];
  }

  async updateGameLayout(id: string, updates: Partial<InsertGameLayout>): Promise<GameLayout> {
    const result = await db
      .update(gameLayouts)
      .set(updates)
      .where(eq(gameLayouts.id, id))
      .returning();
    
    if (result.length === 0) {
      throw new Error(`Layout with id ${id} not found`);
    }
    
    return result[0];
  }

  // User Progress
  async getUserProgress(): Promise<UserProgress[]> {
    return await db.select().from(userProgress);
  }

  async createUserProgress(progress: InsertUserProgress): Promise<UserProgress> {
    const result = await db.insert(userProgress).values(progress).returning();
    return result[0];
  }

  async getUserProgressByPortal(portalId: string): Promise<UserProgress[]> {
    return await db.select().from(userProgress).where(eq(userProgress.portalId, portalId));
  }

  // Game Settings
  async getGameSettings(): Promise<GameSettings | undefined> {
    const result = await db.select().from(gameSettings);
    return result[0];
  }

  async updateGameSettings(settings: Partial<InsertGameSettings>): Promise<GameSettings> {
    // First try to get existing settings
    const existing = await this.getGameSettings();

    if (existing) {
      // Update existing
      const result = await db
        .update(gameSettings)
        .set({ ...settings, updatedAt: new Date() })
        .where(eq(gameSettings.id, existing.id))
        .returning();
      return result[0];
    } else {
      // Create new
      const result = await db.insert(gameSettings).values(settings).returning();
      return result[0];
    }
  }
}