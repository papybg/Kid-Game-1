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
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Portals
  getPortals(): Promise<Portal[]>;
  getPortal(id: string): Promise<Portal | undefined>;
  createPortal(portal: InsertPortal): Promise<Portal>;

  // Game Items
  getGameItems(): Promise<GameItem[]>;
  getGameItem(id: number): Promise<GameItem | undefined>;
  createGameItem(item: InsertGameItem): Promise<GameItem>;

  // Game Layouts
  getGameLayouts(): Promise<GameLayout[]>;
  getGameLayout(id: string): Promise<GameLayout | undefined>;
  createGameLayout(layout: InsertGameLayout): Promise<GameLayout>;

  // User Progress
  getUserProgress(): Promise<UserProgress[]>;
  createUserProgress(progress: InsertUserProgress): Promise<UserProgress>;
  getUserProgressByPortal(portalId: string): Promise<UserProgress[]>;

  // Game Settings
  getGameSettings(): Promise<GameSettings | undefined>;
  updateGameSettings(settings: Partial<InsertGameSettings>): Promise<GameSettings>;
}

export class MemStorage implements IStorage {
  private portals: Map<string, Portal> = new Map();
  private gameItems: Map<number, GameItem> = new Map();
  private gameLayouts: Map<string, GameLayout> = new Map();
  private userProgress: UserProgress[] = [];
  private gameSettings: GameSettings | undefined;

  constructor() {
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Initialize default portal
    const defaultPortal: Portal = {
      id: "dolina",
      name: "Зелена долина",
      icon: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200",
      layouts: ["d1"],
      difficulty: "easy",
      isLocked: false,
      createdAt: new Date(),
    };
    this.portals.set(defaultPortal.id, defaultPortal);

    // Initialize default game items
    const defaultItems: GameItem[] = [
      {
        id: 1,
        name: "Заек",
        image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
        index: 1,
        category: "animals",
        createdAt: new Date(),
      },
      {
        id: 2,
        name: "Пеперуда",
        image: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
        index: 2,
        category: "insects",
        createdAt: new Date(),
      },
      {
        id: 3,
        name: "Пчела",
        image: "https://images.unsplash.com/photo-1535930891776-0c2dfb7fda1a?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
        index: 3,
        category: "insects",
        createdAt: new Date(),
      },
      {
        id: 4,
        name: "Птичка",
        image: "https://images.unsplash.com/photo-1552053831-71594a27632d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
        index: 4,
        category: "birds",
        createdAt: new Date(),
      },
      {
        id: 5,
        name: "Цвете",
        image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
        index: 5,
        category: "plants",
        createdAt: new Date(),
      },
      {
        id: 6,
        name: "Котка",
        image: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
        index: 6,
        category: "animals",
        createdAt: new Date(),
      },
      {
        id: 7,
        name: "Куче",
        image: "https://images.unsplash.com/photo-1552053831-71594a27632d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
        index: 7,
        category: "animals",
        createdAt: new Date(),
      },
      {
        id: 8,
        name: "Дърво",
        image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
        index: 8,
        category: "plants",
        createdAt: new Date(),
      },
    ];

    defaultItems.forEach(item => {
      this.gameItems.set(item.id, item);
    });

    // Initialize default layout
    const defaultLayout: GameLayout = {
      id: "d1",
      name: "Зелена долина - Ниво 1",
      backgroundLarge: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080",
      backgroundSmall: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=768&h=1024",
      slots: [
        { index: [1, 2], position: { top: "20%", left: "30%" }, diameter: "64px" },
        { index: [3, 4], position: { top: "60%", left: "70%" }, diameter: "64px" },
        { index: [5, 6], position: { top: "40%", left: "15%" }, diameter: "64px" },
      ],
      createdAt: new Date(),
    };
    this.gameLayouts.set(defaultLayout.id, defaultLayout);

    // Initialize default settings
    this.gameSettings = {
      id: randomUUID(),
      soundEnabled: true,
      musicEnabled: true,
      effectsEnabled: true,
      themeMode: "light",
      difficulty: "medium",
      autoSave: true,
      updatedAt: new Date(),
    };
  }

  // Portals
  async getPortals(): Promise<Portal[]> {
    return Array.from(this.portals.values());
  }

  async getPortal(id: string): Promise<Portal | undefined> {
    return this.portals.get(id);
  }

  async createPortal(portal: InsertPortal): Promise<Portal> {
    const newPortal: Portal = {
      ...portal,
      createdAt: new Date(),
    };
    this.portals.set(newPortal.id, newPortal);
    return newPortal;
  }

  // Game Items
  async getGameItems(): Promise<GameItem[]> {
    return Array.from(this.gameItems.values());
  }

  async getGameItem(id: number): Promise<GameItem | undefined> {
    return this.gameItems.get(id);
  }

  async createGameItem(item: InsertGameItem): Promise<GameItem> {
    const newItem: GameItem = {
      ...item,
      createdAt: new Date(),
    };
    this.gameItems.set(newItem.id, newItem);
    return newItem;
  }

  // Game Layouts
  async getGameLayouts(): Promise<GameLayout[]> {
    return Array.from(this.gameLayouts.values());
  }

  async getGameLayout(id: string): Promise<GameLayout | undefined> {
    return this.gameLayouts.get(id);
  }

  async createGameLayout(layout: InsertGameLayout): Promise<GameLayout> {
    const newLayout: GameLayout = {
      ...layout,
      createdAt: new Date(),
    };
    this.gameLayouts.set(newLayout.id, newLayout);
    return newLayout;
  }

  // User Progress
  async getUserProgress(): Promise<UserProgress[]> {
    return this.userProgress;
  }

  async createUserProgress(progress: InsertUserProgress): Promise<UserProgress> {
    const newProgress: UserProgress = {
      id: randomUUID(),
      ...progress,
      completedAt: new Date(),
    };
    this.userProgress.push(newProgress);
    return newProgress;
  }

  async getUserProgressByPortal(portalId: string): Promise<UserProgress[]> {
    return this.userProgress.filter(p => p.portalId === portalId);
  }

  // Game Settings
  async getGameSettings(): Promise<GameSettings | undefined> {
    return this.gameSettings;
  }

  async updateGameSettings(settings: Partial<InsertGameSettings>): Promise<GameSettings> {
    if (!this.gameSettings) {
      this.gameSettings = {
        id: randomUUID(),
        soundEnabled: true,
        musicEnabled: true,
        effectsEnabled: true,
        themeMode: "light",
        difficulty: "medium",
        autoSave: true,
        updatedAt: new Date(),
        ...settings,
      };
    } else {
      this.gameSettings = {
        ...this.gameSettings,
        ...settings,
        updatedAt: new Date(),
      };
    }
    return this.gameSettings;
  }
}

export const storage = new MemStorage();
