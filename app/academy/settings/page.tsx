'use client';

import { useState } from 'react';
import { SITE_CONTACT_EMAIL, SITE_CONTACT_WHATSAPP } from '@/lib/siteContact';

export default function AcademySettingsPage() {
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    academy_name: 'EPR Academy',
    tagline: 'Training, Certification & EPR Awareness Management',
    contact_email: SITE_CONTACT_EMAIL,
    contact_phone: SITE_CONTACT_WHATSAPP,
    certificate_signature_name: 'EPR Compass',
    certificate_signature_title: 'Training Team',
    auto_certificate_issuance: true,
    require_assessment_pass: true,
    assessment_pass_percentage: '70',
    certificate_validity_months: '12',
    enable_qr_verification: true,
    reminder_days_before: '3',
    auto_attendance_reminder: true,
    enable_ai_features: true,
    marketplace_public: true,
    allow_institutional_registration: true,
  });

  function upd(k: string, v: string | boolean) { setForm(f => ({ ...f, [k]: v })); }

  async function save() {
    setSaved(true);
    await new Promise(r => setTimeout(r, 800));
    setSaved(false);
  }

  const Toggle = ({ k }: { k: string }) => (
    <button onClick={() => upd(k, !(form as any)[k])}
      className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors ${(form as any)[k] ? 'bg-indigo-600' : 'bg-slate-700'}`}>
      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${(form as any)[k] ? 'translate-x-4' : 'translate-x-0'}`} />
    </button>
  );

  const Input = ({ k, label, type = 'text' }: { k: string; label: string; type?: string }) => (
    <div className="flex items-center justify-between gap-4">
      <label className="text-sm text-slate-300">{label}</label>
      <input type={type} value={(form as any)[k]} onChange={e => upd(k, e.target.value)}
        className="w-64 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-right" />
    </div>
  );

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Academy Settings</h1>
          <p className="mt-0.5 text-sm text-slate-500">Configure academy operations, certification, and automation</p>
        </div>
        <button onClick={save}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition">
          {saved ? '✓ Saved' : 'Save Settings'}
        </button>
      </div>

      {/* Branding */}
      <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-200">Academy Profile</h2>
        <Input k="academy_name"  label="Academy Name"   />
        <Input k="tagline"       label="Tagline"         />
        <Input k="contact_email" label="Contact Email"   type="email" />
        <Input k="contact_phone" label="Contact Phone"   />
      </div>

      {/* Certification */}
      <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-200">Certification Settings</h2>
        <Input k="certificate_signature_name"  label="Signatory Name"  />
        <Input k="certificate_signature_title" label="Signatory Title" />
        <Input k="assessment_pass_percentage"  label="Minimum Pass %"  type="number" />
        <Input k="certificate_validity_months" label="Certificate Validity (months)" type="number" />
        <div className="flex items-center justify-between">
          <label className="text-sm text-slate-300">Auto-issue on completion</label>
          <Toggle k="auto_certificate_issuance" />
        </div>
        <div className="flex items-center justify-between">
          <label className="text-sm text-slate-300">Require assessment to pass</label>
          <Toggle k="require_assessment_pass" />
        </div>
        <div className="flex items-center justify-between">
          <label className="text-sm text-slate-300">QR code verification</label>
          <Toggle k="enable_qr_verification" />
        </div>
      </div>

      {/* Automation */}
      <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-200">Automation & Notifications</h2>
        <Input k="reminder_days_before" label="Reminder days before session" type="number" />
        <div className="flex items-center justify-between">
          <label className="text-sm text-slate-300">Auto attendance reminder</label>
          <Toggle k="auto_attendance_reminder" />
        </div>
      </div>

      {/* Features */}
      <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-200">Features</h2>
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm text-slate-300">AI Features</label>
            <p className="text-[11px] text-slate-500">AI planner, content generator, compliance advisor</p>
          </div>
          <Toggle k="enable_ai_features" />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm text-slate-300">Public Marketplace</label>
            <p className="text-[11px] text-slate-500">Show programs on public website</p>
          </div>
          <Toggle k="marketplace_public" />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm text-slate-300">Institutional Registrations</label>
            <p className="text-[11px] text-slate-500">Allow colleges and universities to register</p>
          </div>
          <Toggle k="allow_institutional_registration" />
        </div>
      </div>
    </div>
  );
}
