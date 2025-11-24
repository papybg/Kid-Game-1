import { useCallback, useRef, useState } from 'react';
import * as Tone from 'tone';

export function useAudio() {
  const [isInitialized, setIsInitialized] = useState(false);
  const synthRef = useRef<any>(null);

  const initializeAudio = useCallback(async () => {
    if (isInitialized) return;

    try {
      await Tone.start();
      synthRef.current = new Tone.Synth().toDestination();
      setIsInitialized(true);
      console.log('Audio initialized successfully (npm tone)');
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
