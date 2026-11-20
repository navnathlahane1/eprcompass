'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { INDIA_STATES_UTS } from '@/lib/indiaGeo';

// ── Partner strategy constants ───────────────────────────────────────────────

const PARTNER_TIERS = [
  { value: 1, label: 'Tier 1', name: 'Direct Sales Power',    stars: 5, desc: 'EHS, CA/CS, ISO, ESG Consultants — highest revenue potential' },
  { value: 2, label: 'Tier 2', name: 'Trusted Advisors',      stars: 4, desc: 'Regulators, Lawyers, Supply Chain, CSR — high influence' },
  { value: 3, label: 'Tier 3', name: 'Networked Influencers', stars: 3, desc: 'Alumni, NGOs, Industry Bodies — medium-high reach' },
  { value: 4, label: 'Tier 4', name: 'Regional Specialists',  stars: 3, desc: 'City/Cluster-specific operators — medium revenue' },
  { value: 5, label: 'Tier 5', name: 'Emerging/Digital',      stars: 2, desc: 'Tech, Academia, Freelancers — long-term pipeline' },
] as const;

const PARTNER_TYPES = [
  { group: 'Compliance & Environment', options: [
    'Env Consultant', 'EHS Consultant', 'ISO Consultant', 'ESG Consultant',
  ]},
  { group: 'Finance & Legal', options: [
    'CA/CS', 'Legal/Law',
  ]},
  { group: 'Industry & Supply Chain', options: [
    'Trade Association', 'PRO', 'Waste Management', 'CHA',
    'Logistics', 'Packaging Consultant', 'Recycler Network',
  ]},
  { group: 'Advisory & Social Impact', options: [
    'CSR/NGO', 'Academic', 'Freelance Trainer', 'Tech/Digital',
  ]},
  { group: 'Other', options: ['Other'] },
] as const;

const PARTNER_PERSONAS: Record<number, string[]> = {
  1: ['EHS Consultant', 'CA Firm', 'Company Secretary (CS)', 'ISO 14001 Auditor', 'ESG/Sustainability Consultant', 'Industrial Waste Company', 'PRO', 'Packaging Consultant', 'Customs Clearing Agent', 'Trade Association Official'],
  2: ['Retired PCB Officer', 'Environmental Lawyer', 'Supply Chain Consultant', 'CSR Consulting Firm', 'MSME/SIDBI Officer', 'FMCG Consultant', 'Pharma Consultant', 'Food Processing Consultant', 'Auto Industry Consultant', 'Battery/E-Waste Company'],
  3: ['IIM/IIT Alumni', 'LinkedIn Sustainability Influencer', 'HR/L&D Head', 'Startup Incubator', 'Green Building/LEED Consultant', 'Chartered Engineer', 'Equipment Vendor', 'Chemical Industry Rep', 'Textile Consultant', 'Export Promotion Council'],
  4: ['Punjab Industrial Cluster', 'Bengaluru Tech Park FM', 'Hyderabad Pharma Consultant', 'Surat Textile Association', 'Chennai Auto Ancillary', 'Coimbatore MSME Association', 'Delhi NCR FMCG Distributor', 'Kolkata Packaging Consultant', 'Ahmedabad Chemical Exporter', 'Nagpur Agri-Processing Network'],
  5: ['LegalTech/Compliance SaaS', 'Environmental NGO', 'Equipment Importer', 'CA Coaching Institute', 'Freelance EHS Trainer', 'Govt PMC', 'Industry 4.0 Consultant', 'Corporate Lawyer', 'CA with Startup Clients', 'University/B-School Faculty'],
};

