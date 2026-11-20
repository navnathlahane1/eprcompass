'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { CheckCircle, Calendar, Clock, MapPin, Users, Award, Mail, Phone, ArrowRight, Download, MessageCircle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import ConsultationTriggerButton from '@/components/ConsultationTriggerButton';
import ContactEmail from '@/components/public-site/ContactEmail';

// Content component that uses useSearchParams
const WorkshopSuccessContent = () => {
  const searchParams = useSearchParams();
  const [registrationData, setRegistrationData] = useState(null);

  useEffect(() => {
    // Get registration data from URL params or localStorage
    const workshopTitle = searchParams.get('workshop') || 'EPR & Sustainability Workshop';
    const participantName = searchParams.get('name') || 'Participant';
    const workshopDates = searchParams.get('dates') || 'Upcoming dates';
    const workshopPrice = searchParams.get('price') || '₹0';
    
    setRegistrationData({
      workshopTitle,
      participantName,
      workshopDates,
      workshopPrice
    });
  }, [searchParams]);

  if (!registrationData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-eco-green-4"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-eco-green-1/20 via-white to-eco-green-2/20 dark:from-eco-green-1/10 dark:via-gray-900 dark:to-eco-green-2/10">
      {/* Success Header */}
      <section className="py-20 text-center">
        <div className="max-w-4xl mx-auto px-6">
          <div className="w-24 h-24 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Registration Successful! 🎉
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Thank you for registering for our workshop. We're excited to have you join us for this learning experience!
          </p>
        </div>
      </section>

      {/* Workshop Details Card */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-green-200 dark:border-green-800 p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
              Workshop Details
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Award className="w-5 h-5 text-eco-green-4" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Workshop</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{registrationData.workshopTitle}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-eco-green-4" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Dates</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{registrationData.workshopDates}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-eco-green-4" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Participant</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{registrationData.participantName}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-eco-green-4" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Duration</p>
                    <p className="font-semibold text-gray-900 dark:text-white">4 Days (2 Weekends)</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-eco-green-4" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Format</p>
                    <p className="font-semibold text-gray-900 dark:text-white">Virtual</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Award className="w-5 h-5 text-eco-green-4" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Amount Paid</p>
                    <p className="font-semibold text-eco-green-4 text-xl">{registrationData.workshopPrice}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Next Steps */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            What Happens Next?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center mb-4">
                <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Confirmation Email
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                You'll receive a detailed confirmation email within the next few minutes with all workshop information.
              </p>
              <div className="text-sm text-gray-500 dark:text-gray-500">
                📧 Check your inbox and spam folder
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center mb-4">
                <Download className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Workshop Materials
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Pre-workshop materials and reading materials will be shared within 48 hours.
              </p>
              <div className="text-sm text-gray-500 dark:text-gray-500">
                📚 Prepare for an engaging learning experience
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-xl flex items-center justify-center mb-4">
                <MessageCircle className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                WhatsApp Group
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Join our workshop WhatsApp group for updates, discussions, and networking.
              </p>
              <div className="text-sm text-gray-500 dark:text-gray-500">
                💬 Link will be shared in the confirmation email
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-xl flex items-center justify-center mb-4">
                <Award className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Pre-Workshop Survey
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Complete a brief questionnaire to help us tailor the workshop to your needs.
              </p>
              <div className="text-sm text-gray-500 dark:text-gray-500">
                📋 Survey link in your email
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Upsell Section */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3 text-center">
            Take the Next Step in Your EPR Journey
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-300 mb-10 max-w-2xl mx-auto">
            Workshop attendees who continue learning achieve compliance 3× faster.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl border-2 border-eco-green-4 bg-gray-50 dark:bg-gray-800 p-6">
              <span className="inline-block bg-eco-green-4 text-white text-xs font-bold px-3 py-1 rounded-full mb-4">RECOMMENDED</span>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">EPR Compliance Master Program</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Complete EPR certification program — CPCB portal, compliance frameworks, certificate procurement and annual returns. 
              </p>
              <p className="text-2xl font-bold text-eco-green-4 mb-4">₹9,999 <span className="text-sm font-normal text-gray-500">+ GST</span></p>
              <Link
                href="/checkout"
                className="block w-full text-center bg-eco-green-4 hover:bg-eco-green-3 text-white font-semibold px-6 py-3 rounded-lg transition"
              >
                Enroll Now
              </Link>
            </div>

            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">1:1 Expert Consultation</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Get a personalized compliance roadmap, target calculation review and certificate procurement strategy for your business.
              </p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Free initial consultation</p>
              <ConsultationTriggerButton
                label="Schedule Consultation"
                source="workshop_success_pricing"
                className="block w-full text-center border-2 border-eco-green-4 text-eco-green-4 hover:bg-eco-green-4 hover:text-white font-semibold px-6 py-3 rounded-lg transition"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Contact Information */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            Need Help?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-eco-green-4 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Email Support
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                Get quick responses to your questions
              </p>
              <ContactEmail className="font-medium text-eco-green-4 hover:text-eco-green-5" />
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-eco-green-4 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Contact Support
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                Email us directly for support
              </p>
              <ContactEmail className="font-medium text-eco-green-4 hover:text-eco-green-5" />
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-eco-green-4 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Contact Information
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                Contact our team by email
              </p>
              <ContactEmail className="font-medium text-eco-green-4 hover:text-eco-green-5" />
            </div>
          </div>
        </div>
      </section>

      {/* Upsell Section */}
      <section className="py-20 bg-eco-green-4">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-white mb-2 text-center">
            Continue Your EPR Journey
          </h2>
          <p className="text-lg text-green-100 mb-10 text-center max-w-2xl mx-auto">
            Workshop attendees who combine training with expert support achieve compliance 3× faster.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 flex flex-col relative">
              <span className="absolute -top-3 left-6 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full">BEST VALUE</span>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 mt-2">EPR Compliance Master Program</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 flex-1">
                Complete certification with CPCB portal training, compliance frameworks and career placement support.
              </p>
              <p className="text-2xl font-bold text-eco-green-4 mb-1">₹9,999 <span className="text-sm line-through text-gray-400 font-normal">₹14,999</span></p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Workshop attendee discount applied</p>
              <Link
                href="/checkout"
                className="block text-center bg-eco-green-4 hover:bg-eco-green-3 text-white font-semibold py-2.5 rounded-full transition text-sm"
              >
                Enroll Now
              </Link>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 flex flex-col">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">1:1 Expert Consultation</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 flex-1">
                60-min personalised session — EPR obligations review, target calculation and compliance roadmap for your business.
              </p>
              <p className="text-2xl font-bold text-eco-green-4 mb-1">₹2,999</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Exclusively for workshop attendees</p>
              <ConsultationTriggerButton
                label="Book Consultation"
                source="workshop_success_upsell"
                className="block text-center border-2 border-eco-green-4 text-eco-green-4 hover:bg-eco-green-4 hover:text-white font-semibold py-2.5 rounded-full transition text-sm"
              />
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 flex flex-col">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Full Compliance Package</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 flex-1">
                EPR registration + certificates + annual returns — end-to-end compliance managed by our expert team.
              </p>
              <p className="text-lg font-bold text-eco-green-4 mb-1">Custom Quote</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Starting ₹29,999 / year</p>
              <Link
                href="/services"
                className="block text-center border-2 border-eco-green-4 text-eco-green-4 hover:bg-eco-green-4 hover:text-white font-semibold py-2.5 rounded-full transition text-sm"
              >
                View Services
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

// Main page component with Suspense boundary
const WorkshopSuccessPage = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-eco-green-4"></div>
      </div>
    }>
      <WorkshopSuccessContent />
    </Suspense>
  );
};

export default WorkshopSuccessPage;


