import React from "react";
import AnimatedBackground from "./AnimatedBackground";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: string;
  background?: boolean;
}

export default function PageContainer({
  children,
  className = "",
  maxWidth = "max-w-4xl",
  background = true
}: PageContainerProps) {
  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-gray-800 via-gray-700 to-gray-600 relative overflow-hidden ${className}`}
    >
      {background && <AnimatedBackground />}
      <div
        className={`${maxWidth} mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10`}
      >
        {children}
      </div>
    </div>
  );
}
