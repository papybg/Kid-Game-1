// Брой редове: 147
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

  const getSoundFile = (name: 'win' | 'bravo' | 'tryAgain'): HTMLAudioElement | null => {
    if (!isInitialized || !soundEnabled) return null;
    const url = VOICE_FILES[name];
    if (!url) return null;
    
    const audio = new Audio();
    // 1. ВАЖНО: Разрешаваме CDN заявки без cookies
    audio.crossOrigin = "anonymous";
    audio.src = url;

    audio.addEventListener('play', () => {
      stopCurrentAudio();
      setIsAudioPlaying(true);
      currentAudioRef.current = audio;
    });
    audio.addEventListener('ended', () => {
      setIsAudioPlaying(false);
      currentAudioRef.current = null;
    });
    audio.addEventListener('error', () => setIsAudioPlaying(false));
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
        const playPromise = voiceSound.play();
        if (playPromise !== undefined) {
            playPromise.catch(e => console.error(`Failed to play voice ${type}:`, e));
        }
    }
    return voiceSound;
  };

  const playItemSound = (item: GameItem, delay?: number): HTMLAudioElement | null => {
    if (!isInitialized || !soundEnabled || !item.audio) return null;
    console.log('playItemSound called with:', item.name, 'audio:', item.audio);

    let audio: HTMLAudioElement | null = null;
    
    const play = () => {
      // --- FIX: Correct handling of Cloudinary/CDN in Edge ---
      const sound = new Audio();
      sound.crossOrigin = "anonymous"; // Това казва на браузъра да не блокира файла заради Privacy
      sound.src = item.audio!;
      sound.volume = 0.7;
      
      sound.addEventListener('play', () => { 
        console.log('Audio play started for:', item.name);
        stopCurrentAudio(); 
        setIsAudioPlaying(true); 
        currentAudioRef.current = sound; 
      });
      sound.addEventListener('ended', () => { 
        setIsAudioPlaying(false); 
        currentAudioRef.current = null; 
      });
      sound.addEventListener('error', (e) => { 
        console.error('Audio error (check CORS/Format):', item.name, e);
        setIsAudioPlaying(false); 
        currentAudioRef.current = null; 
      });
      
      // Защита срещу блокиране на play()
      const playPromise = sound.play();

      if (playPromise !== undefined) {
          playPromise.then(() => {
            console.log('Audio playing successfully:', item.name);
          }).catch((e) => {
            console.warn('Playback prevented:', e);
            // Fallback: Ако mp3-то не тръгне, пускаме "бип" от синтезатора
            playTone(440, 0.1); 
          });
      }

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
