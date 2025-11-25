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

  // Пазим URL-ите на блобовете, за да ги чистим и да не пълним паметта
  const activeBlobUrls = useRef<string[]>([]);

  useEffect(() => {
    // Cleanup при демонтиране на компонента
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
    
    audio.addEventListener('play', () => {
      stopCurrentAudio();
      setIsAudioPlaying(true);
      currentAudioRef.current = audio;
    });
    audio.addEventListener('ended', () => {
      setIsAudioPlaying(false);
      currentAudioRef.current = null;
    });
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
        const p = voiceSound.play();
        if (p !== undefined) {
            p.catch(e => console.log("Voice play blocked", e));
        }
    }
    return voiceSound;
  };

  // --- ЯДРЕНАТА ОПЦИЯ: FETCH + BLOB ---
  const playItemSound = (item: GameItem, delay?: number): HTMLAudioElement | null => {
    if (!isInitialized || !soundEnabled || !item.audio) return null;
    
    console.log('Fetching audio via Blob strategy for:', item.name);

    let audioObj: HTMLAudioElement | null = null;
    
    const play = async () => {
      try {
        // 1. Ръчно изтегляне на файла. Това заобикаля Tracking Prevention,
        // защото е просто "data fetch", а не "third-party media play".
        const response = await fetch(item.audio!);
        
        if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
        
        // 2. Превръщане в Blob (сурови данни)
        const blob = await response.blob();
        
        // 3. Създаване на локален URL (blob:http://localhost:xxxx/....)
        const blobUrl = URL.createObjectURL(blob);
        activeBlobUrls.current.push(blobUrl); // Пазим го за почистване

        // 4. Пускане на локалния URL
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
            // Освобождаваме паметта след като свърши
            URL.revokeObjectURL(blobUrl); 
        };

        sound.onerror = (e) => {
             console.error("Blob playback failed", e);
             playTone(200, 0.2); // Fallback
        };

        const playPromise = sound.play();
        if (playPromise !== undefined) {
            playPromise.catch(e => console.warn("Play blocked:", e));
        }

        audioObj = sound;

      } catch (err) {
        console.error("Manual fetch failed. Likely CORS or Network.", err);
        // Последен опит - директно (понякога работи, ако fetch е блокиран)
        const directSound = new Audio(item.audio!);
        directSound.play().catch(() => playTone(200, 0.2));
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