const ALL_ROLES = [
  { value: 'client',           label: 'EPR Portal',       color: 'text-blue-400',    desc: 'Access EPR client portal'       },
  { value: 'partner',          label: 'Partner Portal',   color: 'text-indigo-400',  desc: 'Partner management access'      },
  { value: 'cepc',             label: 'CEPC Portal',      color: 'text-violet-400',  desc: 'CEPC operations portal'         },
  { value: 'recycler',         label: 'Recycler Portal',  color: 'text-teal-400',    desc: 'Recycler management portal'     },
  { value: 'legal',              label: 'Legal Portal',     color: 'text-violet-400',  desc: 'Document verification — recycler onboarding'  },
  { value: 'compliance_manager', label: 'Compliance Mgr',   color: 'text-cyan-400',    desc: 'Recycler compliance management'               },
  { value: 'tendering_manager',   label: 'Tendering Manager',  color: 'text-pink-400',  desc: 'Tendering portal — full access'               },
  { value: 'tendering_executive', label: 'Tendering Exec',    color: 'text-pink-300',  desc: 'Tendering portal — my tenders & bids only'    },
  { value: 'telecaller',           label: 'Telecaller',           color: 'text-orange-400',  desc: 'Telecalling — agent access'              },
  { value: 'tc_team_lead',         label: 'TC Team Lead',         color: 'text-orange-300',  desc: 'Telecalling — team lead & analytics'     },
  { value: 'tc_senior_agent',      label: 'TC Senior Agent',      color: 'text-orange-300',  desc: 'Telecalling — senior agent access'       },
  { value: 'tc_quality_analyst',   label: 'TC Quality Analyst',   color: 'text-amber-300',   desc: 'Telecalling — QA & call monitoring'      },
  { value: 'tc_campaign_manager',  label: 'TC Campaign Manager',  color: 'text-amber-400',   desc: 'Telecalling — campaign & lead strategy'  },
  { value: 'tc_trainer',           label: 'TC Trainer',           color: 'text-amber-200',   desc: 'Telecalling — agent training & scripts'  },
  { value: 'sales-executive',  label: 'Sales Executive',  color: 'text-amber-400',   desc: 'Sales team access'              },
  { value: 'manager',          label: 'Admin Panel',      color: 'text-rose-400',    desc: 'Full admin panel access'        },
  { value: 'user_manager',     label: 'Access Manager',   color: 'text-slate-400',   desc: 'IAM portal access'              },
  { value: 'task_manager',     label: 'Task Manager',     color: 'text-orange-400',  desc: 'Cross-portal task control'      },
  { value: 'cfo',                      label: 'Finance — CFO',        color: 'text-emerald-400', desc: 'Finance portal — full access'          },
  { value: 'finance_executive',        label: 'Finance Executive',    color: 'text-emerald-300', desc: 'Finance portal — invoices & tasks'     },
  { value: 'academy_director',         label: 'Academy Director',     color: 'text-indigo-400',  desc: 'Academy portal — full access'          },
  { value: 'academy_manager',          label: 'Academy Manager',      color: 'text-indigo-300',  desc: 'Academy portal — manage programs'      },
  { value: 'training_program_manager', label: 'Program Manager',      color: 'text-violet-400',  desc: 'Academy portal — program lifecycle'    },
  { value: 'trainer',                  label: 'Trainer',              color: 'text-violet-300',  desc: 'Academy portal — sessions & LMS'       },
  { value: 'guest_trainer',            label: 'Guest Trainer',        color: 'text-purple-300',  desc: 'Academy portal — assigned sessions only'},
  { value: 'partner_trainer',          label: 'Partner Trainer',      color: 'text-fuchsia-300', desc: 'Academy portal — partner-delivered sessions'},
  { value: 'learner',                  label: 'Learner',              color: 'text-sky-300',     desc: 'Academy portal — course access & self-service'},
  { value: 'comms_cmo',               label: 'CMO',                  color: 'text-emerald-400', desc: 'Comms — full strategy & admin access'          },
  { value: 'comms_brand_manager',     label: 'Brand Manager',        color: 'text-emerald-300', desc: 'Comms — brand guidelines & approvals'          },
  { value: 'comms_regional_manager',  label: 'Regional Mktg Mgr',   color: 'text-emerald-300', desc: 'Comms — regional campaigns & accounts'         },
  { value: 'comms_campaign_manager',  label: 'Campaign Manager',     color: 'text-emerald-300', desc: 'Comms — campaign lifecycle management'         },
  { value: 'comms_social_media_manager', label: 'Social Media Mgr', color: 'text-emerald-200', desc: 'Comms — social platforms & scheduling'         },
  { value: 'comms_content_strategist',label: 'Content Strategist',   color: 'text-emerald-200', desc: 'Comms — content planning & strategy'           },
  { value: 'comms_content_creator',   label: 'Content Creator',      color: 'text-emerald-200', desc: 'Comms — content writing & production'          },
  { value: 'comms_graphic_designer',  label: 'Graphic Designer',     color: 'text-emerald-200', desc: 'Comms — visual design & creatives'             },
  { value: 'comms_community_manager', label: 'Community Manager',    color: 'text-emerald-200', desc: 'Comms — community engagement & moderation'     },
  { value: 'comms_performance_specialist', label: 'Performance Spec', color: 'text-emerald-200', desc: 'Comms — paid media & performance metrics'    },
  { value: 'comms_pr_manager',        label: 'PR Manager',           color: 'text-emerald-200', desc: 'Comms — press, media relations & outreach'     },
  { value: 'comms_influencer_manager',label: 'Influencer Manager',   color: 'text-emerald-200', desc: 'Comms — influencer sourcing & partnerships'    },
  { value: 'comms_marketing_analyst', label: 'Marketing Analyst',    color: 'text-emerald-200', desc: 'Comms — analytics, reporting & insights'       },
  { value: 'comms_marketing_ops',     label: 'Marketing Ops',        color: 'text-emerald-200', desc: 'Comms — tools, ops & workflow management'      },
  { value: 'comms_marketing_intern',  label: 'Mktg Intern',          color: 'text-emerald-200', desc: 'Comms — limited read & task access'            },
  { value: 'knowledge_admin',               label: 'Knowledge Admin',       color: 'text-cyan-400',    desc: 'Knowledge Hub — full access & access control'        },
  { value: 'knowledge_manager',             label: 'Knowledge Manager',     color: 'text-cyan-300',    desc: 'Knowledge Hub — manage all docs & categories'        },
  { value: 'knowledge_contributor',         label: 'Knowledge Contributor', color: 'text-cyan-200',    desc: 'Knowledge Hub — upload & edit own items'             },
  { value: 'knowledge_viewer',              label: 'Knowledge Viewer',      color: 'text-cyan-200',    desc: 'Knowledge Hub — browse & download only'              },
  // Business & Sales WFH roles
  { value: 'lead_gen_executive',            label: 'Lead Gen Exec',         color: 'text-yellow-400',  desc: 'Ops Portal — lead generation & pipeline build'       },
  { value: 'appointment_setter',            label: 'Appointment Setter',    color: 'text-yellow-300',  desc: 'Ops Portal — calendar booking & scheduling'          },
  { value: 'crm_data_executive',            label: 'CRM Data Exec',         color: 'text-yellow-300',  desc: 'Ops Portal — CRM data entry & maintenance'           },
  { value: 'customer_support_executive',    label: 'Support Exec',          color: 'text-yellow-200',  desc: 'Ops Portal — client query & ticket handling'         },
  // Operations WFH roles
  { value: 'virtual_assistant',             label: 'Virtual Assistant',     color: 'text-rose-400',    desc: 'Ops Portal — task coordination & admin support'      },
  { value: 'proposal_executive',            label: 'Proposal Exec',         color: 'text-rose-300',    desc: 'Ops Portal — proposal drafting & submission'         },
  { value: 'compliance_doc_executive',      label: 'Compliance Doc Exec',   color: 'text-rose-300',    desc: 'Ops Portal — compliance documentation workflow'      },
  { value: 'market_research_executive',     label: 'Market Research Exec',  color: 'text-rose-200',    desc: 'Ops Portal — research, analysis & intel reports'     },
  { value: 'mis_reporting_executive',       label: 'MIS & Reporting Exec',  color: 'text-rose-200',    desc: 'Ops Portal — MIS dashboards & data exports'          },
] as const;

