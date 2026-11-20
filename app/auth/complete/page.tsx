'use client';
import { useEffect,useRef,useState } from 'react';
import Link from 'next/link';
import { finishSignIn } from '@/lib/auth/finishSignIn';
import { supabase } from '@/lib/supabaseClient';
export default function CompleteSignIn(){
  const [error,setError]=useState('');
  const exchange=useRef<Promise<void> | null>(null);
  useEffect(()=>{
    let active=true;
    // React may replay effects in development. Exchange a single-use code once.
    exchange.current ??= (async()=>{
      const url=new URL(window.location.href);
      const fragment=new URLSearchParams(url.hash.slice(1));
      if(url.searchParams.has('error') || fragment.has('error')) throw new Error('Your verification link is invalid or expired. Return to sign in or request a new verification code.');
      const code=url.searchParams.get('code');
      if(code) {
        const {error}=await supabase.auth.exchangeCodeForSession(code);
        if(error) throw new Error('Your verification link could not be completed. Request a new verification code.');
        window.history.replaceState({},'',url.pathname);
      }
    })();
    void exchange.current.then(async()=>{if(active) await finishSignIn();}).catch(e=>{if(active) setError(e instanceof Error?e.message:'Sign-in could not be completed');});
    return ()=>{active=false;};
  },[]);
  return <main className="mx-auto max-w-md px-5 py-16"><h1 className="text-2xl font-semibold">EPR Compass</h1><p role={error?'alert':'status'} className="my-5">{error || 'Completing sign-in...'}</p>{error && <Link href="/login" className="text-emerald-700">Return to sign in</Link>}</main>;
}

