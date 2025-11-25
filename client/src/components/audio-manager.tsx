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
  playSound: (type: 'success' | 'error' | 'click' | 'start' | 'bell') => void;
  playVoice: (type: 'bravo' | 'tryAgain') => HTMLAudioElement | null;
  playItemSound: (item: GameItem, delay?: number) => HTMLAudioElement | null;
  getSoundFile: (name: 'win' | 'bravo' | 'tryAgain') => HTMLAudioElement | null;
  initializeAudio: () => Promise<void>;
};

const AudioContext = createContext<AudioContextType | undefined>(undefined);

const VOICE_FILES: { [key: string]: string } = {
  bravo: '/audio/voices/bravo.wav',
  tryAgain: '/audio/voices/try-again.wav',
  win: '/audio/voices/win.wav',
};

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  
  const { soundEnabled, setSoundEnabled: storeSetSoundEnabled } = useSettingsStore();
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

  // ТАЗИ ФУНКЦИЯ ПРЕВРЪЩА Cloudinary В ЛОКАЛЕН ЛИНК
  const getProxyUrl = (url: string) => {
      if (!url) return '';
      // Ако вече е локален, не го пипаме
      if (url.startsWith('/')) return url;
      
      // Ако е от Cloudinary, го пренасочваме през нашето прокси
      if (url.includes('cloudinary.com')) {
          // Търсим частта след /upload/
          const parts = url.split('/upload/');
          if (parts.length === 2) {
             // Връщаме /game-audio/v1234.../cat.mp3
             return `/game-audio/${parts[1]}`;
          }
      }
      return url;
  };

  const getSoundFile = (name: 'win' | 'bravo' | 'tryAgain'): HTMLAudioElement | null => {
    if (!isInitialized || !soundEnabled) return null;
    const url = VOICE_FILES[name];
    if (!url) return null;
    
    // Стандартно аудио - без Fetch, без магии
    const audio = new Audio(url);
    
    audio.onplay = () => {
      stopCurrentAudio();
      setIsAudioPlaying(true);
      currentAudioRef.current = audio;
    };
    audio.onended = () => {
      setIsAudioPlaying(false);
      currentAudioRef.current = null;
    };
    return audio;
  };
  
  const playSound = (type: 'success' | 'error' | 'click' | 'start' | 'bell') => {
    if (!isInitialized || !soundEnabled) return;
    const frequencies = {
      success: [440, 554, 659], error: [220, 233, 246], click: [800],
      start: [261, 329, 392], bell: [800, 1000, 1200],
    };
    // @ts-ignore
    const freqs = frequencies[type];
    if (freqs) freqs.forEach((freq: number, index: number) => setTimeout(() => playTone(freq, 0.2), index * 100));
  };
  
  const playVoice = (type: 'bravo' | 'tryAgain'): HTMLAudioElement | null => {
    const voiceSound = getSoundFile(type);
    if (voiceSound) {
        voiceSound.play().catch(e => console.error("Voice error", e));
    }
    return voiceSound;
  };

  const playItemSound = (item: GameItem, delay?: number): HTMLAudioElement | null => {
    if (!isInitialized || !soundEnabled || !item.audio) return null;
    
    // 1. Взимаме "безопасния" линк
    const safeUrl = getProxyUrl(item.audio);
    console.log(`Playing proxy audio: ${safeUrl} (Original: ${item.audio})`);

    let audio: HTMLAudioElement | null = null;
    
    const play = () => {
      const sound = new Audio(safeUrl);
      sound.volume = 1.0;
      
      sound.onplay = () => { 
        console.log('Audio STARTED:', item.name);
        stopCurrentAudio(); 
        setIsAudioPlaying(true); 
        currentAudioRef.current = sound; 
      };
      
      sound.onended = () => { 
        console.log('Audio ENDED:', item.name);
        setIsAudioPlaying(false); 
        currentAudioRef.current = null; 
      };
      
      sound.onerror = (e) => {
        console.error('Audio ERROR:', item.name, e);
        playTone(200, 0.2); // Fallback
      };
      
      // Просто .play() - без fetch, без blob, без headers
      sound.play().catch((e) => {
        console.warn('Autoplay prevented:', e);
      });

      audio = sound;
    };

    if (delay && delay > 0) {
      setTimeout(play, delay);
    } else {
      play();
    }
    return audio;
  };

  return (
    <AudioContext.Provider
      value={{
        isInitialized,
        soundEnabled,
        isAudioPlaying,
        setSoundEnabled: storeSetSoundEnabled,
        musicEnabled: false,
        effectsEnabled: true,
        setMusicEnabled: () => {},
        setEffectsEnabled: () => {},
        playSound,
        playVoice,
        playItemSound,
        getSoundFile,
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
