import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type GameMode = 'simple' | 'advanced';

interface SettingsState {
  // Audio settings
  soundEnabled: boolean;
  musicEnabled: boolean;

  // Game mode
  gameMode: GameMode;

  // Actions
  setSoundEnabled: (enabled: boolean) => void;
  setMusicEnabled: (enabled: boolean) => void;
  setGameMode: (mode: GameMode) => void;
  resetSettings: () => void;
}

const initialState = {
  soundEnabled: true,
  musicEnabled: true,
  gameMode: 'advanced' as GameMode,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setSoundEnabled: (enabled: boolean) => {
        set({ soundEnabled: enabled });
      },

      setMusicEnabled: (enabled: boolean) => {
        set({ musicEnabled: enabled });
      },

      setGameMode: (mode: GameMode) => {
        set({ gameMode: mode });
      },

      resetSettings: () => {
        set(initialState);
      },
    }),
    {
      name: 'game-settings',
      storage: createJSONStorage(() => localStorage),
      version: 1,
    }
  )
);

// Helper hooks for easier access
export const useSoundEnabled = () => useSettingsStore((state) => state.soundEnabled);
export const useMusicEnabled = () => useSettingsStore((state) => state.musicEnabled);
export const useGameMode = () => useSettingsStore((state) => state.gameMode);

// Helper functions
export const getCurrentSettings = () => {
  const state = useSettingsStore.getState();
  return {
    soundEnabled: state.soundEnabled,
    musicEnabled: state.musicEnabled,
    gameMode: state.gameMode,
  };
};

export const updateSettings = (updates: Partial<Omit<SettingsState, 'setSoundEnabled' | 'setMusicEnabled' | 'setGameMode' | 'resetSettings'>>) => {
  const state = useSettingsStore.getState();
  if (updates.soundEnabled !== undefined) state.setSoundEnabled(updates.soundEnabled);
  if (updates.musicEnabled !== undefined) state.setMusicEnabled(updates.musicEnabled);
  if (updates.gameMode !== undefined) state.setGameMode(updates.gameMode);
};