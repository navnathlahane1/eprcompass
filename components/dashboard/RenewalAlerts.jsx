// CHANGED: New Renewal Alerts component
// components/dashboard/RenewalAlerts.jsx

'use client';

import React from 'react';

export default function RenewalAlerts({ data = [] }) {
  // Default dummy data if none provided
  const defaultData = [
    { client: 'TechCorp India', service: 'Annual EPR License', dueDate: '2026-04-25', daysRemaining: 7 },
    { client: 'GreenRecycle Ltd', service: 'Compliance Audit', dueDate: '2026-05-10', daysRemaining: 22 },
    { client: 'ABC Industries', service: 'Training Renewal', dueDate: '2026-05-30', daysRemaining: 42 },
    { client: 'XYZ Electronics', service: 'Credit Balance', dueDate: '2026-06-15', daysRemaining: 58 },
    { client: 'Waste Solutions', service: 'Certificate', dueDate: '2026-07-01', daysRemaining: 74 },
    { client: 'EcoPartners', service: 'Quarterly Filing', dueDate: '2026-04-20', daysRemaining: 2 }
  ];

  const renewalData = data.length > 0 ? data : defaultData;

  // CHANGED: Color code based on days remaining
  const getStatusColor = (days) => {
    if (days < 30) return 'bg-red-50 border-red-200 text-red-700';
    if (days < 60) return 'bg-amber-50 border-amber-200 text-amber-700';
    return 'bg-green-50 border-green-200 text-green-700';
  };

  const getStatusLabel = (days) => {
    if (days < 30) return '🔴 Urgent';
    if (days < 60) return '🟡 Coming Soon';
    return '🟢 On Track';
  };

  const getDaysColor = (days) => {
    if (days < 30) return 'text-red-600 font-bold';
    if (days < 60) return 'text-amber-600 font-bold';
    return 'text-green-600 font-bold';
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">📅 RENEWAL ALERTS</h3>
        <span className="text-xs font-medium text-gray-500">
          {renewalData.filter(r => r.daysRemaining < 30).length} urgent
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Client</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Service</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Due Date</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Days Remaining</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
            </tr>
          </thead>
          <tbody>
            {renewalData.map((renewal, idx) => (
              <tr 
                key={idx} 
                className={`border-b border-gray-100 ${getStatusColor(renewal.daysRemaining)} border-l-4`}
              >
                <td className="px-4 py-3 font-medium text-gray-900">{renewal.client}</td>
                <td className="px-4 py-3 text-gray-700">{renewal.service}</td>
                <td className="px-4 py-3 text-gray-700">{renewal.dueDate}</td>
                <td className={`px-4 py-3 ${getDaysColor(renewal.daysRemaining)}`}>
                  {renewal.daysRemaining} days
                </td>
                <td className="px-4 py-3">
                  <span className="inline-block px-2 py-1 rounded-full text-xs font-semibold bg-white bg-opacity-70">
                    {getStatusLabel(renewal.daysRemaining)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex gap-4 text-xs text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span>Urgent: &lt;30 days</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500"></div>
          <span>Coming Soon: 30–60 days</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span>On Track: &gt;60 days</span>
        </div>
      </div>
    </div>
  );
}
