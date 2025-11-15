import React from "react";

interface AnimatedBackgroundProps {
  className?: string;
}

export default function AnimatedBackground({
  className = ""
}: AnimatedBackgroundProps) {
  return (
    <>
      <div
        className={`absolute inset-0 bg-gradient-to-r from-gray-600/20 via-gray-500/20 to-gray-400/20 animate-pulse duration-3000 ${className}`}
      ></div>
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-gray-400/30 to-gray-500/30 rounded-full blur-3xl duration-3000"></div>
      <div
        className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-gray-500/30 to-gray-400/30 rounded-full blur-3xl duration-3000"
        style={{ animationDelay: "1s" }}
      ></div>
    </>
  );
}