type Role = typeof ALL_ROLES[number]['value'];

interface PartnerConfig {
  partner_tier: number | null;
  partner_type: string;
  persona_label: string;
  commission_type: string;
  commission_value: string;
  nda_signed: boolean;
  state: string;
  city: string;
}

interface IntelCompanyOption {
  id: string;
  name: string;
  gstin: string | null;
  state: string | null;
  city: string | null;
  company_type: string | null;
  website: string | null;
}

interface RecyclerConfig {
  intel_company_id: string | null;
  intel_company_name: string;
  gstin: string;
  state: string;
  city: string;
  address: string;
  waste_categories: string[];
  capacity_mt_pa: string;
  cpcb_cert_no: string;
  cpcb_cert_expiry: string;
}

interface FormState {
  email: string;
  password: string;
  full_name: string;
  company_name: string;
  phone: string;
  role: Role;
  partnerConfig: PartnerConfig;
  recyclerConfig: RecyclerConfig;
}

const DEFAULT_PARTNER: PartnerConfig = {
  partner_tier: null,
  partner_type: 'Env Consultant',
  persona_label: '',
  commission_type: 'Revenue Share',
  commission_value: '20',
  nda_signed: false,
  state: '',
  city: '',
};

const RECYCLER_WASTE_CATEGORIES = [
  'Plastic', 'E-Waste', 'Battery', 'Tyre', 'Used Oil', 'Hazardous Waste',
] as const;

const DEFAULT_RECYCLER: RecyclerConfig = {
  intel_company_id: null,
  intel_company_name: '',
  gstin: '',
  state: '',
  city: '',
  address: '',
  waste_categories: [],
  capacity_mt_pa: '',
  cpcb_cert_no: '',
  cpcb_cert_expiry: '',
};

