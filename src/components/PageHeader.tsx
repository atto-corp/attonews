import React from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

export default function PageHeader({
  title,
  description,
  children,
  className = ""
}: PageHeaderProps) {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div>
        <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">
          {title}
        </h1>
        {description && <p className="text-white/80 text-lg">{description}</p>}
      </div>
      {children && (
        <div className="flex items-center space-x-4">{children}</div>
      )}
    </div>
  );
}
