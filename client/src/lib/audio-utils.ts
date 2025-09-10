declare global {
  interface Window {
    Tone?: any;
  }
}

export class AudioManager {
  private static instance: AudioManager;
  private isInitialized = false;
  private synth: any = null;

  private constructor() {}

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized || !window.Tone) return;

    try {
      await window.Tone.start();
      this.synth = new window.Tone.Synth().toDestination();
      this.isInitialized = true;
      console.log('Audio system initialized');
    } catch (error) {
      console.error('Failed to initialize audio:', error);
      throw error;
    }
  }

  playSound(type: 'success' | 'error' | 'click' | 'start' | 'win'): void {
    if (!this.isInitialized || !this.synth) return;

    const soundPatterns = {
      success: [
        { note: 'C4', duration: '8n', time: 0 },
        { note: 'E4', duration: '8n', time: 0.1 },
        { note: 'G4', duration: '4n', time: 0.2 },
      ],
      error: [
        { note: 'F3', duration: '8n', time: 0 },
        { note: 'E3', duration: '4n', time: 0.1 },
      ],
      click: [
        { note: 'C5', duration: '16n', time: 0 },
      ],
      start: [
        { note: 'C4', duration: '8n', time: 0 },
        { note: 'D4', duration: '8n', time: 0.1 },
        { note: 'E4', duration: '8n', time: 0.2 },
        { note: 'G4', duration: '4n', time: 0.3 },
      ],
      win: [
        { note: 'C4', duration: '8n', time: 0 },
        { note: 'E4', duration: '8n', time: 0.1 },
        { note: 'G4', duration: '8n', time: 0.2 },
        { note: 'C5', duration: '4n', time: 0.3 },
        { note: 'G4', duration: '8n', time: 0.7 },
        { note: 'C5', duration: '2n', time: 0.8 },
      ],
    };

    const pattern = soundPatterns[type];
    pattern.forEach(({ note, duration, time }) => {
      this.synth.triggerAttackRelease(note, duration, `+${time}`);
    });
  }

  cleanup(): void {
    if (this.synth) {
      this.synth.dispose();
      this.synth = null;
    }
    this.isInitialized = false;
  }
}

export const audioManager = AudioManager.getInstance();
