// Alerts and Insights Panel Component
// components/dashboard/AlertsInsights.jsx

'use client';

import React, { useState } from 'react';

export function AlertCard({ alert, onDismiss }) {
  const severityClasses = {
    critical: 'bg-red-50 border-red-200 text-red-800',
    high: 'bg-orange-50 border-orange-200 text-orange-800',
    medium: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    low: 'bg-blue-50 border-blue-200 text-blue-800'
  };

  const severity = alert.severity?.toLowerCase() || 'medium';

  return (
    <div className={`${severityClasses[severity]} rounded-lg border-2 p-4 flex justify-between items-start`}>
      <div>
        <p className="font-semibold text-sm">{alert.alert_type}</p>
        <p className="text-sm mt-1">{alert.message}</p>
      </div>
      {onDismiss && (
        <button
          onClick={() => onDismiss(alert.id)}
          className="ml-4 text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      )}
    </div>
  );
}

export function InsightCard({ insight }) {
  // CHANGED: Added state for clickable expanding cards
  const [isExpanded, setIsExpanded] = useState(false);
  
  const typeClasses = {
    risk: 'border-red-200 bg-red-50',
    opportunity: 'border-green-200 bg-green-50',
    trend: 'border-blue-200 bg-blue-50',
    prediction: 'border-purple-200 bg-purple-50'
  };

  const typeIcons = {
    risk: '⚠️',
    opportunity: '💡',
    trend: '📈',
    prediction: '🔮'
  };

  return (
    <div 
      // CHANGED: Made card clickable with cursor pointer
      onClick={() => setIsExpanded(!isExpanded)}
      className={`rounded-lg border-2 p-4 cursor-pointer transition-all ${typeClasses[insight.type?.toLowerCase()] || typeClasses.trend} ${isExpanded ? 'ring-2 ring-offset-2 ring-blue-400' : 'hover:shadow-md'}`}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">{typeIcons[insight.type?.toLowerCase()] || '📊'}</span>
        <div className="flex-1">
          <p className="font-semibold text-sm">{insight.title}</p>
          <p className="text-sm mt-1 text-gray-700">{insight.message}</p>
          
          {/* CHANGED: Show recommended action on expand */}
          {isExpanded && insight.recommended_action && (
            <div className="mt-3 p-3 bg-white bg-opacity-60 rounded border-l-4 border-blue-500">
              <p className="text-xs font-semibold text-gray-600">Recommended Action:</p>
              <p className="text-sm mt-1 text-gray-700">{insight.recommended_action}</p>
            </div>
          )}
          
          <div className="mt-2 flex gap-2 flex-wrap">
            <span className="inline-block px-2 py-1 rounded-full text-xs bg-white bg-opacity-50 font-medium">
              {insight.category}
            </span>
            <span className="inline-block px-2 py-1 rounded-full text-xs bg-white bg-opacity-50 font-medium">
              {Math.round(insight.confidence_score * 100)}% confidence
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AlertsInsightsPanel({ alerts, insights, loading }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Alerts Section */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">🚨 Active Alerts</h3>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 rounded animate-pulse" />)}
          </div>
        ) : alerts && alerts.length > 0 ? (
          <div className="space-y-3">
            {alerts.slice(0, 5).map(alert => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No active alerts</p>
        )}
      </div>

      {/* Insights Section */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">💡 AI Insights</h3>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 rounded animate-pulse" />)}
          </div>
        ) : insights && insights.length > 0 ? (
          <div className="space-y-3">
            {insights.slice(0, 5).map((insight, index) => (
              <InsightCard key={index} insight={insight} />
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No insights available</p>
        )}
      </div>
    </div>
  );
}
