'use client';

import Link from 'next/link';
import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';

type Step = 'upload' | 'map' | 'preview' | 'importing' | 'done';

const LEAD_FIELDS = [
  { key: 'company', label: 'Company Name', required: true },
  { key: 'contact_name', label: 'Contact Name', required: false },
  { key: 'email', label: 'Email', required: false },
  { key: 'phone', label: 'Phone', required: false },
  { key: 'state', label: 'State', required: false },
  { key: 'city', label: 'City', required: false },
];

const ALIAS_MAP: Record<string, string[]> = {
  company:      ['Company Name', 'Company', 'CompanyName', 'Firm Name', 'Organization', 'Organisation', 'Account Name', 'Business Name', 'Client Company', 'Firm'],
  contact_name: ['Contact Name', 'Contact Person', 'Contact', 'Name', 'Full Name', 'Person Name', 'Customer Name', 'Client Name', 'Owner Name', 'Proprietor', 'Director Name', 'Key Person', 'POC', 'Point of Contact'],
  email:        ['Email', 'Email ID', 'Email Address', 'E-Mail', 'Mail', 'Mail ID'],
  phone:        ['Phone', 'Phone Numbers', 'Phone Number', 'Mobile', 'Mobile No', 'Mobile Number', 'Contact Number', 'Contact No', 'WhatsApp', 'Telephone'],
  state:        ['State', 'Province'],
  city:         ['City', 'Town', 'District'],
};

