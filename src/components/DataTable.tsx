import React from "react";

interface DataTableProps {
  headers: string[];
  children: React.ReactNode;
  className?: string;
}

export default function DataTable({
  headers,
  children,
  className = ""
}: DataTableProps) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="min-w-full divide-y divide-white/10">
        <thead className="backdrop-blur-xl bg-white/5">
          <tr>
            {headers.map((header, index) => (
              <th
                key={index}
                className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="backdrop-blur-xl bg-white/5 divide-y divide-white/10">
          {children}
        </tbody>
      </table>
    </div>
  );
}
