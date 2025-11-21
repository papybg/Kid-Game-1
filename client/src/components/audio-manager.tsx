import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import * as Tone from 'tone';

interface AudioContextType {
  playSuccess: () => Promise<void>;
  playClick: () => Promise<void>;
  playItemSound: (itemName: string, audioUrl?: string, delay?: number) => Promise<void>;
  toggleMute: () => void;
  isMuted: boolean;
  initializeAudio: () => Promise<void>;
}

const AudioContext = createContext<AudioContextType | null>(null);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [isMuted, setIsMuted] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const synth = useRef<Tone.PolySynth | null>(null);

  const initializeAudio = async () => {
    if (isInitialized) return;

    try {
      await Tone.start();
      
      if (Tone.context.state !== 'running') {
        await Tone.context.resume();
      }

      synth.current = new Tone.PolySynth(Tone.Synth).toDestination();
      synth.current.volume.value = -10;
      
      setIsInitialized(true);
      console.log('Audio System Unlocked');
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
    }
  };

  const playSuccess = async () => {
    if (isMuted || !synth.current) return;
    try {
        await Tone.start();
        const now = Tone.now();
        synth.current.triggerAttackRelease("C5", "8n", now);
        synth.current.triggerAttackRelease("E5", "8n", now + 0.1);
        synth.current.triggerAttackRelease("G5", "8n", now + 0.2);
    } catch (e) { console.log("Synth error", e); }
  };

  const playClick = async () => {
    if (isMuted || !synth.current) return;
    try {
        await Tone.start(); 
        synth.current.triggerAttackRelease("G4", "16n");
    } catch (e) { console.log("Click error", e); }
  };

  // HTML5 Audio Player (Стабилен за всички браузъри)
  const playItemSound = (itemName: string, audioUrl?: string, delay: number = 0): Promise<void> => {
    return new Promise((resolve) => {
        if (isMuted || !audioUrl) {
            resolve();
            return;
        }

        setTimeout(() => {
            const player = new Audio(audioUrl);
            
            player.onended = () => { resolve(); };

            player.onerror = (e) => {
                console.warn(`Audio error for ${itemName}:`, e);
                resolve(); 
            };

            const playPromise = player.play();

            if (playPromise !== undefined) {
                playPromise.catch((error) => {
                    console.warn("Browser blocked audio autoplay:", error);
                    resolve();
                });
            }
        }, delay);
    });
  };

  const toggleMute = () => {
    setIsMuted(prev => !prev);
  };

  useEffect(() => {
    const init = async () => {
        try {
            synth.current = new Tone.PolySynth(Tone.Synth).toDestination();
        } catch (e) {}
    };
    init();
    
    const unlockHandler = () => {
        initializeAudio();
        window.removeEventListener('click', unlockHandler);
        window.removeEventListener('touchstart', unlockHandler);
    };
    
    window.addEventListener('click', unlockHandler);
    window.addEventListener('touchstart', unlockHandler);
    
    return () => {
        window.removeEventListener('click', unlockHandler);
        window.removeEventListener('touchstart', unlockHandler);
    };
  }, []);

  return (
    <AudioContext.Provider value={{ 
      playSuccess, 
      playClick, 
      playItemSound, 
      toggleMute, 
      isMuted,
      initializeAudio 
    }}>
      {children}
    </AudioContext.Provider>
  );
}

// ТУК БЕШЕ ГРЕШКАТА - Върнах старото име, за да не гърми App.tsx
export function useAudioContext() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudioContext must be used within an AudioProvider');
  }
  return context;
}
