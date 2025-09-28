import type { Portal, GameSession } from "@shared/schema";

import apiPath from './config';

// API functions for fetching data from the backend (uses VITE_API_URL when provided)
export async function fetchPortals(): Promise<Portal[]> {
  const response = await fetch(apiPath('/api/portals'));
  if (!response.ok) {
    throw new Error('Failed to fetch portals');
  }
  return response.json();
}

export async function fetchGameSession(portalId: string, deviceType: 'desktop' | 'mobile' = 'desktop', gameMode: 'simple' | 'advanced' = 'simple', variantId?: string): Promise<GameSession> {
  const urlStr = apiPath(`/api/game-session/${portalId}`);
  // apiPath returns a string; convert to URL for query params
  const url = new URL(urlStr);
  url.searchParams.set('device', deviceType);
  url.searchParams.set('mode', gameMode);
  if (variantId) {
    url.searchParams.set('variant', variantId);
  }

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error('Failed to fetch game session');
  }
  return response.json();
}