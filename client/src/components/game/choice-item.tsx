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

  // ПРЕМАХНАХМЕ обвиващия <div>. Сега връщаме директно <img>.
  // Така гарантираме, че няма скрити кутийки или padding, които да правят сянка/фон.
  return (
    <img
      src={item.image || ""}
      alt={item.name}
      className={cn(
        "choice-item w-32 h-32 object-contain flex-shrink-0 transition-all duration-200 cursor-pointer drop-shadow-md hover:drop-shadow-xl", // Добавих drop-shadow, за да се вижда добре върху всякакъв фон
        {
          "used opacity-50 cursor-not-allowed": isUsed,
          "opacity-50 cursor-not-allowed": isDisabled,
          "hover:scale-110": !isUsed && !isDisabled,
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