function normalizeHeader(h: string) {
  return String(h || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function autoMap(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  for (const field of LEAD_FIELDS) {
    const aliases = ALIAS_MAP[field.key] || [];
    for (const alias of aliases) {
      const found = headers.find(h => normalizeHeader(h) === normalizeHeader(alias));
      if (found) { mapping[field.key] = found; break; }
    }
  }
  return mapping;
}

interface ImportResult {
  import_id: string;
  total: number;
  imported: number;
  duplicates: number;
  errors: number;
  warning?: string;
}

const TEMPLATE_ROWS = [
  {
    company: 'ABC Packaging Pvt Ltd',
    contact_name: 'Rohit Sharma',
    email: 'rohit@abcpackaging.com',
    phone: '9876543210',
    state: 'Maharashtra',
    city: 'Mumbai',
  },
  {
    company: 'Green Recycle Industries',
    contact_name: '',
    email: 'info@greenrecycle.in',
    phone: '9988776655',
    state: 'Karnataka',
    city: 'Bengaluru',
  },
];

function downloadLeadTemplateCsv() {
  const headers = LEAD_FIELDS.map((f) => f.key);
  const escapeCell = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const lines = [
    headers.join(','),
    ...TEMPLATE_ROWS.map((row) => headers.map((h) => escapeCell((row as Record<string, unknown>)[h])).join(',')),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'telecalling-leads-template.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function downloadLeadTemplateExcel() {
  const sheet = XLSX.utils.json_to_sheet(TEMPLATE_ROWS, { header: LEAD_FIELDS.map((f) => f.key) });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, 'LeadsTemplate');
  XLSX.writeFile(wb, 'telecalling-leads-template.xlsx');
}

export default function LeadImportWizard() {
  const [step, setStep] = useState<Step>('upload');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, any>[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [filename, setFilename] = useState('');
  const [result, setResult] = useState<ImportResult | null>(null);
  const [importError, setImportError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFilename(file.name);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const data = ev.target?.result;
      const wb = XLSX.read(data, { type: 'array' });
      const sheetName = wb.SheetNames[0];
      const sheet = wb.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: '' });
      if (rows.length === 0) { alert('No rows found in file'); return; }
      const hdrs = Object.keys(rows[0]);
      setHeaders(hdrs);
      setRawRows(rows);
      setMapping(autoMap(hdrs));
      setStep('map');
    };
    reader.readAsArrayBuffer(file);
  }

  function getMappedRows() {
    return rawRows.map(row => {
      const mapped: Record<string, any> = {};
      for (const [field, col] of Object.entries(mapping)) {
        if (col) mapped[field] = row[col];
      }
      return mapped;
    }).filter(r => Object.values(r).some(v => String(v ?? '').trim()));
  }

  async function startImport() {
    setStep('importing');
    setImportError('');
    const rows = getMappedRows();
    try {
      const res = await fetch('/api/admin/telecalling/leads/import', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ rows, filename, column_mapping: mapping }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import failed');
      setResult(data);
      setStep('done');
    } catch (err: any) {
      setImportError(err.message);
      setStep('preview');
    }
  }

  const previewRows = getMappedRows().slice(0, 5);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Step indicators */}
      <div className="flex items-center gap-2 mb-8 text-xs">
        {(['upload', 'map', 'preview'] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            {i > 0 && <div className="w-8 h-px bg-slate-600" />}
            <div className={`flex items-center gap-1.5 ${step === s || (step === 'importing' && s === 'preview') || (step === 'done' && s === 'preview') ? 'text-teal-400' : 'text-slate-500'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === s ? 'bg-teal-500/15 text-white' : 'bg-slate-700 text-slate-400'}`}>{i + 1}</div>
              <span className="capitalize font-medium">{s}</span>
            </div>
          </div>
        ))}
      </div>

      {step === 'upload' && (
        <div>
          <div
            className="border-2 border-dashed border-slate-700 rounded-xl p-12 text-center cursor-pointer hover:border-teal-400 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            <div className="text-4xl mb-3">📄</div>
            <p className="text-lg font-medium text-slate-300">Upload CSV or Excel file</p>
            <p className="text-sm text-slate-500 mt-1">Supports .csv, .xlsx, .xls</p>
            <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFile} />
          </div>

          <div className="mt-4 rounded-xl border border-blue-200 bg-teal-500/10/70 p-4">
            <p className="text-sm font-medium text-blue-900">Need a standard format for your team?</p>
            <p className="text-xs text-teal-300 mt-1">Download the lead import template and fill the same columns for consistency.</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <button
                type="button"
                onClick={downloadLeadTemplateCsv}
                className="px-3 py-1.5 rounded-lg border border-blue-300 text-teal-300 text-xs font-medium hover:bg-teal-500/15"
              >
                Download CSV Template
              </button>
              <button
                type="button"
                onClick={downloadLeadTemplateExcel}
                className="px-3 py-1.5 rounded-lg border border-blue-300 text-teal-300 text-xs font-medium hover:bg-teal-500/15"
              >
                Download Excel Template
              </button>
            </div>
            <p className="text-[11px] text-teal-300/80 mt-2">Template columns: company, contact_name, email, phone, state, city</p>
            <p className="text-[11px] text-teal-300/80 mt-1">
              Only a company name or phone is required per row — contact name is optional and rows without it import fine.
              Columns with different headings can be matched manually in the next step.
            </p>
          </div>
        </div>
      )}

      {step === 'map' && (
        <div>
          <h2 className="text-base font-semibold text-slate-200 mb-4">Map Columns — {rawRows.length} rows from <span className="font-normal text-slate-400">{filename}</span></h2>
          <div className="space-y-3">
            {LEAD_FIELDS.map(field => (
              <div key={field.key} className="flex items-center gap-4">
                <div className="w-40 text-sm text-slate-300">
                  {field.label}{field.required && <span className="text-red-500 ml-1">*</span>}
                </div>
                <select
                  value={mapping[field.key] || ''}
                  onChange={e => setMapping(m => ({ ...m, [field.key]: e.target.value }))}
                  className="flex-1 border border-slate-700 rounded-lg px-3 py-2 text-sm bg-slate-900/60 text-slate-100"
                >
                  <option value="">— skip —</option>
                  {headers.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            ))}
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={() => setStep('upload')} className="px-4 py-2 border border-slate-700 rounded-lg text-sm text-slate-300">Back</button>
            <button
              onClick={() => setStep('preview')}
              disabled={!mapping['company'] && !mapping['phone']}
              className="px-6 py-2 bg-teal-500/15 text-white rounded-lg text-sm font-medium hover:bg-teal-500/20 disabled:opacity-50"
            >
              Preview Import
            </button>
          </div>
        </div>
      )}

      {step === 'preview' && (
        <div>
          <h2 className="text-base font-semibold text-slate-200 mb-1">Preview — {getMappedRows().length} valid rows</h2>
          <p className="text-sm text-slate-400 mb-4">Showing first 5 rows. DNC check and dedup run during import.</p>
          <div className="overflow-x-auto rounded-lg border border-slate-700/60 mb-4">
            <table className="w-full text-xs">
              <thead className="bg-slate-800/40">
                <tr>
                  {LEAD_FIELDS.filter(f => mapping[f.key]).map(f => (
                    <th key={f.key} className="px-3 py-2 text-left font-medium text-slate-300">{f.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row, i) => (
                  <tr key={i} className="border-t border-slate-800">
                    {LEAD_FIELDS.filter(f => mapping[f.key]).map(f => (
                      <td key={f.key} className="px-3 py-2 text-slate-300">{String(row[f.key] ?? '')}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {importError && <p className="text-sm text-red-600 mb-3">{importError}</p>}
          <div className="flex gap-3">
            <button onClick={() => setStep('map')} className="px-4 py-2 border border-slate-700 rounded-lg text-sm text-slate-300">Back</button>
            <button
              onClick={startImport}
              className="px-6 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
            >
              Import {getMappedRows().length} Leads
            </button>
          </div>
        </div>
      )}

      {step === 'importing' && (
        <div className="text-center py-16">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-lg font-medium text-slate-300">Importing leads…</p>
          <p className="text-sm text-slate-500 mt-1">Running DNC check and dedup</p>
        </div>
      )}

      {step === 'done' && result && (
        <div className="text-center py-12">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-xl font-semibold text-slate-100 mb-6">Import Complete</h2>
          {result.warning && (
            <p className="text-sm text-amber-400 mb-4 max-w-md mx-auto">{result.warning}</p>
          )}
          <div className="grid grid-cols-4 gap-4 max-w-md mx-auto mb-8">
            {[
              { label: 'Total', value: result.total },
              { label: 'Imported', value: result.imported, color: 'text-green-600' },
              { label: 'Duplicates', value: result.duplicates, color: 'text-yellow-600' },
              { label: 'Errors', value: result.errors, color: 'text-red-500' },
            ].map(stat => (
              <div key={stat.label} className="bg-slate-900/60 rounded-lg border border-slate-700/60 p-3">
                <div className={`text-2xl font-bold ${stat.color || 'text-slate-100'}`}>{stat.value}</div>
                <div className="text-xs text-slate-400 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
          <Link href="/admin/telecalling/leads" className="px-6 py-2 bg-teal-500/15 text-white rounded-lg text-sm font-medium hover:bg-teal-500/20">
            View Leads
          </Link>
        </div>
      )}
    </div>
  );
}
