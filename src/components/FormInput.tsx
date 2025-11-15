import React from "react";

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function FormInput({
  label,
  error,
  className = "",
  ...props
}: FormInputProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-white/90">
          {label}
        </label>
      )}
      <input
        className={`w-full px-3 py-2 backdrop-blur-xl bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-300 ${className}`}
        {...props}
      />
      {error && <p className="text-sm text-red-300">{error}</p>}
    </div>
  );
}
