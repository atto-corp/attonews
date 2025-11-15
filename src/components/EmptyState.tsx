import React from "react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  className = ""
}: EmptyStateProps) {
  return (
    <div className={`text-center py-12 ${className}`}>
      {icon && (
        <div className="w-16 h-16 backdrop-blur-sm bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-xl font-semibold text-white/90 mb-2">{title}</h3>
      {description && <p className="text-white/70">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
