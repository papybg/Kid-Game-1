import React from "react";
import { Button } from "../components/ui/button";
import { Hammer } from "lucide-react";

interface Props {
  onBack?: () => void;
}

export default function UnderConstruction({ onBack }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-gradient-to-br from-yellow-400 via-orange-400 to-red-400">
      <div className="bg-white/90 rounded-2xl p-8 shadow-lg max-w-lg w-full text-center">
        <div className="flex items-center justify-center mb-4">
          <Hammer className="w-12 h-12 text-orange-600" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Under construction</h2>
        <p className="text-sm text-gray-700 mb-6">Тази секция е в процес на разработка.</p>
        <div className="flex justify-center">
          <Button onClick={onBack}>Back</Button>
        </div>
      </div>
    </div>
  );
}
