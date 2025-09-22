import type { Portal, GameSession } from "@shared/schema";

// API functions for fetching data from the backend

export async function fetchPortals(): Promise<Portal[]> {
  const response = await fetch('http://localhost:3005/api/portals');
  if (!response.ok) {
    throw new Error('Failed to fetch portals');
  }
  return response.json();
}

export async function fetchGameSession(portalId: string): Promise<GameSession> {
  const response = await fetch(`http://localhost:3005/api/game-session/${portalId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch game session');
  }
  return response.json();
}