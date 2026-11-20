'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const PROGRAM_TYPES = ['Webinar','Workshop','Awareness Session','Corporate Training','Certification Course',
  'Employee Induction','Vendor Training','Dealer Training','Customer Awareness Program','Public Awareness Program',
  'Refresher Program','Educational Program','Sustainability Program','ESG Program','Circular Economy Program'];

const DELIVERY_MODES = ['Online Live','Classroom','Hybrid','Self-Paced','Recorded'];
const VISIBILITY_OPTS = ['Internal Only','Client Only','Invite Only','Public','Educational Partner Only','Hybrid Visibility'];
const WASTE_CATS = ['General','Plastic Waste EPR','E-Waste EPR','Battery Waste EPR','Tyre Waste EPR','Used Oil EPR','C&D Waste EPR'];

export default function CreateProgramPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: '', description: '', program_type: 'Workshop', delivery_mode: 'Online Live',
    visibility: 'Public', waste_category: 'General', capacity: '', duration_hours: '',
    fee: '', is_free: true, certification_offered: true, trainer_name: '', start_date: '',
    objectives: '', target_audience: '',
  });
  const [saving, setSaving] = useState(false);

  function upd(k: string, v: string | boolean) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await new Promise(r => setTimeout(r, 800));
    router.push('/academy/programs');
  }

  const LabelInput = ({ label, name, type = 'text', required = false, placeholder = '' }: { label: string; name: string; type?: string; required?: boolean; placeholder?: string }) => (
    <div>
      <label className="block text-xs font-medium text-slate-400 mb-1">{label}{required && <span className="text-rose-400 ml-0.5">*</span>}</label>
      <input type={type} value={(form as any)[name]} onChange={e => upd(name, e.target.value)}
        required={required} placeholder={placeholder}
        className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
    </div>
  );

  const LabelSelect = ({ label, name, opts }: { label: string; name: string; opts: string[] }) => (
    <div>
      <label className="block text-xs font-medium text-slate-400 mb-1">{label}</label>
      <select value={(form as any)[name]} onChange={e => upd(name, e.target.value)}
        className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500">
        {opts.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-100">Create Training Program</h1>
        <p className="mt-0.5 text-sm text-slate-500">Design and schedule a new training or awareness program.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-200">Program Details</h2>
          <LabelInput label="Program Title" name="title" required placeholder="e.g. EPR Plastic Waste Awareness Workshop" />
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Description</label>
            <textarea rows={3} value={form.description} onChange={e => upd('description', e.target.value)}
              placeholder="Describe the program objectives, content, and expected outcomes…"
              className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Target Audience</label>
            <textarea rows={2} value={form.target_audience} onChange={e => upd('target_audience', e.target.value)}
              placeholder="Employees, dealers, distributors, customers, students…"
              className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Learning Objectives</label>
            <textarea rows={3} value={form.objectives} onChange={e => upd('objectives', e.target.value)}
              placeholder="By end of this program, participants will be able to…"
              className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          </div>
        </div>

        {/* Classification */}
        <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-200">Classification</h2>
          <div className="grid grid-cols-2 gap-4">
            <LabelSelect label="Program Type"   name="program_type"   opts={PROGRAM_TYPES}  />
            <LabelSelect label="Delivery Mode"  name="delivery_mode"  opts={DELIVERY_MODES} />
            <LabelSelect label="Visibility"     name="visibility"     opts={VISIBILITY_OPTS}/>
            <LabelSelect label="EPR Waste Category" name="waste_category" opts={WASTE_CATS} />
          </div>
        </div>

        {/* Scheduling */}
        <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-200">Scheduling & Capacity</h2>
          <div className="grid grid-cols-2 gap-4">
            <LabelInput label="Start Date"      name="start_date"      type="date" />
            <LabelInput label="Duration (hours)"name="duration_hours"  type="number" placeholder="e.g. 4" />
            <LabelInput label="Capacity"        name="capacity"        type="number" placeholder="e.g. 50" />
            <LabelInput label="Lead Trainer"    name="trainer_name"    placeholder="Trainer name" />
          </div>
        </div>

        {/* Fees & Certification */}
        <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-200">Fees & Certification</h2>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
              <input type="checkbox" checked={form.is_free} onChange={e => upd('is_free', e.target.checked)}
                className="rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500" />
              Free Program
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
              <input type="checkbox" checked={form.certification_offered} onChange={e => upd('certification_offered', e.target.checked)}
                className="rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500" />
              Certificate Offered
            </label>
          </div>
          {!form.is_free && (
            <LabelInput label="Registration Fee (₹)" name="fee" type="number" placeholder="e.g. 2500" />
          )}
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving}
            className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50">
            {saving ? 'Creating…' : 'Create Program'}
          </button>
          <button type="button" onClick={() => router.back()}
            className="rounded-lg border border-slate-700 px-5 py-2 text-sm font-medium text-slate-400 transition hover:bg-slate-800">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
