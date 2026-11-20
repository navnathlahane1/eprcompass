'use client';

import { useState, useEffect } from 'react';

const TEMPLATES = [
  { id: 'session-reminder', icon: '🔔', label: 'Session Reminder', subject: 'Reminder: Your session starts tomorrow at 10 AM IST', body: 'Hi {{learner_name}},\n\nThis is a friendly reminder that your {{program_name}} session starts tomorrow.\n\n📅 Date & Time: {{session_date}}\n🔗 Join here: {{zoom_link}}\n\nSee you there!\n\nEPR Academy Team' },
  { id: 'assignment-due', icon: '📝', label: 'Assignment Due', subject: 'Action Required: Assignment due in 48 hours', body: 'Hi {{learner_name}},\n\nYour assignment for {{program_name}} is due in 48 hours. Please submit it on the portal before the deadline.\n\nNeed help? Reply to this message.\n\nEPR Academy Team' },
  { id: 'certificate', icon: '🎓', label: 'Certificate Issued', subject: 'Congratulations! Your EPR Compass is ready', body: 'Hi {{learner_name}},\n\nCongratulations on completing {{program_name}}! 🎉\n\nYour certificate is ready for download:\n👉 {{cert_download_url}}\n\nShare it on LinkedIn and let your network know!\n\nEPR Academy Team' },
  { id: 'batch-filling', icon: '⚡', label: 'Batch Filling Up', subject: 'Only a few seats left — Act now!', body: 'Hi {{learner_name}},\n\nThe upcoming batch of {{program_name}} is almost full!\n\nSecure your seat today before it\'s too late.\n\n👉 Enroll now at EPR Compass\n\nEPR Academy Team' },
  { id: 'upgrade-offer', icon: '🚀', label: 'Upgrade Offer', subject: 'Exclusive Alumni Discount: Upgrade to the next Tier', body: 'Hi {{learner_name}},\n\nAs a valued {{program_name}} alumni, you qualify for an exclusive upgrade discount.\n\nUpgrade to the next tier and take your EPR expertise further.\n\n👉 Claim your discount at EPR Compass\n\nEPR Academy Team' },
  { id: 'payment-reminder', icon: '💳', label: 'Payment Reminder', subject: 'Action Required: EMI payment overdue', body: 'Hi {{learner_name}},\n\nThis is a reminder that your EMI payment for {{program_name}} is overdue.\n\nPlease complete your payment to continue accessing course materials.\n\n👉 Pay now at EPR Compass\n\nEPR Academy Team' },
  { id: 'post-survey', icon: '📊', label: 'Post-Session Survey', subject: 'Quick feedback request — 2 minutes', body: 'Hi {{learner_name}},\n\nThank you for attending today\'s {{program_name}} session on {{session_date}}.\n\nWe\'d love your feedback! It takes just 2 minutes:\n👉 {{zoom_link}}\n\nYour input helps us improve.\n\nEPR Academy Team' },
  { id: 'partner-payout', icon: '💰', label: 'Partner Payout', subject: 'Your EPR Academy payout has been processed', body: 'Hi Partner,\n\nYour monthly payout from EPR Academy has been processed and will reflect in your account within 2 business days.\n\nThank you for your continued partnership!\n\nEPR Academy Team' },
];

const AUDIENCE_OPTIONS = [
  { id: 'all-program',     label: 'All learners in program', estimatedCount: null },
  { id: 'all-confirmed',   label: 'All confirmed registrations', estimatedCount: null },
  { id: 'all-partners',    label: 'All active partners', estimatedCount: null },
  { id: 'specific-cohort', label: 'Specific cohort', estimatedCount: null },
  { id: 'individual',      label: 'Individual learner', estimatedCount: 1 },
];

const VARIABLES = ['{{learner_name}}', '{{program_name}}', '{{session_date}}', '{{zoom_link}}', '{{cert_download_url}}'];

