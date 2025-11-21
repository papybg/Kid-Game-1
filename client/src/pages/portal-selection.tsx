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

  // --- МАКСИМАЛНО ПРОСТА ФУНКЦИЯ ---
  const getSource = (portal: any) => {
      // Пробваме всички възможни имена на полета
      // Vercel понякога връща properties с малки/големи букви различно
      const val = portal.icon_url || portal.iconUrl || portal.icon_file_name || portal.icon || "";
      return String(val).trim();
  };

  const getFinalUrl = (raw: string) => {
      if (!raw) return "/images/placeholder-1.png";
      
      // Ако има http -> връщаме го директно
      if (raw.toLowerCase().includes("http")) {
          return raw;
      }
      // Иначе е локален
      const path = raw.startsWith("/") ? raw.substring(1) : raw;
      return `/images/backgrounds/${path}`;
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <div className="p-10 text-red-500">Грешка при зареждане!</div>;
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col p-4 bg-background">
      <div className="flex items-center justify-between mb-8">
        <Button variant="outline" size="icon" onClick={onBackToWelcome}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        
        <h1 className="font-display font-bold text-2xl md:text-3xl text-center flex-1">
          Избери световете (DEBUG)
        </h1>
        
        <Button variant="outline" size="icon" onClick={toggleTheme}>
          {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {portals.map((portal: Portal) => {
            
            const rawSource = getSource(portal);
            const finalSrc = getFinalUrl(rawSource);

            return (
            <div
              key={portal.id}
              className="bg-card rounded-2xl overflow-hidden shadow-lg cursor-pointer pb-8" // Добавих padding отдолу за текста
              onClick={() => onSelectPortal(portal)}
            >
              <div className="relative">
                <img
                  src={finalSrc}
                  alt={portal.name}
                  className="w-full h-48 object-cover"
                  onError={(e) => { e.currentTarget.src = "/images/placeholder-1.png"; }}
                />
                
                {/* --- ШПИОНСКИ ТЕКСТ --- */}
                {/* Това ще се покаже върху картинката, за да видим какво става */}
                <div className="absolute top-0 left-0 bg-black/80 text-white text-[10px] p-2 w-full break-all font-mono z-50">
                    RAW: {rawSource} <br/>
                    FINAL: {finalSrc}
                </div>
                {/* --------------------- */}

                <div className="absolute bottom-4 left-4 text-white">
                  <h3 className="font-bold text-xl">{portal.name}</h3>
                </div>
              </div>
            </div>
          );
          })}
        </div>
      </div>
    </div>
  );
}
