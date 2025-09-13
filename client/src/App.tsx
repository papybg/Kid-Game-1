import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";
import { ThemeProvider } from "./components/theme-provider";
import { AudioProvider } from "./components/audio-manager";

import Welcome from "./pages/welcome";
import PortalSelection from "./pages/portal-selection";
import Game from "./pages/game";
import Win from "./pages/win";

import type { Portal } from "@shared/schema";

type Screen = "welcome" | "portals" | "game" | "win";

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("welcome");
  const [selectedPortal, setSelectedPortal] = useState<Portal | null>(null);
  const [gameResult, setGameResult] = useState<{ score: number; time: number } | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleEnterGame = () => {
    setCurrentScreen("portals");
  };

  const handleBackToWelcome = () => {
    setCurrentScreen("welcome");
    setSelectedPortal(null);
    setGameResult(null);
  };

  const handleSelectPortal = (portal: Portal) => {
    setSelectedPortal(portal);
    setCurrentScreen("game");
  };

  const handleBackToMenu = () => {
    setCurrentScreen("portals");
    setSelectedPortal(null);
    setGameResult(null);
  };

  const handleWin = (score: number, time: number) => {
    setGameResult({ score, time });
    setCurrentScreen("win");
  };

  const handlePlayAgain = () => {
    setGameResult(null);
    setCurrentScreen("game");
  };

  const handleNextLevel = () => {
    // For now, just play again since we only have one level
    handlePlayAgain();
  };

  const handleOpenSettings = () => {
    setSettingsOpen(true);
  };

  const handleCloseSettings = () => {
    setSettingsOpen(false);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="kade-da-me-otkriesh-theme">
        <AudioProvider>
          <TooltipProvider>
            <div className="min-h-screen">
              {currentScreen === "welcome" && (
                <Welcome 
                  onEnterGame={handleEnterGame}
                  onOpenSettings={handleOpenSettings}
                />
              )}
              
              {currentScreen === "portals" && (
                <PortalSelection
                  onBackToWelcome={handleBackToWelcome}
                  onSelectPortal={handleSelectPortal}
                />
              )}
              
              {currentScreen === "game" && selectedPortal && (
                <Game
                  portal={selectedPortal}
                  onBackToMenu={handleBackToMenu}
                  onWin={handleWin}
                />
              )}
              
              {currentScreen === "win" && gameResult && (
                <Win
                  score={gameResult.score}
                  timeSpent={gameResult.time}
                  onPlayAgain={handlePlayAgain}
                  onNextLevel={handleNextLevel}
                  onBackToMenu={handleBackToMenu}
                />
              )}
            </div>
            
            {/* TODO: Add Settings Modal */}
            
            <Toaster />
          </TooltipProvider>
        </AudioProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
