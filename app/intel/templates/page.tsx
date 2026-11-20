'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type IntelSourceRow = {
  id: string;
  source_name: string;
  vendor_name: string | null;
};

type IntelTemplateRow = {
  id: string;
  source_id: string;
  template_name: string;
  version_no: number;
  is_active: boolean;
  vendor_name: string | null;
  mapping_json: Record<string, string>;
  updated_at: string;
};

type IntelTemplateVersionRow = {
  id: string;
  template_id: string;
  version_no: number;
  mapping_json: Record<string, string>;
  change_notes: string | null;
  created_at: string;
};

function safeParseJson(input: string): Record<string, string> | null {
  try {
    const parsed = JSON.parse(input);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null;
    }
    return parsed as Record<string, string>;
  } catch {
    return null;
  }
}

export default function IntelTemplatesPage() {
  const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;
  const [sources, setSources] = useState<IntelSourceRow[]>([]);
  const [templates, setTemplates] = useState<IntelTemplateRow[]>([]);
  const [versions, setVersions] = useState<IntelTemplateVersionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [templatePage, setTemplatePage] = useState(1);
  const [templatePageSize, setTemplatePageSize] = useState<number>(25);
  const [versionPage, setVersionPage] = useState(1);
  const [versionPageSize, setVersionPageSize] = useState<number>(10);

  const [selectedSourceId, setSelectedSourceId] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  const [templateName, setTemplateName] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [changeNotes, setChangeNotes] = useState('Initial template');
  const [mappingJsonText, setMappingJsonText] = useState('{\n  "company_name": "Company Name",\n  "gstin": "GSTIN"\n}');

  const loadSources = useCallback(async () => {
    const { data, error: sourceError } = await supabase
      .from('intel_sources')
      .select('id, source_name, vendor_name')
      .eq('active', true)
      .order('source_name', { ascending: true });

    if (sourceError) {
      setError(sourceError.message);
      return;
    }

    const rows = (data || []) as IntelSourceRow[];
    setSources(rows);
    if (!selectedSourceId && rows.length > 0) {
      setSelectedSourceId(rows[0].id);
      setVendorName(rows[0].vendor_name || '');
    }
  }, [selectedSourceId]);

  const loadTemplates = useCallback(async (sourceId?: string) => {
    const target = sourceId || selectedSourceId;
    if (!target) {
      setTemplates([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error: templateError } = await supabase
      .from('intel_mapping_templates')
      .select('*')
      .eq('source_id', target)
      .order('updated_at', { ascending: false });

    if (templateError) {
      setError(templateError.message);
      setLoading(false);
      return;
    }

    const rows = (data || []) as IntelTemplateRow[];
    setTemplates(rows);
    if (!selectedTemplateId && rows.length > 0) {
      setSelectedTemplateId(rows[0].id);
    }
    setLoading(false);
  }, [selectedSourceId, selectedTemplateId]);

  const loadVersions = useCallback(async (templateId?: string) => {
    const target = templateId || selectedTemplateId;
    if (!target) {
      setVersions([]);
      return;
    }

    const { data, error: versionsError } = await supabase
      .from('intel_mapping_template_versions')
      .select('*')
      .eq('template_id', target)
      .order('version_no', { ascending: false });

    if (versionsError) {
      setError(versionsError.message);
      return;
    }

    setVersions((data || []) as IntelTemplateVersionRow[]);
  }, [selectedTemplateId]);

  useEffect(() => {
    loadSources();
  }, [loadSources]);

  useEffect(() => {
    if (!selectedSourceId) return;
    loadTemplates(selectedSourceId);
  }, [loadTemplates, selectedSourceId]);

  useEffect(() => {
    if (!selectedTemplateId) return;
    loadVersions(selectedTemplateId);
  }, [loadVersions, selectedTemplateId]);

  async function handleCreateTemplate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');

    const parsedJson = safeParseJson(mappingJsonText);
    if (!parsedJson) {
      setError('Invalid JSON mapping payload.');
      return;
    }

    if (!selectedSourceId) {
      setError('Select a source first.');
      return;
    }

    setSaving(true);

    const { data: templateRow, error: insertError } = await supabase
      .from('intel_mapping_templates')
      .insert({
        source_id: selectedSourceId,
        vendor_name: vendorName.trim() || null,
        template_name: templateName.trim(),
        version_no: 1,
        is_active: true,
        mapping_json: parsedJson,
        updated_at: new Date().toISOString()
      })
      .select('*')
      .single();

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    const { error: versionError } = await supabase.from('intel_mapping_template_versions').insert({
      template_id: templateRow.id,
      version_no: 1,
      mapping_json: parsedJson,
      change_notes: changeNotes.trim() || 'Initial template'
    });

    if (versionError) {
      setError(versionError.message);
      setSaving(false);
      return;
    }

    setTemplateName('');
    setChangeNotes('Initial template');
    setSuccess('Template created.');
    setSaving(false);
    await loadTemplates(selectedSourceId);
    setSelectedTemplateId(templateRow.id);
    await loadVersions(templateRow.id);
  }

  async function createVersion(template: IntelTemplateRow) {
    setError('');
    setSuccess('');

    const parsedJson = safeParseJson(mappingJsonText);
    if (!parsedJson) {
      setError('Invalid JSON mapping payload.');
      return;
    }

    const nextVersion = Number(template.version_no || 0) + 1;

    const { error: updateError } = await supabase
      .from('intel_mapping_templates')
      .update({
        mapping_json: parsedJson,
        version_no: nextVersion,
        updated_at: new Date().toISOString()
      })
      .eq('id', template.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    const { error: versionError } = await supabase.from('intel_mapping_template_versions').insert({
      template_id: template.id,
      version_no: nextVersion,
      mapping_json: parsedJson,
      change_notes: changeNotes.trim() || 'Version increment'
    });

    if (versionError) {
      setError(versionError.message);
      return;
    }

    setSuccess(`Template version ${nextVersion} saved.`);
    await loadTemplates(selectedSourceId);
    await loadVersions(template.id);
  }

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedTemplateId) || null,
    [templates, selectedTemplateId]
  );

  const templateTotalPages = Math.max(1, Math.ceil(templates.length / templatePageSize));
  const templatePageSafe = Math.min(templatePage, templateTotalPages);
  const templateStart = (templatePageSafe - 1) * templatePageSize;
  const templateEnd = templateStart + templatePageSize;
  const pagedTemplates = templates.slice(templateStart, templateEnd);

  const versionTotalPages = Math.max(1, Math.ceil(versions.length / versionPageSize));
  const versionPageSafe = Math.min(versionPage, versionTotalPages);
  const versionStart = (versionPageSafe - 1) * versionPageSize;
  const versionEnd = versionStart + versionPageSize;
  const pagedVersions = versions.slice(versionStart, versionEnd);

  useEffect(() => {
    setTemplatePage(1);
  }, [selectedSourceId, templates.length, templatePageSize]);

  useEffect(() => {
    setVersionPage(1);
  }, [selectedTemplateId, versions.length, versionPageSize]);

  return (
    <div className="min-h-screen text-slate-100">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-60 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-teal-500/5 blur-[130px]" />
      </div>
      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Link href="/intel" className="text-[11px] text-slate-500 hover:text-slate-300 transition">Intel</Link>
              <svg className="h-3 w-3 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
              <span className="text-[11px] text-slate-400">Templates</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-block h-1.5 w-7 rounded-full bg-cyan-400" />
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Mapping Templates</h1>
            </div>
            <p className="mt-1.5 text-sm text-slate-400">Create reusable vendor/source mappings and version updates.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/intel/sources" className="rounded-md border border-slate-700 px-3 py-2 text-xs font-semibold hover:border-teal-400 hover:text-teal-300">
              Source Registry
            </Link>
          </div>
        </div>

        <div className="mb-4 rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <label className="mb-1 block text-xs text-slate-400">Source</label>
          <select
            value={selectedSourceId}
            onChange={(event) => {
              setSelectedSourceId(event.target.value);
              setSelectedTemplateId('');
              setVersions([]);
            }}
            className="w-full max-w-md rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-teal-400"
          >
            {sources.map((source) => (
              <option key={source.id} value={source.id}>
                {source.source_name}
              </option>
            ))}
          </select>
        </div>

        {error ? <p className="mb-3 text-sm text-rose-300">{error}</p> : null}
        {success ? <p className="mb-3 text-sm text-emerald-300">{success}</p> : null}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 lg:col-span-1">
            <h2 className="text-sm font-semibold text-teal-300">Create Template</h2>
            <form className="mt-4 space-y-3" onSubmit={handleCreateTemplate}>
              <div>
                <label className="mb-1 block text-xs text-slate-400">Template Name</label>
                <input
                  value={templateName}
                  onChange={(event) => setTemplateName(event.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-teal-400"
                  placeholder="Tofler default schema"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">Vendor Name</label>
                <input
                  value={vendorName}
                  onChange={(event) => setVendorName(event.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-teal-400"
                  placeholder="Tofler"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">Change Notes</label>
                <input
                  value={changeNotes}
                  onChange={(event) => setChangeNotes(event.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-teal-400"
                  placeholder="Initial template"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">Mapping JSON</label>
                <textarea
                  value={mappingJsonText}
                  onChange={(event) => setMappingJsonText(event.target.value)}
                  rows={10}
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs outline-none focus:border-teal-400"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-md bg-teal-600 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-500 disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Create Template'}
              </button>
            </form>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 lg:col-span-2">
            <h2 className="text-sm font-semibold text-teal-300">Templates</h2>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs text-slate-300">
              <p>
                Showing {templates.length === 0 ? 0 : templateStart + 1}-{Math.min(templateEnd, templates.length)} of {templates.length}
              </p>
              <div className="flex items-center gap-2">
                <label htmlFor="templates-page-size" className="text-slate-400">
                  Rows
                </label>
                <select
                  id="templates-page-size"
                  value={templatePageSize}
                  onChange={(event) => setTemplatePageSize(Number(event.target.value))}
                  className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-xs outline-none focus:border-teal-400"
                >
                  {PAGE_SIZE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setTemplatePage((prev) => Math.max(1, prev - 1))}
                  disabled={templatePageSafe <= 1}
                  className="rounded border border-slate-700 px-2 py-1 text-xs text-slate-200 hover:border-teal-400 hover:text-teal-300 disabled:opacity-50"
                >
                  Prev
                </button>
                <span>
                  Page {templatePageSafe} / {templateTotalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setTemplatePage((prev) => Math.min(templateTotalPages, prev + 1))}
                  disabled={templatePageSafe >= templateTotalPages}
                  className="rounded border border-slate-700 px-2 py-1 text-xs text-slate-200 hover:border-teal-400 hover:text-teal-300 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/40 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">Vendor</th>
                    <th className="px-3 py-2">Version</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-4">
                        <div className="space-y-2 animate-pulse p-4">
                          {Array.from({length:4}).map((_,i)=><div key={i} className="h-10 rounded-lg bg-slate-800/60"/>)}
                        </div>
                      </td>
                    </tr>
                  ) : templates.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-8 text-center text-slate-400">
                        <svg className="mx-auto h-8 w-8 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        <p className="mt-2">No templates found for selected source.</p>
                      </td>
                    </tr>
                  ) : (
                    pagedTemplates.map((template) => (
                      <tr key={template.id} className="border-b border-slate-900">
                        <td className="px-3 py-2 font-medium text-slate-100">{template.template_name}</td>
                        <td className="px-3 py-2 text-slate-300">{template.vendor_name || '-'}</td>
                        <td className="px-3 py-2 text-slate-300">{template.version_no}</td>
                        <td className="px-3 py-2 text-slate-300">{template.is_active ? 'active' : 'inactive'}</td>
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            className="rounded border border-slate-700 px-2 py-1 text-xs text-slate-200 hover:border-teal-400 hover:text-teal-300"
                            onClick={() => {
                              setSelectedTemplateId(template.id);
                              setMappingJsonText(JSON.stringify(template.mapping_json || {}, null, 2));
                            }}
                          >
                            Select
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950/70 p-4">
              <h3 className="text-sm font-semibold text-teal-300">Version Management</h3>
              <p className="mt-1 text-xs text-slate-400">
                Selected template: {selectedTemplate ? `${selectedTemplate.template_name} (v${selectedTemplate.version_no})` : 'None'}
              </p>
              <button
                type="button"
                disabled={!selectedTemplate}
                onClick={() => selectedTemplate && createVersion(selectedTemplate)}
                className="mt-3 rounded-md bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-100 hover:bg-slate-700 disabled:opacity-50"
              >
                Save As New Version
              </button>

              <div className="mt-4 overflow-x-auto">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-xs text-slate-300">
                  <p>
                    Showing {versions.length === 0 ? 0 : versionStart + 1}-{Math.min(versionEnd, versions.length)} of {versions.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <label htmlFor="versions-page-size" className="text-slate-400">
                      Rows
                    </label>
                    <select
                      id="versions-page-size"
                      value={versionPageSize}
                      onChange={(event) => setVersionPageSize(Number(event.target.value))}
                      className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-xs outline-none focus:border-teal-400"
                    >
                      {PAGE_SIZE_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setVersionPage((prev) => Math.max(1, prev - 1))}
                      disabled={versionPageSafe <= 1}
                      className="rounded border border-slate-700 px-2 py-1 text-xs text-slate-200 hover:border-teal-400 hover:text-teal-300 disabled:opacity-50"
                    >
                      Prev
                    </button>
                    <span>
                      Page {versionPageSafe} / {versionTotalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setVersionPage((prev) => Math.min(versionTotalPages, prev + 1))}
                      disabled={versionPageSafe >= versionTotalPages}
                      className="rounded border border-slate-700 px-2 py-1 text-xs text-slate-200 hover:border-teal-400 hover:text-teal-300 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
                <table className="w-full min-w-[560px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/40 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                      <th className="px-2 py-2">Version</th>
                      <th className="px-2 py-2">Change Notes</th>
                      <th className="px-2 py-2">Created At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {versions.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-2 py-3 text-slate-500">
                          No version records yet.
                        </td>
                      </tr>
                    ) : (
                      pagedVersions.map((version) => (
                        <tr key={version.id} className="border-b border-slate-900">
                          <td className="px-2 py-2 text-slate-200">v{version.version_no}</td>
                          <td className="px-2 py-2 text-slate-300">{version.change_notes || '-'}</td>
                          <td className="px-2 py-2 text-slate-400">{new Date(version.created_at).toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-2 border-t border-slate-900 pt-6">
          <Link href="/intel" className="inline-flex items-center gap-1.5 text-xs text-slate-500 transition hover:text-slate-300">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
            Back to Intel
          </Link>
        </div>
      </section>
    </div>
  );
}
