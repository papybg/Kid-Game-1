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
  });

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  // Чиста функция за определяне на пътя към картинката
  const getImageUrl = (portal: any) => {
    const source = portal.icon_url || portal.icon_file_name || portal.icon;
    
    if (!source) return "/images/placeholder-1.png";

    const str = String(source).trim();

    // Ако е линк (от Cloudinary), го връщаме директно
    if (str.includes("http")) {
        // Лека корекция само ако има счупени наклонени черти от базата
        if (str.includes("https:/") && !str.includes("https://")) {
            return str.replace("https:/", "https://");
        }
        return str;
    }

    // Ако е локален файл, добавяме пътя
    const cleanPath = str.startsWith("/") ? str.substring(1) : str;
    return `/images/backgrounds/${cleanPath}`;
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-muted-foreground">Зарежда се...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <p className="text-destructive">Грешка при зареждане на световете.</p>
          <Button onClick={() => window.location.reload()}>Опитай отново</Button>
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
              className="bg-card rounded-2xl overflow-hidden shadow-lg cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
              onClick={() => onSelectPortal(portal)}
            >
              <div className="relative">
                <img
                  src={getImageUrl(portal)}
                  alt={portal.name}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    // Ако няма картинка, показваме локалния placeholder
                    e.currentTarget.src = "/images/placeholder-1.png";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                <div className="absolute bottom-4 left-4 text-white">
                  <h3 className="font-display font-semibold text-xl">{portal.name}</h3>
                  <p className="text-sm text-gray-200">Открий животните в природата</p>
                </div>
                <div className="absolute top-4 right-4 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
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
                    <span className="text-sm text-muted-foreground">{portal.layouts?.length || 0} нива</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {/* Coming Soon Cards */}
          <div className="bg-card rounded-2xl overflow-hidden shadow-lg opacity-50">
            <div className="relative">
              <img
                src="/images/placeholder-1.png"
                alt="Подводен свят"
                className="w-full h-48 object-contain"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
              <div className="absolute bottom-4 left-4 text-white">
                <h3 className="font-display font-semibold text-xl">Подводен свят</h3>
                <p className="text-sm text-gray-200">Скоро...</p>
              </div>
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  🔒
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
