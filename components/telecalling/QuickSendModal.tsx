'use client';

// Feature 5: WhatsApp / Email Quick-Send
// One-click send a templated message from the lead card

import { useState, useEffect } from 'react';

interface Props {
  lead: any;
  enrichment?: any;
  onClose: () => void;
}

const WHATSAPP_TEMPLATES = [
  {
    id: 'intro',
    label: 'Introduction',
    icon: '👋',
    body: (lead: any) =>
      `Hello${lead.contact_name ? ` ${lead.contact_name}` : ''},\n\nI'm reaching out from EPR Compass — we help companies like ${lead.company_name || 'yours'} with EPR compliance registration (plastic, e-waste, batteries).\n\nWould you be open to a quick 10-minute call this week?\n\nRegards`,
  },
  {
    id: 'followup',
    label: 'Follow-up',
    icon: '🔁',
    body: (lead: any) =>
      `Hi${lead.contact_name ? ` ${lead.contact_name}` : ''},\n\nJust following up on our earlier conversation about EPR compliance for ${lead.company_name || 'your company'}.\n\nHappy to answer any questions or share our fee schedule if helpful.\n\nLet me know a convenient time!\n\nRegards`,
  },
  {
    id: 'deadline',
    label: 'Deadline Alert',
    icon: '⏰',
    body: (lead: any) =>
      `Dear${lead.contact_name ? ` ${lead.contact_name}` : ''},\n\nQuick reminder — CPCB EPR registration deadlines for FY26 are approaching. Unregistered producers & importers are receiving notices.\n\n${lead.company_name || 'Your company'} may be required to register. We can complete this in 3–4 weeks.\n\nShall we get started?\n\nRegards`,
  },
  {
    id: 'quote',
    label: 'Sending Quote',
    icon: '📋',
    body: (lead: any) =>
      `Hi${lead.contact_name ? ` ${lead.contact_name}` : ''},\n\nAs discussed, please find our EPR compliance package details below.\n\nWe offer end-to-end registration, CPCB portal filing, and annual return support for ${lead.company_name || 'your company'}.\n\nPlease let me know if you'd like to proceed or have any questions.\n\nRegards`,
  },
];

export default function QuickSendModal({ lead, enrichment, onClose }: Props) {
  const [mode, setMode] = useState<'whatsapp' | 'email'>('whatsapp');
  const [selectedTemplate, setSelectedTemplate] = useState(WHATSAPP_TEMPLATES[0]);
  const [body, setBody] = useState('');
  const [emailTemplates, setEmailTemplates] = useState<any[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<any>(null);
  const [loadingEmails, setLoadingEmails] = useState(false);
  const [copied, setCopied] = useState(false);

  // Init WhatsApp body
  useEffect(() => {
    setBody(selectedTemplate.body(lead));
  }, [selectedTemplate, lead]);

  // Load email templates
  useEffect(() => {
    if (mode !== 'email') return;
    setLoadingEmails(true);
    fetch('/api/admin/telecalling/email-templates')
      .then(r => r.json())
      .then(d => {
        const list = d.templates || d || [];
        setEmailTemplates(list);
        if (list.length > 0) setSelectedEmail(list[0]);
      })
      .finally(() => setLoadingEmails(false));
  }, [mode]);

  function openWhatsApp() {
    const phone = (lead.phone || '').replace(/\D/g, '');
    const dialCode = phone.length === 10 ? `91${phone}` : phone;
    const url = `https://wa.me/${dialCode}?text=${encodeURIComponent(body)}`;
    window.open(url, '_blank');
    onClose();
  }

  function openEmail() {
    if (!lead.email && !selectedEmail) return;
    const subject = selectedEmail?.subject || `EPR Compliance — ${lead.company_name || 'Your Company'}`;
    const bodyText = selectedEmail?.html_body?.replace(/<[^>]*>/g, '') || '';
    const url = `mailto:${lead.email || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;
    window.open(url, '_blank');
    onClose();
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const phone = (lead.phone || '').replace(/\D/g, '');
  const hasPhone = phone.length >= 10;
  const hasEmail = !!lead.email;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60">
      <div className="bg-slate-900 border border-slate-700/60 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg p-6 shadow-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">Quick Send</h2>
            <p className="text-xs text-slate-500">{lead.contact_name || lead.company_name}</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 text-2xl leading-none">&times;</button>
        </div>

        {/* Mode toggle */}
        <div className="flex bg-slate-800/60 rounded-lg p-1 mb-4">
          {(['whatsapp', 'email'] as const).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors capitalize ${mode === m ? 'bg-slate-700 text-slate-100' : 'text-slate-400 hover:text-slate-200'}`}
            >
              {m === 'whatsapp' ? '💬 WhatsApp' : '✉️ Email'}
            </button>
          ))}
        </div>

        {mode === 'whatsapp' && (
          <>
            {/* Template pills */}
            <div className="flex gap-2 flex-wrap mb-3">
              {WHATSAPP_TEMPLATES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTemplate(t)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${selectedTemplate.id === t.id ? 'bg-teal-500/20 border-teal-500/40 text-teal-200' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'}`}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>

            {/* Editable message */}
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={8}
              className="flex-1 w-full border border-slate-700 rounded-lg px-3 py-2.5 text-sm bg-slate-800/60 text-slate-200 resize-none focus:outline-none focus:border-teal-500 font-sans leading-relaxed"
            />

            {/* Actions */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={copyToClipboard}
                className="px-3 py-2 border border-slate-700 text-slate-300 rounded-lg text-sm hover:bg-slate-800"
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
              <button
                onClick={openWhatsApp}
                disabled={!hasPhone}
                className="flex-1 flex items-center justify-center gap-2 bg-green-600/20 border border-green-600/40 text-green-200 rounded-lg py-2 text-sm font-semibold hover:bg-green-600/30 disabled:opacity-40 transition-colors"
              >
                <span>💬</span> Open in WhatsApp
              </button>
            </div>
            {!hasPhone && <p className="text-xs text-red-400 mt-2">No phone number saved for this lead.</p>}
          </>
        )}

        {mode === 'email' && (
          <>
            {loadingEmails ? (
              <div className="text-center py-8 text-slate-500 text-sm">Loading templates…</div>
            ) : emailTemplates.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                No email templates found.{' '}
                <a href="/telecalling/scripts?tab=emails" className="text-teal-400 hover:underline">Create one →</a>
              </div>
            ) : (
              <>
                <div className="space-y-2 flex-1 overflow-y-auto mb-4">
                  {emailTemplates.map((t: any) => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedEmail(t)}
                      className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors ${selectedEmail?.id === t.id ? 'bg-teal-500/10 border-teal-500/30 text-teal-200' : 'bg-slate-800/40 border-slate-700 text-slate-300 hover:border-slate-600'}`}
                    >
                      <div className="font-medium">{t.title}</div>
                      <div className="text-xs text-slate-500 mt-0.5">Subject: {t.subject}</div>
                    </button>
                  ))}
                </div>
                <button
                  onClick={openEmail}
                  disabled={!hasEmail || !selectedEmail}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600/20 border border-blue-600/40 text-blue-200 rounded-lg py-2.5 text-sm font-semibold hover:bg-blue-600/30 disabled:opacity-40 transition-colors"
                >
                  <span>✉️</span> Open in Email Client
                </button>
                {!hasEmail && <p className="text-xs text-red-400 mt-2">No email address saved for this lead.</p>}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

