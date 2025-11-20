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

// --- ХИРУРГИЧЕСКА ФУНКЦИЯ (Вътрешна) ---
const fixUrl = (raw: any): string => {
  // 1. Превръщаме в текст и махаме празни места
  let str = String(raw || "").trim();
  
  if (!str || str === "undefined" || str === "null") return "/images/placeholder-1.png";

  console.log("Checking URL:", str); // Виж това в конзолата (F12)

  // 2. АКО СЪДЪРЖА "http" (независимо къде)
  const httpIndex = str.indexOf("http");
  if (httpIndex !== -1) {
    // Изрязваме всичко преди "http" (махаме /images/backgrounds/ ако се е залепило)
    let clean = str.substring(httpIndex);
    
    // Оправяме печатната грешка от базата (https:/ -> https://)
    if (clean.startsWith("https:/") && !clean.startsWith("https://")) {
        clean = clean.replace("https:/", "https://");
    }
    if (clean.startsWith("http:/") && !clean.startsWith("http://")) {
        clean = clean.replace("http:/", "http://");
    }
    
    return clean;
  }

  // 3. Ако няма http, значи е локален файл
  // Махаме водещата наклонена черта за всеки случай
  const filename = str.startsWith("/") ? str.substring(1) : str;
  return `/images/backgrounds/${filename}`;
};
// ----------------------------------------

export default function PortalSelection({ onBackToWelcome, onSelectPortal }: PortalSelectionProps) {
  const { theme, setTheme } = useTheme();

  const { data: portals = [], isLoading, error } = useQuery<Portal[]>({
    queryKey: ['api/portals'],
    // Спираме кеша на заявката за всеки случай
    staleTime: 0,
    cacheTime: 0,
  });

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-muted-foreground">Зарежда световете...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <p className="text-destructive">Грешка при зареждане на световете:</p>
          <Button onClick={() => window.location.reload()}>Опитай отново</Button>
        </div>
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
          {portals?.map((portal: Portal, index: number) => {
            
            // Взимаме суровите данни
            const rawIcon = (portal as any).icon_url || (portal as any).icon_file_name || (portal as any).icon;
            // Поправяме ги на място
            const finalSrc = fixUrl(rawIcon);

            return (
            <div
              key={portal.id}
              className="bg-card rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
              onClick={() => onSelectPortal(portal)}
            >
              <div className="relative">
                <img
                  src={finalSrc}
                  alt={portal.name}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    console.error("Image error for:", finalSrc);
                    e.currentTarget.src = "/images/placeholder-1.png";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                <div className="absolute bottom-4 left-4 text-white">
                  <h3 className="font-display font-semibold text-xl">{portal.name}</h3>
                  <p className="text-sm text-gray-200">Открий животните в природата</p>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span>Лесно</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <PuzzleIcon className="w-4 h-4 text-primary" />
                    <span className="text-sm text-muted-foreground">{portal.layouts.length} нива</span>
                  </div>
                </div>
              </div>
            </div>
          );
          })}
          
           {/* Coming Soon Cards - запазени са */}
           <div className="bg-card rounded-2xl overflow-hidden shadow-lg opacity-50">
              <div className="relative">
                 <img src="/images/placeholder-1.png" className="w-full h-48 object-contain" />
                 <div className="absolute bottom-4 left-4 text-white">
                    <h3 className="font-display font-semibold text-xl">Подводен свят</h3>
                    <p>Скоро...</p>
                 </div>
              </div>
           </div>

        </div>
      </div>
    </div>
  );
}
