import { useCallback, useRef, useState } from 'react';

declare global {
  interface Window {
    Tone?: any;
  }
}

export function useAudio() {
  const [isInitialized, setIsInitialized] = useState(false);
  const synthRef = useRef<any>(null);

  const initializeAudio = useCallback(async () => {
    if (isInitialized || !window.Tone) return;

    try {
      await window.Tone.start();
      synthRef.current = new window.Tone.Synth().toDestination();
      setIsInitialized(true);
      console.log('Audio initialized successfully');
    } catch (error) {
      console.error('Failed to initialize audio:', error);
      throw error;
    }
  }, [isInitialized]);

  const playTone = useCallback((frequency: number, duration: number = 0.2) => {
    if (!isInitialized || !synthRef.current) return;

    try {
      synthRef.current.triggerAttackRelease(frequency, duration);
    } catch (error) {
      console.error('Failed to play tone:', error);
    }
  }, [isInitialized]);

  return {
    isInitialized,
    initializeAudio,
    playTone,
  };
}
