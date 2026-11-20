"use client";

import { useEffect, useMemo, useState } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { ShieldCheck, Lock, BadgeCheck, Smartphone, Landmark, CreditCard, Plus, Check } from "lucide-react";
import CountdownTimer from "@/components/CountdownTimer";
import { trackEvent, trackRevenue } from "@/lib/analytics";

const COURSE_NAME = "EPR Compliance Master Program";
const SUBTOTAL_INR = 9999;
const GST_PERCENT = 18;
const EARLYBIRD_FALLBACK = process.env.NEXT_PUBLIC_CHECKOUT_EARLYBIRD_END || "";

const ORDER_BUMPS = [
  { id: "consultation-1on1", name: "1:1 Expert Consultation (30 min)", desc: "Get personalised compliance guidance from an EPR specialist.", priceInr: 2999 },
  { id: "workshop-bundle", name: "Live Workshop Access (3 sessions)", desc: "Hands-on CPCB portal training, return filing & live Q&A.", priceInr: 1999 },
  { id: "priority-support", name: "Priority Email Support (90 days)", desc: "Direct email access to our compliance team for 90 days.", priceInr: 999 },
];

function formatINR(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function CheckoutPage() {
  const router = useRouter();
  const [couponCode, setCouponCode] = useState("");
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [earlyBirdEnd, setEarlyBirdEnd] = useState(EARLYBIRD_FALLBACK);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/public/site-settings/checkout.earlybird_end')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (cancelled || !data?.value) return;
        setEarlyBirdEnd(String(data.value));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const addonsTotal = useMemo(() => selectedAddons.reduce((sum, id) => {
    const addon = ORDER_BUMPS.find(a => a.id === id);
    return sum + (addon?.priceInr || 0);
  }, 0), [selectedAddons]);
  const gstAmount = useMemo(() => Math.round(((SUBTOTAL_INR + addonsTotal) * GST_PERCENT) / 100), [addonsTotal]);
  const totalAmount = SUBTOTAL_INR + addonsTotal + gstAmount;

  const toggleAddon = (id) => {
    setSelectedAddons(prev => {
      const isAdding = !prev.includes(id);
      trackEvent('Checkout Addon Toggled', { addon_id: id, action: isAdding ? 'added' : 'removed' });
      return isAdding ? [...prev, id] : prev.filter(a => a !== id);
    });
  };

  const handlePayNow = async () => {
    setIsLoading(true);
    setError("");
    trackEvent("Checkout Started", {
      product: "epr-course",
      addons: selectedAddons,
      amount: totalAmount,
    });

    try {
      if (typeof window === "undefined" || typeof window.Razorpay !== "function") {
        throw new Error("Razorpay SDK failed to load. Refresh and try again.");
      }

      const response = await fetch('/api/payment/create-order', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          couponCode: couponCode.trim(),
          product: "epr-course",
          addons: selectedAddons,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to initialize payment");
      }

      const razorpay = new window.Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "EPR Compass",
        description: COURSE_NAME,
        order_id: data.orderId,
        image: "/imgs/epr-compass/epr-compass-platform.png",
        handler: function (paymentResponse) {
          trackEvent("Purchase Completed", {
            product: "epr-course",
            addons: selectedAddons,
            amount: totalAmount,
            payment_id: paymentResponse.razorpay_payment_id || "",
            order_id: paymentResponse.razorpay_order_id || "",
          });
          trackRevenue({ amount: totalAmount, productId: "epr-course" });
          const params = new URLSearchParams({
            payment_id: paymentResponse.razorpay_payment_id || "",
            order_id: paymentResponse.razorpay_order_id || "",
            signature: paymentResponse.razorpay_signature || "",
          });
          router.push(`/thank-you?${params.toString()}`);
        },
        modal: {
          ondismiss: function () {
            setIsLoading(false);
          },
        },
        theme: {
          color: "#07875f",
        },
      });

      razorpay.open();
    } catch (err) {
      setError(err.message || "Payment initialization failed");
      setIsLoading(false);
    }
  };

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      <main className="min-h-screen bg-white dark:bg-gray-900 py-12 px-4">
        <section className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          <article className="lg:col-span-2 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
            <p className="text-sm font-semibold text-eco-green-4 mb-2">Checkout</p>
            <h1 className="font-tricks text-3xl md:text-4xl text-eco-navy dark:text-white mb-3">Enroll in EPR Course</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">Complete your payment securely and get instant access details on your registered email.</p>

            <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{COURSE_NAME}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Includes modules, templates, and practical implementation roadmap.</p>
            </div>

            <div className="mb-6">
              <label htmlFor="coupon" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Coupon Code (Optional)
              </label>
              <input
                id="coupon"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="Enter coupon code (applied at payment)"
                aria-describedby="coupon-hint"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2.5 min-h-[44px] bg-transparent text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-eco-green-4 focus:border-eco-green-4"
              />
              <p id="coupon-hint" className="mt-1 text-xs text-gray-500 dark:text-gray-400">Coupons are validated when you proceed to pay.</p>
            </div>

            {/* Order Bumps */}
            <div className="mb-6">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Enhance Your Program</h2>
              <div className="space-y-3">
                {ORDER_BUMPS.map(bump => {
                  const selected = selectedAddons.includes(bump.id);
                  return (
                    <button
                      key={bump.id}
                      type="button"
                      onClick={() => toggleAddon(bump.id)}
                      className={`w-full text-left rounded-xl border-2 p-4 transition-all duration-200 ${
                        selected
                          ? "border-eco-green-4 bg-eco-green-4/5 dark:bg-eco-green-4/10"
                          : "border-gray-200 dark:border-gray-700 hover:border-eco-green-4/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className={`w-5 h-5 rounded mt-0.5 border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                            selected ? "bg-eco-green-4 border-eco-green-4" : "border-gray-300 dark:border-gray-600"
                          }`}>
                            {selected && <Check size={12} className="text-white" />}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{bump.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{bump.desc}</p>
                          </div>
                        </div>
                        <span className="text-sm font-bold text-eco-green-4 whitespace-nowrap">+{formatINR(bump.priceInr)}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-3 text-sm text-gray-700 dark:text-gray-200 flex items-center gap-2">
                <Smartphone size={16} className="text-eco-green-4" /> UPI Supported
              </div>
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-3 text-sm text-gray-700 dark:text-gray-200 flex items-center gap-2">
                <Landmark size={16} className="text-eco-green-4" /> EMI Options
              </div>
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-3 text-sm text-gray-700 dark:text-gray-200 flex items-center gap-2">
                <CreditCard size={16} className="text-eco-green-4" /> Cards & Netbanking
              </div>
            </div>

            <div
              role="alert"
              aria-live="assertive"
              className={`rounded-lg p-3 text-sm border ${error ? "bg-red-50 text-red-700 border-red-200" : "hidden"}`}
            >
              {error}
            </div>
          </article>

          <aside className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 h-fit">
            {earlyBirdEnd ? (
              <CountdownTimer targetDate={earlyBirdEnd} label="Early bird pricing ends in" variant="banner" className="mb-5" />
            ) : null}
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Price Breakdown</h2>
            <div className="space-y-2 text-sm text-gray-700 dark:text-gray-200">
              <div className="flex justify-between">
                <span>Course Subtotal</span>
                <span>{formatINR(SUBTOTAL_INR)}</span>
              </div>
              {selectedAddons.length > 0 && (
                <div className="flex justify-between">
                  <span>Add-ons ({selectedAddons.length})</span>
                  <span>{formatINR(addonsTotal)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>GST ({GST_PERCENT}%)</span>
                <span>{formatINR(gstAmount)}</span>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2 flex justify-between font-semibold text-base text-gray-900 dark:text-white">
                <span>Total</span>
                <span>{formatINR(totalAmount)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handlePayNow}
              disabled={isLoading}
              aria-busy={isLoading}
              className="w-full mt-6 bg-eco-green-4 hover:bg-eco-green-3 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 min-h-[48px] rounded-xl transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-eco-green-4"
            >
              {isLoading ? "Opening Razorpay..." : "Pay & Enroll"}
            </button>

            <div className="mt-6 space-y-2 text-xs text-gray-500 dark:text-gray-400">
              <p className="flex items-center gap-2"><ShieldCheck size={14} className="text-eco-green-4" /> Secure Payment Gateway</p>
              <p className="flex items-center gap-2"><Lock size={14} className="text-eco-green-4" /> SSL Encrypted Checkout</p>
              <p className="flex items-center gap-2"><BadgeCheck size={14} className="text-eco-green-4" /> Verified Business Account</p>
            </div>
          </aside>
        </section>
      </main>
    </>
  );
}

