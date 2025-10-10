import {
  type Portal,
  type GameItem,
  type GameLayout,
  type UserProgress,
  type GameSettings,
  type GameVariant,
  type CategoryIndex,
  type InsertPortal,
  type InsertGameItem,
  type InsertGameLayout,
  type InsertUserProgress,
  type InsertGameSettings,
} from "../shared/schema";
import { randomUUID } from "crypto";
import { DbStorage } from "./db-storage";

export interface IStorage {
  // Portals
  getPortals(): Promise<Portal[]>;
  getPortal(id: string): Promise<Portal | undefined>;
  createPortal(portal: InsertPortal): Promise<Portal>;
  updatePortal(id: string, updates: Partial<InsertPortal>): Promise<Portal>;

  // Game Variants
  getGameVariants(): Promise<GameVariant[]>;

  // Categories
  getCategoriesIndices(): Promise<CategoryIndex[]>;

  // Game Items
  getGameItems(): Promise<GameItem[]>;
  getGameItem(id: number): Promise<GameItem | undefined>;
  createGameItem(item: InsertGameItem): Promise<GameItem>;

  // Game Layouts
  getGameLayouts(): Promise<GameLayout[]>;
  getGameLayout(id: string): Promise<GameLayout | undefined>;
  createGameLayout(layout: InsertGameLayout): Promise<GameLayout>;
  updateGameLayout(id: string, updates: Partial<InsertGameLayout>): Promise<GameLayout>;

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
  private gameVariants: Map<string, GameVariant> = new Map();
  private gameLayouts: Map<string, GameLayout> = new Map();
  private userProgress: UserProgress[] = [];
  private gameSettings: GameSettings | undefined;

