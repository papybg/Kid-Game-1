import { Button } from "../components/ui/button";
import { Settings, Play, Brain, Gamepad2, Smartphone, Volume2 } from "lucide-react";
import { useAudioContext } from "../components/audio-manager";

interface WelcomeProps {
  onEnterGame: () => void;
  onOpenSettings: () => void;
}

export default function Welcome({ onEnterGame, onOpenSettings }: WelcomeProps) {
  const { initializeAudio, playSound } = useAudioContext();

  const handleEnterGame = async () => {
    await initializeAudio();
    playSound('start');
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
        
        {/* Enter Button */}
        <Button
          onClick={handleEnterGame}
          className="w-full bg-white text-blue-600 font-semibold py-4 px-8 rounded-2xl text-lg hover:bg-blue-50 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl animate-slide-up"
          style={{ animationDelay: "0.3s" }}
          data-testid="button-enter-game"
        >
          <Play className="w-5 h-5 mr-2" />
          ЗАПОЧНИ ИГРАТА
        </Button>
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
