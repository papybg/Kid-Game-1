import { cn } from "../ui/utils";
import type { GameItem } from "@shared/schema";

interface ChoiceItemProps {
  item: GameItem;
  isUsed?: boolean;
  isDisabled?: boolean;
  shouldDisappear?: boolean; // New prop for disappearing animation
  isSelected?: boolean; // New prop for selected state
  isAnimating?: boolean; // New prop for placement animation
  targetPosition?: { top: number; left: number }; // Target position for animation
  onClick?: (item: GameItem) => void;
  className?: string;
}

export function ChoiceItem({ item, isUsed, isDisabled, shouldDisappear, isSelected, isAnimating, targetPosition, onClick, className }: ChoiceItemProps) {
  const handleClick = () => {
    if ((!isUsed && !isDisabled) && onClick) {
      onClick(item);
    }
  };

  return (
    <div className="p-2">
      <img
        src={item.image}
        alt={item.name}
        className={cn(
          "choice-item w-32 h-32 object-contain flex-shrink-0 transition-all duration-200 cursor-pointer",
          {
            "used opacity-50 cursor-not-allowed": isUsed && !shouldDisappear,
            "opacity-0 scale-0 pointer-events-none": shouldDisappear, // Disappear animation
            "opacity-50 cursor-not-allowed": isDisabled,
            "hover:scale-110": !isUsed && !isDisabled && !shouldDisappear,
            "ring-4 ring-yellow-400 ring-opacity-75 scale-110": isSelected, // Selected state styling
            "absolute z-50 transition-all duration-1000 ease-in-out": isAnimating, // Animation to target position
          },
          className
        )}
        style={isAnimating && targetPosition ? {
          top: targetPosition.top,
          left: targetPosition.left,
          transform: 'translate(-50%, -50%)',
        } : {}}
        onClick={handleClick}
        data-testid={`choice-item-${item.id}`}
        data-item-id={item.id}
        data-item-index={item.index}
      />
    </div>
  );
}
