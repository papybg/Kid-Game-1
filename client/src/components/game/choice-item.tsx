import { cn } from "../ui/utils";
import type { GameItem } from "@shared/schema";

interface ChoiceItemProps {
  item: GameItem;
  isUsed?: boolean;
  isDisabled?: boolean;
  isSelected?: boolean;
  isAnimating?: boolean;
  targetPosition?: { top: number; left: number };
  onClick?: (item: GameItem) => void;
  className?: string;
}

export function ChoiceItem({ item, isUsed, isDisabled, isSelected, isAnimating, targetPosition, onClick, className }: ChoiceItemProps) {
  const handleClick = () => {
    if ((!isUsed && !isDisabled) && onClick) {
      onClick(item);
    }
  };

  return (
    <img
      src={item.image || ""}
      alt={item.name}
      // ПРОМЯНА: 
      // w-14 (56px) за мобилни - много компактно
      // md:w-24 (96px) за таблети/лаптопи
      // lg:w-32 (128px) за големи екрани
      className={cn(
        "choice-item w-14 h-14 md:w-24 md:h-24 lg:w-32 lg:h-32 object-contain flex-shrink-0 transition-all duration-200 cursor-pointer drop-shadow-md hover:drop-shadow-xl hover:scale-110",
        {
          "used opacity-50 cursor-not-allowed": isUsed,
          "opacity-50 cursor-not-allowed": isDisabled,
          "ring-4 ring-yellow-400 ring-opacity-75 scale-110": isSelected,
          "absolute z-50 transition-all duration-1000 ease-in-out": isAnimating,
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
  );
}
