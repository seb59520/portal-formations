import React from 'react';

interface AlertCardProps {
  type: 'warning' | 'error' | 'info';
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function AlertCard({ type, title, message, action }: AlertCardProps) {
  const typeClasses = {
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-900',
    error: 'bg-red-50 border-red-200 text-red-900',
    info: 'bg-blue-50 border-blue-200 text-blue-900',
  };

  return (
    <div className={`rounded-lg border p-4 ${typeClasses[type]}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-semibold">{title}</h4>
          <p className="mt-1 text-sm opacity-75">{message}</p>
        </div>
        {action && (
          <button
            onClick={action.onClick}
            className="ml-4 rounded px-3 py-1 text-sm font-medium hover:opacity-80"
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
}

