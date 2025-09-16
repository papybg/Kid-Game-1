var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  gameItems: () => gameItems,
  gameLayouts: () => gameLayouts,
  gameSettings: () => gameSettings,
  insertGameItemSchema: () => insertGameItemSchema,
  insertGameLayoutSchema: () => insertGameLayoutSchema,
  insertGameSettingsSchema: () => insertGameSettingsSchema,
  insertPortalSchema: () => insertPortalSchema,
  insertUserProgressSchema: () => insertUserProgressSchema,
  portals: () => portals,
  userProgress: () => userProgress
});
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var portals, gameItems, gameLayouts, userProgress, gameSettings, insertPortalSchema, insertGameItemSchema, insertGameLayoutSchema, insertUserProgressSchema, insertGameSettingsSchema;
var init_schema = __esm({
  "shared/schema.ts"() {
    "use strict";
    portals = pgTable("portals", {
      id: varchar("id").primaryKey(),
      name: text("name").notNull(),
      icon: text("icon").notNull(),
      layouts: jsonb("layouts").notNull().$type(),
      difficulty: text("difficulty").notNull(),
      isLocked: boolean("is_locked").default(false),
      createdAt: timestamp("created_at").default(sql`now()`)
    });
    gameItems = pgTable("game_items", {
      id: integer("id").primaryKey(),
      name: text("name").notNull(),
      image: text("image").notNull(),
      index: text("index").notNull(),
      category: text("category"),
      createdAt: timestamp("created_at").default(sql`now()`)
    });
    gameLayouts = pgTable("game_layouts", {
      id: varchar("id").primaryKey(),
      name: text("name").notNull(),
      backgroundLarge: text("background_large").notNull(),
      backgroundSmall: text("background_small").notNull(),
      slots: jsonb("slots").notNull().$type(),
      createdAt: timestamp("created_at").default(sql`now()`)
    });
    userProgress = pgTable("user_progress", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      portalId: varchar("portal_id").notNull(),
      layoutId: varchar("layout_id").notNull(),
      completedAt: timestamp("completed_at").default(sql`now()`),
      score: integer("score").default(0),
      timeSpent: integer("time_spent").default(0),
      // in seconds
      sessionData: jsonb("session_data")
    });
    gameSettings = pgTable("game_settings", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      soundEnabled: boolean("sound_enabled").default(true),
      musicEnabled: boolean("music_enabled").default(true),
      effectsEnabled: boolean("effects_enabled").default(true),
      themeMode: text("theme_mode").default("light"),
      difficulty: text("difficulty").default("medium"),
      autoSave: boolean("auto_save").default(true),
      updatedAt: timestamp("updated_at").default(sql`now()`)
    });
    insertPortalSchema = createInsertSchema(portals);
    insertGameItemSchema = createInsertSchema(gameItems);
    insertGameLayoutSchema = createInsertSchema(gameLayouts);
    insertUserProgressSchema = createInsertSchema(userProgress);
    insertGameSettingsSchema = createInsertSchema(gameSettings);
  }
});

// server/db.ts
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
var sql2, db;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema();
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is required");
    }
    sql2 = neon(process.env.DATABASE_URL);
    db = drizzle(sql2, { schema: schema_exports });
  }
});