export default function BroadcastPage() {
  const [step, setStep] = useState(1);
  const [programs, setPrograms]           = useState<{ id: string; title: string }[]>([]);
  const [audience, setAudience]           = useState('all-program');
  const [program, setProgram]             = useState('');
  const [channelEmail, setChannelEmail]   = useState(true);
  const [channelWA, setChannelWA]         = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [subject, setSubject]             = useState('');
  const [body, setBody]                   = useState('');
  const [scheduleMode, setScheduleMode]   = useState<'now' | 'schedule'>('now');
  const [scheduleAt, setScheduleAt]       = useState('');
  const [sent, setSent]                   = useState(false);

  useEffect(() => {
    fetch('/api/academy/programs')
      .then(r => r.json())
      .then(d => {
        const list = (d.programs ?? []).map((p: any) => ({ id: p.id, title: p.title }));
        setPrograms(list);
        if (list.length > 0) setProgram(list[0].title);
      })
      .catch(() => {});
  }, []);

  const audienceObj    = AUDIENCE_OPTIONS.find(a => a.id === audience)!;
  const estimatedCount = audienceObj.estimatedCount ?? 0;

  function pickTemplate(tpl: typeof TEMPLATES[0]) {
    setSelectedTemplate(tpl.id);
    setSubject(tpl.subject);
    setBody(tpl.body);
    setStep(4);
  }

  function insertVar(v: string) {
    setBody(prev => prev + ' ' + v);
  }

  const previewBody = body
    .replace(/{{learner_name}}/g, '[Learner Name]')
    .replace(/{{program_name}}/g, program || '[Program Name]')
    .replace(/{{session_date}}/g, '[Session Date & Time]')
    .replace(/{{zoom_link}}/g, '[Meeting Link]')
    .replace(/{{cert_download_url}}/g, '[Certificate URL]');

  if (sent) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="h-16 w-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
        <svg className="h-8 w-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
      </div>
      <h2 className="text-lg font-semibold text-slate-100">{scheduleMode === 'now' ? 'Broadcast Sent!' : 'Broadcast Scheduled!'}</h2>
      <p className="text-slate-500 text-sm">{estimatedCount} recipients · {[channelEmail && 'Email', channelWA && 'WhatsApp'].filter(Boolean).join(' + ')}</p>
      <button onClick={() => setSent(false)} className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-500 transition">New Broadcast</button>
    </div>
  );

  const STEPS = ['Audience', 'Channel', 'Template', 'Message', 'Schedule'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-100">Broadcast Composer</h1>
        <p className="mt-0.5 text-sm text-slate-500">Send targeted messages to learners, partners, or cohorts</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-0">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center">
            <button onClick={() => setStep(i + 1)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${step === i+1 ? 'bg-indigo-600 text-white' : step > i+1 ? 'text-emerald-400' : 'text-slate-500'}`}>
              <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step===i+1 ? 'bg-white/20' : step>i+1 ? 'bg-emerald-500/20' : 'bg-slate-800'}`}>
                {step > i+1 ? '✓' : i+1}
              </span>
              {s}
            </button>
            {i < STEPS.length-1 && <div className={`h-px w-6 ${step > i+1 ? 'bg-emerald-500/40' : 'bg-slate-800'}`} />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Steps */}
        <div className="lg:col-span-2 space-y-4">

          {/* Step 1 – Audience */}
          {step === 1 && (
            <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-5 space-y-4">
              <h2 className="text-sm font-semibold text-slate-200">Step 1 — Select Audience</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {AUDIENCE_OPTIONS.map(a => (
                  <button key={a.id} onClick={() => setAudience(a.id)}
                    className={`flex items-center justify-between rounded-lg border px-4 py-3 text-left text-sm transition ${audience===a.id ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300' : 'border-slate-700 text-slate-400 hover:border-slate-600'}`}>
                    <span>{a.label}</span>
                    {a.estimatedCount !== null && <span className="ml-2 text-[10px] font-bold text-slate-500">{a.estimatedCount}</span>}
                  </button>
                ))}
              </div>
              {(audience === 'all-program' || audience === 'specific-cohort') && programs.length > 0 && (
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Program</label>
                  <select value={program} onChange={e => setProgram(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-300">
                    {programs.map(p => <option key={p.id} value={p.title}>{p.title}</option>)}
                  </select>
                </div>
              )}
              <div className="flex items-center justify-between pt-2">
                <div className="rounded-lg bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 text-xs text-indigo-300">
                  ≈ <span className="font-bold">{estimatedCount}</span> recipients estimated
                </div>
                <button onClick={() => setStep(2)} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition">Next →</button>
              </div>
            </div>
          )}

          {/* Step 2 – Channel */}
          {step === 2 && (
            <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-5 space-y-4">
              <h2 className="text-sm font-semibold text-slate-200">Step 2 — Select Channel</h2>
              <div className="flex gap-4">
                {[
                  { key: 'email', label: 'Email', desc: 'Delivered to learner inbox', val: channelEmail, set: setChannelEmail },
                  { key: 'wa', label: 'WhatsApp', desc: '94% delivery rate', val: channelWA, set: setChannelWA },
                ].map(ch => (
                  <button key={ch.key} onClick={() => ch.set(!ch.val)}
                    className={`flex-1 rounded-xl border p-4 text-left transition ${ch.val ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-700 hover:border-slate-600'}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-200">{ch.label}</span>
                      <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${ch.val ? 'border-indigo-500 bg-indigo-500' : 'border-slate-600'}`}>
                        {ch.val && <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{ch.desc}</p>
                  </button>
                ))}
              </div>
              <div className="flex justify-between pt-2">
                <button onClick={() => setStep(1)} className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-400 hover:bg-slate-800 transition">← Back</button>
                <button onClick={() => setStep(3)} disabled={!channelEmail && !channelWA} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition disabled:opacity-40">Next →</button>
              </div>
            </div>
          )}

          {/* Step 3 – Template */}
          {step === 3 && (
            <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-5 space-y-4">
              <h2 className="text-sm font-semibold text-slate-200">Step 3 — Choose Template</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {TEMPLATES.map(t => (
                  <button key={t.id} onClick={() => pickTemplate(t)}
                    className={`rounded-xl border p-4 text-center transition hover:border-indigo-500/60 ${selectedTemplate===t.id ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-700 hover:bg-slate-800/50'}`}>
                    <div className="text-2xl mb-2">{t.icon}</div>
                    <p className="text-xs font-medium text-slate-300">{t.label}</p>
                  </button>
                ))}
              </div>
              <div className="flex justify-between pt-2">
                <button onClick={() => setStep(2)} className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-400 hover:bg-slate-800 transition">← Back</button>
                <button onClick={() => setStep(4)} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition">Next →</button>
              </div>
            </div>
          )}

          {/* Step 4 – Message Editor */}
          {step === 4 && (
            <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-5 space-y-4">
              <h2 className="text-sm font-semibold text-slate-200">Step 4 — Message Editor</h2>
              {channelEmail && (
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Subject Line</label>
                  <input value={subject} onChange={e => setSubject(e.target.value)}
                    placeholder="Email subject…"
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500" />
                </div>
              )}
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Message Body</label>
                <textarea value={body} onChange={e => setBody(e.target.value)} rows={8}
                  placeholder="Type your message…"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 resize-none" />
              </div>
              <div>
                <p className="text-[10px] text-slate-600 mb-2">Click to insert variable:</p>
                <div className="flex flex-wrap gap-2">
                  {VARIABLES.map(v => (
                    <button key={v} onClick={() => insertVar(v)}
                      className="rounded-md bg-violet-500/10 border border-violet-500/20 px-2 py-1 text-[10px] font-mono text-violet-300 hover:bg-violet-500/20 transition">{v}</button>
                  ))}
                </div>
              </div>
              <div className="flex justify-between pt-2">
                <button onClick={() => setStep(3)} className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-400 hover:bg-slate-800 transition">← Back</button>
                <button onClick={() => setStep(5)} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition">Next →</button>
              </div>
            </div>
          )}

          {/* Step 5 – Schedule */}
          {step === 5 && (
            <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-5 space-y-4">
              <h2 className="text-sm font-semibold text-slate-200">Step 5 — Schedule</h2>
              <div className="space-y-3">
                {(['now', 'schedule'] as const).map(m => (
                  <label key={m} className={`flex items-center gap-3 rounded-xl border p-4 cursor-pointer transition ${scheduleMode===m ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-700'}`}>
                    <input type="radio" name="schedule" checked={scheduleMode===m} onChange={() => setScheduleMode(m)} className="accent-indigo-500" />
                    <div>
                      <p className="text-sm font-medium text-slate-200">{m === 'now' ? 'Send Now' : 'Schedule for later'}</p>
                      <p className="text-xs text-slate-500">{m === 'now' ? 'Message will be dispatched immediately' : 'Choose a date and time to send'}</p>
                    </div>
                  </label>
                ))}
              </div>
              {scheduleMode === 'schedule' && (
                <input type="datetime-local" value={scheduleAt} onChange={e => setScheduleAt(e.target.value)}
                  className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-indigo-500" />
              )}
              <div className="rounded-lg bg-slate-800/60 p-3 text-xs text-slate-400 space-y-1">
                <div className="flex justify-between"><span>Recipients</span><span className="font-semibold text-slate-200">≈ {estimatedCount}</span></div>
                <div className="flex justify-between"><span>Channels</span><span className="font-semibold text-slate-200">{[channelEmail && 'Email', channelWA && 'WhatsApp'].filter(Boolean).join(' + ')}</span></div>
                {channelEmail && <div className="flex justify-between"><span>Subject</span><span className="font-semibold text-slate-200 max-w-[180px] truncate">{subject || '—'}</span></div>}
              </div>
              <div className="flex justify-between pt-2">
                <button onClick={() => setStep(4)} className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-400 hover:bg-slate-800 transition">← Back</button>
                <button onClick={() => setSent(true)}
                  className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition">
                  {scheduleMode === 'now' ? '🚀 Send Now' : '📅 Schedule'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Preview */}
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Preview</p>

          {channelEmail && (
            <div className="rounded-xl border border-slate-700 bg-white p-4 shadow-lg">
              <div className="mb-2 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-red-400" />
                <div className="h-2 w-2 rounded-full bg-yellow-400" />
                <div className="h-2 w-2 rounded-full bg-green-400" />
              </div>
              <p className="text-[10px] text-gray-500 mb-1">From: noreply@eprcertificate.online</p>
              <p className="text-xs font-semibold text-gray-800 mb-2">{subject || '(no subject)'}</p>
              <div className="text-[11px] text-gray-700 whitespace-pre-wrap border-t border-gray-100 pt-2">{previewBody || '(empty message)'}</div>
            </div>
          )}

          {channelWA && (
            <div className="rounded-xl border border-slate-700 bg-[#0b1a0b] p-4">
              <p className="text-[10px] text-emerald-600 mb-2 font-semibold">WhatsApp Preview</p>
              <div className="inline-block rounded-2xl rounded-tl-none bg-emerald-700/30 border border-emerald-700/40 px-3 py-2 max-w-xs">
                <p className="text-[11px] text-emerald-100 whitespace-pre-wrap leading-relaxed">{previewBody || '(empty message)'}</p>
                <p className="text-[9px] text-emerald-600 text-right mt-1">09:00 ✓✓</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

