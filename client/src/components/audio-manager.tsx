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
  
  // Tone.js Synth само за системните звуци (цъкане и успех)
  const synth = useRef<Tone.PolySynth | null>(null);

  // 1. Инициализация при първи клик (Задължително за Edge/Chrome)
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

  // 2. Пускане на кратки системни звуци (Tone.js)
  const playSuccess = async () => {
    if (isMuted || !synth.current) return;
    try {
        await Tone.start(); // Подсигуряване
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

  // 3. ГЛАВНАТА ПРОМЯНА: Използваме стандартно HTML5 Audio за файловете
  // Това работи много по-стабилно в Edge за MP3 файлове
  const playItemSound = (itemName: string, audioUrl?: string, delay: number = 0): Promise<void> => {
    return new Promise((resolve) => {
        // Ако е mute или няма линк -> веднага продължаваме играта
        if (isMuted || !audioUrl) {
            resolve();
            return;
        }

        // Изчакваме (ако има delay, напр. да се скрие старата карта)
        setTimeout(() => {
            // Създаваме стандартен плеър
            const player = new Audio(audioUrl);
            
            // Настройваме събитията ПРЕДИ да пуснем звука
            
            // Успешен край -> казваме на играта да продължи
            player.onended = () => {
                resolve();
            };

            // Грешка (напр. файлът липсва) -> казваме на играта да продължи, за да не забие
            player.onerror = (e) => {
                console.warn(`Audio error for ${itemName}:`, e);
                resolve(); 
            };

            // Опит за пускане
            const playPromise = player.play();

            // Edge изисква да хванем грешката, ако autoplay е забранен
            if (playPromise !== undefined) {
                playPromise.catch((error) => {
                    console.warn("Browser blocked audio autoplay:", error);
                    // Дори да е блокирано, ние "решаваме" промиса, за да не спре играта
                    resolve();
                });
            }
        }, delay);
    });
  };

  const toggleMute = () => {
    setIsMuted(prev => !prev);
  };

  // Автоматичен опит за старт при зареждане
  useEffect(() => {
    const init = async () => {
        try {
            synth.current = new Tone.PolySynth(Tone.Synth).toDestination();
        } catch (e) {}
    };
    init();
    
    // Добавяме глобален слушател за първи клик, за да "отпушим" звука в Edge
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

export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}
