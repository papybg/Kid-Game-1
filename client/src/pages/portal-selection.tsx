import { Button } from "../components/ui/button";
import { ArrowLeft, Moon, Sun, Star, PuzzleIcon } from "lucide-react";
import { useTheme } from "../components/theme-provider";
import { useQuery } from "@tanstack/react-query";
import { LoadingSpinner } from "../components/ui/loading-spinner";
import type { Portal } from "@shared/schema";

interface PortalSelectionProps {
  onBackToWelcome: () => void;
  onSelectPortal: (portal: Portal) => void;
}

export default function PortalSelection({ onBackToWelcome, onSelectPortal }: PortalSelectionProps) {
  const { theme, setTheme } = useTheme();

  // 1. Слагаме случаен номер в заявката, за да счупим кеша насила
  const { data: portals = [], isLoading, error } = useQuery<Portal[]>({
    queryKey: ['api/portals', Math.random()], 
    staleTime: 0,
    cacheTime: 0,
    refetchOnMount: true
  });

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  // --- НОВА ФУНКЦИЯ ЗА ПОЧИСТВАНЕ ---
  const getSafeUrl = (portal: any) => {
      const raw = portal.icon_url || portal.icon_file_name || portal.icon;
      let str = String(raw || "").trim();

      console.log("RAW DATA:", str); // Гледай конзолата

      // Ако вече е омазано с локалния път (понякога базата връща странни неща)
      if (str.includes("/images/backgrounds/https")) {
          str = str.replace("/images/backgrounds/", "");
      }

      if (str.includes("http")) {
          // Извличаме само http частта
          const httpIndex = str.indexOf("http");
          let clean = str.substring(httpIndex);
          
          // Оправяме счупените наклонени черти
          clean = clean.replace("https:/", "https://").replace("https:///", "https://");
          clean = clean.replace("http:/", "http://").replace("http:///", "http://");
          
          return clean;
      }

      // Локален файл
      const cleanPath = str.startsWith("/") ? str.substring(1) : str;
      return `/images/backgrounds/${cleanPath}`;
  };
  // ----------------------------------

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <p>Зарежда се...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="p-10 text-center text-red-500">Грешка при зареждане.</div>;
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col p-4 bg-background">
      <div className="flex items-center justify-between mb-8">
        <Button variant="outline" size="icon" onClick={onBackToWelcome} className="w-12 h-12">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        
        {/* ТУК Е ТЕСТЪТ - ВИЖДАШ ЛИ ТОВА ЗАГЛАВИЕ? */}
        <h1 className="font-display font-bold text-2xl md:text-3xl text-center flex-1 text-red-500">
           ИЗБЕРИ СВЕТОВЕТЕ (ВЕРСИЯ 2)
        </h1>
        
        <Button variant="outline" size="icon" onClick={toggleTheme} className="w-12 h-12">
          {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {portals?.map((portal: Portal, index: number) => {
            
            const finalSrc = getSafeUrl(portal);

            return (
            <div
              key={portal.id}
              className="bg-card rounded-2xl overflow-hidden shadow-lg cursor-pointer"
              onClick={() => onSelectPortal(portal)}
            >
              <div className="relative">
                <img
                  src={finalSrc}
                  alt={portal.name}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                     console.error("STILL BROKEN:", finalSrc);
                     e.currentTarget.src = "/images/placeholder-1.png";
                  }}
                />
                <div className="absolute bottom-4 left-4 text-white drop-shadow-md">
                  <h3 className="font-bold text-xl">{portal.name}</h3>
                  {/* DEBUG TEXT НА ЕКРАНА, ЗА ДА ВИДИМ КАКВО СТАВА */}
                  <p className="text-[10px] bg-black/50 px-1 rounded">{finalSrc.substring(0, 30)}...</p>
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
