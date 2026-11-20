'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { isSupabaseConfigured,supabase } from '@/lib/supabaseClient';
import { finishSignIn } from '@/lib/auth/finishSignIn';
import { AUTH_CALLBACK_URL } from '@/lib/auth/config';
import PublicBrand from '@/components/public-site/PublicBrand';
import { trackEvent } from '@/lib/analytics';

export default function RegistrationEntry() {
  const [email,setEmail]=useState(''); const [token,setToken]=useState('');
  const [sent,setSent]=useState(false); const [busy,setBusy]=useState(false); const [error,setError]=useState('');
  const [resendCooldown,setResendCooldown]=useState(0); const [notice,setNotice]=useState('');
  useEffect(()=>{
    if(resendCooldown<=0) return;
    const timer=window.setTimeout(()=>setResendCooldown(seconds=>Math.max(0,seconds-1)),1000);
    return ()=>window.clearTimeout(timer);
  },[resendCooldown]);

  async function resendCode() {
    if(!isSupabaseConfigured || !email || busy || resendCooldown>0) return;
    setBusy(true);setError('');setNotice('');
    try {
      // Passwordless email OTPs are resent by requesting a new OTP, not by
      // resending a password-based signup confirmation.
      const {error}=await supabase.auth.signInWithOtp({
        email:email.trim().toLowerCase(),
        options:{shouldCreateUser:true,emailRedirectTo:AUTH_CALLBACK_URL},
      });
      if(error) throw new Error('Unable to resend the verification email. Please wait and try again.');
      setToken('');
      setResendCooldown(60);
      setNotice('A new verification email has been sent. Use the newest code.');
    } catch(e) {
      setError(e instanceof Error?e.message:'Unable to resend the verification email.');
    } finally {setBusy(false);}
  }

  async function submit(e:React.FormEvent) {
    e.preventDefault();setBusy(true);setError('');setNotice('');
    try {
      if(!isSupabaseConfigured) throw new Error('Account registration is unavailable. Please contact support.');
      if(sent) {
        const {error}=await supabase.auth.verifyOtp({email:email.trim().toLowerCase(),token:token.trim(),type:'email'});
        if(error) throw new Error('The code is invalid or expired. Request a new code and try again.');
        trackEvent('Email Verified', { source: 'registration' });
        await finishSignIn();
      } else {
        const {error}=await supabase.auth.signInWithOtp({email:email.trim().toLowerCase(),options:{shouldCreateUser:true,emailRedirectTo:AUTH_CALLBACK_URL}});
        if(error) throw new Error('Unable to send verification. Please wait and try again.');
        setSent(true);
        setResendCooldown(60);
        trackEvent('Verification Requested', { source: 'registration' });
      }
    } catch(e){setError(e instanceof Error?e.message:'Unable to continue');}finally{setBusy(false);}
  }
  async function google() {
    setBusy(true);setError('');
    try {const {error}=await supabase.auth.signInWithOAuth({provider:'google',options:{redirectTo:AUTH_CALLBACK_URL}}); if(error) throw error;}
    catch {setError('Google sign-in is unavailable.');setBusy(false);}
  }
  return <main className="min-h-screen bg-[#fbfdfc] px-5 py-10 text-slate-900"><div className="mx-auto max-w-md"><PublicBrand compact /><h1 className="mt-10 text-2xl font-semibold">Create your EPR Compass account</h1>
    {!isSupabaseConfigured && <p role="status" className="mt-5 text-sm text-amber-800">Registration is currently unavailable. Please contact support.</p>}
    {isSupabaseConfigured && process.env.NEXT_PUBLIC_GOOGLE_SIGN_IN_ENABLED==='true' && <button disabled={busy} onClick={google} className="mt-6 min-h-12 w-full rounded-lg border border-slate-300 bg-white text-sm font-semibold">Continue with Google</button>}
    <form onSubmit={submit} className="mt-6 space-y-5"><label className="block text-sm font-medium">Email<input type="email" required autoComplete="email" disabled={sent || busy} value={email} onChange={e=>setEmail(e.target.value)} className="mt-2 min-h-12 w-full rounded-lg border border-slate-300 bg-white px-3" /></label>
      {sent && <><p className="text-sm">Check {email} for your one-time verification code. Enter the code below to verify your account.</p><label className="block text-sm font-medium">One-time verification code<input required autoComplete="one-time-code" inputMode="numeric" value={token} onChange={e=>setToken(e.target.value)} className="mt-2 min-h-12 w-full rounded-lg border border-slate-300 px-3" /></label></>}
      {notice && <p role="status" className="text-sm text-emerald-700">{notice}</p>}
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <button disabled={busy || !isSupabaseConfigured} className="min-h-12 w-full rounded-lg bg-emerald-700 px-4 font-semibold text-white disabled:opacity-50">{busy?'Please wait...':sent?'Verify and continue':'Continue with email'}</button>
      {sent && <div className="flex items-center justify-between gap-3 text-sm"><button type="button" disabled={busy || resendCooldown>0} onClick={resendCode} className="min-h-11 font-semibold text-emerald-700 disabled:text-slate-400">{busy?'Sending...':resendCooldown>0?`Resend code in ${resendCooldown}s`:'Resend verification code'}</button><button type="button" disabled={busy} onClick={()=>{setSent(false);setToken('');setError('');setNotice('');setResendCooldown(0);}} className="min-h-11 text-slate-600">Change email</button></div>}
    </form><Link href="/login" className="mt-6 inline-block text-sm font-semibold text-emerald-700">Already have an account? Sign in</Link></div></main>;
}

