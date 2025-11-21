import React, { createContext, useContext, useState, useEffect } from 'react';

// Дефинираме интерфейса за аудио контекста
interface AudioContextType {
  playSuccess: () => void;
  playClick: () => void;
  playItemSound: (itemName: string, audioUrl?: string, delay?: number) => Promise<void>;
  toggleMute: () => void;
  isMuted: boolean;
  initializeAudio: () => void;
}

// Създаваме контекста
const AudioContext = createContext<AudioContextType | null>(null);

// Провайдър компонент
export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [isMuted, setIsMuted] = useState(false);

  // Функция за инициализация (вече не прави нищо сложно, но я пазим за съвместимост)
  const initializeAudio = () => {
    console.log("Audio initialized (Simple Mode)");
  };

  // Функция за възпроизвеждане на системен звук (бип)
  const playBeep = (freq: number = 440, type: 'sine' | 'square' | 'triangle' = 'sine', duration: number = 0.1) => {
    if (isMuted) return;
    try {
      // Взимаме аудио контекста на браузъра
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;

      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      // Настройка на силата на звука (затихваща)
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.error("Beep error:", e);
    }
  };

  // Звук за успех (три тона)
  const playSuccess = () => {
    if (isMuted) return;
    setTimeout(() => playBeep(523.25, 'sine', 0.1), 0);   // C5
    setTimeout(() => playBeep(659.25, 'sine', 0.1), 100); // E5
    setTimeout(() => playBeep(783.99, 'sine', 0.2), 200); // G5
  };

  // Звук за клик (кратък)
  const playClick = () => {
    if (isMuted) return;
    playBeep(800, 'triangle', 0.05);
  };

  // Основна функция за възпроизвеждане на файл (MP3)
  const playItemSound = (itemName: string, audioUrl?: string, delay: number = 0): Promise<void> => {
    return new Promise((resolve) => {
      if (isMuted || !audioUrl) {
        resolve();
        return;
      }

      setTimeout(() => {
        try {
          const player = new Audio(audioUrl);
          
          // Когато звукът свърши, разрешаваме Promise-а
          player.onended = () => resolve();
          
          // При грешка също разрешаваме, за да не забие играта
          player.onerror = (e) => {
            console.warn(`Audio error for ${itemName}:`, e);
            resolve();
          };

          // Опитваме се да пуснем звука
          const playPromise = player.play();
          
          // Обработваме грешки при autoplay политиките на браузъра
          if (playPromise !== undefined) {
            playPromise.catch((error) => {
              console.log("Audio autoplay blocked:", error);
              resolve(); // Продължаваме играта
            });
          }
        } catch (e) {
          console.error("Audio play error:", e);
          resolve();
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

// Хук за използване на аудио контекста
// ВНИМАНИЕ: Запазваме името useAudioContext, за да не чупим другите файлове
export function useAudioContext() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudioContext must be used within an AudioProvider');
  }
  return context;
}
