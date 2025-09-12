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
        name: "Котка",
        image: "https://raw.githubusercontent.com/papybg/Kade-da-me-otkriesh/main/images/h/cat.jpg",
        index: "h",
        category: "домашни",
        createdAt: new Date(),
      },
      {
        id: 2,
        name: "Куче",
        image: "https://raw.githubusercontent.com/papybg/Kade-da-me-otkriesh/main/images/h/dog.jpg",
        index: "h",
        category: "домашни",
        createdAt: new Date(),
      },
      {
        id: 3,
        name: "Кокошка",
        image: "https://raw.githubusercontent.com/papybg/Kade-da-me-otkriesh/main/images/p/chicken.png",
        index: "p",
        category: "селскостопански",
        createdAt: new Date(),
      },
      {
        id: 4,
        name: "Влак",
        image: "https://raw.githubusercontent.com/papybg/Kade-da-me-otkriesh/main/images/i/train.jpg",
        index: "i",
        category: "транспорт",
        createdAt: new Date(),
      },
      {
        id: 5,
        name: "Автобус",
        image: "https://raw.githubusercontent.com/papybg/Kade-da-me-otkriesh/main/images/r/bus.jpg",
        index: "r",
        category: "транспорт",
        createdAt: new Date(),
      },
      {
        id: 6,
        name: "Врана",
        image: "https://raw.githubusercontent.com/papybg/Kade-da-me-otkriesh/main/images/s/crow.png",
        index: "s",
        category: "птици",
        createdAt: new Date(),
      },
    ];

    // Add some distractor items for difficulty
    const distractorItems: GameItem[] = [
      {
        id: 7,
        name: "Крава",
        image: "https://raw.githubusercontent.com/papybg/Kade-da-me-otkriesh/main/images/p/cow.png",
        index: "p", 
        category: "селскостопански",
        createdAt: new Date(),
      },
      {
        id: 8,
        name: "Самолет",
        image: "https://raw.githubusercontent.com/papybg/Kade-da-me-otkriesh/main/images/s/airplane.jpg",
        index: "s",
        category: "транспорт", 
        createdAt: new Date(),
      },
    ];

    // Add all items to storage
    [...defaultItems, ...distractorItems].forEach(item => {
      this.gameItems.set(item.id, item);
    });

    // Initialize default layout
    const defaultLayout: GameLayout = {
      id: "d1",
      name: "Зелена долина - Ниво 1",
      backgroundLarge: "https://raw.githubusercontent.com/papybg/Kade-da-me-otkriesh/main/assets/backgrounds/dolina-large.png",
      backgroundSmall: "https://raw.githubusercontent.com/papybg/Kade-da-me-otkriesh/main/assets/backgrounds/dolina-small.png",
      slots: [
        { index: ["s"], position: { top: "25%", left: "15%" }, diameter: "10%" },
        { index: ["s"], position: { top: "23%", left: "80%" }, diameter: "10%" },
        { index: ["p", "h"], position: { top: "70%", left: "80%" }, diameter: "10%" },
        { index: ["i"], position: { top: "75%", left: "40%" }, diameter: "10%" },
        { index: ["r"], position: { top: "65%", left: "65%" }, diameter: "10%" },
        { index: ["p"], position: { top: "72%", left: "92%" }, diameter: "10%" },
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
      id: portal.id,
      name: portal.name,
      icon: portal.icon,
      layouts: Array.isArray(portal.layouts) ? [...portal.layouts] : [],
      difficulty: portal.difficulty,
      isLocked: portal.isLocked ?? null,
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
      category: item.category ?? null, // Convert undefined to null
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
      id: layout.id,
      name: layout.name,
      backgroundLarge: layout.backgroundLarge,
      backgroundSmall: layout.backgroundSmall,
      slots: (layout.slots as any) || [],
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
      portalId: progress.portalId,
      layoutId: progress.layoutId,
      score: progress.score ?? null, // Convert undefined to null
      timeSpent: progress.timeSpent ?? null, // Convert undefined to null
      sessionData: progress.sessionData ?? null, // Convert undefined to null
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
