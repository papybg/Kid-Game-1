import { Button } from "../components/ui/button";
import { Trophy, Star, ArrowRight, RotateCcw, Home } from "lucide-react";
import { formatTime, getStarRating } from "../lib/game-logic";

interface WinProps {
  score: number;
  timeSpent: number;
  onPlayAgain: () => void;
  onNextLevel: () => void;
  onBackToMenu: () => void;
}

export default function Win({ score, timeSpent, onPlayAgain, onNextLevel, onBackToMenu }: WinProps) {
  const stars = getStarRating(score);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600">
      <div className="text-center space-y-8 max-w-md mx-auto animate-bounce-in">
        {/* Celebration Icon */}
        <div className="mx-auto w-32 h-32 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm animate-pulse-glow">
          <Trophy className="w-16 h-16 text-yellow-300" />
        </div>
        
        {/* Win Message */}
        <div className="space-y-4">
          <h1 className="font-display font-bold text-5xl md:text-6xl text-white text-center animate-bounce-in">
            БРАВО!
          </h1>
          <p className="text-green-100 text-lg text-center">Успешно завърши нивото!</p>
          
          {/* Score Stats */}
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-3xl font-bold text-white" data-testid="text-score">{score}</div>
                <div className="text-sm text-green-100">Точки</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white" data-testid="text-time">{formatTime(timeSpent)}</div>
                <div className="text-sm text-green-100">Време</div>
              </div>
            </div>
            
            {/* Stars Rating */}
            <div className="flex justify-center gap-2" data-testid="stars-rating">
              {[...Array(3)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-8 h-8 ${
                    i < stars ? "text-yellow-300 fill-current" : "text-gray-400"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="space-y-4 w-full">
          <Button
            onClick={onNextLevel}
            className="w-full bg-white text-green-600 font-semibold py-4 px-8 rounded-2xl text-lg hover:bg-green-50 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
            data-testid="button-next-level"
          >
            <ArrowRight className="w-5 h-5 mr-2" />
            СЛЕДВАЩО НИВО
          </Button>
          
          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={onPlayAgain}
              variant="ghost"
              className="bg-white/20 backdrop-blur-sm text-white font-semibold py-3 px-6 rounded-xl hover:bg-white/30 transition-colors"
              data-testid="button-play-again"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Отново
            </Button>
            <Button
              onClick={onBackToMenu}
              variant="ghost"
              className="bg-white/20 backdrop-blur-sm text-white font-semibold py-3 px-6 rounded-xl hover:bg-white/30 transition-colors"
              data-testid="button-back-to-menu"
            >
              <Home className="w-4 h-4 mr-2" />
              Меню
            </Button>
          </div>
        </div>
      </div>
      
      {/* Confetti Animation Placeholder */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* CSS animations for confetti could be added here */}
      </div>
    </div>
  );
}
