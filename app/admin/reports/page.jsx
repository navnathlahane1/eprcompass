"use client";

import { useState } from 'react';

function toCsv(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const escapeCell = (value) => {
    const s = value == null ? '' : String(value);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => escapeCell(row[h])).join(','));
  }
  return lines.join('\n');
}

function downloadCsv(fileName, rows) {
  const csv = toCsv(rows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

// Returns the current year-month in "YYYY-MM" format
function currentYearMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export default function AdminReportsPage() {
  const [loading, setLoading] = useState('');
  const [message, setMessage] = useState({ text: '', type: 'info' });
  const [selectedMonth, setSelectedMonth] = useState(currentYearMonth());

  const runReport = async (name, endpoint, fileName) => {
    try {
      setLoading(name);
      setMessage({ text: '', type: 'info' });
      const sep = endpoint.includes('?') ? '&' : '?';
      const url = `${endpoint}${sep}month=${selectedMonth}`;
      const response = await fetch(url);
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to run report.');
      }
      const data = await response.json();
      const rows = Array.isArray(data) ? data : [data];
      if (rows.length === 0) {
        setMessage({ text: `No data found for ${name} in ${selectedMonth}.`, type: 'warn' });
        return;
      }
      // Stamp the month into the filename
      const stamped = fileName.replace('.csv', `-${selectedMonth}.csv`);
      downloadCsv(stamped, rows);
      setMessage({ text: `${name} (${selectedMonth}) downloaded — ${rows.length} row${rows.length !== 1 ? 's' : ''}.`, type: 'success' });
    } catch (err) {
      setMessage({ text: err.message || 'Could not run report.', type: 'error' });
    } finally {
      setLoading('');
    }
  };

  const reports = [
    {
      name: 'Leads Funnel Report',
      endpoint: '/api/analytics/leads/funnel',
      file: 'leads-funnel-report.csv',
      description: 'Source-wise lead funnel with conversion rates for the selected month.',
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
        </svg>
      ),
    },
    {
      name: 'Compliance Category Report',
      endpoint: '/api/analytics/compliance/by-category',
      file: 'compliance-category-report.csv',
      description: 'EPR filing and fulfillment performance by waste category.',
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
        </svg>
      ),
    },
    {
      name: 'Monthly Revenue Report',
      endpoint: '/api/analytics/revenue/monthly-chart',
      file: 'monthly-revenue-report.csv',
      description: 'Invoice revenue breakdown for the selected month.',
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
        </svg>
      ),
    },
    {
      name: 'Recent Alerts Report',
      endpoint: '/api/analytics/alerts/recent?limit=50',
      file: 'recent-alerts-report.csv',
      description: 'Operational and compliance alerts for the selected month.',
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" />
        </svg>
      ),
    },
  ];

  const msgColors = {
    success: 'bg-emerald-950/40 border-emerald-700/50 text-emerald-300',
    warn: 'bg-amber-950/40 border-amber-700/50 text-amber-300',
    error: 'bg-rose-950/40 border-rose-700/50 text-rose-300',
    info: 'bg-blue-950/40 border-blue-700/50 text-blue-300',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/60 p-6 rounded-xl border border-slate-800">
        <h1 className="text-2xl font-bold text-slate-100">Reports</h1>
        <p className="text-slate-400 mt-1">Generate and download business reports as CSV files.</p>
      </div>

      {/* Month Picker */}
      <div className="flex items-center gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <label htmlFor="report-month" className="text-sm font-medium text-slate-300 whitespace-nowrap">
          Report Month
        </label>
        <input
          id="report-month"
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
        <span className="text-xs text-slate-500">
          All reports will be filtered to show data for the selected month
        </span>
      </div>

      {message.text && (
        <div className={`border rounded-xl p-4 text-sm ${msgColors[message.type] || msgColors.info}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map((report) => {
          const busy = loading === report.name;
          return (
            <div key={report.name} className="bg-slate-900/60 p-5 rounded-xl border border-slate-800 flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-teal-900/60 text-teal-400 flex items-center justify-center shrink-0">
                  {report.icon}
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-100">{report.name}</h2>
                  <p className="text-sm text-slate-400 mt-0.5">{report.description}</p>
                </div>
              </div>
              <button
                onClick={() => runReport(report.name, report.endpoint, report.file)}
                disabled={!!loading}
                className="btn-primary self-start"
              >
                {busy ? (
                  <>
                    <span className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
                    Generating…
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                    </svg>
                    Download CSV
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
