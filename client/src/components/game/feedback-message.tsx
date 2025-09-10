import { cn } from "@/lib/utils";
import type { FeedbackMessage } from "@shared/schema";

interface FeedbackMessageProps {
  feedback: FeedbackMessage;
  className?: string;
}

export function FeedbackMessageComponent({ feedback, className }: FeedbackMessageProps) {
  if (!feedback.isVisible) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div
        className={cn(
          "font-display font-bold text-6xl md:text-8xl text-center transition-all duration-300 animate-bounce-in",
          {
            "text-success": feedback.type === 'success',
            "text-error": feedback.type === 'error',
          },
          className
        )}
        data-testid="feedback-message"
      >
        {feedback.message}
      </div>
    </div>
  );
}
