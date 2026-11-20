'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function ReminderPreferences() {
  const [cadence,setCadence]=useState('daily');
  const [ready,setReady]=useState(false);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  useEffect(() => {
    let active=true;
    fetch('/api/account/reminder-preferences').then(async response => {const value=await response.json();if(!response.ok)throw new Error(value.error);return value;})
      .then(value=>{if(active){setCadence(value.cadence);setReady(true);}}).catch(error=>{if(active)setMessage(error.message);});
    return()=>{active=false;};
  },[]);
  async function save(event: React.FormEvent) {
    event.preventDefault();setBusy(true);setMessage('');
    try {const response=await fetch('/api/account/reminder-preferences',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({cadence})});const value=await response.json();if(!response.ok)throw new Error(value.error);setMessage('Reminder preference saved.');}
    catch(error){setMessage(error instanceof Error?error.message:'Unable to save preference');}finally{setBusy(false);}
  }
  return <main className="mx-auto max-w-xl px-5 py-12 text-slate-900"><h1 className="text-2xl font-semibold">Scheduled reminders</h1>
    <form onSubmit={save} className="mt-6 space-y-5"><fieldset disabled={!ready || busy} className="space-y-3"><legend className="mb-3 text-sm font-medium">Repeat frequency per item</legend>{[['daily','Daily'],['weekly','Weekly'],['off','Off']].map(([value,label])=><label key={value} className="flex min-h-11 items-center gap-3 text-sm"><input type="radio" name="cadence" value={value} checked={cadence===value} onChange={()=>setCadence(value)} />{label}</label>)}</fieldset>
    <p className="text-sm text-slate-600">Applies to scheduled in-app deadline, document-expiry and overdue-invoice reminders. Security messages and direct staff communications are unchanged.</p>
    <button disabled={!ready || busy} className="min-h-11 rounded-lg bg-emerald-700 px-5 text-sm font-semibold text-white disabled:opacity-50">{busy?'Saving...':'Save preference'}</button></form>
    <p role="status" className="mt-4 text-sm">{message}</p><Link href="/login" className="mt-5 inline-block text-sm text-emerald-700">Back to my account</Link>
  </main>;
}
