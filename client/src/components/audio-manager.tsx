import { createContext, useContext, useEffect, useRef, useState } from "react";
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
  playVoice: (type: 'bravo' | 'tryAgain') => void;
  playAnimalSound: (animalIndex: string) => void;
  initializeAudio: () => Promise<void>;
};

const AudioContext = createContext<AudioContextType | undefined>(undefined);

// Audio file URLs - can be replaced with actual Bulgarian recordings
const AUDIO_FILES = {
  voices: {
    bravo: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DwuGwdBzCLz/LNfywFJHTBrdRmMQwVXrrm7qxdFwxAluDx0nkxBC15vefMHKv//+w=', // Simple beep tone as placeholder
    tryAgain: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DwuGwdBzCLz/LNfywFJHTBrdRmMQwVXbrm7qxdFwxAluDx0nkxBC15vefM8N2QQAoUXrTp66hVFA='
  },
  animals: {
    h: '/audio/animals/cat-meow.mp3', // Placeholder URLs
    p: '/audio/animals/chicken-cluck.mp3',
    s: '/audio/animals/bird-chirp.mp3',
    r: '/audio/vehicles/engine.mp3',
    i: '/audio/vehicles/train.mp3'
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
      
      // Preload voice files
      const voiceFiles = Object.entries(AUDIO_FILES.voices);
      await Promise.all(voiceFiles.map(([key, url]) => {
        return new Promise<void>((resolve) => {
          const audio = new Audio(url);
          audio.addEventListener('canplaythrough', () => resolve());
          audio.addEventListener('error', () => resolve()); // Continue even if file fails
          audioElementsRef.current[`voice-${key}`] = audio;
        });
      }));
      
      setIsInitialized(true);
      console.log('Audio system initialized with voice support');
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

    const audioKey = `voice-${type}`;
    const audio = audioElementsRef.current[audioKey];
    
    if (audio) {
      audio.currentTime = 0; // Reset to beginning
      audio.play().catch(error => {
        console.warn('Failed to play voice audio:', error);
        // Fallback to tone if voice file fails
        if (type === 'bravo') {
          playSound('success');
        } else {
          playSound('error');
        }
      });
    } else {
      // Fallback to tones
      if (type === 'bravo') {
        playSound('success');
      } else {
        playSound('error');
      }
    }
  };

  const playAnimalSound = (animalIndex: string) => {
    if (!isInitialized || !soundEnabled || !effectsEnabled) return;

    const soundUrl = AUDIO_FILES.animals[animalIndex as keyof typeof AUDIO_FILES.animals];
    if (soundUrl) {
      // Create a new audio element for each play to allow overlapping sounds
      const audio = new Audio(soundUrl);
      audio.volume = 0.7;
      audio.play().catch((error: unknown) => {
        console.warn(`Failed to play animal sound for ${animalIndex}:`, error);
        // Fallback to a pleasant tone
        playTone(330, 0.3); // Pleasant frequency
      });
    } else {
      // Fallback tone based on animal category
      const frequencies = {
        h: 330, // Home animals - warm tone
        p: 280, // Farm animals - lower tone
        s: 520, // Sky - higher tone
        r: 200, // Road - deeper tone
        i: 180  // Industrial - lowest tone
      };
      const freq = frequencies[animalIndex as keyof typeof frequencies] || 300;
      playTone(freq, 0.4);
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
