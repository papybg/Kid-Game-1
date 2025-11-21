import React, { createContext, useContext, useState, useEffect } from 'react';

interface AudioContextType {
  playSuccess: () => void;
  playClick: () => void;
  playItemSound: (itemName: string, audioUrl?: string, delay?: number) => Promise<void>;
  toggleMute: () => void;
  isMuted: boolean;
  initializeAudio: () => void;
}

const AudioContext = createContext<AudioContextType | null>(null);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [isMuted, setIsMuted] = useState(false);

  // Прости звукови ефекти (Beep) с Web Audio API (без библиотеки)
  const playBeep = (freq: number = 440, type: 'sine' | 'square' = 'sine', duration: number = 0.1) => {
    if (isMuted) return;
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + duration);
    } catch (e) {
        console.error("Beep error", e);
    }
  };

  const initializeAudio = () => {
    // При простата система няма нужда от тежка инициализация
    console.log("Audio Simple Mode Ready");
  };

  const playSuccess = () => {
    if (isMuted) return;
    // Три-тонална мелодия за успех
    setTimeout(() => playBeep(523.25, 'sine', 0.1), 0);   // C5
    setTimeout(() => playBeep(659.25, 'sine', 0.1), 100); // E5
    setTimeout(() => playBeep(783.99, 'sine', 0.2), 200); // G5
  };

  const playClick = () => {
    if (isMuted) return;
    playBeep(800, 'triangle', 0.05); // Кратко "цък"
  };

  // Основната функция за гласовете (MP3)
  const playItemSound = (itemName: string, audioUrl?: string, delay: number = 0): Promise<void> => {
    return new Promise((resolve) => {
        if (isMuted || !audioUrl) {
            resolve();
            return;
        }

        setTimeout(() => {
            const player = new Audio(audioUrl);
            
            player.onended = () => resolve();
            
            player.onerror = (e) => {
                console.warn(`Audio fail for ${itemName}`, e);
                resolve(); // Продължаваме играта дори при грешка
            };

            const playPromise = player.play();
            if (playPromise !== undefined) {
                playPromise.catch((error) => {
                    console.log("Audio autoplay blocked by browser:", error);
                    resolve(); // Продължаваме
                });
            }
        }, delay);
    });
  };

  const toggleMute = () => {
    setIsMuted(prev => !prev);
  };

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

export function useAudioContext() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudioContext must be used within an AudioProvider');
  }
  return context;
}
