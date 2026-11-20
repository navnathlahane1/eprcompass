'use client';

import { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';

type PreviewRow = Record<string, any>;

type ImportError = {
  rowIndex: number;
  companyName: string;
  reason: string;
};

type SystemField = {
  key: string;
  label: string;
  required?: boolean;
};

const SYSTEM_FIELDS: SystemField[] = [
  { key: 'company_name', label: 'Company Name', required: true },
  { key: 'partner_type', label: 'Partner Type' },
  { key: 'state', label: 'State' },
  { key: 'city', label: 'City' },
  { key: 'pincode', label: 'Pincode' },
  { key: 'outreach_tier', label: 'Outreach Tier' },
  { key: 'stage', label: 'Stage' },
  { key: 'epr_pitch_status', label: 'EPR Pitch Status' },
  { key: 'epr_awareness_level', label: 'EPR Awareness Level' },
  { key: 'outreach_attempt_count', label: 'Outreach Attempt Count' },
  { key: 'contact_name', label: 'Contact Name' },
  { key: 'contact_person_2', label: 'Contact Person 2' },
  { key: 'contact_person_3', label: 'Contact Person 3' },
  { key: 'email_primary', label: 'Email Primary' },
  { key: 'email_secondary', label: 'Email Secondary' },
  { key: 'email_2', label: 'Email 2' },
  { key: 'email_3', label: 'Email 3' },
  { key: 'phone_numbers', label: 'Phone Numbers' },
  { key: 'phone_primary', label: 'Phone Primary' },
  { key: 'phone_secondary', label: 'Phone Secondary' },
  { key: 'phone_tertiary', label: 'Phone Tertiary' },
  { key: 'phone_raw', label: 'Phone Raw' },
  { key: 'website', label: 'Website' },
  { key: 'address', label: 'Address' }
  ,{ key: 'full_address', label: 'Full Address' }
  ,{ key: 'data_source', label: 'Data Source' }
  ,{ key: 'data_completeness_score', label: 'Data Completeness Score' }
  ,{ key: 'priority_score', label: 'Priority Score' }
  ,{ key: 'has_email', label: 'Has Email (Generated, ignored)' }
  ,{ key: 'has_phone', label: 'Has Phone (Generated, ignored)' }
];

const DEFAULT_ALIASES: Record<string, string[]> = {
  company_name: ['Company Name', 'CompanyName', 'Name of Company', 'Organization Name', 'Firm Name', 'Company'],
  partner_type: ['Partner Type', 'Company Type', 'Type', 'Business Type'],
  state: ['State', 'Province'],
  city: ['City', 'Town'],
  pincode: ['Pincode', 'Pin Code', 'Postal Code', 'Zip'],
  outreach_tier: ['Outreach Tier', 'Tier', 'Priority Tier'],
  stage: ['Stage', 'Partner Stage'],
  epr_pitch_status: ['EPR Pitch Status', 'Pitch Status'],
  epr_awareness_level: ['EPR Awareness Level', 'Awareness Level'],
  outreach_attempt_count: ['Outreach Attempt Count', 'Attempts'],
  contact_name: ['Contact Name', 'Contact Person', 'Contact'],
  contact_person_2: ['Contact Person 2', 'Secondary Contact Person'],
  contact_person_3: ['Contact Person 3', 'Tertiary Contact Person'],
  email_primary: ['Email Primary', 'E-Mail', 'Email', 'Email ID', 'Email Address'],
  email_secondary: ['Email Secondary', 'Secondary Email'],
  email_2: ['Email 2', 'Alternate Email 2'],
  email_3: ['Email 3', 'Alternate Email 3'],
  phone_numbers: ['Phone Numbers', 'Phone', 'Mobile', 'Mobile No', 'Contact Number'],
  phone_primary: ['Phone Primary', 'Primary Phone'],
  phone_secondary: ['Phone Secondary', 'Secondary Phone'],
  phone_tertiary: ['Phone Tertiary', 'Tertiary Phone'],
  phone_raw: ['Phone Raw', 'Raw Phone'],
  website: ['Website', 'Weblink', 'URL', 'Site'],
  address: ['Address', 'Office Address'],
  full_address: ['Full Address'],
  data_source: ['Data Source', 'Source'],
  data_completeness_score: ['Data Completeness Score', 'Completeness Score'],
  priority_score: ['Priority Score'],
  has_email: ['Has Email'],
  has_phone: ['Has Phone']
};

function normalizeHeader(value: string): string {
  return String(value || '').replace(/^\uFEFF/, '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function guessMappingFromColumns(columns: string[]): Record<string, string> {
  const normalized = new Map<string, string>();
  columns.forEach((col) => normalized.set(normalizeHeader(col), col));

  const out: Record<string, string> = {};
  SYSTEM_FIELDS.forEach((field) => {
    const aliases = DEFAULT_ALIASES[field.key] || [field.label];
    for (const alias of aliases) {
      const hit = normalized.get(normalizeHeader(alias));
      if (hit) {
        out[field.key] = hit;
        return;
      }
    }
  });

  return out;
}

function downloadSampleCsv() {
  const headers = [
    'Company Name',
    'Partner Type',
    'State',
    'City',
    'Pincode',
    'Outreach Tier',
    'Stage',
    'EPR Pitch Status',
    'EPR Awareness Level',
    'Outreach Attempt Count',
    'Contact Name',
    'Contact Person 2',
    'Contact Person 3',
    'Email Primary',
    'Email Secondary',
    'Email 2',
    'Email 3',
    'Phone Numbers',
    'Phone Primary',
    'Phone Secondary',
    'Phone Tertiary',
    'Phone Raw',
    'Website',
    'Address',
    'Full Address',
    'Data Source',
    'Data Completeness Score',
    'Priority Score',
    'Has Email',
    'Has Phone'
  ];

  const sampleRow = [
    'ABC Logistics Pvt Ltd',
    'Logistics / Freight Forwarder',
    'Maharashtra',
    'Mumbai',
    '400069',
    'Tier 1',
    'Not Contacted',
    'Not Pitched',
    'Low',
    '0',
    'Rahul Mehta',
    'Nidhi Sharma',
    'Vikas Rao',
    'rahul@abclogistics.com',
    'ops@abclogistics.com',
    'sales@abclogistics.com',
    'owner@abclogistics.com',
    '+919876543210|022-22223333',
    '+919876543210',
    '02222223333',
    '',
    '+919876543210|02222223333',
    'https://abclogistics.com',
    'Unit 5, Andheri East',
    'Unit 5, Andheri East, Mumbai, 400069',
    'Manual',
    '75',
    '6',
    '',
    ''
  ];

  const csv = [headers, sampleRow]
    .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'partners-import-sample.csv';
  a.click();

  URL.revokeObjectURL(url);
}

export default function PartnerImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped: number; errors: ImportError[] } | null>(null);
  const [error, setError] = useState('');

  const hasPreview = previewRows.length > 0;

  const previewColumns = useMemo(() => {
    const first = previewRows[0] || {};
    return Object.keys(first).slice(0, 8);
  }, [previewRows]);

  const allPreviewColumns = useMemo(() => {
    const first = previewRows[0] || {};
    return Object.keys(first);
  }, [previewRows]);

  const mappingMissingRequired = useMemo(() => {
    return SYSTEM_FIELDS.some((field) => field.required && !columnMapping[field.key]);
  }, [columnMapping]);

  async function readPreviewRows(selectedFile: File) {
    const buffer = await selectedFile.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });

    const wantedSheets = ['Tier1_Hot', 'Tier2_Warm', 'All Leads'];
    let chosen = workbook.SheetNames.find((name) => wantedSheets.some((x) => x.toLowerCase() === name.toLowerCase()));
    if (!chosen) chosen = workbook.SheetNames[0];
    if (!chosen) return [];

    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(workbook.Sheets[chosen], { defval: '' });
    return rows.slice(0, 10);
  }

  async function onPreview() {
    if (!file) return;
    setLoadingPreview(true);
    setError('');
    setResult(null);

    try {
      const rows = await readPreviewRows(file);
      setPreviewRows(rows);
      const columns = rows.length ? Object.keys(rows[0]) : [];
      setColumnMapping(guessMappingFromColumns(columns));
    } catch (e: any) {
      setError(String(e?.message || 'Unable to preview file'));
      setPreviewRows([]);
      setColumnMapping({});
    } finally {
      setLoadingPreview(false);
    }
  }

  async function onImport() {
    if (!file) return;
    setImporting(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('sourceName', 'CHA_EPR_Leads_Ready');
      formData.append('columnMapping', JSON.stringify(columnMapping));

      const response = await fetch('/api/admin/partners/import', {
        method: 'POST',
        body: formData
      });

      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || 'Import failed');
      }

      setResult({
        imported: Number(payload.imported || 0),
        skipped: Number(payload.skipped || 0),
        errors: Array.isArray(payload.errors) ? payload.errors : []
      });
    } catch (e: any) {
      setError(String(e?.message || 'Import failed'));
    } finally {
      setImporting(false);
    }
  }

  function downloadErrorReport() {
    if (!result?.errors?.length) return;

    const headers = ['rowIndex', 'companyName', 'reason'];
    const rows = result.errors.map((item) =>
      [item.rowIndex, item.companyName, item.reason]
        .map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`)
        .join(',')
    );

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'partner-import-errors.csv';
    a.click();

    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <h1 className="text-2xl font-bold text-slate-100">Partner Bulk Import</h1>
        <p className="mt-1 text-slate-400">Upload CHA/Logistics lead files, preview data, and import with error tracking.</p>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <label className="flex min-h-32 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-slate-700 p-6 text-center hover:border-blue-400">
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(event) => {
              const selected = event.target.files?.[0] || null;
              setFile(selected);
              setPreviewRows([]);
              setColumnMapping({});
              setResult(null);
              setError('');
            }}
          />
          <span className="text-sm text-slate-200">
            {file ? `Selected: ${file.name}` : 'Drag & drop or click to upload .xlsx/.csv'}
          </span>
        </label>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={downloadSampleCsv}
            className="rounded-lg border border-blue-700/50 px-4 py-2 text-sm font-semibold text-blue-300 hover:bg-blue-950/30"
          >
            Download Sample CSV
          </button>

          <button
            type="button"
            onClick={onPreview}
            disabled={!file || loadingPreview}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingPreview ? 'Previewing...' : 'Preview'}
          </button>

          <button
            type="button"
            onClick={onImport}
            disabled={!file || importing || (hasPreview && mappingMissingRequired)}
            className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            {importing ? 'Importing...' : 'Import'}
          </button>
        </div>

        {hasPreview && mappingMissingRequired ? (
          <p className="mt-3 text-sm text-amber-700">Map required fields before importing.</p>
        ) : null}

        {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
      </section>

      {hasPreview ? (
        <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
          <h2 className="mb-3 text-lg font-semibold text-slate-100">Column Mapping</h2>
          <p className="mb-4 text-sm text-slate-400">Map uploaded file columns to your system fields, then import.</p>

          <div className="mb-6 overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-left text-slate-400">
                  <th className="px-2 py-2 font-semibold">System Field</th>
                  <th className="px-2 py-2 font-semibold">CSV Column</th>
                </tr>
              </thead>
              <tbody>
                {SYSTEM_FIELDS.map((field) => (
                  <tr key={field.key} className="border-b border-slate-800/60">
                    <td className="px-2 py-2 text-slate-100">
                      {field.label}
                      {field.required ? <span className="ml-1 text-rose-400">*</span> : null}
                    </td>
                    <td className="px-2 py-2">
                      <select
                        value={columnMapping[field.key] || ''}
                        onChange={(event) => {
                          const value = event.target.value;
                          setColumnMapping((prev) => ({ ...prev, [field.key]: value }));
                        }}
                        className="w-full rounded-md border border-slate-700 px-3 py-2 text-sm"
                      >
                        <option value="">-- Not mapped --</option>
                        {allPreviewColumns.map((col) => (
                          <option key={`${field.key}-${col}`} value={col}>{col}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 className="mb-3 text-lg font-semibold text-slate-100">Preview (first 10 rows)</h2>
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-left text-slate-400">
                  {previewColumns.map((col) => (
                    <th key={col} className="px-2 py-2 font-semibold">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row, idx) => (
                  <tr key={idx} className="border-b border-slate-800/60">
                    {previewColumns.map((col) => (
                      <td key={`${idx}-${col}`} className="px-2 py-2 text-slate-100">{String(row[col] ?? '')}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {result ? (
        <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
          <h2 className="text-lg font-semibold text-slate-100">Import Result</h2>
          <p className="mt-2 text-sm text-slate-200">Imported: {result.imported}</p>
          <p className="text-sm text-slate-200">Skipped: {result.skipped}</p>

          {result.errors.length ? (
            <>
              <button
                type="button"
                onClick={downloadErrorReport}
                className="mt-3 rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-950"
              >
                Download Error Report
              </button>

              <ul className="mt-4 max-h-64 space-y-2 overflow-auto text-sm text-slate-200">
                {result.errors.map((item, idx) => (
                  <li key={`${item.rowIndex}-${idx}`} className="rounded-md border border-slate-800 px-3 py-2">
                    Row {item.rowIndex + 1} · {item.companyName || 'Unknown'} · {item.reason}
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
