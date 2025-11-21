import { Button } from "@/components/ui/button";
import { ArrowLeft, Moon, Sun, Star, PuzzleIcon } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { useQuery } from "@tanstack/react-query";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import type { Portal } from "@shared/schema";

interface PortalSelectionProps {
  onBackToWelcome: () => void;
  onSelectPortal: (portal: Portal) => void;
}

export default function PortalSelection({ onBackToWelcome, onSelectPortal }: PortalSelectionProps) {
  const { theme, setTheme } = useTheme();

  const { data: portals = [], isLoading, error } = useQuery<Portal[]>({
    queryKey: ['api/portals'],
    staleTime: 0, 
    refetchOnMount: true
  });

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  // --- ФУНКЦИЯ ЗА ПОЧИСТВАНЕ (V4 - FORCE HTTPS) ---
  const getSafeUrl = (portal: any) => {
      const raw = portal.icon_url || portal.icon_file_name || portal.icon;
      let str = String(raw || "").trim();

      // Ако няма нищо -> Връщаме сигурен онлайн placeholder
      if (!str || str === "null" || str === "undefined") {
          return "https://placehold.co/600x400/png?text=No+Image";
      }

      // АКО СЪДЪРЖА "http"
      if (str.includes("http")) {
          let clean = str.substring(str.indexOf("http"));
          
          // ТУК Е МАГИЯТА:
          // 1. Намира http или https с колкото и да е наклонени черти
          // 2. ЗАМЕНЯ ГО НАСИЛСТВЕНО С "https://"
          clean = clean.replace(/https?:\/+/g, 'https://');
          
          return clean;
      }

      // АКО Е ЛОКАЛЕН ФАЙЛ
      const path = str.startsWith("/") ? str.substring(1) : str;
      return `/images/backgrounds/${path}`;
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-background">
         <p className="text-destructive">Грешка при зареждане.</p>
         <Button onClick={() => window.location.reload()} className="ml-2">Опитай пак</Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col p-4 bg-background">
      <div className="flex items-center justify-between mb-8">
        <Button variant="outline" size="icon" onClick={onBackToWelcome} className="w-12 h-12">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        
        <h1 className="font-display font-bold text-2xl md:text-3xl text-center flex-1">
          Избери световете
        </h1>
        
        <Button variant="outline" size="icon" onClick={toggleTheme} className="w-12 h-12">
          {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {portals.map((portal: Portal, index: number) => (
            <div
              key={portal.id}
              className="bg-card rounded-2xl overflow-hidden shadow-lg cursor-pointer hover:scale-105 transition-all"
              onClick={() => onSelectPortal(portal)}
            >
              <div className="relative">
                <img
                  src={getSafeUrl(portal)}
                  alt={portal.name}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                     // ВАЖНО: Ако гръмне, слагаме външен линк, който 100% работи
                     console.log("Image Error for:", portal.name);
                     e.currentTarget.src = "https://placehold.co/600x400/png?text=Image+Error";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-4 left-4 text-white">
                  <h3 className="font-display font-bold text-xl">{portal.name}</h3>
                  <p className="text-xs text-gray-200">Кликни за старт</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
