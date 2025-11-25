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

  // Helper: Конструира прокси URL, но само ако сме в среда, която го поддържа
  const getProxyUrl = (url: string) => {
      if (!url || !url.includes('cloudinary.com')) return url;
      const parts = url.split('/upload/');
      if (parts.length === 2) {
         return `/game-audio/${parts[1]}`;
      }
      return url;
  };

  const getSoundFile = (name: 'win' | 'bravo' | 'tryAgain'): HTMLAudioElement | null => {
    if (!isInitialized || !soundEnabled) return null;
    const url = VOICE_FILES[name];
    if (!url) return null;
    
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

    // СТРАТЕГИЯТА "УМЕН FALLBACK"
    const proxyUrl = getProxyUrl(item.audio);
    const originalUrl = item.audio;

    console.log(`Trying Proxy: ${proxyUrl}`);

    let audio: HTMLAudioElement | null = null;
    
    const play = () => {
      // 1. Пробваме с Прокси URL-а
      const sound = new Audio(proxyUrl);
      sound.volume = 1.0;
      
      sound.onplay = () => { 
        console.log('Audio STARTED (Proxy):', item.name);
        stopCurrentAudio(); 
        setIsAudioPlaying(true); 
        currentAudioRef.current = sound; 
      };
      
      sound.onended = () => { 
        setIsAudioPlaying(false); 
        currentAudioRef.current = null; 
      };
      
      // 2. АКО ПРОКСИТО ГРЪМНЕ (404 грешката, която виждаш в лога)
      sound.onerror = (e) => {
        console.warn('Proxy failed (404 likely). Switching to Direct URL...', item.name);
        
        // Веднага сменяме източника на оригиналния
        sound.src = originalUrl!;
        
        // Опитваме пак
        sound.play().then(() => {
            console.log('Audio recovered with Direct URL');
        }).catch(err => {
            console.error('Direct play also failed:', err);
            playTone(200, 0.2); // Последен шанс - бип
        });
      };
      
      sound.play().catch((e) => {
        console.warn('Autoplay prevented on proxy attempt:', e);
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
