// Data Table Component with filters and sorting
// components/dashboard/DataTable.jsx

'use client';

import React, { useState } from 'react';

export default function DataTable({ 
  title, 
  columns, 
  data, 
  onRowClick, 
  filters = [],
  searchable = true 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, ascending: true });
  const [activeFilter, setActiveFilter] = useState('');

  const filteredData = data
    .filter(row => {
      if (activeFilter && row.status !== activeFilter) return false;
      if (searchTerm) {
        return columns.some(col => 
          String(row[col.key]).toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (!sortConfig.key) return 0;
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      
      if (aVal < bVal) return sortConfig.ascending ? -1 : 1;
      if (aVal > bVal) return sortConfig.ascending ? 1 : -1;
      return 0;
    });

  const handleSort = (key) => {
    setSortConfig({
      key,
      ascending: sortConfig.key === key ? !sortConfig.ascending : true
    });
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <div className="flex gap-2 flex-wrap">
          {searchable && (
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          )}
          {filters.length > 0 && (
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="">All Status</option>
              {filters.map(filter => (
                <option key={filter} value={filter}>{filter}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {columns.map(col => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className="cursor-pointer px-4 py-3 text-left font-semibold text-gray-700 hover:bg-gray-100"
                >
                  <div className="flex items-center gap-2">
                    {col.label}
                    {sortConfig.key === col.key && (
                      <span>{sortConfig.ascending ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.length > 0 ? (
              filteredData.map((row, idx) => (
                <tr
                  key={idx}
                  onClick={() => onRowClick && onRowClick(row)}
                  className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                >
                  {columns.map(col => (
                    <td key={col.key} className="px-4 py-3 text-gray-700">
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-500">
                  No data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-between text-sm text-gray-600">
        <span>Showing {filteredData.length} of {data.length} records</span>
      </div>
    </div>
  );
}
