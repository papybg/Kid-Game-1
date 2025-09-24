import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useAudio } from "../hooks/use-audio";
import { useSettingsStore } from "../lib/settings-store";
import type { GameItem } from "@shared/schema";

type AudioContextType = {
  isInitialized: boolean;
  soundEnabled: boolean;
  musicEnabled: boolean;
  effectsEnabled: boolean;
  isAudioPlaying: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  setMusicEnabled: (enabled: boolean) => void;
  setEffectsEnabled: (enabled: boolean) => void;
  playSound: (type: 'success' | 'error' | 'click' | 'start' | 'win' | 'bell') => void;
  playVoice: (type: 'bravo' | 'tryAgain') => void;
  playAnimalSound: (item: GameItem, delay?: number) => HTMLAudioElement | null; // Променяме да приема item
  getSoundFile: (name: 'win' | 'bravo' | 'tryAgain') => HTMLAudioElement | null; // НОВАТА ФУНКЦИЯ
  initializeAudio: () => Promise<void>;
};

const AudioContext = createContext<AudioContextType | undefined>(undefined);

const AUDIO_FILES: {
  voices: { [key: string]: string | null };
  animals: { [key: string]: string | null };
} = {
  voices: {
    bravo: '/audio/voices/bravo.wav',
    tryAgain: '/audio/voices/try-again.wav',
    win: '/audio/voices/win.wav', // ДОБАВЕНО: Звук за победа
  },
  animals: {
    h: '/audio/animals/cat.mp3',
    p: '/audio/animals/chicken.mp3',
    s: '/audio/animals/crow.mp3',
    r: '/audio/vehicles/bus.mp3',
    i: '/audio/vehicles/train.mp3'
  }
};

const ITEM_AUDIO_MAP: { [itemName: string]: string } = {
  'Котка': '/audio/animals/cat.mp3',
  'Куче': '/audio/animals/dog.mp3',
  'Кокошка': '/audio/animals/chicken.mp3',
  'Крава': '/audio/animals/cow.mp3',
  'Врана': '/audio/animals/crow.mp3',
  'Влак': '/audio/vehicles/train.mp3',
  'Автобус': '/audio/vehicles/bus.mp3',
  'Самолет': '/audio/vehicles/airplane.mp3',
  'Заек': '/audio/animals/wolf.mp3',
  'Пеперуда': '/audio/animals/monkey.mp3',
  'Пчела': '/audio/animals/monkey.mp3',
  'Птичка': '/audio/animals/crow.mp3',
  'Цвете': '/audio/animals/monkey.mp3',
  'Дърво': '/audio/animals/elephant.mp3'
};

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  
  const { soundEnabled, musicEnabled, setSoundEnabled: storeSetSoundEnabled } = useSettingsStore();
  const { initializeAudio: initAudio, playTone } = useAudio();
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  const stopCurrentAudio = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }
    setIsAudioPlaying(false);
  };

  const initializeAudio = async () => {
    try {
      await initAudio();
      setIsInitialized(true);
      console.log('Audio system initialized');
    } catch (error) {
      console.error('Failed to initialize audio:', error);
    }
  };

  const playSound = (type: 'success' | 'error' | 'click' | 'start' | 'win' | 'bell') => {
    if (!isInitialized || !soundEnabled) return;
    
    // Ако искаме да пуснем 'win' звук, вече ще използваме getSoundFile, за да имаме onended
    if (type === 'win') {
        const winSound = getSoundFile('win');
        winSound?.play();
        return;
    }

    const frequencies = { /* ... същите честоти ... */ };
    // ... останалата логика за тоновете
  };

  // --- НОВА ФУНКЦИЯ ---
  const getSoundFile = (name: 'win' | 'bravo' | 'tryAgain'): HTMLAudioElement | null => {
    if (!isInitialized || !soundEnabled) return null;

    const url = AUDIO_FILES.voices[name];
    
    if (url) {
        const audio = new Audio(url);
        // Управляваме глобалното състояние 'isAudioPlaying'
        audio.addEventListener('play', () => {
            stopCurrentAudio();
            setIsAudioPlaying(true);
            currentAudioRef.current = audio;
        });
        audio.addEventListener('ended', () => {
            setIsAudioPlaying(false);
            currentAudioRef.current = null;
        });
        audio.addEventListener('error', (e) => {
            console.error(`Sound file ${name} error:`, e);
            setIsAudioPlaying(false);
            currentAudioRef.current = null;
        });
        return audio;
    }
    return null;
  }

  const playVoice = (type: 'bravo' | 'tryAgain') => {
    const voiceSound = getSoundFile(type);
    voiceSound?.play().catch(e => console.error(`Failed to play voice ${type}:`, e));
  };

  const playAnimalSound = (item: GameItem, delay?: number) => {
    if (!isInitialized || !soundEnabled) return null;
    
    let audio: HTMLAudioElement | null = null;
    const playAfterDelay = () => {
      let audioUrl = item.audio; // Use item's audio first
      if (!audioUrl) {
        audioUrl = ITEM_AUDIO_MAP[item.name] || AUDIO_FILES.animals[item.index as keyof typeof AUDIO_FILES.animals];
      }
      if (audioUrl) {
        const sound = new Audio(audioUrl);
        sound.volume = 0.7;
        
        sound.addEventListener('play', () => {
            stopCurrentAudio();
            setIsAudioPlaying(true);
            currentAudioRef.current = sound;
        });
        sound.addEventListener('ended', () => {
            setIsAudioPlaying(false);
            currentAudioRef.current = null;
        });
        sound.addEventListener('error', () => {
            setIsAudioPlaying(false);
            currentAudioRef.current = null;
        });

        sound.play().catch(() => playTone(300, 0.3));
        audio = sound;
      } else {
        playTone(300, 0.3);
      }
    };

    if (delay && delay > 0) {
      setTimeout(playAfterDelay, delay);
      return null; // За delayed звуци не можем да върнем audio обект
    } else {
      playAfterDelay();
      return audio; // Връщаме създадения audio обект
    }
  };


  return (
    <AudioContext.Provider
      value={{
        isInitialized,
        soundEnabled,
        musicEnabled,
        effectsEnabled: true,
        isAudioPlaying,
        setSoundEnabled: storeSetSoundEnabled,
        setMusicEnabled: () => {},
        setEffectsEnabled: () => {},
        playSound,
        playVoice,
        playAnimalSound,
        getSoundFile, // ДОБАВЕНО ТУК
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