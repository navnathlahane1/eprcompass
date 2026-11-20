'use client';

import { useState } from 'react';

const CONTENT_TYPES = ['Training Presentation','Awareness Material','Quiz / Assessment','Handout PDF','Email Invite','Social Media Post','WhatsApp Message','Certificate Template'];

const WASTE_CATS = ['Plastic Waste EPR','E-Waste EPR','Battery Waste EPR','Tyre Waste EPR','Used Oil EPR','C&D Waste EPR','General EPR'];

const AUDIENCES = ['Employees','Dealers & Distributors','Customers','Recyclers','Students','General Public','Corporate Leadership','Government Officials'];

const LANG = ['English','Hindi','Marathi','Tamil','Telugu','Bengali','Kannada','Gujarati'];

export default function AIContentPage() {
  const [type,     setType]     = useState(CONTENT_TYPES[0]);
  const [category, setCategory] = useState(WASTE_CATS[0]);
  const [audience, setAudience] = useState(AUDIENCES[0]);
  const [language, setLanguage] = useState('English');
  const [points,   setPoints]   = useState('');
  const [generating, setGenerating] = useState(false);
  const [result,   setResult]   = useState('');

  const SAMPLE_OUTPUT = `# ${category} Awareness Training Presentation

## Slide 1: Title
**Understanding ${category}**
*Compliance & Sustainability for ${audience}*

---

## Slide 2: What is EPR?
Extended Producer Responsibility (EPR) is a policy approach where producers are given significant responsibility for the treatment and disposal of post-consumer products.

**Key Points:**
- Producers are responsible for end-of-life product management
- Reduces burden on municipal waste systems
- Drives eco-design and circular economy

---

## Slide 3: Your Obligations
As a stakeholder, you are required to:
- Register on the CPCB EPR portal
- Submit quarterly reports
- Achieve annual collection/recycling targets
- Maintain evidence of awareness activities

---

## Slide 4: Take Action Today
**Step 1:** Register on CPCB portal
**Step 2:** Partner with authorized recyclers
**Step 3:** Conduct awareness programs annually
**Step 4:** Submit compliance evidence

*Contact EPR Compass through the website contact form*`;

  async function generate() {
    setGenerating(true);
    await new Promise(r => setTimeout(r, 2500));
    setResult(SAMPLE_OUTPUT);
    setGenerating(false);
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-pink-600">
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-white" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          </div>
          <h1 className="text-xl font-semibold text-slate-100">AI Content Generator</h1>
        </div>
        <p className="text-sm text-slate-500">Generate training materials, awareness content, quizzes, and presentations powered by AI.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Config Panel */}
        <div className="space-y-4 rounded-xl border border-slate-800/80 bg-[#0c1022] p-5">
          <h2 className="text-sm font-semibold text-slate-200">Configure Content</h2>
          {[
            { label: 'Content Type',    val: type,     set: setType,     opts: CONTENT_TYPES },
            { label: 'Waste Category',  val: category, set: setCategory, opts: WASTE_CATS },
            { label: 'Target Audience', val: audience, set: setAudience, opts: AUDIENCES },
            { label: 'Language',        val: language, set: setLanguage, opts: LANG },
          ].map(f => (
            <div key={f.label}>
              <label className="block text-xs font-medium text-slate-400 mb-1">{f.label}</label>
              <select value={f.val} onChange={e => f.set(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                {f.opts.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          ))}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Additional Instructions (optional)</label>
            <textarea rows={3} value={points} onChange={e => setPoints(e.target.value)}
              placeholder="Include CPCB portal registration steps, mention annual targets, add contact details…"
              className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          </div>
          <button onClick={generate} disabled={generating}
            className="w-full rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 py-3 text-sm font-bold text-white hover:from-indigo-500 hover:to-violet-500 transition disabled:opacity-50">
            {generating ? 'AI is generating content…' : 'Generate Content'}
          </button>
        </div>

        {/* Output Panel */}
        <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-800/80 flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-400">Generated Content</p>
            {result && (
              <div className="flex gap-2">
                <button className="rounded px-2 py-1 text-[10px] font-medium bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25 transition">Copy</button>
                <button className="rounded px-2 py-1 text-[10px] font-medium bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 transition">Export</button>
              </div>
            )}
          </div>
          {generating ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                <p className="mt-3 text-sm text-slate-400">AI is crafting your content…</p>
                <p className="text-[11px] text-slate-600">Tailoring for {audience} on {category}</p>
              </div>
            </div>
          ) : result ? (
            <div className="p-5 overflow-y-auto max-h-[500px]">
              <pre className="text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-wrap">{result}</pre>
            </div>
          ) : (
            <div className="flex items-center justify-center py-20 text-center px-5">
              <div>
                <svg viewBox="0 0 24 24" className="mx-auto h-10 w-10 text-slate-700" fill="none" stroke="currentColor" strokeWidth={1.25}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                <p className="mt-2 text-sm text-slate-600">Configure and generate AI content</p>
                <p className="text-[11px] text-slate-700">Presentations, quizzes, awareness material in seconds</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

