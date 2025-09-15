import { cn } from "../ui/utils";
import type { GameItem } from "@shared/schema";

interface ChoiceItemProps {
  item: GameItem;
  isUsed?: boolean;
  isDisabled?: boolean;
  onClick?: (item: GameItem) => void;
  className?: string;
}

export function ChoiceItem({ item, isUsed, isDisabled, onClick, className }: ChoiceItemProps) {
  const handleClick = () => {
    if ((!isUsed && !isDisabled) && onClick) {
      onClick(item);
    }
  };

  return (
    <img
      src={item.image}
      alt={item.name}
      className={cn(
        "choice-item w-16 h-16 bg-white dark:bg-card rounded-xl object-cover border-2 border-white/50 dark:border-card-foreground/20 hover:border-yellow-400 flex-shrink-0 transition-all duration-200",
        {
          "used": isUsed,
          "opacity-50 cursor-not-allowed": isDisabled,
          "hover:border-yellow-400": !isUsed && !isDisabled,
        },
        className
      )}
      onClick={handleClick}
      data-testid={`choice-item-${item.id}`}
      data-item-id={item.id}
      data-item-index={item.index}
    />
  );
}
