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
  'Крава': '/audio/animals/elephant.mp3', // Using elephant as cow alternative
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
  
  // Audio queue system
  const audioQueueRef = useRef<Array<{ type: 'voice' | 'animal' | 'sound', data: any, delay?: number }>>([]);
  const isProcessingQueueRef = useRef(false);
  
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

      // Preload animal files
      const animalFiles = Object.entries(AUDIO_FILES.animals);
      await Promise.all(animalFiles.map(([key, url]) => {
        return new Promise<void>((resolve) => {
          if (!url) {
            resolve();
            return;
          }
          const audio = new Audio(url);
          audio.addEventListener('canplaythrough', () => resolve());
          audio.addEventListener('error', () => resolve()); // Continue even if file fails
          audioElementsRef.current[`animal-${key}`] = audio;
        });
      }));

      // Preload specific item audio files
      const itemFiles = Object.entries(ITEM_AUDIO_MAP);
      await Promise.all(itemFiles.map(([key, url]) => {
        return new Promise<void>((resolve) => {
          const audio = new Audio(url);
          audio.addEventListener('canplaythrough', () => resolve());
          audio.addEventListener('error', () => resolve()); // Continue even if file fails
          audioElementsRef.current[`item-${key}`] = audio;
        });
      }));
      
      setIsInitialized(true);
      console.log('Audio system initialized with tone support');
    } catch (error) {
      console.error('Failed to initialize audio:', error);
    }
  };

  // Audio queue processing
  const processAudioQueue = async () => {
    if (isProcessingQueueRef.current || audioQueueRef.current.length === 0) return;
    
    isProcessingQueueRef.current = true;
    
    while (audioQueueRef.current.length > 0) {
      const audioItem = audioQueueRef.current.shift();
      if (!audioItem) continue;
      
      setIsAudioPlaying(true);
      
      // Add delay if specified
      if (audioItem.delay) {
        await new Promise(resolve => setTimeout(resolve, audioItem.delay));
      }
      
      // Play the audio
      if (audioItem.type === 'voice') {
        await playVoiceInternal(audioItem.data);
      } else if (audioItem.type === 'animal') {
        await playAnimalSoundInternal(audioItem.data);
      } else if (audioItem.type === 'sound') {
        await playSoundInternal(audioItem.data);
      }
      
      // Small delay between different audio types
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    setIsAudioPlaying(false);
    isProcessingQueueRef.current = false;
  };

  const addToAudioQueue = (type: 'voice' | 'animal' | 'sound', data: any, delay?: number) => {
    audioQueueRef.current.push({ type, data, delay });
    processAudioQueue();
  };

  // Internal play functions that return promises
  const playVoiceInternal = (type: 'bravo' | 'tryAgain'): Promise<void> => {
    return new Promise((resolve) => {
      const audioUrl = AUDIO_FILES.voices[type];
      if (audioUrl) {
        const audio = audioElementsRef.current[`voice-${type}`];
        if (audio) {
          audio.currentTime = 0;
          audio.play().catch(() => {
            // Fallback to tone
            if (type === 'bravo') {
              playSound('success');
            } else {
              playSound('error');
            }
            resolve();
          });
          
          audio.addEventListener('ended', () => resolve(), { once: true });
          audio.addEventListener('error', () => resolve(), { once: true });
          return;
        }
      }
      
      // Fallback to tone
      if (type === 'bravo') {
        playSound('success');
      } else {
        playSound('error');
      }
      resolve();
    });
  };

  const playAnimalSoundInternal = (itemNameOrIndex: string): Promise<void> => {
    return new Promise((resolve) => {
      // First check if this is a specific item name
      if (ITEM_AUDIO_MAP[itemNameOrIndex]) {
        const audio = audioElementsRef.current[`item-${itemNameOrIndex}`];
        if (audio) {
          audio.currentTime = 0;
          audio.play().catch(() => {
            playIndexBasedAudioInternal(itemNameOrIndex, resolve);
          });
          
          audio.addEventListener('ended', () => resolve(), { once: true });
          audio.addEventListener('error', () => resolve(), { once: true });
          return;
        }
      }
      
      // Fallback to index-based audio
      playIndexBasedAudioInternal(itemNameOrIndex, resolve);
    });
  };

  const playIndexBasedAudioInternal = (animalIndex: string, resolve: () => void) => {
    const audioUrl = AUDIO_FILES.animals[animalIndex as keyof typeof AUDIO_FILES.animals];
    if (audioUrl) {
      const audio = audioElementsRef.current[`animal-${animalIndex}`];
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch(() => {
          playToneForAnimal(animalIndex);
          resolve();
        });
        
        audio.addEventListener('ended', () => resolve(), { once: true });
        audio.addEventListener('error', () => resolve(), { once: true });
        return;
      }
    }
    
    // Final fallback to tone
    playToneForAnimal(animalIndex);
    resolve();
  };

  const playSoundInternal = (type: 'success' | 'error' | 'click' | 'start' | 'win'): Promise<void> => {
    return new Promise((resolve) => {
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
        // Resolve after the longest tone duration
        setTimeout(resolve, freqs.length * 100 + 200);
      } else {
        resolve();
      }
    });
  };

  const playSound = (type: 'success' | 'error' | 'click' | 'start' | 'win') => {
    if (!isInitialized || !soundEnabled || !effectsEnabled) return;
    addToAudioQueue('sound', type);
  };

  const playVoice = (type: 'bravo' | 'tryAgain') => {
    if (!isInitialized || !soundEnabled || !effectsEnabled) return;
    addToAudioQueue('voice', type);
  };

  const playAnimalSound = (itemNameOrIndex: string, delay?: number) => {
    if (!isInitialized || !soundEnabled || !effectsEnabled) return;
    addToAudioQueue('animal', itemNameOrIndex, delay || 1000); // Reduced from 2000ms to 1000ms
  };

  const playToneForAnimal = (animalIndex: string) => {
    // Use tone-based sounds as fallback
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
