import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useAudio } from "../hooks/use-audio";

type AudioContextType = {
  isInitialized: boolean;
  soundEnabled: boolean;
  musicEnabled: boolean;
  effectsEnabled: boolean;
  isAudioPlaying: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  setMusicEnabled: (enabled: boolean) => void;
  setEffectsEnabled: (enabled: boolean) => void;
  playSound: (type: 'success' | 'error' | 'click' | 'start' | 'win') => void;
  playVoice: (type: 'bravo' | 'tryAgain') => void;
  playAnimalSound: (itemNameOrIndex: string, delay?: number) => void;
  initializeAudio: () => Promise<void>;
};

const AudioContext = createContext<AudioContextType | undefined>(undefined);

// Audio file URLs - Bulgarian audio files from the repository
const AUDIO_FILES: {
  voices: { [key: string]: string | null };
  animals: { [key: string]: string | null };
} = {
  voices: {
    bravo: '/audio/voices/bravo.wav',
    tryAgain: '/audio/voices/try-again.wav'
  },
  animals: {
    h: '/audio/animals/cat.mp3',        // Home animals - cat (primary)
    p: '/audio/animals/chicken.mp3',    // Farm animals - chicken (primary)
    s: '/audio/animals/crow.mp3',       // Sky animals - crow (primary)
    r: '/audio/vehicles/bus.mp3',       // Road vehicles - bus (primary)
    i: '/audio/vehicles/train.mp3'      // Industrial vehicles - train (primary)
  }
};

// Specific audio mappings for individual items
const ITEM_AUDIO_MAP: { [itemName: string]: string } = {
  'Котка': '/audio/animals/cat.mp3',
  'Куче': '/audio/animals/dog.mp3',
  'Кокошка': '/audio/animals/chicken.mp3',
  'Крава': '/audio/animals/cow.mp3', // Using cow.mp3 for cow sound
  'Врана': '/audio/animals/crow.mp3',
  'Влак': '/audio/vehicles/train.mp3',
  'Автобус': '/audio/vehicles/bus.mp3',
  'Самолет': '/audio/vehicles/airplane.mp3',
  'Заек': '/audio/animals/wolf.mp3', // Using wolf as rabbit alternative
  'Пеперуда': '/audio/animals/monkey.mp3', // Using monkey for butterfly
  'Пчела': '/audio/animals/monkey.mp3', // Using monkey for bee
  'Птичка': '/audio/animals/crow.mp3', // Using crow for little bird
  'Цвете': '/audio/animals/monkey.mp3', // Using monkey for flower
  'Дърво': '/audio/animals/elephant.mp3' // Using elephant for tree
};

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [effectsEnabled, setEffectsEnabled] = useState(true);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  
  const { initializeAudio: initAudio, playTone } = useAudio();
  
  // Track currently playing audio elements to prevent overlap
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  // Stop any currently playing audio
  const stopCurrentAudio = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }
    setIsAudioPlaying(false);
  };

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
      console.log('Audio system initialized');
    } catch (error) {
      console.error('Failed to initialize audio:', error);
    }
  };

  // Remove all complex queue and preloading functions
  const playSound = (type: 'success' | 'error' | 'click' | 'start' | 'win') => {
    if (!isInitialized || !soundEnabled || !effectsEnabled) return;
    
    const frequencies = {
      success: [440, 554, 659],
      error: [220, 233, 246], 
      click: [800],
      start: [261, 329, 392],
      win: [523, 659, 784, 1047],
    };

    const freqs = frequencies[type];
    if (freqs) {
      freqs.forEach((freq, index) => {
        setTimeout(() => playTone(freq, 0.2), index * 100);
      });
    }
  };

  const playVoice = (type: 'bravo' | 'tryAgain') => {
    if (!isInitialized || !soundEnabled || !effectsEnabled) return;

    // Stop any currently playing audio first
    stopCurrentAudio();

    // Simple direct audio playback
    const audioUrl = AUDIO_FILES.voices[type];
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.volume = 0.9; // Increased volume
      currentAudioRef.current = audio;
      setIsAudioPlaying(true);

      audio.addEventListener('loadstart', () => {
        console.log(`Loading voice: ${type}`);
      });

      audio.addEventListener('canplay', () => {
        console.log(`Voice ${type} ready to play, duration: ${audio.duration}s`);
      });

      audio.play().then(() => {
        console.log(`Playing voice: ${type}`);
      }).catch((error) => {
        console.error(`Failed to play voice ${type}:`, error);
        // Simple tone fallback
        if (type === 'bravo') {
          playSound('success');
        } else {
          playSound('error');
        }
        setIsAudioPlaying(false);
      });

      audio.addEventListener('ended', () => {
        console.log(`Voice ${type} ended`);
        setIsAudioPlaying(false);
        currentAudioRef.current = null;
      });

      audio.addEventListener('error', (e) => {
        console.error(`Voice ${type} error:`, e);
        setIsAudioPlaying(false);
        currentAudioRef.current = null;
      });
    } else {
      console.warn(`No audio URL for voice: ${type}`);
      // Simple tone fallback
      if (type === 'bravo') {
        playSound('success');
      } else {
        playSound('error');
      }
    }
  };  const playAnimalSound = (itemNameOrIndex: string, delay?: number) => {
    if (!isInitialized || !soundEnabled || !effectsEnabled) return;
    
    const playAfterDelay = () => {
      // Stop any currently playing audio first
      stopCurrentAudio();
      
      // Simple direct audio playback without queue system
      const audioUrl = ITEM_AUDIO_MAP[itemNameOrIndex] || AUDIO_FILES.animals[itemNameOrIndex as keyof typeof AUDIO_FILES.animals];
      
      if (audioUrl) {
        const audio = new Audio(audioUrl);
        audio.volume = 0.7;
        currentAudioRef.current = audio;
        setIsAudioPlaying(true);
        
        audio.play().catch(() => {
          // Simple tone fallback
          playTone(300, 0.3);
          setIsAudioPlaying(false);
        });
        
        audio.addEventListener('ended', () => {
          setIsAudioPlaying(false);
          currentAudioRef.current = null;
        });
        
        audio.addEventListener('error', () => {
          setIsAudioPlaying(false);
          currentAudioRef.current = null;
        });
      } else {
        // Simple tone fallback
        playTone(300, 0.3);
      }
    };

    if (delay && delay > 0) {
      setTimeout(playAfterDelay, delay);
    } else {
      playAfterDelay();
    }
  };

  const playToneForAnimal = (animalIndex: string) => {
    // Simple tone fallback
    playTone(300, 0.3);
  };

  return (
    <AudioContext.Provider
      value={{
        isInitialized,
        soundEnabled,
        musicEnabled,
        effectsEnabled,
        isAudioPlaying,
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
