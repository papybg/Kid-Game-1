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
  const slotId = `${slot.position.top}-${slot.position.left}`;
  const hasPlacedItem = !!placedItem;
  
  return (
    <div
      className={cn(
        "game-slot absolute rounded-full transition-all duration-200",
        {
          // Default visible outline - only when no item is placed
          "bg-white/6 backdrop-blur-sm border-4 border-solid border-white/80": !isActive && !hasPlacedItem && !isCompleted,
          // Active slot: brighter ring + glow - only when no item is placed
          "bg-white/6 backdrop-blur-sm border-4 border-yellow-400 ring-4 ring-yellow-300/60 shadow-[0_8px_20px_rgba(250,204,21,0.18)]": isActive && !hasPlacedItem,
          // Filled slot: no border, no background - just the image
          "border-0 bg-transparent": hasPlacedItem,
          // Completed: slightly dimmed
          "opacity-70": isCompleted,
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
            className="w-full h-full object-contain transform"
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
