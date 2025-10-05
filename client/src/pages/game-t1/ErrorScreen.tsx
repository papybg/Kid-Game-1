import React from 'react';
import { Button } from "../../components/ui/button";

interface ErrorScreenProps { onBackToMenu: () => void; error?: any }

const ErrorScreen: React.FC<ErrorScreenProps> = ({ onBackToMenu }) => (
  <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 to-purple-100">
    <div className="text-center">
      <h2 className="text-2xl font-bold text-red-600 mb-4">Грешка при зареждането</h2>
      <Button onClick={onBackToMenu}>Обратно към менюто</Button>
    </div>
  </div>
);

export default ErrorScreen;
