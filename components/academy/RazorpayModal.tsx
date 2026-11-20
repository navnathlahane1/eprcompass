'use client';

import { useState, useEffect } from 'react';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any;
  }
}

export interface RazorpayModalProps {
  programTitle: string;
  programId?: string;
  participantName: string;
  participantEmail: string;
  participantPhone?: string;
  organization?: string;
  promoCode?: string;
  partnerCode?: string;
  /** Override the order-creation endpoint. Defaults to /api/academy/payment/create-order */
  createOrderUrl?: string;
  /** Override the verify endpoint. Defaults to /api/academy/payment/verify */
  verifyUrl?: string;
  onSuccess: (paymentId: string, orderId: string) => void;
  onFailure?: (error: string) => void;
  onClose: () => void;
}

interface Pricing {
  subtotalInr: number;
  gstPercent: number;
  gstAmountInr: number;
  totalInr: number;
  discountInr: number;
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise(resolve => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload  = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`;

export default function RazorpayModal({
  programTitle,
  programId,
  participantName,
  participantEmail,
  participantPhone,
  organization,
  promoCode,
  partnerCode,
  createOrderUrl = '/api/academy/payment/create-order',
  verifyUrl = '/api/academy/payment/verify',
  onSuccess,
  onFailure,
  onClose,
}: RazorpayModalProps) {
  const [step, setStep]         = useState<'pricing' | 'processing' | 'done' | 'error'>('pricing');
  const [pricing, setPricing]   = useState<Pricing | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    // Fetch order / pricing as soon as modal mounts
    fetch(createOrderUrl, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        programTitle, programId,
        participantName, participantEmail,
        participantPhone, organization,
        promoCode, partnerCode,
      }),
    })
      .then(r => r.json())
      .then(async data => {
        if (!data.success) {
          setErrorMsg(data.message || 'Could not initialise payment');
          setStep('error');
          return;
        }

        setPricing(data.pricing);

        const loaded = await loadRazorpayScript();
        if (!loaded) {
          setErrorMsg('Could not load Razorpay. Check your internet connection.');
          setStep('error');
          return;
        }

        setStep('processing');

        const options = {
          key:         data.keyId,
          amount:      data.amount,
          currency:    data.currency,
          name:        'EPR Compass Academy',
          description: programTitle,
          order_id:    data.orderId,
          prefill: {
            name:    participantName,
            email:   participantEmail,
            contact: participantPhone || '',
          },
          theme: { color: '#6366f1' },
          modal: {
            ondismiss() {
              setStep('pricing');
              onClose();
            },
          },
          handler: async (response: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) => {
            const verify = await fetch(verifyUrl, {
              method:  'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id:   response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature:  response.razorpay_signature,
              }),
            }).then(r => r.json());

            if (verify.success) {
              setStep('done');
              onSuccess(response.razorpay_payment_id, response.razorpay_order_id);
            } else {
              setErrorMsg(verify.message || 'Payment verification failed');
              setStep('error');
              onFailure?.(verify.message);
            }
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', (resp: { error: { description: string } }) => {
          setErrorMsg(resp.error.description || 'Payment failed');
          setStep('error');
          onFailure?.(resp.error.description);
        });
        rzp.open();
      })
      .catch(err => {
        setErrorMsg(String(err));
        setStep('error');
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-[#0c1022] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-800">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-0.5">EPR Academy · Enrolment Payment</p>
            <h2 className="text-base font-semibold text-white truncate max-w-xs">{programTitle}</h2>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition ml-4 shrink-0">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Learner info */}
          <div className="rounded-xl bg-slate-800/40 px-4 py-3 space-y-1">
            <p className="text-xs font-semibold text-slate-300">{participantName}</p>
            <p className="text-xs text-slate-500">{participantEmail}</p>
            {organization && <p className="text-xs text-slate-500">{organization}</p>}
          </div>

          {/* Pricing breakdown */}
          {pricing && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Program fee</span>
                <span>{fmt(pricing.subtotalInr + pricing.discountInr)}</span>
              </div>
              {pricing.discountInr > 0 && (
                <div className="flex justify-between text-xs text-emerald-400">
                  <span>Promo discount</span>
                  <span>−{fmt(pricing.discountInr)}</span>
                </div>
              )}
              <div className="flex justify-between text-xs text-slate-400">
                <span>GST ({pricing.gstPercent}%)</span>
                <span>{fmt(pricing.gstAmountInr)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-white border-t border-slate-700 pt-2 mt-1">
                <span>Total payable</span>
                <span className="text-indigo-300">{fmt(pricing.totalInr)}</span>
              </div>
            </div>
          )}

          {/* Status indicators */}
          {step === 'pricing' && (
            <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800/30 rounded-lg px-3 py-2">
              <svg className="h-4 w-4 animate-spin text-indigo-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
              </svg>
              Initialising secure payment…
            </div>
          )}

          {step === 'processing' && (
            <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
              <svg className="h-4 w-4 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
              </svg>
              Razorpay checkout is open — complete payment there.
            </div>
          )}

          {step === 'done' && (
            <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              Payment successful! Enrolment confirmed.
            </div>
          )}

          {step === 'error' && (
            <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 px-3 py-2">
              <p className="text-xs text-rose-400">{errorMsg || 'Something went wrong.'}</p>
              <button onClick={onClose} className="mt-2 text-xs text-rose-300 underline">Close</button>
            </div>
          )}

          {/* Security note */}
          <p className="text-[11px] text-slate-600 text-center">
            Secured by Razorpay · 256-bit SSL · PCI DSS compliant
          </p>
        </div>
      </div>
    </div>
  );
}

