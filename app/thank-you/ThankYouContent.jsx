'use client';

import Link from "next/link";
import { CheckCircle, ArrowRight, BookOpen, Users, Shield } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { getWhatsAppCommunity } from "@/lib/whatsappCommunities";
import WhatsAppJoinCTA from "@/components/WhatsAppJoinCTA";

export default function ThankYouContent() {
  const searchParams = useSearchParams();
  const communityKey = searchParams.get('page') || searchParams.get('course') || searchParams.get('plan');
  const community = getWhatsAppCommunity(communityKey);
  const isMeetingRequest = searchParams.get('intent') === 'meeting';

  if (isMeetingRequest) {
    return (
      <main className="min-h-screen bg-[#fffcf8] px-4 py-16 text-[#281d39]">
        <section className="mx-auto max-w-2xl rounded-2xl border border-[var(--epr-border)] bg-white p-8 text-center shadow-sm md:p-12">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#f0e6fa] text-[#3f1b66]">
            <CheckCircle className="h-8 w-8" />
          </div>
          <p className="mb-2 text-sm font-semibold text-[#e98200]">Request received</p>
          <h1 className="mb-4 text-3xl font-bold text-[#3f1b66] md:text-4xl">Thank you for reaching out.</h1>
          <p className="mb-8 leading-7 text-[#72627e]">Our EPR Compass team will contact you to discuss your requirements and arrange a suitable meeting time.</p>
          <Link href="/" className="inline-flex items-center gap-2 rounded-full bg-[#3f1b66] px-6 py-3 font-semibold text-white transition hover:opacity-90">
            Back to home <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-4 py-16">
      <section className="max-w-3xl mx-auto text-center rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-8 md:p-12">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
        <p className="text-sm font-semibold text-eco-green-4 mb-2">Enrollment Confirmed</p>
        <h1 className="font-tricks text-3xl md:text-5xl text-eco-navy dark:text-white mb-4">Thank You for Your Payment</h1>
        <p className="text-gray-700 dark:text-gray-200 mb-6">
          Your payment was received successfully. Our team will share course access details and onboarding steps on your registered email.
        </p>

        {community && (
          <div className="mb-6">
            <WhatsAppJoinCTA communityName={community.name} link={community.link} />
          </div>
        )}

        <a
          href="/contact"
          className="inline-block bg-eco-green-4 hover:bg-eco-green-3 text-white font-semibold px-6 py-3 rounded-full transition"
        >
          Need Help? Contact Support
        </a>
      </section>

      {/* Upsell Section */}
      <section className="max-w-5xl mx-auto mt-16">
        <h2 className="text-2xl md:text-3xl font-bold text-center text-eco-navy dark:text-white mb-3">
          Accelerate Your EPR Compliance
        </h2>
        <p className="text-center text-gray-600 dark:text-gray-300 mb-10 max-w-2xl mx-auto">
          Professionals who combine training with expert support achieve compliance 3× faster.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Upsell Card 1: Workshop */}
          <div className="relative rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 flex flex-col">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mb-4">
              <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Live Workshops</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 flex-1">
              Hands-on CPCB portal training, annual return filing walkthroughs and live Q&A with EPR experts. ₹799 per session.
            </p>
            <Link
              href="/training_calendar"
              className="inline-flex items-center gap-1 text-eco-green-4 hover:text-eco-green-3 font-semibold text-sm"
            >
              View Upcoming Workshops <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Upsell Card 2: 1:1 Consultation */}
          <div className="relative rounded-2xl border-2 border-eco-green-4 bg-white dark:bg-gray-800 p-6 flex flex-col">
            <span className="absolute -top-3 left-6 bg-eco-green-4 text-white text-xs font-bold px-3 py-1 rounded-full">MOST POPULAR</span>
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mb-4">
              <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">1:1 Expert Consultation</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 flex-1">
              Get a personalized compliance roadmap, target calculation review and certificate procurement strategy for your business.
            </p>
            <Link
              href="/contact?intent=meeting&source=thank_you"
              className="inline-flex items-center gap-1 text-eco-green-4 hover:text-eco-green-3 font-semibold text-sm"
            >
              Schedule Free Consultation <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Upsell Card 3: Full Compliance Package */}
          <div className="relative rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 flex flex-col">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mb-4">
              <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Full Compliance Package</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 flex-1">
              EPR registration + certificate procurement + annual returns — end-to-end compliance handled by our team. Custom quote.
            </p>
            <Link
              href="/services"
              className="inline-flex items-center gap-1 text-eco-green-4 hover:text-eco-green-3 font-semibold text-sm"
            >
              View Services <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
