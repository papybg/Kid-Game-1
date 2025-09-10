import { cn } from "@/lib/utils";
import type { GameSlot } from "@shared/schema";

interface GameSlotProps {
  slot: GameSlot;
  isActive?: boolean;
  isCompleted?: boolean;
  className?: string;
}

export function GameSlotComponent({ slot, isActive, isCompleted, className }: GameSlotProps) {
  return (
    <div
      className={cn(
        "game-slot absolute",
        {
          "active": isActive && !isCompleted,
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
    />
  );
}
