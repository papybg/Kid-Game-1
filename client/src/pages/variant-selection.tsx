import { Button } from "../components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { LoadingSpinner } from "../components/ui/loading-spinner";
import type { GameVariant } from "@shared/schema";

interface VariantSelectionProps {
  onSelectVariant: (variant: GameVariant) => void;
  onBackToWelcome: () => void;
}

export default function VariantSelection({ onSelectVariant, onBackToWelcome }: VariantSelectionProps) {
  const { data: variants = [], isLoading, error } = useQuery<GameVariant[]>({
    queryKey: ['game-variants'],
    queryFn: async () => {
      const response = await fetch('http://localhost:3005/api/game-variants');
      if (!response.ok) {
        throw new Error('Failed to fetch game variants');
      }
      return response.json();
    },
    retry: 2,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-muted-foreground">Зареждане на вариантите...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <p className="text-destructive">Грешка при зареждане на вариантите</p>
          <Button onClick={() => window.location.reload()}>Опитай отново</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col p-4 bg-background">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Button
          variant="outline"
          size="icon"
          onClick={onBackToWelcome}
          className="w-12 h-12"
        >
          ←
        </Button>

        <h1 className="font-display font-bold text-2xl md:text-3xl text-center flex-1">
          Избери вариант
        </h1>

        <div className="w-12"></div> {/* Spacer for centering */}
      </div>

      {/* Variant Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 gap-6 max-w-md mx-auto">
          {variants.map((variant: GameVariant, index: number) => (
            <div
              key={variant.id}
              className="bg-card rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer animate-slide-up border-2 border-transparent hover:border-primary/20"
              style={{ animationDelay: `${index * 0.1}s` }}
              onClick={() => onSelectVariant(variant)}
            >
              <div className="text-center space-y-4">
                {/* Variant Icon */}
                <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                  {variant.id === 't1' && <span className="text-2xl">👶</span>}
                  {variant.id === 'k1' && <span className="text-2xl">🧒</span>}
                  {variant.id === 'e1' && <span className="text-2xl">🧑</span>}
                </div>

                {/* Variant Title */}
                <div>
                  <h3 className="font-display font-semibold text-xl text-primary">
                    {variant.displayName}
                  </h3>
                  {variant.description && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {variant.description}
                    </p>
                  )}
                </div>

                {/* Difficulty Indicator */}
                <div className="flex justify-center gap-1">
                  {variant.id === 't1' && (
                    <>
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-gray-200 rounded-full"></div>
                      <div className="w-3 h-3 bg-gray-200 rounded-full"></div>
                    </>
                  )}
                  {variant.id === 'k1' && (
                    <>
                      <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-gray-200 rounded-full"></div>
                    </>
                  )}
                  {variant.id === 'e1' && (
                    <>
                      <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-8 text-center">
        <p className="text-sm text-muted-foreground">
          Избери варианта според възрастта на детето
        </p>
      </div>
    </div>
  );
}