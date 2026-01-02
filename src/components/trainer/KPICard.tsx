import React from 'react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'gray';
  trend?: {
    value: number;
    label: string;
  };
}

export function KPICard({ title, value, subtitle, icon, color = 'blue', trend }: KPICardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-900',
    green: 'bg-green-50 border-green-200 text-green-900',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-900',
    red: 'bg-red-50 border-red-200 text-red-900',
    gray: 'bg-gray-50 border-gray-200 text-gray-900',
  };

  return (
    <div className={`rounded-lg border p-6 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium opacity-75">{title}</p>
          <p className="mt-2 text-3xl font-bold">{value}</p>
          {subtitle && <p className="mt-1 text-sm opacity-75">{subtitle}</p>}
          {trend && (
            <p className="mt-2 text-xs">
              <span className={trend.value >= 0 ? 'text-green-600' : 'text-red-600'}>
                {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              {' '}
              {trend.label}
            </p>
          )}
        </div>
        {icon && <div className="ml-4">{icon}</div>}
      </div>
    </div>
  );
}

