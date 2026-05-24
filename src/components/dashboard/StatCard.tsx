import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  variant?: 'admin' | 'manager' | 'auditor';
  color?: string; // e.g. 'bg-primary' for admin, 'text-blue-500' for manager, 'text-yellow-400' for auditor
  subtext?: string;
  containerClass?: string; // used for custom bg/border in auditor variant
}

export function StatCard({
  label,
  value,
  icon: Icon,
  variant = 'admin',
  color = 'bg-primary',
  subtext,
  containerClass = ''
}: StatCardProps) {
  if (variant === 'auditor' || variant === 'AUDITOR') {
    return (
      <div className={`bg-gray-800 border rounded-xl p-5 ${containerClass}`}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-gray-400 text-sm">{label}</p>
          {Icon && <Icon className={`w-5 h-5 ${color}`} />}
        </div>
        <p className={`text-3xl font-bold ${color}`}>{value}</p>
      </div>
    );
  }

  if (variant === 'manager' || variant === 'MANAGER') {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
        <div className="flex items-center gap-3 mb-2">
          {Icon && <Icon className={`w-5 h-5 ${color}`} />}
          <p className="text-gray-400 text-sm">{label}</p>
        </div>
        <div className="text-xl font-bold text-white">{value}</div>
        {subtext && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
      </div>
    );
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center`}>
          {Icon && <Icon className="w-6 h-6 text-white" />}
        </div>
      </div>
      <p className="text-gray-400 text-sm mb-1">{label}</p>
      <p className="text-3xl font-bold text-white">{value}</p>
    </div>
  );
}