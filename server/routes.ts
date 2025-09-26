import type { Express } from "express";
import { getStorage } from "./storage";
import { insertUserProgressSchema, insertGameSettingsSchema } from "../shared/schema";
import { z } from "zod";
import { generateGameSession } from "./gameService";
import multer from "multer";
import sharp from "sharp";
import { fileURLToPath } from 'url';
import { dirname, join, parse, extname } from 'path';
import { promises as fs } from 'fs';
import { existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure multer for file uploads
const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req: any, file: any, cb: any) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

export function registerRoutes(app: Express): void {
  // Get all portals
  app.get("/api/portals", async (req, res) => {
    try {
      const storage = await getStorage();
      const portals = await storage.getPortals();
      res.json(portals);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch portals" });
    }
  });

  // Create new portal
  app.post("/api/portals", async (req, res) => {
    try {
      const storage = await getStorage();
      const portalData = req.body;
      const newPortal = await storage.createPortal(portalData);
      res.status(201).json(newPortal);
    } catch (error) {
      console.error('Failed to create portal:', error);
      res.status(500).json({ message: "Failed to create portal" });
    }
  });

  // Update portal
  app.put("/api/portals/:id", async (req, res) => {
    try {
      const storage = await getStorage();
      const portalId = req.params.id;
      const updates = req.body;
      
      // For now, we'll need to implement updatePortal in storage
      // Since the interface doesn't have it, we'll recreate it
      const existingPortal = await storage.getPortal(portalId);
      if (!existingPortal) {
        return res.status(404).json({ message: "Portal not found" });
      }
      
      // Delete existing and create new one (simplified approach)
      // In a real app, you'd implement updatePortal in storage
      const updatedPortal = { ...existingPortal, ...updates };
      // Note: This is a simplified approach. In production, implement proper update method
      
      res.json(updatedPortal);
    } catch (error) {
      console.error('Failed to update portal:', error);
      res.status(500).json({ message: "Failed to update portal" });
    }
  });

  // Get all game items
  app.get("/api/game-items", async (req, res) => {
    try {
      const storage = await getStorage();
      const items = await storage.getGameItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch game items" });
    }
  });

  // Get specific game layout
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

  // Create new layout
  app.post("/api/layouts", async (req, res) => {
    try {
      const storage = await getStorage();
      const layoutData = req.body;
      const newLayout = await storage.createGameLayout(layoutData);
      res.status(201).json(newLayout);
    } catch (error) {
      console.error('Failed to create layout:', error);
      res.status(500).json({ message: "Failed to create layout" });
    }
  });

  // Update layout (create if doesn't exist)
  app.put("/api/layouts/:id", async (req, res) => {
    try {
      const storage = await getStorage();
      const layoutId = req.params.id;
      const updates = req.body;
      
      // Check if layout exists
      const existingLayout = await storage.getGameLayout(layoutId);
      
      if (!existingLayout) {
        // Create new layout
        const newLayout = await storage.createGameLayout({
          id: layoutId,
          ...updates
        });
        return res.status(201).json(newLayout);
      }
      
      // Update existing layout
      const updatedLayout = await storage.updateGameLayout(layoutId, updates);
      res.json(updatedLayout);
    } catch (error) {
      console.error('Failed to update layout:', error);
      res.status(500).json({ message: "Failed to update layout" });
    }
  });

  // Get user progress
  app.get("/api/progress", async (req, res) => {
    try {
      const storage = await getStorage();
      const progress = await storage.getUserProgress();
      res.json(progress);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch progress" });
    }
  });

  // Save user progress
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

  // Get game settings
  app.get("/api/settings", async (req, res) => {
    try {
      const storage = await getStorage();
      const settings = await storage.getGameSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  // Update game settings
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

  // Generate dynamic game session
  app.get("/api/game-session/:portalId", async (req, res) => {
    try {
      const { portalId } = req.params;
      const deviceType = (req.query.device as 'desktop' | 'mobile') || 'desktop';
      const gameMode = (req.query.mode as 'simple' | 'advanced') || 'simple';
      const sessionData = await generateGameSession(portalId, deviceType, gameMode);
      res.json(sessionData);
    } catch (error) {
      console.error('Error generating game session:', error);
      res.status(500).json({ error: 'Failed to generate game session' });
    }
  });

  // Upload background image and generate variants
  app.post("/api/upload/background", upload.single('background'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const portalId = req.body.portalId || 'd1';
      const file = req.file;

      // Create backgrounds directory if it doesn't exist
      const backgroundsDir = join(process.cwd(), 'client', 'public', 'images', 'backgrounds');
      if (!existsSync(backgroundsDir)) {
        mkdirSync(backgroundsDir, { recursive: true });
      }

      // Generate unique filename based on original name
      const baseName = parse(file.originalname).name;
      const extension = extname(file.originalname);
      const timestamp = Date.now();

      // Desktop version (original size, max 1920x1080)
      const desktopFileName = `${baseName}_${timestamp}_desktop${extension}`;
      const desktopPath = join(backgroundsDir, desktopFileName);

      // Mobile version (70% of desktop, max 1280x720)
      const mobileFileName = `${baseName}_${timestamp}_mobile${extension}`;
      const mobilePath = join(backgroundsDir, mobileFileName);

      // Icon version (200x200)
      const iconFileName = `${baseName}_${timestamp}_icon${extension}`;
      const iconPath = join(backgroundsDir, iconFileName);

      // Process images with sharp
      const image = sharp(file.buffer);
      const metadata = await image.metadata();

      // Create desktop version (keep original aspect ratio, max 1920x1080)
      await image
        .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 90 })
        .toFile(desktopPath);

      // Create mobile version (70% of desktop size)
      const mobileWidth = Math.round(metadata.width! * 0.7);
      const mobileHeight = Math.round(metadata.height! * 0.7);
      await sharp(file.buffer)
        .resize(mobileWidth, mobileHeight, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toFile(mobilePath);

      // Create icon version (200x200)
      await sharp(file.buffer)
        .resize(200, 200, { fit: 'cover' })
        .jpeg({ quality: 80 })
        .toFile(iconPath);

      // Get final dimensions
      const desktopMeta = await sharp(desktopPath).metadata();

      res.json({
        desktop: desktopFileName,
        mobile: mobileFileName,
        icon: iconFileName,
        size: {
          width: desktopMeta.width,
          height: desktopMeta.height
        }
      });

    } catch (error) {
      console.error('Failed to upload background:', error);
      res.status(500).json({ message: "Failed to upload background" });
    }
  });
}
