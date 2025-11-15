import React from "react";
import AnimatedBackground from "./AnimatedBackground";

interface LoadingSpinnerProps {
  message?: string;
  className?: string;
}

export default function LoadingSpinner({
  message = "Loading...",
  className = ""
}: LoadingSpinnerProps) {
  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-gray-800 via-gray-700 to-gray-600 flex items-center justify-center relative overflow-hidden ${className}`}
    >
      <AnimatedBackground />
      <div className="text-center relative z-10">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
        <p className="mt-4 text-white/80">{message}</p>
      </div>
    </div>
  );
}
