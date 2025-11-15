import React from "react";

interface GradientButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "blue" | "green" | "purple" | "red" | "yellow" | "orange";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  loadingText?: string;
}

const variants = {
  blue: "from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:ring-blue-500",
  green:
    "from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 focus:ring-green-500",
  purple:
    "from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 focus:ring-purple-500",
  red: "from-red-500 to-red-600 hover:from-red-600 hover:to-red-500 focus:ring-red-500",
  yellow:
    "from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 focus:ring-yellow-500",
  orange:
    "from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 focus:ring-orange-500"
};

const sizes = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-sm",
  lg: "px-8 py-3 text-base"
};

export default function GradientButton({
  children,
  variant = "blue",
  size = "md",
  disabled = false,
  loading = false,
  loadingText,
  className = "",
  ...props
}: GradientButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      className={`group relative inline-flex items-center border border-transparent font-medium rounded-lg text-white overflow-hidden transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 hover:shadow-lg hover:shadow-${variant}-500/25 ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isDisabled}
      {...props}
    >
      <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
      <span className="relative z-10 flex items-center space-x-2">
        {loading && (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
        )}
        <span>{loading ? loadingText || "Loading..." : children}</span>
      </span>
    </button>
  );
}
