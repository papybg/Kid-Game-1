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
  
  // Пазим URL-ите, за да чистим паметта
  const activeBlobUrls = useRef<string[]>([]);

  useEffect(() => {
    return () => {
      activeBlobUrls.current.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

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

  // --- STEALTH MODE PLAYBACK ---
  const playItemSound = (item: GameItem, delay?: number): HTMLAudioElement | null => {
    if (!isInitialized || !soundEnabled || !item.audio) return null;

    let audioObj: HTMLAudioElement | null = null;

    const play = async () => {
        try {
            console.log(`Stealth fetching: ${item.name}`);
            
            // 1. ВАЖНО: credentials: 'omit' казва на Edge "Няма да ползвам бисквитки/storage"
            // Това е магическият ключ, който заобикаля Tracking Prevention
            const response = await fetch(item.audio!, {
                method: 'GET',
                credentials: 'omit', 
                mode: 'cors',
                headers: {
                    // Опитваме се да не кешираме, за да не тригерваме storage error
                    'Cache-Control': 'no-cache'
                }
            });

            if (!response.ok) throw new Error(`Fetch status: ${response.status}`);

            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            activeBlobUrls.current.push(blobUrl);

            const sound = new Audio(blobUrl);
            sound.volume = 1.0;

            sound.onplay = () => { 
                stopCurrentAudio(); 
                setIsAudioPlaying(true); 
                currentAudioRef.current = sound; 
            };

            sound.onended = () => { 
                setIsAudioPlaying(false); 
                currentAudioRef.current = null;
                URL.revokeObjectURL(blobUrl); // Чистим паметта
            };
            
            sound.onerror = (e) => {
                console.error("Blob playback error:", e);
                // Последен опит с fallback тонче
                playTone(300, 0.2); 
            };

            await sound.play();
            audioObj = sound;

        } catch (error) {
            console.warn("Stealth fetch failed, trying direct play as last resort:", error);
            
            // Ако всичко пропадне, пробваме "глупавия" начин
            // Добавяме рандъм параметър, за да излъжем кеша
            const directUrl = `${item.audio}?t=${Date.now()}`;
            const fallbackSound = new Audio(directUrl);
            
            // Този път БЕЗ crossOrigin, за да е "Opaque" заявка
            fallbackSound.play().catch(e => console.error("Direct play blocked:", e));
        }
    };

    if (delay && delay > 0) {
      setTimeout(play, delay);
    } else {
      play();
    }
    
    return audioObj;
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
