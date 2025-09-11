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
        image: "data:image/svg+xml,%3csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3e%3ccircle cx='50' cy='40' r='20' fill='%23f4f4f4'/%3e%3ccircle cx='40' cy='35' r='3' fill='%23000'/%3e%3ccircle cx='60' cy='35' r='3' fill='%23000'/%3e%3cellipse cx='40' cy='25' rx='8' ry='12' fill='%23f4f4f4'/%3e%3cellipse cx='60' cy='25' rx='8' ry='12' fill='%23f4f4f4'/%3e%3ccircle cx='50' cy='50' r='2' fill='%23ff69b4'/%3e%3cpath d='M45 55 Q50 60 55 55' stroke='%23000' stroke-width='1' fill='none'/%3e%3c/svg%3e",
        index: 1,
        category: "animals",
        createdAt: new Date(),
      },
      {
        id: 2,
        name: "Пеперуда",
        image: "data:image/svg+xml,%3csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3e%3cellipse cx='50' cy='50' rx='25' ry='15' fill='%23ff8c00'/%3e%3ccircle cx='40' cy='45' r='3' fill='%23000'/%3e%3ccircle cx='60' cy='45' r='3' fill='%23000'/%3e%3cpath d='M20 40 Q15 35 25 35 Q50 20 75 35 Q85 35 80 40 Q75 50 50 55 Q25 50 20 40' fill='%23ffb347'/%3e%3cpath d='M35 60 Q50 65 65 60' stroke='%23000' stroke-width='1' fill='none'/%3e%3c/svg%3e",
        index: 2,
        category: "insects",
        createdAt: new Date(),
      },
      {
        id: 3,
        name: "Пчела",
        image: "data:image/svg+xml,%3csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3e%3ccircle cx='50' cy='50' r='20' fill='%23ffd700'/%3e%3ccircle cx='45' cy='45' r='3' fill='%23000'/%3e%3ccircle cx='55' cy='45' r='3' fill='%23000'/%3e%3cpath d='M30 40 Q20 30 10 40 Q15 50 30 45' fill='%23ffd700'/%3e%3cpath d='M70 40 Q80 30 90 40 Q85 50 70 45' fill='%23ffd700'/%3e%3cpath d='M40 60 Q50 65 60 60' stroke='%23000' stroke-width='2' fill='none'/%3e%3c/svg%3e",
        index: 3,
        category: "insects",
        createdAt: new Date(),
      },
      {
        id: 4,
        name: "Птичка",
        image: "data:image/svg+xml,%3csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3e%3ccircle cx='50' cy='50' r='18' fill='%23add8e6'/%3e%3ccircle cx='45' cy='45' r='2' fill='%23000'/%3e%3ccircle cx='55' cy='45' r='2' fill='%23000'/%3e%3cpath d='M40 55 Q50 60 60 55' stroke='%23ff8c00' stroke-width='2' fill='none'/%3e%3cpath d='M30 30 Q25 25 35 20 Q50 15 65 20 Q75 25 70 30' fill='%23ff69b4'/%3e%3cpath d='M25 50 Q20 45 15 50 Q20 55 25 50' fill='%23add8e6'/%3e%3cpath d='M75 50 Q80 45 85 50 Q80 55 75 50' fill='%23add8e6'/%3e%3c/svg%3e",
        index: 4,
        category: "birds",
        createdAt: new Date(),
      },
      {
        id: 5,
        name: "Цвете",
        image: "data:image/svg+xml,%3csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3e%3ccircle cx='50' cy='60' r='15' fill='%23ff69b4'/%3e%3ccircle cx='45' cy='55' r='2' fill='%23fff'/%3e%3ccircle cx='55' cy='55' r='2' fill='%23fff'/%3e%3cpath d='M30 20 Q35 10 45 15 Q50 20 55 15 Q65 10 70 20 Q65 30 55 25 Q50 30 45 25 Q35 30 30 20' fill='%23ff1493'/%3e%3cpath d='M50 75 Q40 85 50 90 Q60 85 50 75' fill='%2332cd32'/%3e%3c/svg%3e",
        index: 5,
        category: "plants",
        createdAt: new Date(),
      },
      {
        id: 6,
        name: "Котка",
        image: "data:image/svg+xml,%3csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3e%3ccircle cx='50' cy='50' r='20' fill='%23ff8c00'/%3e%3ccircle cx='45' cy='45' r='3' fill='%23000'/%3e%3ccircle cx='55' cy='45' r='3' fill='%23000'/%3e%3cpath d='M40 55 Q50 60 60 55' stroke='%23000' stroke-width='1' fill='none'/%3e%3ctriangle points='35,30 40,20 30,20' fill='%23ff8c00'/%3e%3ctriangle points='65,30 70,20 60,20' fill='%23ff8c00'/%3e%3cpath d='M30 70 Q20 80 30 85 Q50 80 30 70' fill='%23ff8c00'/%3e%3cpath d='M70 70 Q80 80 70 85 Q50 80 70 70' fill='%23ff8c00'/%3e%3c/svg%3e",
        index: 6,
        category: "animals",
        createdAt: new Date(),
      },
      {
        id: 7,
        name: "Куче",
        image: "data:image/svg+xml,%3csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3e%3ccircle cx='50' cy='50' r='22' fill='%238b4513'/%3e%3ccircle cx='42' cy='45' r='3' fill='%23000'/%3e%3ccircle cx='58' cy='45' r='3' fill='%23000'/%3e%3cpath d='M40 60 Q50 65 60 60' stroke='%23000' stroke-width='2' fill='none'/%3e%3cellipse cx='35' cy='35' rx='6' ry='10' fill='%238b4513'/%3e%3cellipse cx='65' cy='35' rx='6' ry='10' fill='%238b4513'/%3e%3cpath d='M50 58 L50 62' stroke='%23000' stroke-width='2'/%3e%3cpath d='M25 75 Q20 80 30 82 Q50 77 25 75' fill='%238b4513'/%3e%3cpath d='M75 75 Q80 80 70 82 Q50 77 75 75' fill='%238b4513'/%3e%3c/svg%3e",
        index: 7,
        category: "animals",
        createdAt: new Date(),
      },
      {
        id: 8,
        name: "Дърво",
        image: "data:image/svg+xml,%3csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3e%3crect x='45' y='60' width='10' height='25' fill='%238b4513'/%3e%3ccircle cx='50' cy='40' r='20' fill='%2332cd32'/%3e%3ccircle cx='35' cy='35' r='12' fill='%2332cd32'/%3e%3ccircle cx='65' cy='35' r='12' fill='%2332cd32'/%3e%3ccircle cx='40' cy='55' r='8' fill='%2332cd32'/%3e%3ccircle cx='60' cy='55' r='8' fill='%2332cd32'/%3e%3cpath d='M30 85 Q20 90 70 90 Q80 85 50 80 Q30 85 30 85' fill='%2332cd32'/%3e%3c/svg%3e",
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
      backgroundLarge: "data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='%2387ceeb'/%3e%3cdefs%3e%3cradialGradient id='a' cx='50%25' cy='30%25'%3e%3cstop offset='0%25' stop-color='%23ffd700'/%3e%3cstop offset='100%25' stop-color='%2387ceeb'/%3e%3c/radialGradient%3e%3c/defs%3e%3crect width='100%25' height='70%25' fill='url(%23a)'/%3e%3crect y='70%25' width='100%25' height='30%25' fill='%2332cd32'/%3e%3c/svg%3e",
      backgroundSmall: "data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='%2387ceeb'/%3e%3cdefs%3e%3cradialGradient id='a' cx='50%25' cy='30%25'%3e%3cstop offset='0%25' stop-color='%23ffd700'/%3e%3cstop offset='100%25' stop-color='%2387ceeb'/%3e%3c/radialGradient%3e%3c/defs%3e%3crect width='100%25' height='70%25' fill='url(%23a)'/%3e%3crect y='70%25' width='100%25' height='30%25' fill='%2332cd32'/%3e%3c/svg%3e",
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