// server/db-storage.ts
var db_storage_exports = {};
__export(db_storage_exports, {
  DbStorage: () => DbStorage
});
import { eq } from "drizzle-orm";
var DbStorage;
var init_db_storage = __esm({
  "server/db-storage.ts"() {
    "use strict";
    init_db();
    init_schema();
    DbStorage = class {
      // Portals
      async getPortals() {
        return await db.select().from(portals);
      }
      async getPortal(id) {
        const result = await db.select().from(portals).where(eq(portals.id, id));
        return result[0];
      }
      async createPortal(portal) {
        const result = await db.insert(portals).values(portal).returning();
        return result[0];
      }
      // Game Items
      async getGameItems() {
        return await db.select().from(gameItems);
      }
      async getGameItem(id) {
        const result = await db.select().from(gameItems).where(eq(gameItems.id, id));
        return result[0];
      }
      async createGameItem(item) {
        const result = await db.insert(gameItems).values(item).returning();
        return result[0];
      }
      // Game Layouts
      async getGameLayouts() {
        return await db.select().from(gameLayouts);
      }
      async getGameLayout(id) {
        const result = await db.select().from(gameLayouts).where(eq(gameLayouts.id, id));
        return result[0];
      }
      async createGameLayout(layout) {
        const result = await db.insert(gameLayouts).values(layout).returning();
        return result[0];
      }
      // User Progress
      async getUserProgress() {
        return await db.select().from(userProgress);
      }
      async createUserProgress(progress) {
        const result = await db.insert(userProgress).values(progress).returning();
        return result[0];
      }
      async getUserProgressByPortal(portalId) {
        return await db.select().from(userProgress).where(eq(userProgress.portalId, portalId));
      }
      // Game Settings
      async getGameSettings() {
        const result = await db.select().from(gameSettings);
        return result[0];
      }
      async updateGameSettings(settings) {
        const existing = await this.getGameSettings();
        if (existing) {
          const result = await db.update(gameSettings).set({ ...settings, updatedAt: /* @__PURE__ */ new Date() }).where(eq(gameSettings.id, existing.id)).returning();
          return result[0];
        } else {
          const result = await db.insert(gameSettings).values(settings).returning();
          return result[0];
        }
      }
    };
  }
});

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/storage.ts
import { randomUUID } from "crypto";
var MemStorage = class {
  portals = /* @__PURE__ */ new Map();
  gameItems = /* @__PURE__ */ new Map();
  gameLayouts = /* @__PURE__ */ new Map();
  userProgress = [];
  gameSettings;
  constructor() {
    this.initializeDefaultData();
  }
  initializeDefaultData() {
    const defaultPortal = {
      id: "dolina",
      name: "\u0417\u0435\u043B\u0435\u043D\u0430 \u0434\u043E\u043B\u0438\u043D\u0430",
      icon: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200",
      layouts: ["d1"],
      difficulty: "easy",
      isLocked: false,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.portals.set(defaultPortal.id, defaultPortal);
    const defaultItems = [
      {
        id: 1,
        name: "\u041A\u043E\u0442\u043A\u0430",
        image: "https://raw.githubusercontent.com/papybg/Kade-da-me-otkriesh/main/images/h/cat.jpg",
        index: "h",
        category: "\u0434\u043E\u043C\u0430\u0448\u043D\u0438",
        createdAt: /* @__PURE__ */ new Date()
      },
      {
        id: 2,
        name: "\u041A\u0443\u0447\u0435",
        image: "https://raw.githubusercontent.com/papybg/Kade-da-me-otkriesh/main/images/h/dog.jpg",
        index: "h",
        category: "\u0434\u043E\u043C\u0430\u0448\u043D\u0438",
        createdAt: /* @__PURE__ */ new Date()
      },
      {
        id: 3,
        name: "\u041A\u043E\u043A\u043E\u0448\u043A\u0430",
        image: "https://raw.githubusercontent.com/papybg/Kade-da-me-otkriesh/main/images/p/chicken.png",
        index: "p",
        category: "\u0441\u0435\u043B\u0441\u043A\u043E\u0441\u0442\u043E\u043F\u0430\u043D\u0441\u043A\u0438",
        createdAt: /* @__PURE__ */ new Date()
      },
      {
        id: 4,
        name: "\u0412\u043B\u0430\u043A",
        image: "https://raw.githubusercontent.com/papybg/Kade-da-me-otkriesh/main/images/i/train.jpg",
        index: "i",
        category: "\u0442\u0440\u0430\u043D\u0441\u043F\u043E\u0440\u0442",
        createdAt: /* @__PURE__ */ new Date()
      },
      {
        id: 5,
        name: "\u0410\u0432\u0442\u043E\u0431\u0443\u0441",
        image: "https://raw.githubusercontent.com/papybg/Kade-da-me-otkriesh/main/images/r/bus.jpg",
        index: "r",
        category: "\u0442\u0440\u0430\u043D\u0441\u043F\u043E\u0440\u0442",
        createdAt: /* @__PURE__ */ new Date()
      },
      {
        id: 6,
        name: "\u0412\u0440\u0430\u043D\u0430",
        image: "https://raw.githubusercontent.com/papybg/Kade-da-me-otkriesh/main/images/s/crow.png",
        index: "s",
        category: "\u043F\u0442\u0438\u0446\u0438",
        createdAt: /* @__PURE__ */ new Date()
      }
    ];
    const distractorItems = [
      {
        id: 7,
        name: "\u041A\u0440\u0430\u0432\u0430",
        image: "https://raw.githubusercontent.com/papybg/Kade-da-me-otkriesh/main/images/p/cow.png",
        index: "p",
        category: "\u0441\u0435\u043B\u0441\u043A\u043E\u0441\u0442\u043E\u043F\u0430\u043D\u0441\u043A\u0438",
        createdAt: /* @__PURE__ */ new Date()
      },
      {
        id: 8,
        name: "\u0421\u0430\u043C\u043E\u043B\u0435\u0442",
        image: "https://raw.githubusercontent.com/papybg/Kade-da-me-otkriesh/main/images/s/airplane.jpg",
        index: "s",
        category: "\u0442\u0440\u0430\u043D\u0441\u043F\u043E\u0440\u0442",
        createdAt: /* @__PURE__ */ new Date()
      }
    ];
    [...defaultItems, ...distractorItems].forEach((item) => {
      this.gameItems.set(item.id, item);
    });
    const defaultLayout = {
      id: "d1",
      name: "\u0417\u0435\u043B\u0435\u043D\u0430 \u0434\u043E\u043B\u0438\u043D\u0430 - \u041D\u0438\u0432\u043E 1",
      backgroundLarge: "https://raw.githubusercontent.com/papybg/Kade-da-me-otkriesh/main/assets/backgrounds/dolina-large.png",
      backgroundSmall: "https://raw.githubusercontent.com/papybg/Kade-da-me-otkriesh/main/assets/backgrounds/dolina-small.png",
      slots: [
        { index: ["s"], position: { top: "25%", left: "15%" }, diameter: "10%" },
        { index: ["s"], position: { top: "23%", left: "80%" }, diameter: "10%" },
        { index: ["p", "h"], position: { top: "70%", left: "80%" }, diameter: "10%" },
        { index: ["i"], position: { top: "75%", left: "40%" }, diameter: "10%" },
        { index: ["r"], position: { top: "65%", left: "65%" }, diameter: "10%" },
        { index: ["p"], position: { top: "72%", left: "92%" }, diameter: "10%" }
      ],
      createdAt: /* @__PURE__ */ new Date()
    };
    this.gameLayouts.set(defaultLayout.id, defaultLayout);
    this.gameSettings = {
      id: randomUUID(),
      soundEnabled: true,
      musicEnabled: true,
      effectsEnabled: true,
      themeMode: "light",
      difficulty: "medium",
      autoSave: true,
      updatedAt: /* @__PURE__ */ new Date()
    };
  }
  // Portals
  async getPortals() {
    return Array.from(this.portals.values());
  }
  async getPortal(id) {
    return this.portals.get(id);
  }
  async createPortal(portal) {
    const newPortal = {
      id: portal.id,
      name: portal.name,
      icon: portal.icon,
      layouts: Array.isArray(portal.layouts) ? [...portal.layouts] : [],
      difficulty: portal.difficulty,
      isLocked: portal.isLocked ?? null,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.portals.set(newPortal.id, newPortal);
    return newPortal;
  }
  // Game Items
  async getGameItems() {
    return Array.from(this.gameItems.values());
  }
  async getGameItem(id) {
    return this.gameItems.get(id);
  }
  async createGameItem(item) {
    const newItem = {
      ...item,
      category: item.category ?? null,
      // Convert undefined to null
      createdAt: /* @__PURE__ */ new Date()
    };
    this.gameItems.set(newItem.id, newItem);
    return newItem;
  }
  // Game Layouts
  async getGameLayouts() {
    return Array.from(this.gameLayouts.values());
  }
  async getGameLayout(id) {
    return this.gameLayouts.get(id);
  }
  async createGameLayout(layout) {
    const newLayout = {
      id: layout.id,
      name: layout.name,
      backgroundLarge: layout.backgroundLarge,
      backgroundSmall: layout.backgroundSmall,
      slots: layout.slots || [],
      createdAt: /* @__PURE__ */ new Date()
    };
    this.gameLayouts.set(newLayout.id, newLayout);
    return newLayout;
  }
  // User Progress
  async getUserProgress() {
    return this.userProgress;
  }
  async createUserProgress(progress) {
    const newProgress = {
      id: randomUUID(),
      portalId: progress.portalId,
      layoutId: progress.layoutId,
      score: progress.score ?? null,
      // Convert undefined to null
      timeSpent: progress.timeSpent ?? null,
      // Convert undefined to null
      sessionData: progress.sessionData ?? null,
      // Convert undefined to null
      completedAt: /* @__PURE__ */ new Date()
    };
    this.userProgress.push(newProgress);
    return newProgress;
  }
  async getUserProgressByPortal(portalId) {
    return this.userProgress.filter((p) => p.portalId === portalId);
  }
  // Game Settings
  async getGameSettings() {
    return this.gameSettings;
  }
  async updateGameSettings(settings) {
    if (!this.gameSettings) {
      this.gameSettings = {
        id: randomUUID(),
        soundEnabled: true,
        musicEnabled: true,
        effectsEnabled: true,
        themeMode: "light",
        difficulty: "medium",
        autoSave: true,
        updatedAt: /* @__PURE__ */ new Date(),
        ...settings
      };
    } else {
      this.gameSettings = {
        ...this.gameSettings,
        ...settings,
        updatedAt: /* @__PURE__ */ new Date()
      };
    }
    return this.gameSettings;
  }
};
var storageInstance = new MemStorage();
if (process.env.DATABASE_URL) {
  Promise.resolve().then(() => (init_db_storage(), db_storage_exports)).then(({ DbStorage: DbStorage2 }) => {
    storageInstance = new DbStorage2();
  }).catch((error) => {
    console.warn("Failed to load database storage, falling back to memory storage:", error.message);
    storageInstance = new MemStorage();
  });
}
var storage = storageInstance;

// server/routes.ts
init_schema();
import { z } from "zod";
async function registerRoutes(app2) {
  app2.get("/api/portals", async (req, res) => {
    try {
      const portals2 = await storage.getPortals();
      res.json(portals2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch portals" });
    }
  });
  app2.get("/api/portals/:id", async (req, res) => {
    try {
      const portal = await storage.getPortal(req.params.id);
      if (!portal) {
        return res.status(404).json({ message: "Portal not found" });
      }
      res.json(portal);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch portal" });
    }
  });
  app2.get("/api/game-items", async (req, res) => {
    try {
      const items = await storage.getGameItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch game items" });
    }
  });
  app2.get("/api/layouts/:id", async (req, res) => {
    try {
      const layout = await storage.getGameLayout(req.params.id);
      if (!layout) {
        return res.status(404).json({ message: "Layout not found" });
      }
      res.json(layout);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch layout" });
    }
  });
  app2.get("/api/progress", async (req, res) => {
    try {
      const progress = await storage.getUserProgress();
      res.json(progress);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch progress" });
    }
  });
  app2.post("/api/progress", async (req, res) => {
    try {
      const validatedProgress = insertUserProgressSchema.parse(req.body);
      const progress = await storage.createUserProgress(validatedProgress);
      res.status(201).json(progress);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid progress data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to save progress" });
    }
  });
  app2.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getGameSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });
  app2.patch("/api/settings", async (req, res) => {
    try {
      const validatedSettings = insertGameSettingsSchema.partial().parse(req.body);
      const settings = await storage.updateGameSettings(validatedSettings);
      res.json(settings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid settings data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update settings" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import tsconfigPaths from "vite-tsconfig-paths";
var __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env.PORT = "3005";
var vite_config_default = defineConfig({
  root: "./client",
  plugins: [react(), tsconfigPaths()],
  build: {
    outDir: "../dist/public"
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client/src"),
      "@shared": path.resolve(__dirname, "shared")
    }
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3005",
        changeOrigin: true
      }
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";

// server/utils.ts
import { fileURLToPath as fileURLToPath2 } from "url";
import { dirname } from "path";
function getDirname(importMetaUrl) {
  const __filename = fileURLToPath2(importMetaUrl);
  return dirname(__filename);
}

// server/vite.ts
var __dirname2 = getDirname(import.meta.url);
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        __dirname2,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const candidates = [
    path2.resolve(__dirname2, "public"),
    // default when building to dist/public
    path2.resolve(process.cwd(), "dist", "public"),
    // explicit project-root dist/public
    path2.resolve(__dirname2, "..", "client", "dist"),
    // client/dist
    path2.resolve(process.cwd(), "client", "dist")
    // alternate client/dist
  ];
  const distPath = candidates.find((p) => fs.existsSync(p));
  if (!distPath) {
    console.warn(
      `Warning: no client build found. Checked: ${candidates.join(", ")}. Starting API only.`
    );
    return;
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var __dirname3 = getDirname(import.meta.url);
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const allowedRaw = process.env.ALLOWED_ORIGINS ?? "http://localhost:5173,http://localhost:5176,http://localhost:5177";
  const allowed = allowedRaw.split(",").map((s) => s.trim()).filter(Boolean);
  const origin = (req.headers.origin || "").toString();
  const allowAll = allowed.includes("*");
  const isAllowed = allowAll || allowed.includes(origin) || !origin && allowed.includes("http://localhost:5173") || origin?.endsWith(".netlify.app");
  if (isAllowed) {
    res.header("Access-Control-Allow-Origin", origin || (allowAll ? "*" : allowed[0] || "*"));
    if (!allowAll && origin) {
      res.header("Access-Control-Allow-Credentials", "true");
    }
  }
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
    return;
  }
  next();
});
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    try {
      serveStatic(app);
    } catch (err) {
      console.warn(
        "Warning: serveStatic failed \u2014 starting API without client static files.",
        err instanceof Error ? err.message : err
      );
    }
  }
  const port = parseInt(process.env.PORT || "3005", 10);
  server.listen(port, () => {
    log(`serving on port ${port}`);
  });
})();
