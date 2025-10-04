import { useState, useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";
import { ThemeProvider } from "./components/theme-provider";
import { AudioProvider } from "./components/audio-manager";
import { SettingsModal } from "./components/settings-modal";

import Welcome from "./pages/welcome";
import VariantSelection from "./pages/variant-selection";
import PortalSelection from "./pages/portal-selection";
import Game from "./pages/game";
import GameT1 from "./pages/game-t1";
import GameK1 from "./pages/game-k1";
import Win from "./pages/win";
import AdminPage from "./pages/admin";
import UnderConstruction from "./pages/under-construction";

import type { Portal, GameVariant } from "@shared/schema";

type Screen = "welcome" | "variants" | "portals" | "game" | "win" | "admin" | "under";

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("welcome");
  const [selectedPortal, setSelectedPortal] = useState<Portal | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<GameVariant | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [gameKey, setGameKey] = useState(0); // Key to force Game component remount

  // Check for admin route on mount and handle URL changes
  useEffect(() => {
    const handleRoute = () => {
      if (window.location.pathname === '/admin') {
        setCurrentScreen('admin');
      } else {
        setCurrentScreen('welcome');
      }
    };

    // Check on mount
    handleRoute();

    // Listen for popstate (back/forward buttons)
    window.addEventListener('popstate', handleRoute);
    
    return () => {
      window.removeEventListener('popstate', handleRoute);
    };
  }, []);

  const handleEnterGame = () => {
    setCurrentScreen("variants");
  };

  // New: directly open portals for a variant (used by welcome buttons)
  const handleEnterPortals = (variantId: string) => {
    // Create a minimal variant object so downstream components can use it
    const dummyVariant = { id: variantId, displayName: variantId, description: '' } as GameVariant;
    setSelectedVariant(dummyVariant);
    setCurrentScreen('portals');
  };

  const handleBackToWelcome = () => {
    setCurrentScreen("welcome");
    setSelectedPortal(null);
    setSelectedVariant(null);
  };

  const handleSelectVariant = (variant: GameVariant) => {
    setSelectedVariant(variant);
    setCurrentScreen("portals");
  };

  const handleBackToVariants = () => {
    setCurrentScreen("variants");
    setSelectedPortal(null);
  };

  const handleSelectPortal = (portal: Portal) => {
    setSelectedPortal(portal);
    setCurrentScreen("game");
  };

  const handleBackToMenu = () => {
    setCurrentScreen("welcome");
    setSelectedPortal(null);
    setSelectedVariant(null);
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
                  onGoToUnderConstruction={() => setCurrentScreen('under')}
                  onEnterPortals={handleEnterPortals}
                />
              )}
              
              {/* variants screen removed: direct navigation to portals is used */}
              
              {currentScreen === "portals" && (
                <PortalSelection
                  onBackToWelcome={handleBackToVariants}
                  onSelectPortal={handleSelectPortal}
                />
              )}
              
              {currentScreen === "game" && selectedPortal && selectedVariant && (
                selectedVariant.id === 't1' ? (
                  <GameT1
                    key={gameKey}
                    portalId={selectedPortal.id}
                    variantId={selectedVariant.id}
                    onBackToMenu={handleBackToMenu}
                    onComplete={handleWin}
                  />
                ) : selectedVariant.id === 'k1' ? (
                  <GameK1
                    key={gameKey}
                    portalId={selectedPortal.id}
                    variantId={selectedVariant.id}
                    onBackToMenu={handleBackToMenu}
                    onComplete={handleWin}
                  />
                ) : (
                  <Game
                    key={gameKey}
                    portalId={selectedPortal.id}
                    variantId={selectedVariant.id}
                    onBackToMenu={handleBackToMenu}
                    onWin={handleWin}
                  />
                )
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
              {currentScreen === "under" && (
                <UnderConstruction onBack={() => setCurrentScreen('welcome')} />
              )}
            </div>
            
            <SettingsModal />
            
            <Toaster />
          </TooltipProvider>
        </AudioProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
