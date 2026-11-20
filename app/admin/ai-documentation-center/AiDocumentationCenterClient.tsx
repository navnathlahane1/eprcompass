'use client';

import { useEffect, useMemo, useState } from 'react';

type DocItem = {
  path: string;
  title: string;
  category: string;
  updatedAt: string;
  summary: string;
};

type IndexResponse = {
  ok: boolean;
  index: {
    generatedAt: string;
    version: string;
    repo: string;
    docs: DocItem[];
  };
};

type ContentResponse = {
  ok: boolean;
  path: string;
  content: string;
};

type Segment =
  | { type: 'markdown'; value: string }
  | { type: 'mermaid'; value: string };

function splitMarkdownSegments(raw: string): Segment[] {
  const lines = String(raw || '').split('\n');
  const segments: Segment[] = [];
  let inMermaid = false;
  let buffer: string[] = [];

  const pushBufferAsMarkdown = () => {
    if (buffer.length > 0) {
      segments.push({ type: 'markdown', value: buffer.join('\n') });
      buffer = [];
    }
  };

  for (const line of lines) {
    if (line.trim() === '```mermaid') {
      pushBufferAsMarkdown();
      inMermaid = true;
      continue;
    }

    if (line.trim() === '```' && inMermaid) {
      segments.push({ type: 'mermaid', value: buffer.join('\n') });
      buffer = [];
      inMermaid = false;
      continue;
    }

    buffer.push(line);
  }

  if (buffer.length > 0) {
    segments.push({ type: inMermaid ? 'mermaid' : 'markdown', value: buffer.join('\n') });
  }

  return segments;
}

function MermaidBlock({ code }: { code: string }) {
  const [src, setSrc] = useState('');

  useEffect(() => {
    const encoded = encodeURIComponent(code);
    setSrc(`https://mermaid.ink/img/${encoded}`);
  }, [code]);

  return (
    <div className="overflow-hidden rounded-xl border border-cyan-900/40 bg-slate-950/60 p-3">
      {src ? (
        <img
          src={src}
          alt="Auto-generated architecture diagram"
          className="max-h-[520px] w-full rounded-md object-contain"
        />
      ) : null}
      <details className="mt-3 rounded-lg border border-slate-800 bg-slate-950/80 p-2">
        <summary className="cursor-pointer text-xs text-slate-400">View Mermaid source</summary>
        <pre className="mt-2 whitespace-pre-wrap text-xs text-slate-300">{code}</pre>
      </details>
    </div>
  );
}

function MarkdownBlock({ value }: { value: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
      <pre className="whitespace-pre-wrap text-sm leading-7 text-slate-200">{value}</pre>
    </div>
  );
}

