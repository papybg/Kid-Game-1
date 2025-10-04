import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Settings } from "lucide-react";

interface SettingsModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [effectsEnabled, setEffectsEnabled] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const handleToggleTheme = (checked: boolean) => {
    setIsDarkMode(checked);
    // Toggle theme class on document
    if (checked) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="fixed top-4 right-4 z-50">
          <Settings className="h-5 w-5" />
          <span className="sr-only">Настройки</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Настройки</DialogTitle>
          <DialogDescription>
            Персонализирайте вашето игрово изживяване
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          {/* Audio Settings */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Аудио настройки</h4>
            
            <div className="flex items-center space-x-2">
              <Switch 
                id="audio-enabled" 
                checked={audioEnabled}
                onCheckedChange={setAudioEnabled}
              />
              <Label htmlFor="audio-enabled">Общо аудио</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch 
                id="music-enabled" 
                checked={musicEnabled}
                onCheckedChange={setMusicEnabled}
                disabled={!audioEnabled}
              />
              <Label htmlFor="music-enabled">Фонова музика</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch 
                id="effects-enabled" 
                checked={effectsEnabled}
                onCheckedChange={setEffectsEnabled}
                disabled={!audioEnabled}
              />
              <Label htmlFor="effects-enabled">Звукови ефекти</Label>
            </div>
          </div>

          {/* Theme Settings */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Тема</h4>
            
            <div className="flex items-center space-x-2">
              <Switch 
                id="dark-mode" 
                checked={isDarkMode}
                onCheckedChange={handleToggleTheme}
              />
              <Label htmlFor="dark-mode">Тъмна тема</Label>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}