import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useAudio } from "../hooks/use-audio";

type AudioContextType = {
  isInitialized: boolean;
  soundEnabled: boolean;
  musicEnabled: boolean;
  effectsEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  setMusicEnabled: (enabled: boolean) => void;
  setEffectsEnabled: (enabled: boolean) => void;
  playSound: (type: 'success' | 'error' | 'click' | 'start' | 'win') => void;
  playVoice: (type: 'bravo' | 'tryAgain') => void;
  playAnimalSound: (animalIndex: string) => void;
  initializeAudio: () => Promise<void>;
};

const AudioContext = createContext<AudioContextType | undefined>(undefined);

// Audio file URLs - can be replaced with actual Bulgarian recordings
const AUDIO_FILES: {
  voices: { [key: string]: string | null };
  animals: { [key: string]: string | null };
} = {
  voices: {
    bravo: null, // Will use tone fallback
    tryAgain: null // Will use tone fallback
  },
  animals: {
    h: null, // Will use tone fallback
    p: null,
    s: null,
    r: null,
    i: null
  }
};

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [effectsEnabled, setEffectsEnabled] = useState(true);
  
  const { initializeAudio: initAudio, playTone } = useAudio();
  
  // Store preloaded audio elements
  const audioElementsRef = useRef<Record<string, HTMLAudioElement>>({});

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
      
      // Preload voice files (skip null urls)
      const voiceFiles = Object.entries(AUDIO_FILES.voices);
      await Promise.all(voiceFiles.map(([key, url]) => {
        return new Promise<void>((resolve) => {
          if (!url) {
            resolve();
            return;
          }
          const audio = new Audio(url);
          audio.addEventListener('canplaythrough', () => resolve());
          audio.addEventListener('error', () => resolve()); // Continue even if file fails
          audioElementsRef.current[`voice-${key}`] = audio;
        });
      }));
      
      setIsInitialized(true);
      console.log('Audio system initialized with tone support');
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

  const playVoice = (type: 'bravo' | 'tryAgain') => {
    if (!isInitialized || !soundEnabled || !effectsEnabled) return;

    // Always use tone fallback for now
    if (type === 'bravo') {
      playSound('success');
    } else {
      playSound('error');
    }
  };

  const playAnimalSound = (animalIndex: string) => {
    if (!isInitialized || !soundEnabled || !effectsEnabled) return;

    // Use tone-based sounds for now
    const frequencies = {
      h: 330, // Home animals - warm tone
      p: 280, // Farm animals - lower tone
      s: 520, // Sky - higher tone
      r: 200, // Road - deeper tone
      i: 180  // Industrial - lowest tone
    };
    const freq = frequencies[animalIndex as keyof typeof frequencies] || 300;
    playTone(freq, 0.4);
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
        playVoice,
        playAnimalSound,
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