export default function CreateUserPage() {
  const [form, setForm] = useState<FormState>({
    email: '', password: '', full_name: '',
    company_name: '', phone: '', role: 'client',
    partnerConfig: { ...DEFAULT_PARTNER },
    recyclerConfig: { ...DEFAULT_RECYCLER },
  });
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [createdUser, setCreatedUser] = useState<{
    id: string;
    email: string;
    password: string;
    displayName: string;
    roleLabel: string;
  } | null>(null);
  const [sendingInvite, setSendingInvite] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [showPw, setShowPw]   = useState(false);
  const [requestId, setRequestId]   = useState<string | null>(null);
  const [requestedBy, setRequestedBy] = useState<string | null>(null);

  const selectedRole = ALL_ROLES.find(r => r.value === form.role)!;
  const isPartner = form.role === 'partner';
  const isRecycler = form.role === 'recycler';

  // Pre-fill from an Academy Director's user-creation request (/iam/create?request=<id>)
  useEffect(() => {
    const rid = new URLSearchParams(window.location.search).get('request');
    if (!rid) return;
    (async () => {
      try {
        const res = await fetch(`/api/iam/user-requests/${rid}`);
        const json = await res.json();
        if (!res.ok || !json.request) return;
        const r = json.request;
        if (r.status !== 'pending') {
          setError(`This request was already ${r.status}.`);
          return;
        }
        setRequestId(rid);
        setRequestedBy(r.requested_by_name || r.requested_by_email || 'Academy Director');
        setForm(f => ({
          ...f,
          email:        r.email || '',
          full_name:    r.full_name || '',
          phone:        r.phone || '',
          company_name: r.company_name || '',
          role:         (r.role as Role) || f.role,
        }));
      } catch { /* ignore — operator can fill manually */ }
    })();
  }, []);

  function setPC(updates: Partial<PartnerConfig>) {
    setForm(f => ({ ...f, partnerConfig: { ...f.partnerConfig, ...updates } }));
  }

  function setRC(updates: Partial<RecyclerConfig>) {
    setForm(f => ({ ...f, recyclerConfig: { ...f.recyclerConfig, ...updates } }));
  }

  function selectRole(role: Role) {
    setForm(f => ({ ...f, role }));
    requestAnimationFrame(() => {
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      document.getElementById('selected-role-summary')?.scrollIntoView({
        behavior: reduceMotion ? 'auto' : 'smooth',
        block: 'start',
      });
    });
  }

  // Intel company search state
  const [intelSearch, setIntelSearch]       = useState('');
  const [intelResults, setIntelResults]     = useState<IntelCompanyOption[]>([]);
  const [intelLoading, setIntelLoading]     = useState(false);
  const [intelDropOpen, setIntelDropOpen]   = useState(false);

  async function searchIntelCompanies(q: string) {
    setIntelSearch(q);
    if (q.length < 2) { setIntelResults([]); setIntelDropOpen(false); return; }
    setIntelLoading(true);
    try {
      const res = await fetch(`/api/iam/intel-companies?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setIntelResults(data.companies ?? []);
      setIntelDropOpen(true);
    } catch { setIntelResults([]); }
    finally { setIntelLoading(false); }
  }

  function selectIntelCompany(company: IntelCompanyOption) {
    setRC({
      intel_company_id:   company.id,
      intel_company_name: company.name,
      gstin: company.gstin  || form.recyclerConfig.gstin,
      state: company.state  || form.recyclerConfig.state,
      city:  company.city   || form.recyclerConfig.city,
    });
    // Also fill company_name on the main form if not already set
    if (!form.company_name) {
      setForm(f => ({ ...f, company_name: company.name }));
    }
    setIntelSearch(company.name);
    setIntelDropOpen(false);
  }

  function clearIntelCompany() {
    setRC({ intel_company_id: null, intel_company_name: '' });
    setIntelSearch('');
    setIntelDropOpen(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isPartner && !form.partnerConfig.partner_tier) {
      setError('Please select a partner tier.'); return;
    }
    setSaving(true);
    setError('');
    setSuccess('');
    setInviteError('');
    try {
      const payload: Record<string, unknown> = { ...form };
      if (isPartner) {
        const pc = form.partnerConfig;
        payload.partner_tier        = pc.partner_tier;
        payload.partner_type        = pc.partner_type;
        payload.persona_label       = pc.persona_label || null;
        payload.commission_type     = pc.commission_type || null;
        payload.commission_value    = pc.commission_value ? parseFloat(pc.commission_value) : null;
        payload.nda_signed          = pc.nda_signed;
        payload.state               = pc.state || null;
        payload.city                = pc.city || null;
      }
      if (isRecycler) {
        const rc = form.recyclerConfig;
        payload.recycler_intel_company_id  = rc.intel_company_id || null;
        payload.recycler_gstin             = rc.gstin || null;
        payload.recycler_state             = rc.state || null;
        payload.recycler_city              = rc.city || null;
        payload.recycler_address           = rc.address || null;
        payload.recycler_waste_categories  = rc.waste_categories;
        payload.recycler_capacity_mt_pa    = rc.capacity_mt_pa ? parseFloat(rc.capacity_mt_pa) : null;
        payload.recycler_cpcb_cert_no      = rc.cpcb_cert_no || null;
        payload.recycler_cpcb_cert_expiry  = rc.cpcb_cert_expiry || null;
      }
      delete (payload as any).partnerConfig;
      delete (payload as any).recyclerConfig;
      const res = await fetch('/api/iam/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to create user'); return; }
      setCreatedUser({
        id: data.userId,
        email: form.email.trim().toLowerCase(),
        password: form.password,
        displayName: form.full_name || form.email,
        roleLabel: selectedRole.label,
      });
      setSuccess('Account created successfully! You can now send the invite email.');

      // If this fulfils an Academy Director request, close it out and return there.
      if (requestId) {
        try {
          await fetch(`/api/iam/user-requests/${requestId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'fulfill', created_user_id: data.userId }),
          });
        } catch { /* request stays pending; not fatal */ }
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleSendInvite() {
    if (!createdUser || inviteSent) return;
    setSendingInvite(true);
    setInviteError('');
    try {
      const response = await fetch(`/api/iam/users/${createdUser.id}/send-invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: createdUser.password }),
      });
      const data = await response.json();
      if (!response.ok) {
        setInviteError(data.error || 'Invite email could not be sent.');
        return;
      }
      setInviteSent(true);
      setSuccess(`Account created and invite email sent to ${createdUser.email}.`);
    } catch {
      setInviteError('Invite email could not be sent. Please try again.');
    } finally {
      setSendingInvite(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">

      {/* Back + heading */}
      <div className="flex items-center gap-3">
        <Link href="/iam/users"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800/80 bg-[#0c1022] text-slate-500 hover:text-slate-300 transition">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Create User</h1>
          <p className="text-sm text-slate-500">Add a new portal account</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Feedback */}
        {error && (
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300 flex items-start gap-2">
            <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300 flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {success}
          </div>
        )}

        {/* Fulfilling an Academy Director request */}
        {requestId && (
          <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-3 text-sm text-indigo-200 flex items-start gap-2">
            <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 mt-0.5 text-indigo-400" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              Fulfilling an academy user request from <span className="font-semibold">{requestedBy}</span>.
              Details are pre-filled — set a password and create the account.
            </span>
          </div>
        )}

        {/* ── Role picker ── */}
        <div id="portal-role-picker" className="scroll-mt-6 rounded-xl border border-slate-800/80 bg-[#0c1022] p-5 space-y-3">
          <div>
            <p className="text-sm font-semibold text-slate-200">Portal Role <span className="text-rose-400">*</span></p>
            <p className="text-xs text-slate-500">Determines which portal the user can access.</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {ALL_ROLES.map(r => (
              <button
                key={r.value}
                type="button"
                onClick={() => selectRole(r.value)}
                aria-pressed={form.role === r.value}
                className={`flex flex-col gap-1 rounded-lg border p-3 text-left transition ${
                  form.role === r.value
                    ? 'border-violet-500/50 bg-violet-500/10 ring-1 ring-violet-500/20'
                    : 'border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-800/30'
                }`}
              >
                <span className={`h-2 w-2 rounded-full bg-current ${r.color}`} />
                <p className={`text-xs font-semibold mt-0.5 leading-tight ${form.role === r.value ? r.color : 'text-slate-400'}`}>
                  {r.label}
                </p>
                <p className="text-[10px] text-slate-600 leading-tight">{r.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Keep the selected role visible while completing the long form. */}
        <div
          id="selected-role-summary"
          className="sticky top-4 z-20 scroll-mt-4 flex items-center gap-3 rounded-xl border border-violet-500/30 bg-[#111329]/95 px-4 py-3 shadow-xl shadow-black/20 backdrop-blur"
          aria-live="polite"
        >
          <span className={`h-2.5 w-2.5 shrink-0 rounded-full bg-current ${selectedRole.color}`} />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Creating user for
            </p>
            <p className="truncate text-sm font-semibold text-slate-100">{selectedRole.label}</p>
            <p className="truncate text-xs text-slate-500">{selectedRole.desc}</p>
          </div>
          <button
            type="button"
            onClick={() => document.getElementById('portal-role-picker')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className="shrink-0 rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-xs font-semibold text-violet-300 transition hover:border-violet-400/50 hover:bg-violet-500/20"
          >
            Change role
          </button>
        </div>

        {/* ── Account credentials ── */}
        <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-5 space-y-4">
          <p className="text-sm font-semibold text-slate-200">Account Credentials</p>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Email <span className="text-rose-400">*</span>
            </label>
            <input
              type="email" required autoComplete="off"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="user@example.com"
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-violet-500 transition"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Password <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'} required minLength={8} autoComplete="new-password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="Min. 8 characters"
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 pr-10 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-violet-500 transition"
              />
              <button type="button" onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition">
                {showPw ? (
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            <p className="text-[11px] text-slate-600">User can change this password after first login.</p>
          </div>
        </div>

        {/* ── Profile details ── */}
        <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-5 space-y-4">
          <p className="text-sm font-semibold text-slate-200">Profile Details <span className="text-slate-600 font-normal">(optional)</span></p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Full Name</label>
              <input
                type="text"
                value={form.full_name}
                onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                placeholder="e.g. Rahul Sharma"
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-violet-500 transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="Enter phone number"
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-violet-500 transition"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Company Name</label>
              <input
                type="text"
                value={form.company_name}
                onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))}
                placeholder="e.g. Acme Recyclers Pvt. Ltd."
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-violet-500 transition"
              />
            </div>
          </div>
        </div>

        {/* ── Partner Setup (shown only when role=partner) ── */}
        {isPartner && (
          <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/5 p-5 space-y-6">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-indigo-400" />
              <p className="text-sm font-semibold text-indigo-300">Partner Setup</p>
              <span className="ml-auto text-[10px] text-indigo-500 bg-indigo-500/10 rounded px-2 py-0.5">Strategy Doc</span>
            </div>

            {/* Tier selection */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Partner Tier <span className="text-rose-400">*</span>
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-5">
                {PARTNER_TIERS.map(t => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setPC({ partner_tier: t.value })}
                    className={`flex flex-col gap-1 rounded-lg border p-3 text-left transition ${
                      form.partnerConfig.partner_tier === t.value
                        ? 'border-indigo-500/60 bg-indigo-500/15 ring-1 ring-indigo-500/20'
                        : 'border-slate-700 bg-slate-900/50 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-indigo-400">{t.label}</span>
                      <span className="text-[9px] text-amber-400">{'★'.repeat(t.stars)}</span>
                    </div>
                    <p className={`text-xs font-semibold leading-tight ${form.partnerConfig.partner_tier === t.value ? 'text-indigo-200' : 'text-slate-400'}`}>
                      {t.name}
                    </p>
                    <p className="text-[10px] text-slate-600 leading-tight">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Persona (filtered by tier) */}
            {form.partnerConfig.partner_tier && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">Persona</label>
                  <select
                    value={form.partnerConfig.persona_label}
                    onChange={e => setPC({ persona_label: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="">— Select persona —</option>
                    {PARTNER_PERSONAS[form.partnerConfig.partner_tier as 1|2|3|4|5]?.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">Partner Type</label>
                  <select
                    value={form.partnerConfig.partner_type}
                    onChange={e => setPC({ partner_type: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {PARTNER_TYPES.map(g => (
                      <optgroup key={g.group} label={g.group}>
                        {g.options.map(o => <option key={o} value={o}>{o}</option>)}
                      </optgroup>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Location */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">State</label>
                <select
                  value={form.partnerConfig.state}
                  onChange={e => setPC({ state: e.target.value })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">Select State / UT</option>
                  {INDIA_STATES_UTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">City</label>
                <input
                  type="text"
                  value={form.partnerConfig.city}
                  onChange={e => setPC({ city: e.target.value })}
                  placeholder="e.g. Mumbai"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Commission */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">Commission Type</label>
                <select
                  value={form.partnerConfig.commission_type}
                  onChange={e => setPC({ commission_type: e.target.value })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="Revenue Share">Revenue Share (%)</option>
                  <option value="Flat Fee">Flat Fee (₹)</option>
                  <option value="Per Lead">Per Lead (₹)</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {form.partnerConfig.commission_type === 'Revenue Share' ? 'Commission %' : 'Amount (₹)'}
                </label>
                <input
                  type="number"
                  min="0"
                  max={form.partnerConfig.commission_type === 'Revenue Share' ? '100' : undefined}
                  value={form.partnerConfig.commission_value}
                  onChange={e => setPC({ commission_value: e.target.value })}
                  placeholder={form.partnerConfig.commission_type === 'Revenue Share' ? '20' : '5000'}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Legal */}
            <div className="flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-3">
              <input
                id="nda_signed"
                type="checkbox"
                checked={form.partnerConfig.nda_signed}
                onChange={e => setPC({ nda_signed: e.target.checked })}
                className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500"
              />
              <label htmlFor="nda_signed" className="text-sm text-slate-300 cursor-pointer">
                NDA signed before sharing program details
              </label>
              {form.partnerConfig.nda_signed && (
                <span className="ml-auto text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded px-2 py-0.5">Confirmed</span>
              )}
            </div>

            <p className="text-[11px] text-slate-600">
              Partner Agreement (non-compete, non-solicitation, IP clauses) should be signed separately and uploaded in the admin partner detail page.
            </p>
          </div>
        )}

        {/* ── Recycler Setup (shown only when role=recycler) ── */}
        {isRecycler && (
          <div className="rounded-xl border border-teal-500/30 bg-teal-500/5 p-5 space-y-5">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-teal-400" />
              <p className="text-sm font-semibold text-teal-300">Recycler Company Details</p>
              <span className="ml-auto text-[10px] text-teal-500 bg-teal-500/10 rounded px-2 py-0.5">EPR Portal</span>
            </div>

            <p className="text-xs text-slate-500">
              The account will start as <span className="text-amber-400 font-medium">PENDING</span> and can be approved from IAM → Recycler Approvals.
            </p>

            {/* ── Intel Company Picker ── */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Link Intel Company <span className="normal-case text-teal-500 font-normal">— search & select from Intel Portal</span>
              </p>

              {form.recyclerConfig.intel_company_id ? (
                /* Selected state */
                <div className="flex items-center gap-3 rounded-lg border border-teal-500/40 bg-teal-500/10 px-4 py-3">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-teal-400" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-teal-200 truncate">{form.recyclerConfig.intel_company_name}</p>
                    <p className="text-[10px] text-slate-500 font-mono truncate">{form.recyclerConfig.intel_company_id}</p>
                  </div>
                  <button
                    type="button"
                    onClick={clearIntelCompany}
                    className="shrink-0 text-slate-500 hover:text-rose-400 transition"
                    title="Remove link"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                /* Search state */
                <div className="relative">
                  <div className="relative">
                    <input
                      type="text"
                      value={intelSearch}
                      onChange={e => searchIntelCompanies(e.target.value)}
                      onFocus={() => intelSearch.length >= 2 && setIntelDropOpen(true)}
                      onBlur={() => setTimeout(() => setIntelDropOpen(false), 150)}
                      placeholder="Type company name to search Intel Portal…"
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 pr-8 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-500 transition"
                    />
                    {intelLoading && (
                      <svg className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-teal-500" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                    )}
                  </div>
                  {intelDropOpen && intelResults.length > 0 && (
                    <ul className="absolute z-20 mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 shadow-xl overflow-hidden">
                      {intelResults.map(c => (
                        <li key={c.id}>
                          <button
                            type="button"
                            onMouseDown={() => selectIntelCompany(c)}
                            className="w-full text-left px-4 py-3 hover:bg-teal-500/10 transition group"
                          >
                            <p className="text-sm font-medium text-slate-200 group-hover:text-teal-200">{c.name}</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {[c.city, c.state].filter(Boolean).join(', ')}
                              {c.gstin ? <span className="ml-2 font-mono">{c.gstin}</span> : null}
                              {c.company_type ? <span className="ml-2 italic">{c.company_type}</span> : null}
                            </p>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {intelDropOpen && !intelLoading && intelResults.length === 0 && intelSearch.length >= 2 && (
                    <div className="absolute z-20 mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-xs text-slate-500">
                      No companies found. Add the company in Intel Portal first.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Waste Categories */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">EPR Waste Categories</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {RECYCLER_WASTE_CATEGORIES.map(cat => (
                  <label key={cat} className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={form.recyclerConfig.waste_categories.includes(cat)}
                      onChange={() => {
                        const current = form.recyclerConfig.waste_categories;
                        const updated = current.includes(cat)
                          ? current.filter(c => c !== cat)
                          : [...current, cat];
                        setRC({ waste_categories: updated });
                      }}
                      className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-teal-500 focus:ring-teal-500"
                    />
                    {cat}
                  </label>
                ))}
              </div>
            </div>

            {/* GSTIN + State + City + Capacity */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">GSTIN</label>
                <input
                  type="text"
                  value={form.recyclerConfig.gstin}
                  onChange={e => setRC({ gstin: e.target.value })}
                  placeholder="e.g. 27AADCE1234F1ZH"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-500 transition"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">State</label>
                <select
                  value={form.recyclerConfig.state}
                  onChange={e => setRC({ state: e.target.value })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="">Select State / UT</option>
                  {INDIA_STATES_UTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">City</label>
                <input
                  type="text"
                  value={form.recyclerConfig.city}
                  onChange={e => setRC({ city: e.target.value })}
                  placeholder="e.g. Pune"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-500 transition"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">Annual Capacity (MT/yr)</label>
                <input
                  type="number"
                  min="0"
                  value={form.recyclerConfig.capacity_mt_pa}
                  onChange={e => setRC({ capacity_mt_pa: e.target.value })}
                  placeholder="e.g. 1000"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-500 transition"
                />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">Plant / Registered Address</label>
              <textarea
                value={form.recyclerConfig.address}
                onChange={e => setRC({ address: e.target.value })}
                placeholder="Full address of the recycling facility"
                rows={2}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-500 resize-none transition"
              />
            </div>

            {/* CPCB Certificate */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">CPCB Certificate No</label>
                <input
                  type="text"
                  value={form.recyclerConfig.cpcb_cert_no}
                  onChange={e => setRC({ cpcb_cert_no: e.target.value })}
                  placeholder="e.g. CPCB/REC/2024/XXXXX"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-500 transition"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">CPCB Cert Expiry</label>
                <input
                  type="date"
                  value={form.recyclerConfig.cpcb_cert_expiry}
                  onChange={e => setRC({ cpcb_cert_expiry: e.target.value })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500 transition"
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Summary ── */}
        {form.email && (
          <div className="rounded-xl border border-slate-800/60 bg-slate-900/30 px-4 py-3 flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-xs font-bold text-violet-300 select-none">
              {(form.full_name || form.email || '?')[0].toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-200 truncate">{form.full_name || <span className="italic text-slate-500">No name</span>}</p>
              <p className="text-xs text-slate-500 truncate">{form.email}</p>
            </div>
            <span className={`shrink-0 rounded border px-2 py-0.5 text-[10px] font-semibold ${
              {
                client: 'border-blue-500/30 bg-blue-500/15 text-blue-300',
                partner: 'border-indigo-500/30 bg-indigo-500/15 text-indigo-300',
                cepc: 'border-violet-500/30 bg-violet-500/15 text-violet-300',
                recycler: 'border-teal-500/30 bg-teal-500/15 text-teal-300',
                legal:              'border-violet-500/30 bg-violet-500/15 text-violet-300',
                compliance_manager: 'border-cyan-500/30 bg-cyan-500/15 text-cyan-300',
                tendering_manager:   'border-pink-500/30 bg-pink-500/15 text-pink-300',
                tendering_executive: 'border-pink-500/30 bg-pink-500/15 text-pink-200',
                telecaller:          'border-orange-500/30 bg-orange-500/15 text-orange-300',
                tc_team_lead:        'border-orange-500/30 bg-orange-500/15 text-orange-200',
                tc_senior_agent:     'border-orange-500/30 bg-orange-500/15 text-orange-200',
                tc_quality_analyst:  'border-amber-500/30 bg-amber-500/15 text-amber-300',
                tc_campaign_manager: 'border-amber-500/30 bg-amber-500/15 text-amber-400',
                tc_trainer:          'border-amber-500/30 bg-amber-500/15 text-amber-200',
                'sales-executive': 'border-amber-500/30 bg-amber-500/15 text-amber-300',
                manager: 'border-rose-500/30 bg-rose-500/15 text-rose-300',
                user_manager: 'border-slate-500/30 bg-slate-500/15 text-slate-300',
                task_manager:            'border-orange-500/30 bg-orange-500/15 text-orange-300',
                academy_director:        'border-indigo-500/30 bg-indigo-500/15 text-indigo-300',
                academy_manager:         'border-indigo-500/30 bg-indigo-500/15 text-indigo-200',
                training_program_manager:'border-violet-500/30 bg-violet-500/15 text-violet-300',
                trainer:                 'border-violet-500/30 bg-violet-500/15 text-violet-200',
                guest_trainer:           'border-purple-500/30 bg-purple-500/15 text-purple-300',
              }[form.role] || 'border-slate-700 text-slate-400'
            }`}>
              {selectedRole.label}
            </span>
          </div>
        )}

        {/* ── Actions ── */}
        {createdUser ? (
          <div className="rounded-xl border border-violet-500/30 bg-violet-500/5 p-5 space-y-4">
            <div>
              <p className="text-sm font-semibold text-slate-100">Account is ready</p>
              <p className="mt-1 text-xs text-slate-400">
                Send {createdUser.displayName} their {createdUser.roleLabel} login link and temporary credentials.
              </p>
            </div>
            {inviteError && (
              <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-300">
                {inviteError}
              </div>
            )}
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href={requestId ? '/iam/requests' : '/iam/users'}
                className="flex-1 rounded-lg border border-slate-700 bg-transparent py-3 text-center text-sm font-semibold text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 transition">
                {inviteSent ? 'Done — View Users' : 'Send Later'}
              </Link>
              <button
                type="button"
                onClick={handleSendInvite}
                disabled={sendingInvite || inviteSent}
                className="flex-1 rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-60 py-3 text-sm font-semibold text-white transition flex items-center justify-center gap-2"
              >
                {sendingInvite ? 'Sending Invite…' : inviteSent ? '✓ Invite Mail Sent' : 'Send Invite Mail'}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link href="/iam/users"
              className="flex-1 rounded-lg border border-slate-700 bg-transparent py-3 text-center text-sm font-semibold text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 transition">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-50 py-3 text-sm font-semibold text-white transition flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <svg className="h-4 w-4 animate-spin text-violet-300" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating…
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
