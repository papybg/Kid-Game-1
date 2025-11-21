// client/src/components/audio-manager.tsx

// Проста функция за пускане на звук
export const playSound = (url: string) => {
  if (!url) return;
  
  try {
    const audio = new Audio(url);
    audio.volume = 1.0;
    
    // Опитваме се да пуснем, но не спираме играта ако не стане
    const promise = audio.play();
    if (promise !== undefined) {
      promise.catch((e) => {
        console.log("Audio play blocked:", e);
      });
    }
  } catch (e) {
    console.error("Audio error:", e);
  }
};

// Проста функция за системен звук (бип)
export const playBeep = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.1);
    osc.stop(ctx.currentTime + 0.1);
  } catch (e) {
    // Ignore
  }
};

// Фалшив хук за съвместимост със съществуващия код
// Така няма да се налага да пренаписваш всички файлове
export function useAudioContext() {
  return {
    playItemSound: async (name: string, url?: string) => {
        if (url) playSound(url);
    },
    playClick: async () => {
        playBeep();
    },
    playSuccess: async () => {
        playBeep();
        setTimeout(playBeep, 100);
    },
    toggleMute: () => {}, // Засега махаме mute функцията, за да е просто
    isMuted: false,
    initializeAudio: async () => {}
  };
}

// Фалшив Provider, за да не гърми App.tsx
export function AudioProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
