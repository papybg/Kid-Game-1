import type { Express, Request, Response } from "express";
import { getStorage, MemStorage } from "./storage";
import { insertUserProgressSchema, insertGameSettingsSchema } from "../shared/schema";
import { z } from "zod";
import { generateGameSession } from "./gameService";
import multer from "multer";
import { fileURLToPath } from 'url';
import { dirname, join, parse, extname } from 'path';
import { promises as fs } from 'fs';
import { existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Конфигурация на multer за качване на файлове в паметта
const upload = multer({
  storage: multer.memoryStorage(), // Важно: файловете се обработват в паметта
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB лимит
  fileFilter: (req: any, file: any, cb: any) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

export function setupRoutes(app: Express): void {
  
  // Качване на original, mobile и icon файлове наведнъж
  app.post("/api/upload/all", upload.fields([
    { name: 'original', maxCount: 1 },
    { name: 'mobile', maxCount: 1 },
    { name: 'icon', maxCount: 1 }
  ]), async (req: Request, res: Response) => {
    try {
      const backgroundsDir = join(process.cwd(), 'client', 'public', 'images', 'backgrounds');
      if (!existsSync(backgroundsDir)) {
        mkdirSync(backgroundsDir, { recursive: true });
      }

      // Helper функция за записване на файл от паметта
      const saveFile = async (file: Express.Multer.File | undefined, label: string) => {
        if (!file) return '';
        const baseName = parse(file.originalname).name.replace(/[^a-zA-Z0-9]/g, '_'); // Почистване на името
        const extension = extname(file.originalname);
        const timestamp = Date.now();
        const fileName = `${baseName}_${label}_${timestamp}${extension}`;
        const filePath = join(backgroundsDir, fileName);
        await fs.writeFile(filePath, file.buffer);
        return fileName;
      };

      // Проверка за req.files, тъй като е optional
      if (!req.files || typeof req.files !== 'object') {
        return res.status(400).json({ message: "No files uploaded" });
      }

      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const originalFile = files.original?.[0];
      const mobileFile = files.mobile?.[0];
      const iconFile = files.icon?.[0];

      const originalName = await saveFile(originalFile, 'desktop');
      const mobileName = await saveFile(mobileFile, 'mobile');
      const iconName = await saveFile(iconFile, 'icon');

      res.json({
        desktop: originalName,
        mobile: mobileName,
        icon: iconName
      });
    } catch (error) {
      console.error('Failed to upload files:', error);
      res.status(500).json({ message: "Failed to upload files" });
    }
  });

  // Всички останали рутери...
  app.get("/api/portals", async (req, res) => {
    try {
      console.log('GET /api/portals - resolving storage...');
      const storage = await getStorage();
      console.log('GET /api/portals - storage resolved:', storage?.constructor?.name || typeof storage);
      const portals = await storage.getPortals();
      console.log('GET /api/portals - portals fetched, count=', Array.isArray(portals) ? portals.length : 'unknown');
      // Ensure variantSettings is always present so UI can rely on it
      const normalized = portals.map(p => ({ ...p, variantSettings: (p as any).variantSettings || {} }));
      res.json(normalized);
    } catch (error) {
  console.error('Error in GET /api/portals:', (error as any) && ((error as any).stack || (error as any)));
      // Temporary fallback: if DB/storage fails, return in-memory default portals so the frontend can work.
      try {
        console.log('GET /api/portals - attempting MemStorage fallback');
        const fallback = new MemStorage();
        const portals = await fallback.getPortals();
        console.log('GET /api/portals - fallback portals count=', portals.length);
        const normalized = portals.map(p => ({ ...p, variantSettings: (p as any).variantSettings || {} }));
        res.setHeader('X-Storage-Fallback', 'mem');
        return res.json(normalized);
      } catch (fallbackErr) {
  console.error('Fallback MemStorage also failed:', (fallbackErr as any) && ((fallbackErr as any).stack || (fallbackErr as any)));
        return res.status(500).json({ message: "Failed to fetch portals" });
      }
    }
  });

  app.get("/api/portals/:id", async (req, res) => {
    try {
      const storage = await getStorage();
      const portal = await storage.getPortal(req.params.id);
      if (!portal) {
        return res.status(404).json({ message: "Portal not found" });
      }
      res.json({ ...portal, variantSettings: (portal as any).variantSettings || {} });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch portal" });
    }
  });

  app.get("/api/portals/:id/full", async (req, res) => {
    try {
      const storage = await getStorage();
      const portalId = decodeURIComponent(req.params.id);
      const portal = await storage.getPortal(portalId);

      if (!portal) {
        return res.status(404).json({ message: "Portal not found" });
      }

      let layout = null;
      if (portal.layouts && portal.layouts.length > 0) {
        const layoutId = portal.layouts[0];
        layout = await storage.getGameLayout(layoutId);
      }

      // Make sure variantSettings is always an object (fallback to {}) to simplify client code
      const normalizedPortal = { ...portal, variantSettings: (portal as any).variantSettings || {} };
      res.json({ portal: normalizedPortal, layout });
    } catch (error) {
      console.error('Failed to fetch full portal data:', error);
      res.status(500).json({ message: "Failed to fetch portal data" });
    }
  });

  app.get("/api/game-variants", async (req, res) => {
    try {
      const storage = await getStorage();
      const variants = await storage.getGameVariants();
      res.json(variants);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch game variants" });
    }
  });

  app.post("/api/portals", async (req, res) => {
    try {
      const storage = await getStorage();
      // Ensure variantSettings exists and add default min_cells/max_cells if missing (DB requires them)
      const body = { 
        ...req.body, 
        variantSettings: req.body?.variantSettings || {},
        min_cells: req.body?.min_cells ?? 0, // Default for DB constraint
        max_cells: req.body?.max_cells ?? 0  // Default for DB constraint
      };
      const newPortal = await storage.createPortal(body);
      res.status(201).json(newPortal);
    } catch (error) {
      console.error('Failed to create portal:', error);
      res.status(500).json({ message: "Failed to create portal" });
    }
  });

  app.put("/api/portals/:id", async (req, res) => {
    try {
      const storage = await getStorage();
      // Normalize incoming payload to ensure required fields exist
      const updates = { 
        ...req.body, 
        variantSettings: req.body?.variantSettings || {},
        // Add default min_cells/max_cells if not provided (for DB constraint compatibility)
        min_cells: req.body?.min_cells ?? 0,
        max_cells: req.body?.max_cells ?? 0
      };
      const updatedPortal = await storage.updatePortal(req.params.id, updates);
      res.json(updatedPortal);
    } catch (error) {
      console.error('Failed to update portal:', error);
      res.status(500).json({ message: "Failed to update portal" });
    }
  });

  app.patch("/api/portals/:id", async (req, res) => {
    try {
      const storage = await getStorage();
      const portalId = decodeURIComponent(req.params.id);
      const updates = { ...req.body };
      // Only enforce default for variantSettings if it's explicitly provided as null/undefined on updates
      if ('variantSettings' in updates) {
        updates.variantSettings = updates.variantSettings || {};
      }
      const updatedPortal = await storage.updatePortal(portalId, updates);
      res.json(updatedPortal);
    } catch (error) {
      console.error('Failed to patch portal:', error);
      res.status(500).json({ message: "Failed to update portal" });
    }
  });

  app.get("/api/game-items", async (req, res) => {
    try {
      const storage = await getStorage();
      const items = await storage.getGameItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch game items" });
    }
  });

  app.get("/api/admin/categories", async (req, res) => {
    try {
      const storage = await getStorage();
      const categories = await storage.getCategoriesIndices();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.get("/api/layouts/:id", async (req, res) => {
    try {
      const storage = await getStorage();
      const layout = await storage.getGameLayout(req.params.id);
      if (!layout) {
        return res.status(404).json({ message: "Layout not found" });
      }
      res.json(layout);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch layout" });
    }
  });

  app.post("/api/layouts", async (req, res) => {
    try {
      const storage = await getStorage();
      const newLayout = await storage.createGameLayout(req.body);
      res.status(201).json(newLayout);
    } catch (error) {
      console.error('Failed to create layout:', error);
      res.status(500).json({ message: "Failed to create layout" });
    }
  });

  app.put("/api/layouts/:id", async (req, res) => {
    try {
      const storage = await getStorage();
      const layoutId = req.params.id;
      const updates = req.body;
      const existingLayout = await storage.getGameLayout(layoutId);
      
      if (!existingLayout) {
        const newLayout = await storage.createGameLayout({ id: layoutId, ...updates });
        return res.status(201).json(newLayout);
      }
      
      const updatedLayout = await storage.updateGameLayout(layoutId, updates);
      res.json(updatedLayout);
    } catch (error) {
      console.error('Failed to update layout:', error);
      res.status(500).json({ message: "Failed to update layout" });
    }
  });

  app.get("/api/progress", async (req, res) => {
    try {
      const storage = await getStorage();
      const progress = await storage.getUserProgress();
      res.json(progress);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch progress" });
    }
  });

  app.post("/api/progress", async (req, res) => {
    try {
      const storage = await getStorage();
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

  app.get("/api/settings", async (req, res) => {
    try {
      const storage = await getStorage();
      const settings = await storage.getGameSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.patch("/api/settings", async (req, res) => {
    try {
      const storage = await getStorage();
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

  app.get("/api/game-session/:portalId", async (req, res) => {
    try {
      const { portalId } = req.params;
      const decodedPortalId = decodeURIComponent(portalId);
      const deviceType = (req.query.device as 'desktop' | 'mobile') || 'desktop';
      const gameMode = (req.query.mode as 'simple' | 'advanced') || 'simple';
      const variantId = req.query.variant as string | undefined;
      const sessionData = await generateGameSession(decodedPortalId, deviceType, gameMode, variantId);
      res.json(sessionData);
    } catch (error) {
      console.error('Error generating game session:', error);
      res.status(500).json({ error: 'Failed to generate game session' });
    }
  });

  // Validation endpoint for client-submitted placements (blueprint-mode like K1)
  app.post("/api/game-session/:portalId/validate", async (req, res) => {
    try {
      const { portalId } = req.params;
      const decodedPortalId = decodeURIComponent(portalId);
      const deviceType = (req.query.device as 'desktop' | 'mobile') || 'desktop';
      const gameMode = (req.query.mode as 'simple' | 'advanced') || 'simple';
      const variantId = req.query.variant as string | undefined;

      // Expect placements in the body: { placements: { [itemId]: cellId } }
      const placements = req.body?.placements as Record<string, string> | undefined;
      if (!placements || typeof placements !== 'object') {
        return res.status(400).json({ message: 'placements object required in request body' });
      }

      // Regenerate the session with the same parameters (server is authoritative)
      const sessionData = await generateGameSession(decodedPortalId, deviceType, gameMode, variantId);

      // Ensure we have a solution mapping from the server
      const solution = sessionData.solution || {};

      const details: Array<{ itemId: number; expectedCellId: string | null; providedCellId: string | null; ok: boolean }> = [];
      let allOk = true;

      for (const key of Object.keys(placements)) {
        const itemId = Number(key);
        const provided = placements[key] || null;
        const expected = (solution as any)[itemId] || null;
        const ok = expected !== null && expected === provided;
        if (!ok) allOk = false;
        details.push({ itemId, expectedCellId: expected, providedCellId: provided, ok });
      }

      res.json({ valid: allOk, details });
    } catch (error) {
      console.error('Error validating game-session placements:', error);
      res.status(500).json({ error: 'Failed to validate placements' });
    }
  });
}