"use client";

import { useState } from "react";
import { X, CheckCircle, AlertCircle } from "lucide-react";
import { submitToGoogleScript } from "@/lib/googleScript";

export default function ConnectModal({ open, onClose, recipientName = "", recipientType = "consultant" }) {
  const [fields, setFields] = useState({ name: "", email: "", phone: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [submitMessage, setSubmitMessage] = useState("");

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fields.name.trim() || !fields.email.trim() || !fields.phone.trim()) {
      setSubmitStatus("error");
      setSubmitMessage("Please fill in all required fields.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
      setSubmitStatus("error");
      setSubmitMessage("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);
    setSubmitMessage("");

    try {
      await submitToGoogleScript({
        type: "connect_request_form",
        ...fields,
        recipientName,
        recipientType,
        submittedAt: new Date().toISOString(),
      });
      setSubmitStatus("success");
      setSubmitMessage("Your request has been sent! We'll connect you shortly.");
      setTimeout(() => {
        setFields({ name: "", email: "", phone: "", message: "" });
        setSubmitStatus(null);
        onClose();
      }, 2000);
    } catch (error) {
      setSubmitStatus("error");
      setSubmitMessage(error.message || "Failed to submit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-5 sm:p-6 relative border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
          Connect with {recipientName || "Partner"}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
          Fill in your details and we&apos;ll facilitate the introduction.
        </p>

        {submitStatus === "success" && (
          <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 rounded-lg p-3 mb-4 text-sm">
            <CheckCircle size={16} className="flex-shrink-0" />
            {submitMessage}
          </div>
        )}
        {submitStatus === "error" && (
          <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg p-3 mb-4 text-sm">
            <AlertCircle size={16} className="flex-shrink-0" />
            {submitMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Name *</label>
            <input
              name="name"
              value={fields.name}
              onChange={handleChange}
              placeholder="Your full name"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-eco-green-4 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Email *</label>
            <input
              name="email"
              type="email"
              value={fields.email}
              onChange={handleChange}
              placeholder="you@company.com"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-eco-green-4 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Phone *</label>
            <input
              name="phone"
              type="tel"
              value={fields.phone}
              onChange={handleChange}
              placeholder="Enter phone number"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-eco-green-4 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Message</label>
            <textarea
              name="message"
              value={fields.message}
              onChange={handleChange}
              rows={3}
              placeholder="Briefly describe your requirement..."
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-eco-green-4 outline-none resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-eco-green-4 hover:bg-eco-green-5 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition text-sm"
          >
            {isSubmitting ? "Sending..." : "Send Connect Request"}
          </button>
        </form>
      </div>
    </div>
  );
}
