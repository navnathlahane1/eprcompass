// Dashboard KPI Cards Component
// components/dashboard/KPICard.jsx

'use client';

import React from 'react';

export default function KPICard({ title, value, unit = '', trend = null, color = 'blue', icon: Icon = null }) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-600',
    green: 'bg-green-50 border-green-200 text-green-600',
    red: 'bg-red-50 border-red-200 text-red-600',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-600',
    purple: 'bg-purple-50 border-purple-200 text-purple-600'
  };

  // CHANGED: Improved trend formatting with color coding
  const trendColor = trend && trend.positive ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50';

  return (
    <div className={`${colorClasses[color]} rounded-lg border-2 p-6 shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            {unit && <span className="text-lg text-gray-600">{unit}</span>}
          </div>
          {/* CHANGED: MoM delta in highlighted box below main value */}
          {trend && (
            <div className={`mt-3 inline-block px-3 py-1 rounded-md text-sm font-medium ${trendColor}`}>
              {trend.positive ? '↑' : '↓'} {trend.value}% vs last month
            </div>
          )}
        </div>
        {Icon && (
          <div className={`rounded-full p-3 ${colorClasses[color]} bg-opacity-20`}>
            <Icon size={24} />
          </div>
        )}
      </div>
    </div>
  );
}
