import React from 'react';
import { LoadingSpinner } from "../../components/ui/loading-spinner";

type LoadingScreenProps = {};

const LoadingScreen: React.FC<LoadingScreenProps> = () => (
  <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 to-purple-100">
    <LoadingSpinner />
  </div>
);

export default LoadingScreen;
