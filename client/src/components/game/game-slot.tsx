import { cn } from "../ui/utils";
import type { GameSlot, GameItem } from "@shared/schema";

interface GameSlotProps {
  slot: GameSlot;
  isActive?: boolean;
  isCompleted?: boolean;
  placedItem?: GameItem;
  className?: string;
}

export function GameSlotComponent({ slot, isActive, isCompleted, placedItem, className }: GameSlotProps) {
  const hasPlacedItem = !!placedItem;
  
  return (
    <div
      className={cn(
        "game-slot absolute rounded-full transition-all duration-200",
        {
          // ПРОМЯНА ТУК: Увеличихме дебелината на рамката
          "border-8 border-dashed border-white/50": !isActive && !hasPlacedItem && !isCompleted,
          
          // Активен слот: става малко по-видим
          "border-12 border-yellow-400 ring-12 ring-yellow-300/40 shadow-[0_0_20px_rgba(250,204,21,0.4)]": isActive && !hasPlacedItem,
          
          // Пълен слот: напълно прозрачен
          "border-0 bg-transparent": hasPlacedItem,
          
          "opacity-100": isCompleted, // Пълна видимост на готовия предмет
        },
        className
      )}
      style={{
        width: slot.diameter,
        height: slot.diameter,
        top: slot.position.top,
        left: slot.position.left,
        transform: "translate(-50%, -50%)",
      }}
      data-testid={`game-slot-${slot.index.join('-')}`}
    >
      {placedItem && (
        <div className="absolute inset-0 p-2 flex items-center justify-center">
          <img
            src={placedItem.image || ''}
            alt={placedItem.name}
            className="w-full h-full object-contain transform drop-shadow-lg"
            style={{
              transform: placedItem.name === "Влак" ? "scale(3)" : "scale(1.5)"
            }}
            data-testid={`placed-item-${placedItem.id}`}
            data-item-name={placedItem.name}
          />
        </div>
      )}
    </div>
  );
}

