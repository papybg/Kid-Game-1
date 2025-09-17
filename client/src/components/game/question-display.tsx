import { useEffect } from "react";
import { useAudioContext } from "../audio-manager";

interface Question {
  id: string;
  portalId: string;
  parentQuestion: string;
  correctSlot: number;
  wrongSlots: number[];
  objectSound: string;
}

interface QuestionDisplayProps {
  question: Question;
  onSlotClick: (slotIndex: number) => void;
  isVisible: boolean;
}

export function QuestionDisplay({ question, onSlotClick, isVisible }: QuestionDisplayProps) {
  const { playVoice } = useAudioContext();

  useEffect(() => {
    if (isVisible && question) {
      // Play the question as voice (if available) or just show text
      // For now, we'll just show the text
      console.log("Question:", question.parentQuestion);
    }
  }, [isVisible, question]);

  if (!isVisible || !question) return null;

  return (
    <div className="fixed top-20 left-4 right-4 z-30 bg-black/70 backdrop-blur-sm rounded-2xl p-6 text-center">
      <h2 className="text-white text-xl md:text-2xl font-bold mb-4">
        {question.parentQuestion}
      </h2>
      <p className="text-white/80 text-sm">
        Посочи правилното място за {question.objectSound}!
      </p>
    </div>
  );
}