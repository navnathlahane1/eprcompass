'use client';

import { useMemo, useState } from 'react';
import { TEMPLATES } from '../../../../lib/whatsapp/templates';

type Contact = {
  phone: string;
  label: string;
  type: 'client' | 'lead' | 'partner';
};

function downloadSampleCsv() {
  const headers = ['phone', 'param1', 'param2', 'param3', 'param4'];
  const sampleRow = ['+919876543210', 'ABC Pvt Ltd', 'Plastic', '30', '2026-06-15'];

  const csv = [headers, sampleRow]
    .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'whatsapp-broadcast-sample.csv';
  a.click();

  URL.revokeObjectURL(url);
}

export default function BroadcastClient({ contacts }: { contacts: Contact[] }) {
  const [templateName, setTemplateName] = useState<string>(TEMPLATES.RENEWAL_30D);
  const [paramsText, setParamsText] = useState('Company,Category,30,2026-06-15');
  const [selectedType, setSelectedType] = useState<'all' | 'client' | 'lead' | 'partner'>('all');
  const [csvRows, setCsvRows] = useState<Array<{ phone: string; params: string[] }>>([]);
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState({ sent: 0, total: 0, failed: 0 });

  const filteredContacts = useMemo(() => {
    return (contacts || []).filter((c) => selectedType === 'all' || c.type === selectedType);
  }, [contacts, selectedType]);

  function onCsvUpload(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || '');
      const lines = text.split(/\r?\n/).filter(Boolean);
      const parsed = lines.slice(1).map((line) => {
        const cols = line.split(',').map((x) => x.trim());
        return {
          phone: cols[0] || '',
          params: cols.slice(1)
        };
      }).filter((r) => r.phone);
      setCsvRows(parsed);
    };
    reader.readAsText(file);
  }

  async function sendBroadcast() {
    setSending(true);

    const manualParams = paramsText.split(',').map((x) => x.trim());
    const targets = csvRows.length
      ? csvRows
      : filteredContacts.map((c) => ({ phone: c.phone, params: manualParams }));

    setProgress({ sent: 0, total: targets.length, failed: 0 });

    for (let i = 0; i < targets.length; i += 1) {
      const target = targets[i];
      try {
        const response = await fetch('/api/admin/whatsapp/send', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            phone: target.phone,
            mode: 'template',
            templateName,
            params: target.params
          })
        });

        const data = await response.json();
        if (!response.ok || !data?.success) {
          setProgress((p) => ({ ...p, failed: p.failed + 1 }));
        } else {
          setProgress((p) => ({ ...p, sent: p.sent + 1 }));
        }
      } catch {
        setProgress((p) => ({ ...p, failed: p.failed + 1 }));
      }

      // Max 50/minute throttle.
      await new Promise((resolve) => setTimeout(resolve, 1200));
    }

    setSending(false);
  }

  return (
    <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <h2 className="text-sm font-semibold">Broadcast Sender</h2>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="text-xs font-semibold text-slate-400">
          Template
          <select
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-700 px-3 py-2 text-sm"
          >
            {Object.values(TEMPLATES).map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </label>

        <label className="text-xs font-semibold text-slate-400">
          Filter Contacts
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as any)}
            className="mt-1 w-full rounded-md border border-slate-700 px-3 py-2 text-sm"
          >
            <option value="all">All</option>
            <option value="client">Clients</option>
            <option value="lead">Leads</option>
            <option value="partner">Partners</option>
          </select>
        </label>
      </div>

      <label className="block text-xs font-semibold text-slate-400">
        Params Preview (comma-separated)
        <input
          value={paramsText}
          onChange={(e) => setParamsText(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-700 px-3 py-2 text-sm"
        />
      </label>

      <label className="block text-xs font-semibold text-slate-400">
        Upload CSV (phone,param1,param2...)
        <input
          type="file"
          accept=".csv"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onCsvUpload(file);
          }}
          className="mt-1 w-full rounded-md border border-slate-700 px-3 py-2 text-sm"
        />
      </label>

      <div>
        <button
          type="button"
          onClick={downloadSampleCsv}
          className="rounded-md border border-teal-300 px-3 py-2 text-sm font-semibold text-teal-700 hover:bg-teal-50"
        >
          Download Sample CSV
        </button>
      </div>

      <div className="rounded-md border border-slate-800 bg-slate-950 p-3 text-sm">
        <p className="font-semibold">Preview</p>
        <p className="mt-1 text-slate-400">Template: {templateName}</p>
        <p className="text-slate-400">Params: {paramsText}</p>
        <p className="text-slate-400">Recipients: {csvRows.length || filteredContacts.length}</p>
      </div>

      <button
        type="button"
        disabled={sending}
        onClick={sendBroadcast}
        className="btn-primary"
      >
        {sending ? 'Sending Broadcast...' : 'Send Broadcast'}
      </button>

      <p className="text-xs text-slate-400">
        Progress: {progress.sent}/{progress.total} sent · {progress.failed} failed
      </p>
    </section>
  );
}
