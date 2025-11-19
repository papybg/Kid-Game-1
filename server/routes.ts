import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserProgressSchema, insertGameSettingsSchema } from "../shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  function normalizeIconValue(icon?: string | null) {
    if (!icon) return null;
    const cloud = process.env.CLOUDINARY_CLOUD_NAME || 'db8o7so6j';

    // If the string contains a Cloudinary URL anywhere, extract and return it
    const cloudMatch = icon.match(/https?:\/\/res\.cloudinary\.com\/.*$/i);
    if (cloudMatch) {
      return cloudMatch[0].replace('https:/', 'https://');
    }

    // Remove accidental local prefix like '/images/backgrounds/' or '/images/'
    let cleaned = icon.replace(/^\/images\/backgrounds\//i, '').replace(/^\/images\//i, '');

    // If cleaned is already a full URL, normalize and return
    if (/^https?:\/\//i.test(cleaned)) {
      return cleaned.replace('https:/', 'https://');
    }

    // If original started with http(s) but didn't match cloud pattern, normalize it
    if (/^https?:\/\//i.test(icon)) {
      return icon.replace('https:/', 'https://');
    }

    // Otherwise treat value as a Cloudinary public ID
    return `https://res.cloudinary.com/${cloud}/image/upload/${cleaned}`;
  }

  // Get all portals
  app.get("/api/portals", async (req, res) => {
    try {
      const portals = await storage.getPortals();
      const withUrls = portals.map(p => ({ ...p, icon_url: normalizeIconValue((p as any).icon) }));
      res.json(withUrls);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch portals" });
    }
  });

  // Get specific portal
  app.get("/api/portals/:id", async (req, res) => {
    try {
      const portal = await storage.getPortal(req.params.id);
      if (!portal) {
        return res.status(404).json({ message: "Portal not found" });
      }
      res.json({ ...portal, icon_url: normalizeIconValue((portal as any).icon) });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch portal" });
    }
  });

  // Get all game items
  app.get("/api/game-items", async (req, res) => {
    try {
      const items = await storage.getGameItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch game items" });
    }
  });

  // Get specific game layout
  app.get("/api/layouts/:id", async (req, res) => {
    try {
      const layout = await storage.getGameLayout(req.params.id);
      if (!layout) {
        return res.status(404).json({ message: "Layout not found" });
      }
      // Normalize background fields to absolute URLs
      const backgroundLarge = (layout as any).backgroundLarge;
      const backgroundSmall = (layout as any).backgroundSmall;
      const normalized = {
        ...layout,
        backgroundLarge_url: normalizeIconValue(backgroundLarge),
        backgroundSmall_url: normalizeIconValue(backgroundSmall),
      };
      res.json(normalized);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch layout" });
    }
  });

  // Get user progress
  app.get("/api/progress", async (req, res) => {
    try {
      const progress = await storage.getUserProgress();
      res.json(progress);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch progress" });
    }
  });

  // Save user progress
  app.post("/api/progress", async (req, res) => {
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

  // Get game settings
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getGameSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  // Update game settings
  app.patch("/api/settings", async (req, res) => {
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

  const httpServer = createServer(app);
  return httpServer;
}
