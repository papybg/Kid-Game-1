import { createContext, useContext, useEffect, useState } from "react";
import { useAudio } from "@/hooks/use-audio";

type AudioContextType = {
  isInitialized: boolean;
  soundEnabled: boolean;
  musicEnabled: boolean;
  effectsEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  setMusicEnabled: (enabled: boolean) => void;
  setEffectsEnabled: (enabled: boolean) => void;
  playSound: (type: 'success' | 'error' | 'click' | 'start' | 'win') => void;
  initializeAudio: () => Promise<void>;
};

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [effectsEnabled, setEffectsEnabled] = useState(true);
  
  const { initializeAudio: initAudio, playTone } = useAudio();

  useEffect(() => {
    // Load settings from localStorage
    const savedSound = localStorage.getItem('soundEnabled');
    const savedMusic = localStorage.getItem('musicEnabled');
    const savedEffects = localStorage.getItem('effectsEnabled');

    if (savedSound !== null) setSoundEnabled(savedSound === 'true');
    if (savedMusic !== null) setMusicEnabled(savedMusic === 'true');
    if (savedEffects !== null) setEffectsEnabled(savedEffects === 'true');
  }, []);

  useEffect(() => {
    localStorage.setItem('soundEnabled', soundEnabled.toString());
  }, [soundEnabled]);

  useEffect(() => {
    localStorage.setItem('musicEnabled', musicEnabled.toString());
  }, [musicEnabled]);

  useEffect(() => {
    localStorage.setItem('effectsEnabled', effectsEnabled.toString());
  }, [effectsEnabled]);

  const initializeAudio = async () => {
    try {
      await initAudio();
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize audio:', error);
    }
  };

  const playSound = (type: 'success' | 'error' | 'click' | 'start' | 'win') => {
    if (!isInitialized || !soundEnabled || !effectsEnabled) return;

    const frequencies = {
      success: [440, 554, 659], // A, C#, E (happy chord)
      error: [220, 233, 246], // A, A#, B (dissonant)
      click: [800], // High click
      start: [261, 329, 392], // C, E, G (major chord)
      win: [523, 659, 784, 1047], // C, E, G, C (victory fanfare)
    };

    const freqs = frequencies[type];
    if (freqs && Array.isArray(freqs)) {
      freqs.forEach((freq, index) => {
        setTimeout(() => playTone(freq, 0.2), index * 100);
      });
    }
  };

  return (
    <AudioContext.Provider
      value={{
        isInitialized,
        soundEnabled,
        musicEnabled,
        effectsEnabled,
        setSoundEnabled,
        setMusicEnabled,
        setEffectsEnabled,
        playSound,
        initializeAudio,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export const useAudioContext = () => {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudioContext must be used within an AudioProvider');
  }
  return context;
};
