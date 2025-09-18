import { useState, useEffect } from "react";
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
import AdminPage from "./pages/admin";

import type { Portal } from "@shared/schema";

type Screen = "welcome" | "portals" | "game" | "win" | "admin";

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("welcome");
  const [selectedPortal, setSelectedPortal] = useState<Portal | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [gameKey, setGameKey] = useState(0); // Key to force Game component remount

  // Check for admin route on mount
  useEffect(() => {
    if (window.location.pathname === '/admin') {
      setCurrentScreen('admin');
    }
  }, []);

  const handleEnterGame = () => {
    setCurrentScreen("portals");
  };

  const handleBackToWelcome = () => {
    setCurrentScreen("welcome");
    setSelectedPortal(null);
  };

  const handleSelectPortal = (portal: Portal) => {
    setSelectedPortal(portal);
    setCurrentScreen("game");
  };

  const handleBackToMenu = () => {
    setCurrentScreen("welcome");
    setSelectedPortal(null);
  };

  const handleWin = () => {
    setCurrentScreen("win");
  };

  const handlePlayAgain = () => {
    setGameKey(prev => prev + 1); // Force Game component remount
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

  const handleGoToAdmin = () => {
    setCurrentScreen("admin");
    window.history.pushState(null, '', '/admin');
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
                  onGoToAdmin={handleGoToAdmin}
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
                  key={gameKey}
                  portal={selectedPortal}
                  onBackToMenu={handleBackToMenu}
                  onWin={handleWin}
                />
              )}
              
              {currentScreen === "win" && (
                <Win
                  onPlayAgain={handlePlayAgain}
                  onNextLevel={handleNextLevel}
                  onBackToMenu={handleBackToMenu}
                />
              )}

              {currentScreen === "admin" && (
                <AdminPage />
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
