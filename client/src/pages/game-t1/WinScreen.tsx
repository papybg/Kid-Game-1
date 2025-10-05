import React from 'react';

type WinScreenProps = {};

const WinScreen: React.FC<WinScreenProps> = () => (
  <div className="flex items-center justify-center h-full">
    <div className="text-center">
      <div className="text-6xl mb-6">🎉</div>
      <h1 className="text-5xl font-bold text-yellow-400 mb-4 drop-shadow-lg animate-bounce">
        Браво! Успех!
      </h1>
    </div>
  </div>
);

export default WinScreen;
