import type { Express } from "express";
import { createServer, type Server } from "http";
import { getStorage } from "./storage";
import { insertUserProgressSchema, insertGameSettingsSchema } from "../shared/schema";
import { z } from "zod";
import { generateGameSession } from "./gameService";

export async function registerRoutes(app: Express): Promise<Server> {
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

  // Get specific portal
  app.get("/api/portals/:id", async (req, res) => {
    try {
      const storage = await getStorage();
      const portal = await storage.getPortal(req.params.id);
      if (!portal) {
        return res.status(404).json({ message: "Portal not found" });
      }
      res.json(portal);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch portal" });
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
      const sessionData = await generateGameSession(portalId);
      res.json(sessionData);
    } catch (error) {
      console.error('Error generating game session:', error);
      res.status(500).json({ error: 'Failed to generate game session' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
