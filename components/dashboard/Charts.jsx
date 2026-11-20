// Chart Components
// components/dashboard/Charts.jsx

'use client';

import React from 'react';
import { LineChart, BarChart, PieChart, Line, Bar, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts';

export function LineChartComponent({ data, title, dataKey, strokeColor = '#3b82f6', showForecast = false }) {
  // CHANGED: Added linear extrapolation for forecast line (next 3 months)
  let chartData = data;
  let forecastData = [];
  
  if (showForecast && data && data.length >= 2) {
    const lastValue = data[data.length - 1][dataKey];
    const prevValue = data[data.length - 2][dataKey];
    const trend = lastValue - prevValue;
    
    const lastMonth = data[data.length - 1].month;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonthIndex = months.indexOf(lastMonth);
    
    for (let i = 1; i <= 3; i++) {
      const nextMonthIndex = (currentMonthIndex + i) % 12;
      const forecastValue = lastValue + (trend * i);
      forecastData.push({
        month: months[nextMonthIndex],
        [dataKey]: forecastValue,
        isForecast: true
      });
    }
    
    chartData = [...data, ...forecastData];
  }
  
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey={dataKey} stroke={strokeColor} strokeWidth={2} dot={{ r: 4 }} name="Actual" />
          {/* CHANGED: Added dotted forecast line for next 3 months */}
          {showForecast && forecastData.length > 0 && (
            <Line 
              type="monotone" 
              dataKey={dataKey} 
              stroke="#9ca3af" 
              strokeWidth={2} 
              strokeDasharray="5 5"
              dot={false}
              isAnimationActive={false}
              name="Forecast"
              data={[...data.slice(-1), ...forecastData]}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BarChartComponent({ data, title, dataKey, barColor = '#3b82f6' }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey={dataKey} fill={barColor} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PieChartComponent({ data, title }) {
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function FunnelChart({ data, title }) {
  // Simplified funnel representation using bars
  const funnelData = data.map((item, index) => ({
    stage: item.stage || ['Visitor', 'Lead', 'Qualified', 'Converted'][index],
    value: item.value || item.count,
    percentage: item.percentage || 0
  }));

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">{title}</h3>
      <div className="space-y-3">
        {funnelData.map((item, index) => (
          <div key={index}>
            <div className="flex justify-between text-sm font-medium text-gray-700 mb-1">
              <span>{item.stage}</span>
              <span>{item.value} ({item.percentage}%)</span>
            </div>
            <div className="h-8 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
                style={{ width: `${item.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function HeatmapChart({ data, title }) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const getColor = (count) => {
    if (!count) return '#f3f4f6';
    if (count < 10) return '#dbeafe';
    if (count < 20) return '#93c5fd';
    if (count < 50) return '#3b82f6';
    return '#1e40af';
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm overflow-x-auto">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">{title}</h3>
      <table className="w-full text-center text-xs">
        <thead>
          <tr>
            <th className="p-2 text-gray-600">Day</th>
            {hours.map(h => (
              <th key={h} className="p-2 text-gray-600">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {days.map((day, dayIdx) => (
            <tr key={dayIdx}>
              <td className="p-2 font-medium text-gray-700 text-left">{day}</td>
              {hours.map(hour => {
                const cell = data.find(d => d.day_of_week === dayIdx && d.hour === hour);
                return (
                  <td
                    key={`${dayIdx}-${hour}`}
                    className="p-2 m-1 rounded"
                    style={{ backgroundColor: getColor(cell?.visit_count || 0) }}
                    title={`${cell?.visit_count || 0} visits`}
                  />
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