export default function AiDocumentationCenterClient() {
  const [loading, setLoading] = useState(true);
  const [regenLoading, setRegenLoading] = useState(false);
  const [index, setIndex] = useState<IndexResponse['index'] | null>(null);
  const [selectedPath, setSelectedPath] = useState('');
  const [docContent, setDocContent] = useState('');
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState('');
  const [askQuery, setAskQuery] = useState('');
  const [askLoading, setAskLoading] = useState(false);
  const [askAnswer, setAskAnswer] = useState('');
  const [relatedTopics, setRelatedTopics] = useState<Array<{ title: string; path: string; category: string }>>([]);

  async function loadIndex() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/ai-docs/index', { cache: 'no-store' });
      const data = (await response.json()) as IndexResponse | { error: string };
      if (!response.ok || !('ok' in data)) {
        throw new Error((data as any).error || 'Failed to load docs index');
      }
      setIndex(data.index);

      if (!selectedPath && data.index.docs.length > 0) {
        setSelectedPath(data.index.docs[0].path);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load docs index');
    } finally {
      setLoading(false);
    }
  }

  async function loadDoc(path: string) {
    if (!path) return;
    setError('');
    try {
      const response = await fetch(`/api/admin/ai-docs/content?path=${encodeURIComponent(path)}`, { cache: 'no-store' });
      const data = (await response.json()) as ContentResponse | { error: string };
      if (!response.ok || !('ok' in data)) {
        throw new Error((data as any).error || 'Failed to load document');
      }
      setDocContent(data.content);
    } catch (err: any) {
      setError(err?.message || 'Failed to load document');
      setDocContent('');
    }
  }

  async function regenerateDocs() {
    setRegenLoading(true);
    setMessage('');
    setError('');
    try {
      const response = await fetch('/api/admin/ai-docs/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Generation failed');
      }

      setMessage(`Documentation regenerated successfully (${data.totalDocs || 0} docs).`);
      await loadIndex();
      if (selectedPath) {
        await loadDoc(selectedPath);
      }
    } catch (err: any) {
      setError(err?.message || 'Generation failed');
    } finally {
      setRegenLoading(false);
    }
  }

  async function askDocsAssistant() {
    const input = askQuery.trim();
    if (!input) return;

    setAskLoading(true);
    setAskAnswer('');
    setRelatedTopics([]);
    setError('');

    try {
      const response = await fetch(`/api/admin/ai-docs/ask?q=${encodeURIComponent(input)}`, {
        cache: 'no-store',
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'AI assistant failed');
      }

      setAskAnswer(String(data?.answer || 'No answer available yet.'));
      setRelatedTopics(Array.isArray(data?.relatedTopics) ? data.relatedTopics : []);
    } catch (err: any) {
      setError(err?.message || 'AI assistant failed');
    } finally {
      setAskLoading(false);
    }
  }

  useEffect(() => {
    loadIndex();
  }, []);

  useEffect(() => {
    if (selectedPath) {
      loadDoc(selectedPath);
    }
  }, [selectedPath]);

  const filteredDocs = useMemo(() => {
    if (!index) return [];
    const q = query.trim().toLowerCase();
    if (!q) return index.docs;
    return index.docs.filter((item) => {
      const text = `${item.title} ${item.summary} ${item.path} ${item.category}`.toLowerCase();
      return text.includes(q);
    });
  }, [index, query]);

  const selectedDoc = useMemo(
    () => index?.docs.find((item) => item.path === selectedPath) || null,
    [index, selectedPath]
  );

  const segments = useMemo(() => splitMarkdownSegments(docContent), [docContent]);

  return (
    <div className="min-h-[calc(100vh-110px)] text-slate-100" dir="auto">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-52 left-20 h-[420px] w-[420px] rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute right-10 top-14 h-[260px] w-[360px] rounded-full bg-indigo-500/10 blur-[100px]" />
      </div>

      <div className="relative z-10 mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Super Admin Module</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">AI Documentation Center</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-300">
            Your internal technical Wikipedia. This space auto-generates architecture, API, database, and workflow docs in simple language.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-cyan-400 hover:text-cyan-300"
          >
            Print / Save PDF
          </button>
          <button
            type="button"
            onClick={regenerateDocs}
            disabled={regenLoading}
            className="rounded-lg border border-cyan-500/60 bg-cyan-500/15 px-3 py-2 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/25 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {regenLoading ? 'Regenerating...' : 'Regenerate Docs'}
          </button>
        </div>
      </div>

      <div className="relative z-10 mb-4 flex flex-wrap items-center gap-3 text-xs text-slate-400">
        <span className="rounded-full border border-slate-700 bg-slate-900/70 px-2 py-1">
          Generated: {index?.generatedAt ? new Date(index.generatedAt).toLocaleString() : 'Not generated yet'}
        </span>
        <span className="rounded-full border border-slate-700 bg-slate-900/70 px-2 py-1">Version: {index?.version || 'unknown'}</span>
        <span className="rounded-full border border-slate-700 bg-slate-900/70 px-2 py-1">Total docs: {index?.docs.length || 0}</span>
      </div>

      <div className="relative z-10 mb-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
        <p className="mb-2 text-xs uppercase tracking-wide text-cyan-300">Ask AI about this platform</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={askQuery}
            onChange={(event) => setAskQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') askDocsAssistant();
            }}
            placeholder="Example: Explain telecalling workflow"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400"
            aria-label="Ask AI documentation assistant"
          />
          <button
            type="button"
            onClick={askDocsAssistant}
            disabled={askLoading}
            className="rounded-lg border border-cyan-500/60 bg-cyan-500/15 px-3 py-2 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/25 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {askLoading ? 'Thinking...' : 'Ask'}
          </button>
        </div>

        {askAnswer ? (
          <div className="mt-3 rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-sm text-slate-200">
            {askAnswer}
          </div>
        ) : null}

        {relatedTopics.length > 0 ? (
          <div className="mt-3">
            <p className="mb-2 text-xs uppercase tracking-wide text-slate-400">Related topics</p>
            <div className="flex flex-wrap gap-2">
              {relatedTopics.map((topic) => (
                <button
                  key={topic.path}
                  type="button"
                  onClick={() => setSelectedPath(topic.path)}
                  className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-300 hover:border-cyan-400 hover:text-cyan-300"
                >
                  {topic.title}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {message ? (
        <div className="relative z-10 mb-4 rounded-xl border border-emerald-700/60 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-200">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="relative z-10 mb-4 rounded-xl border border-rose-700/60 bg-rose-950/40 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      <div className="relative z-10 grid gap-4 lg:grid-cols-[330px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3 backdrop-blur">
          <div className="mb-3">
            <label className="mb-1 block text-[11px] uppercase tracking-wide text-slate-400">Search docs</label>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search architecture, APIs, flows..."
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400"
              aria-label="Search AI documentation"
            />
          </div>

          <div className="max-h-[64vh] space-y-1 overflow-auto pr-1">
            {loading ? (
              <p className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-sm text-slate-400">Loading docs...</p>
            ) : null}

            {!loading && filteredDocs.length === 0 ? (
              <p className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-sm text-slate-400">No matching docs.</p>
            ) : null}

            {filteredDocs.map((item) => {
              const active = item.path === selectedPath;
              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => setSelectedPath(item.path)}
                  className={`w-full rounded-lg border px-3 py-2 text-left transition ${
                    active
                      ? 'border-cyan-500/60 bg-cyan-500/15 text-cyan-100'
                      : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                  aria-label={`Open documentation ${item.title}`}
                >
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">{item.category}</p>
                  <p className="mt-1 text-sm font-semibold leading-5">{item.title}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-400">{item.summary}</p>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 backdrop-blur">
          {!selectedDoc ? (
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-6 text-sm text-slate-400">
              Select a documentation page from the left panel.
            </div>
          ) : (
            <>
              <div className="mb-4 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-cyan-300">{selectedDoc.category}</p>
                    <h2 className="mt-1 text-2xl font-semibold text-slate-100">{selectedDoc.title}</h2>
                    <p className="mt-2 text-sm text-slate-300">{selectedDoc.summary}</p>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={`/api/admin/ai-docs/export?path=${encodeURIComponent(selectedDoc.path)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-cyan-400 hover:text-cyan-300"
                    >
                      Export Page (PDF View)
                    </a>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {segments.map((segment, index) => {
                  if (segment.type === 'mermaid') {
                    return <MermaidBlock key={`mermaid-${index}`} code={segment.value} />;
                  }
                  return <MarkdownBlock key={`markdown-${index}`} value={segment.value} />;
                })}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
