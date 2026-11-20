'use client';

import { useEffect, useState } from 'react';

interface Invoice {
  id: string;
  invoice_no: string;
  description: string;
  amount_inr: number;
  tax_inr: number;
  total_inr: number;
  issued_date: string;
  due_date: string;
  paid_date: string | null;
  status: 'Pending' | 'Paid' | 'Overdue' | 'Cancelled';
  payment_ref: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  Pending: 'bg-yellow-100 text-yellow-800',
  Paid: 'bg-green-100 text-green-800',
  Overdue: 'bg-red-100 text-red-800',
  Cancelled: 'bg-gray-100 text-gray-600',
};

function fmt(n: number) {
  return '₹' + n.toLocaleString('en-IN');
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/recycler-portal/invoices')
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); return; }
        setInvoices(d.invoices);
      })
      .catch(() => setError('Failed to load invoices'))
      .finally(() => setLoading(false));
  }, []);

  const totalPending = invoices
    .filter(i => i.status === 'Pending')
    .reduce((sum, i) => sum + (i.total_inr ?? 0), 0);

  const totalPaid = invoices
    .filter(i => i.status === 'Paid')
    .reduce((sum, i) => sum + (i.total_inr ?? 0), 0);

  const overdueCount = invoices.filter(i => i.status === 'Overdue').length;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Total Pending</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">{fmt(totalPending)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Total Paid</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{fmt(totalPaid)}</p>
        </div>
        <div className={`rounded-xl border p-4 ${overdueCount > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
          <p className={`text-xs uppercase tracking-wide ${overdueCount > 0 ? 'text-red-500' : 'text-gray-500'}`}>Overdue</p>
          <p className={`text-2xl font-bold mt-1 ${overdueCount > 0 ? 'text-red-700' : 'text-gray-400'}`}>{overdueCount}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading invoices…</div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">{error}</div>
        ) : invoices.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <p className="text-lg font-medium">No invoices yet</p>
            <p className="text-sm mt-1">Invoices will appear here once generated.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Invoice No', 'Description', 'Amount', 'Tax', 'Total', 'Issued', 'Due Date', 'Paid Date', 'Status'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">{inv.invoice_no}</td>
                    <td className="px-4 py-3 text-gray-800 max-w-xs truncate">{inv.description}</td>
                    <td className="px-4 py-3 text-gray-700">{fmt(inv.amount_inr)}</td>
                    <td className="px-4 py-3 text-gray-500">{fmt(inv.tax_inr)}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{fmt(inv.total_inr)}</td>
                    <td className="px-4 py-3 text-gray-600">{inv.issued_date ? new Date(inv.issued_date).toLocaleDateString('en-IN') : '—'}</td>
                    <td className={`px-4 py-3 ${inv.status === 'Overdue' ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                      {inv.due_date ? new Date(inv.due_date).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {inv.paid_date ? new Date(inv.paid_date).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[inv.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
