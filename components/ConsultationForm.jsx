"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { submitToGoogleScript } from "@/lib/googleScript";

const initialState = {
  name: "",
  email: "",
  phone: "",
  practice: "",
  specialty: "",
  date: "",
  time: "",
  message: "",
};

const validate = (fields) => {
  const errors = {};
  if (!fields.name.trim()) errors.name = "Name is required";
  if (!fields.email.trim()) {
    errors.email = "Email is required";
  } else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(fields.email)) {
    errors.email = "Invalid email";
  }
  if (!fields.phone.trim()) {
    errors.phone = "Phone is required";
  } else if (!/^\d{7,15}$/.test(fields.phone.replace(/\D/g, ""))) {
    errors.phone = "Invalid phone number";
  }
  if (!fields.practice.trim()) errors.practice = "Company name is required";
  return errors;
};

export default function ConsultationForm({ open, onClose }) {
  const [fields, setFields] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success', 'error', null
  const [submitMessage, setSubmitMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const modalRef = useRef(null);

  useEffect(() => {
    if (open) {
      setFields(initialState);
      setErrors({});
      setSubmitStatus(null);
      setSubmitMessage("");
      setShowForm(false);
      setTimeout(() => {
        modalRef.current?.focus();
      }, 0);
    }
  }, [open]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape" && open) onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  if (!open) return null;

  const handleChange = (e) => {
    setFields({ ...fields, [e.target.name]: e.target.value });
    // Clear field-specific error when user starts typing
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: "" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validation = validate(fields);
    setErrors(validation);
    
    if (Object.keys(validation).length > 0) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);
    setSubmitMessage("");

    try {
      await submitToGoogleScript({
        type: "Consultation_Form",
        name: fields.name,
        email: fields.email,
        phone: fields.phone,
        company: fields.practice,
        specialty: fields.specialty,
        date: fields.date,
        time: fields.time,
        message: fields.message || `Focus: ${fields.specialty}`,
      });

      setSubmitStatus('success');
      setSubmitMessage('Thank you! Your consultation request has been submitted. Our EPR compliance team will connect with you shortly.');
      
      // Keep flow in-modal and close after success.
      setTimeout(() => {
        setFields(initialState);
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Submission error:', error);
      setSubmitStatus('error');
      setSubmitMessage(error.message || 'Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFields(initialState);
    setErrors({});
    setSubmitStatus(null);
    setSubmitMessage("");
  };

  const WA_HREF = "/contact";

  const handleScheduleConsultation = () => {
    setShowForm(true);
  };

  const modal = (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4">
      <div
        ref={modalRef}
        tabIndex={-1}
        className="relative w-full max-w-md mx-auto bg-white rounded-2xl shadow-lg p-6 md:p-8 focus:outline-none max-h-[90vh] overflow-y-auto"
        aria-modal="true"
        role="dialog"
      >
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl focus:outline-none"
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>
        
        {!showForm ? (
          <>
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-eco-green-4 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </div>
            </div>
            
            {/* Title */}
            <h2 className="text-2xl font-bold text-center mb-4 text-gray-900">Get EPR Compliance Guidance</h2>
            
            {/* Description */}
            <p className="text-center mb-8 text-gray-600">Ready to achieve EPR compliance? Our experts help with registration, certificate procurement and annual returns under PWM Rules 2022.</p>
            
            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleScheduleConsultation}
                className="w-full bg-eco-green-4 hover:bg-eco-green-5 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Schedule Consultation
              </button>
              
              <a
                href={WA_HREF}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-white border-2 border-[#25D366] text-[#066e4e] hover:bg-[#25D366]/10 font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                Send a request
              </a>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Free EPR Compliance Consultation</h2>
            <p className="text-sm text-gray-600 mb-4">Get expert advice on EPR registration, certificate procurement and annual return filing.</p>
            
            {/* Success/Error Messages */}
            {submitStatus === 'success' && (
              <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                <p className="text-sm">{submitMessage}</p>
              </div>
            )}
            
            {submitStatus === 'error' && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                <p className="text-sm">{submitMessage}</p>
                <button
                  onClick={resetForm}
                  className="mt-2 text-sm underline hover:no-underline"
                >
                  Try Again
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <input
                  type="text"
                  name="name"
                  placeholder="Your Name"
                  value={fields.name}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className={`w-full rounded-lg border px-3 py-2 bg-transparent text-gray-900 border-gray-300 focus:ring-2 focus:ring-eco-green-4 outline-none disabled:opacity-50 disabled:cursor-not-allowed ${errors.name ? 'border-red-500' : ''}`}
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>
              
              <div>
                <input
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  value={fields.email}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className={`w-full rounded-lg border px-3 py-2 bg-transparent text-gray-900 border-gray-300 focus:ring-2 focus:ring-eco-green-4 outline-none disabled:opacity-50 disabled:cursor-not-allowed ${errors.email ? 'border-red-500' : ''}`}
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>
              
              <div>
                <input
                  type="text"
                  name="phone"
                  placeholder="Phone Number"
                  value={fields.phone}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className={`w-full rounded-lg border px-3 py-2 bg-transparent text-gray-900 border-gray-300 focus:ring-2 focus:ring-eco-green-4 outline-none disabled:opacity-50 disabled:cursor-not-allowed ${errors.phone ? 'border-red-500' : ''}`}
                />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>
              
              <div>
                <input
                  type="text"
                  name="practice"
                  placeholder="Company Name"
                  value={fields.practice}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className={`w-full rounded-lg border px-3 py-2 bg-transparent text-gray-900 border-gray-300 focus:ring-2 focus:ring-eco-green-4 outline-none disabled:opacity-50 disabled:cursor-not-allowed ${errors.practice ? 'border-red-500' : ''}`}
                />
                {errors.practice && <p className="text-red-500 text-xs mt-1">{errors.practice}</p>}
              </div>

              <div>
                <input
                  type="text"
                  name="specialty"
                  placeholder="Focus (e.g. shipping, ports)"
                  value={fields.specialty}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className={`w-full rounded-lg border px-3 py-2 bg-transparent text-gray-900 border-gray-300 focus:ring-2 focus:ring-eco-green-4 outline-none disabled:opacity-50 disabled:cursor-not-allowed ${errors.specialty ? 'border-red-500' : ''}`}
                />
                {errors.specialty && <p className="text-red-500 text-xs mt-1">{errors.specialty}</p>}
              </div>
              
              <div className="flex gap-2">
                <div className="flex-1">
                  <input
                    type="date"
                    name="date"
                    placeholder="dd-mm-yyyy"
                    value={fields.date}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    className={`w-full rounded-lg border px-3 py-2 bg-transparent text-gray-900 border-gray-300 focus:ring-2 focus:ring-eco-green-4 outline-none disabled:opacity-50 disabled:cursor-not-allowed ${errors.date ? 'border-red-500' : ''}`}
                  />
                  {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
                </div>
                <div className="flex-1">
                  <input
                    type="time"
                    name="time"
                    placeholder="--:--"
                    value={fields.time}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    className={`w-full rounded-lg border px-3 py-2 bg-transparent text-gray-900 border-gray-300 focus:ring-2 focus:ring-eco-green-4 outline-none disabled:opacity-50 disabled:cursor-not-allowed ${errors.time ? 'border-red-500' : ''}`}
                  />
                  {errors.time && <p className="text-red-500 text-xs mt-1">{errors.time}</p>}
                </div>
              </div>
              
              <div>
                <textarea
                  name="message"
                  placeholder="Tell us about your business goals and current challenges (Optional)"
                  value={fields.message}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="w-full rounded-lg border px-3 py-2 bg-transparent text-gray-900 border-gray-300 focus:ring-2 focus:ring-eco-green-4 outline-none min-h-[64px] disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-eco-green-4 hover:bg-eco-green-5 disabled:bg-eco-green-3 text-white font-semibold py-2 rounded-lg transition-colors mt-2 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </>
                ) : (
                  'Schedule Free Consultation'
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full border border-gray-300 text-gray-700 font-semibold py-2 rounded-lg transition-colors hover:bg-gray-100"
              >
                Cancel
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

