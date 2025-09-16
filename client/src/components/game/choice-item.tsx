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
    <div className="p-2">
      <img
        src={item.image}
        alt={item.name}
        className={cn(
          "choice-item w-16 h-16 object-contain flex-shrink-0 transition-all duration-200 cursor-pointer",
          {
            "used": isUsed,
            "opacity-50 cursor-not-allowed": isDisabled,
            "hover:scale-110": !isUsed && !isDisabled,
          },
          className
        )}
        onClick={handleClick}
        data-testid={`choice-item-${item.id}`}
        data-item-id={item.id}
        data-item-index={item.index}
      />
    </div>
  );
}
