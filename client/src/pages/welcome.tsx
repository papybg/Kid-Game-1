import { useState } from "react";
import { Button } from "../components/ui/button";
// RadioGroupItem (Radix) requires a RadioGroup context; we use a decorative/focusable element instead
import { Label } from "../components/ui/label";
import { Settings, Play, Brain, Gamepad2, Smartphone, Volume2 } from "lucide-react";
import { useAudioContext } from "../components/audio-manager";
import { useSettingsStore, type GameMode } from "../lib/settings-store";

interface WelcomeProps {
  onEnterGame: () => void;
  onOpenSettings: () => void;
  onGoToAdmin?: () => void;
  onGoToUnderConstruction?: () => void;
  onEnterPortals?: (variantId: string) => void;
}

export default function Welcome({ onEnterGame, onOpenSettings, onGoToUnderConstruction, onEnterPortals }: WelcomeProps) {
  const { initializeAudio, playSound } = useAudioContext();
  const { setGameMode } = useSettingsStore();
  const [selectedMode, setSelectedMode] = useState<GameMode>('advanced');

  const handleEnterGame = async () => {
    // Записваме избрания режим в settings store
    setGameMode(selectedMode);

    await initializeAudio();
    // Remove automatic start sound - let the game handle audio cues
    onEnterGame();
  };

  const handleChoose = async (mode: GameMode) => {
    setGameMode(mode);
    await initializeAudio();
    // If a direct portals handler is provided, use it with a variant mapping
    if (mode === 'simple' && onEnterPortals) {
      onEnterPortals('t1');
      return;
    }
    if (mode === 'advanced' && onEnterPortals) {
      onEnterPortals('k1');
      return;
    }
    onEnterGame();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 animate-fade-in">
      <div className="text-center space-y-8 max-w-md mx-auto">
        {/* App Icon */}
        <div className="mx-auto w-24 h-24 bg-white/20 rounded-3xl flex items-center justify-center backdrop-blur-sm animate-bounce-in">
          <Brain className="w-12 h-12 text-white" />
        </div>
        
        {/* Title */}
        <div className="space-y-2">
          <h1 className="font-display font-bold text-4xl md:text-5xl text-white text-center animate-slide-up">
            Къде да ме откриеш?
          </h1>
          <p className="text-blue-100 text-lg text-center animate-slide-up" style={{ animationDelay: "0.1s" }}>
            Образователна игра за деца
          </p>
        </div>
        
        {/* Features */}
        <div className="grid grid-cols-2 gap-4 text-sm text-blue-100 animate-slide-up" style={{ animationDelay: "0.2s" }}>
                  <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-blue-200" />
            <span>Развива мисленето</span>
          </div>
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-4 h-4 text-blue-200" />
            <span>Интерактивна игра</span>
          </div>
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-blue-200" />
            <span>За всички устройства</span>
          </div>
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-blue-200" />
            <span>Звукови ефекти</span>
          </div>
        </div>
        
        {/* Game Mode Selection */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 animate-slide-up" style={{ animationDelay: "0.25s" }}>
          <h3 className="text-white font-semibold text-lg mb-4 text-center">
            Избери режим на играта
          </h3>
          <div className="space-y-3">
            <div>
              <Button
                variant="ghost"
                onClick={() => handleChoose('simple')}
                className="w-full text-left p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors flex items-center gap-3"
              >
                <span className="text-2xl" aria-hidden>{'👶'}</span>
                <div className="flex-1 text-white">
                  <div className="font-medium">Игра за мъници (2+)</div>
                  <div className="text-sm text-blue-100 opacity-80">Всички клетки са видими от началото</div>
                </div>
              </Button>
            </div>

            <div>
              <Button
                variant="ghost"
                onClick={() => handleChoose('advanced')}
                className="w-full text-left p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors flex items-center gap-3"
              >
                <span className="text-2xl" aria-hidden>{'🧒'}</span>
                <div className="flex-1 text-white">
                  <div className="font-medium">Игра за малчугани (4+)</div>
                  <div className="text-sm text-blue-100 opacity-80">Клетките се показват последователно</div>
                </div>
              </Button>
            </div>

            {/* batkovci remains a radio-like item that opens Under Construction */}
            <div className="flex items-center space-x-3 p-3 rounded-xl bg-white/10 transition-colors">
              <Label
                htmlFor="batkovci"
                className="flex-1 text-white cursor-pointer flex items-center gap-3"
                onClick={() => {
                  if (onGoToUnderConstruction) onGoToUnderConstruction();
                }}
              >
                <span className="text-2xl" aria-hidden>{'🧑'}</span>
                <div>
                  <div className="font-medium">Игра за батковци</div>
                  <div className="text-sm text-blue-100 opacity-80">Клетките се показват последователно</div>
                </div>
              </Label>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onOpenSettings}
        className="absolute top-4 right-4 w-12 h-12 bg-white/20 rounded-xl hover:bg-white/30 text-white"
        data-testid="button-settings"
      >
        <Settings className="w-6 h-6" />
      </Button>
    </div>
  );
}
