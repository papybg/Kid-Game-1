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

  // Заявка към сървъра. 
  // staleTime: 0 гарантира, че ако добавиш нов портал в админа, той ще се появи веднага тук.
  const { data: portals = [], isLoading, error } = useQuery<Portal[]>({
    queryKey: ['api/portals'],
    staleTime: 0, 
    refetchOnMount: true
  });

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  // --- ФУНКЦИЯТА, КОЯТО ОПРАВЯ БЪГА С КАРТИНКИТЕ ---
  // Тя е критично важна, защото базата ти връща счупени пътища (https:/)
  const getSafeUrl = (portal: any) => {
      // 1. Взимаме данните от всички възможни полета
      const raw = portal.icon_url || portal.icon_file_name || portal.icon;
      let str = String(raw || "").trim();

      // 2. Ако няма данни, връщаме placeholder
      if (!str || str === "null" || str === "undefined") return "/images/placeholder-1.png";

      // 3. Ако е външен линк (Cloudinary)
      if (str.includes("http")) {
          // Изрязваме всичко преди http (ако локалният път се е залепил)
          let clean = str.substring(str.indexOf("http"));
          
          // Оправяме счупените наклонени черти (от https:/ на https://)
          // Този Regex хваща и http:/ и https:/ и ги прави валидни
          clean = clean.replace(/https?:\/+/g, (match) => {
              return match.startsWith('https') ? 'https://' : 'http://';
          });
          
          return clean;
      }

      // 4. Ако е локален файл (започва с / или име на файл)
      const path = str.startsWith("/") ? str.substring(1) : str;
      return `/images/backgrounds/${path}`;
  };
  // ---------------------------------------------------

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-muted-foreground">Зареждат се световете...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-background">
         <div className="text-center space-y-4">
            <p className="text-destructive">Възникна грешка при връзката със сървъра.</p>
            <Button onClick={() => window.location.reload()}>Опитай пак</Button>
         </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col p-4 bg-background">
      {/* Header */}
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
      
      {/* Portal Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {portals.map((portal: Portal, index: number) => (
            <div
              key={portal.id}
              className="bg-card rounded-2xl overflow-hidden shadow-lg cursor-pointer hover:scale-105 hover:shadow-xl transition-all duration-300 animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
              onClick={() => onSelectPortal(portal)}
            >
              <div className="relative">
                <img
                  // ТУК ИЗПОЛЗВАМЕ ПОПРАВКАТА
                  src={getSafeUrl(portal)}
                  alt={portal.name}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                     // Ако въпреки всичко картинката не зареди, показваме резервна
                     e.currentTarget.src = "/images/placeholder-1.png";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-4 left-4 text-white">
                  <h3 className="font-display font-bold text-xl">{portal.name}</h3>
                  <p className="text-xs text-gray-200 mt-1">Кликни за начало</p>
                </div>
                
                {/* Декоративна икона горе вдясно */}
                <div className="absolute top-4 right-4 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-white text-xs">🌿</span>
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
                    {/* Тук показваме броя нива, ако има такива */}
                    <span className="text-sm text-muted-foreground">{portal.layouts?.length || 0} нива</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
           {/* Coming Soon Cards (Статични карти за бъдещо съдържание) */}
           <div className="bg-card rounded-2xl overflow-hidden shadow-lg opacity-50 grayscale">
              <div className="relative">
                 <img src="/images/placeholder-1.png" className="w-full h-48 object-contain bg-gray-100" />
                 <div className="absolute bottom-4 left-4 text-white">
                    <h3 className="font-bold text-xl">Подводен свят</h3>
                    <p>Скоро...</p>
                 </div>
                 <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                    <span className="text-4xl drop-shadow-lg">🔒</span>
                 </div>
              </div>
           </div>

        </div>
      </div>
    </div>
  );
}