  constructor() {
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Initialize default game variants
    const defaultVariants: GameVariant[] = [
      {
        id: 't1',
        name: 'toddlers',
        displayName: 'За мъници',
        description: 'За деца 2-4 години - прости игри с малко елементи',
        createdAt: new Date(),
      },
      {
        id: 'k1',
        name: 'kids',
        displayName: 'За малчугани',
        description: 'За деца 4-6 години - средна сложност',
        createdAt: new Date(),
      },
      {
        id: 'e1',
        name: 'experts',
        displayName: 'За батковци',
        description: 'За деца 8+ години - сложни игри с много елементи',
        createdAt: new Date(),
      }
    ];

    defaultVariants.forEach(variant => {
      this.gameVariants.set(variant.id, variant);
    });

    // Initialize default portal
    const defaultPortal: Portal = {
      id: "dolina",
      portalName: "Зелена долина",
      fileName: "dolina.png",
      iconFileName: "dolina-icon.png", 
      layouts: ["d1"],
      cellCount: 6,
      min_cells: 4,
      max_cells: 8,
      item_count_rule: "equals_cells",
      variantSettings: {},
      isLocked: false,
      createdAt: new Date(),
    };
    this.portals.set(defaultPortal.id, defaultPortal);

    // Initialize default game items
    const defaultItems: GameItem[] = [
      {
        id: 1,
        name: "Котка",
        image: "/images/cat.png",
        audio: "/audio/cat.mp3",
        index: "h",
        category: "домашни",
        createdAt: new Date(),
      },
      {
        id: 2,
        name: "Куче",
        image: "/images/dog.png",
        audio: "/audio/dog.mp3",
        index: "h",
        category: "домашни",
        createdAt: new Date(),
      },
      {
        id: 3,
        name: "Кокошка",
        image: "/images/chicken.png",
        audio: "/audio/chicken.mp3",
        index: "p",
        category: "селскостопански",
        createdAt: new Date(),
      },
      {
        id: 4,
        name: "Влак",
        image: "/images/train.png",
        audio: "/audio/train.mp3",
        index: "i",
        category: "транспорт",
        createdAt: new Date(),
      },
      {
        id: 5,
        name: "Автобус",
        image: "/images/bus.png",
        audio: "/audio/bus.mp3",
        index: "r",
        category: "транспорт",
        createdAt: new Date(),
      },
      {
        id: 6,
        name: "Врана",
        image: "/images/crow.png",
        audio: "/audio/crow.mp3",
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
        image: "/images/cow.png",
        audio: "/audio/cow.mp3",
        index: "p", 
        category: "селскостопански",
        createdAt: new Date(),
      },
      {
        id: 8,
        name: "Самолет",
        image: "/images/airplane.png",
        audio: "/audio/airplane.mp3",
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
      backgroundLarge: "/images/backgrounds/dolina-large.png",
      backgroundSmall: "/images/backgrounds/dolina-small.png",
      slots_desktop: [
        { index: ["s"], position: { top: "25%", left: "15%" }, diameter: "11%" },
        { index: ["s"], position: { top: "23%", left: "80%" }, diameter: "11%" },
        { index: ["p", "h"], position: { top: "70%", left: "80%" }, diameter: "11%" },
        { index: ["i"], position: { top: "69%", left: "35%" }, diameter: "11%" },
        { index: ["r"], position: { top: "65%", left: "65%" }, diameter: "11%" },
        { index: ["p"], position: { top: "72%", left: "92%" }, diameter: "11%" },
      ],
      slots_mobile: null,
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
      portalName: portal.portalName,
      fileName: portal.fileName,
      iconFileName: portal.iconFileName,
      layouts: Array.isArray(portal.layouts) ? [...portal.layouts] : [],
      cellCount: portal.cellCount,
      min_cells: portal.min_cells,
      max_cells: portal.max_cells,
      item_count_rule: portal.item_count_rule,
      variantSettings: portal.variantSettings || {},
      isLocked: portal.isLocked ?? null,
      createdAt: new Date(),
    };
    this.portals.set(newPortal.id, newPortal);
    return newPortal;
  }

  async updatePortal(id: string, updates: Partial<InsertPortal>): Promise<Portal> {
    const existingPortal = this.portals.get(id);
    if (!existingPortal) {
      throw new Error(`Portal with id ${id} not found`);
    }

    const updatedPortal: Portal = {
      ...existingPortal,
      ...updates,
      layouts: updates.layouts ? [...updates.layouts] : existingPortal.layouts,
      variantSettings: updates.variantSettings || existingPortal.variantSettings,
    };

    this.portals.set(id, updatedPortal);
    return updatedPortal;
  }

  // Game Variants
  async getGameVariants(): Promise<GameVariant[]> {
    return Array.from(this.gameVariants.values());
  }

  // Categories
  async getCategoriesIndices(): Promise<CategoryIndex[]> {
    // For now, return an empty array as we don't have category indices implemented
    return [];
  }

  // Game Items
  async getGameItems(): Promise<GameItem[]> {
    return Array.from(this.gameItems.values());
  }

  async getGameItem(id: number): Promise<GameItem | undefined> {
    return this.gameItems.get(id);
  }

  async createGameItem(item: InsertGameItem): Promise<GameItem> {
    const id = Math.max(...this.gameItems.keys()) + 1; // Generate new ID
    const newItem: GameItem = {
      id: id,
      name: item.name,
      image: item.image,
      audio: item.audio,
      index: item.index,
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
      slots_desktop: layout.slots_desktop || [],
      slots_mobile: layout.slots_mobile || null,
      createdAt: new Date(),
    };
    this.gameLayouts.set(newLayout.id, newLayout);
    return newLayout;
  }

  async updateGameLayout(id: string, updates: Partial<InsertGameLayout>): Promise<GameLayout> {
    const existingLayout = this.gameLayouts.get(id);
    if (!existingLayout) {
      throw new Error(`Layout with id ${id} not found`);
    }

    const updatedLayout: GameLayout = {
      ...existingLayout,
      ...updates,
      slots_desktop: updates.slots_desktop || existingLayout.slots_desktop,
      slots_mobile: updates.slots_mobile || existingLayout.slots_mobile,
    };

    this.gameLayouts.set(id, updatedLayout);
    return updatedLayout;
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

// Use database storage if DATABASE_URL is available, otherwise use memory storage
let _dbLogShown = false;
async function createStorage(): Promise<IStorage> {
  if (process.env.DATABASE_URL) {
    if (!_dbLogShown) {
      console.log("Using database storage (PostgreSQL)");
      _dbLogShown = true;
    }
    // When running built ESM files under Node, dynamic imports need the .js extension.
    // Resolve relative to this file using import.meta.url so it works both in ts-node and in dist/.
    const dbModuleUrl = new URL('./db-storage.js', import.meta.url).href;
    const { DbStorage } = await import(dbModuleUrl);
    return new DbStorage();
  } else {
    if (!_dbLogShown) {
      console.log("Using memory storage");
      _dbLogShown = true;
    }
    return new MemStorage();
  }
}

// Initialize storage
let storageInstance: IStorage | null = null;

export const getStorage = async (): Promise<IStorage> => {
  if (!storageInstance) {
    storageInstance = await createStorage();
  }
  return storageInstance;
};

// For backward compatibility
export const storage: IStorage = new Proxy({} as IStorage, {
  get: (target, prop) => {
    throw new Error("Use getStorage() instead of direct storage access");
  }
});
