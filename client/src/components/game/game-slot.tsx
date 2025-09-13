import { cn } from "../ui/utils";
import type { GameSlot, GameItem } from "../../../shared/schema";

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
        "game-slot absolute border-2 border-dashed border-white/50 rounded-full bg-white/10 backdrop-blur-sm",
        {
          "border-yellow-400 border-solid animate-pulse": isActive && !hasPlacedItem,
          "border-green-400 border-solid bg-green-400/20": hasPlacedItem,
          "opacity-50": isCompleted,
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
        <div className="absolute inset-1 rounded-full overflow-hidden">
          <img
            src={placedItem.image}
            alt={placedItem.name}
            className="w-full h-full object-cover"
            data-testid={`placed-item-${placedItem.id}`}
          />
        </div>
      )}
    </div>
  );
}
