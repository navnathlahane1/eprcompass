'use client';
import { useEffect,useState } from 'react';
import Link from 'next/link';
import { PURPOSES,parseRegistration } from '@/lib/onboarding/registration';
import { BUSINESS_ACTIVITIES } from '@/lib/onboarding/clientSetup';
type Registration=ReturnType<typeof parseRegistration> & {status?:string};
export default function WelcomePage(){
  const [form,setForm]=useState<Registration>({full_name:'',purpose:'',company_name:'',country:'',business_activity:null});
  const [loaded,setLoaded]=useState(false); const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [saved,setSaved]=useState(false);
  useEffect(()=>{let active=true;fetch('/api/auth/registration',{cache:'no-store'}).then(async r=>{if(r.status===401){window.location.assign('/signup');return null;}const v=await r.json();if(!r.ok)throw new Error(v.error);return v;}).then(v=>{if(active && v){if(v.registration){setForm(v.registration);setSaved(true);}setLoaded(true);}}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;};},[]);
  async function save(e:React.FormEvent){e.preventDefault();setBusy(true);setError('');try{const body=parseRegistration(form);const r=await fetch('/api/auth/registration',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const v=await r.json();if(!r.ok)throw new Error(v.error);setSaved(true);}catch(e){setError(e instanceof Error?e.message:'Unable to save');}finally{setBusy(false);}}
  const input='mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2';
  return <main className="min-h-screen bg-[#fbfdfc] px-5 py-10 text-slate-900"><div className="mx-auto max-w-2xl"><h1 className="text-2xl font-semibold">Welcome to EPR Compass</h1>{error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
    {!loaded && !error && <p role="status" className="mt-5">Loading account setup...</p>}
    {loaded && <><form onSubmit={save} onChange={()=>setSaved(false)} className="mt-6 space-y-5"><fieldset disabled={busy || (!!form.status && form.status!=='pending')} className="space-y-5">
      <label className="block text-sm font-medium">Your name<input required maxLength={160} value={form.full_name} onChange={e=>setForm({...form,full_name:e.target.value})} className={input} /></label>
      <label className="block text-sm font-medium">What brings you here?<select required className={input} value={form.purpose} onChange={e=>setForm({...form,purpose:e.target.value,business_activity:null})}><option value="">Select your purpose</option>{PURPOSES.map(p=><option key={p.value} value={p.value}>{p.label}</option>)}</select></label>
      {form.purpose==='company' && <label className="block text-sm font-medium">Company activity<select required value={form.business_activity ?? ''} onChange={e=>setForm({...form,business_activity:e.target.value})} className={input}><option value="">Select company activity</option>{BUSINESS_ACTIVITIES.map(a=><option key={a.value} value={a.value}>{a.label}</option>)}</select></label>}
      <label className="block text-sm font-medium">{form.purpose==='learner'?'Organisation (optional)':'Company name'}<input required={form.purpose!=='learner'} maxLength={160} value={form.company_name} onChange={e=>setForm({...form,company_name:e.target.value})} className={input} /></label>
      <label className="block text-sm font-medium">Country<input required maxLength={100} value={form.country} onChange={e=>setForm({...form,country:e.target.value})} className={input} /></label>
      <button className="min-h-11 rounded-lg bg-emerald-700 px-5 text-sm font-semibold text-white disabled:opacity-50">{busy?'Saving...':'Save and continue'}</button>
    </fieldset></form>{saved && <section role="status" className="mt-8 border-t border-slate-200 pt-5"><h2 className="text-lg font-semibold">Your account setup</h2><ul className="mt-3 space-y-2 text-sm"><li>Email verified</li><li>Basic details saved</li><li>Workspace access: {form.status || 'pending'} review</li></ul><Link href="/login" className="mt-5 inline-block font-semibold text-emerald-700">Open my assigned workspace</Link></section>}</>}
    <Link href="/contact" className="mt-8 inline-block text-sm text-emerald-700">Contact support</Link></div></main>;
}

