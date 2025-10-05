import React from 'react';
import { Button } from "../components/ui/button";
import { ArrowLeft, Volume2, VolumeX } from 'lucide-react';

interface HeaderProps { onBackToMenu: () => void; onToggleSound: () => void; soundEnabled: boolean }

const Header: React.FC<HeaderProps> = ({ onBackToMenu, onToggleSound, soundEnabled }) => (
  <div className="relative z-10 flex justify-between items-center p-4">
    <Button
      variant="outline"
      size="sm"
      onClick={onBackToMenu}
      className="bg-white/80 backdrop-blur-sm"
    >
      <ArrowLeft className="h-4 w-4 mr-2" />
      Обратно
    </Button>

    <div />

    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={onToggleSound}
        className="bg-white/80 backdrop-blur-sm"
      >
        {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
      </Button>
    </div>
  </div>
);

export default Header;
