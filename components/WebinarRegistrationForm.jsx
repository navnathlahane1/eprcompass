"use client";

import React, { useState, useRef, useEffect } from "react";
import { CheckCircle, X, AlertCircle } from "lucide-react";
import { submitToGoogleScript } from "@/lib/googleScript";
import { useTheme } from "@/components/ThemeProvider";

function loadRazorpaySDK() {
  return new Promise((resolve, reject) => {
    if (typeof window.Razorpay === "function") return resolve();
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = resolve;
    script.onerror = () => reject(new Error("Failed to load Razorpay SDK"));
    document.head.appendChild(script);
  });
}

const WebinarRegistrationForm = ({ training, open, onClose }) => {
  const { theme, mounted: themeMounted } = useTheme();
  const isDark = themeMounted && theme === "dark";
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    designation: "",
    trainingId: training?.id || "epr-webinar-live",
    trainingTitle: training?.title || "EPR Compliance Blueprint Webinar",
    trainingDuration: training?.duration || "2 Hours",
    trainingFormat: training?.format || "Online (Zoom)",
    experience: "",
    expectations: "",
    specialRequirements: "",
    agreeToTerms: false,
    agreeToMarketing: false,
  });

  const [errors, setErrors] = useState({});
  const modalRef = useRef(null);

  useEffect(() => {
    if (open) {
      setFormData(prev => ({
        ...prev,
        trainingId: training?.id || "epr-webinar-live",
        trainingTitle: training?.title || "EPR Compliance Blueprint Webinar",
        trainingDuration: training?.duration || "2 Hours",
        trainingFormat: training?.format || "Online (Zoom)",
      }));
      setStep(1);
      setErrors({});
      setSuccessMessage("");
      setErrorMessage("");
      setTimeout(() => modalRef.current?.focus(), 0);
    }
  }, [open, training]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape" && open) onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  if (!open) return null;

  const validateStep = (currentStep) => {
    const newErrors = {};

    if (currentStep === 1) {
      if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
      if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
      if (!formData.email.trim()) {
        newErrors.email = "Email is required";
      } else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(formData.email)) {
        newErrors.email = "Invalid email format";
      }
      if (!formData.phone.trim()) {
        newErrors.phone = "Phone is required";
      } else if (!/^\d{7,15}$/.test(formData.phone.replace(/\D/g, ""))) {
        newErrors.phone = "Invalid phone number";
      }
    } else if (currentStep === 2) {
      if (!formData.designation.trim()) newErrors.designation = "Designation is required";
      if (!formData.experience) newErrors.experience = "Experience level is required";
      if (!formData.expectations.trim()) {
        newErrors.expectations = "Please share what you hope to learn (min 10 characters)";
      } else if (formData.expectations.trim().length < 10) {
        newErrors.expectations = "Please write at least 10 characters";
      }
    } else if (currentStep === 3) {
      if (!formData.agreeToTerms) newErrors.agreeToTerms = "You must agree to terms";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleNextStep = () => {
    if (validateStep(step)) setStep(step + 1);
  };

  const handlePrevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const resetAndClose = () => {
    setFormData({
      firstName: "", lastName: "", email: "", phone: "", company: "", designation: "",
      trainingId: training?.id || "epr-webinar-live",
      trainingTitle: training?.title || "EPR Compliance Blueprint Webinar",
      trainingDuration: training?.duration || "2 Hours",
      trainingFormat: training?.format || "Online (Zoom)",
      experience: "", expectations: "", specialRequirements: "",
      agreeToTerms: false, agreeToMarketing: false,
    });
    setStep(1);
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(step)) return;

    setLoading(true);
    setErrorMessage("");

    try {
      // Save registration to Google Script first
      await submitToGoogleScript({
        type: "Webinar_Form",
        ...formData,
        company: formData.company.trim() || "Individual",
        trainingType: "webinar",
        registrationDate: new Date().toISOString(),
      });

      const price = training?.price || 0;

      if (price > 0) {
        // Paid webinar — open Razorpay checkout
        await loadRazorpaySDK();

        const res = await fetch('/api/payment/create-order', {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ product: "epr-webinar-paid" }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || "Payment initialization failed");

        const razorpay = new window.Razorpay({
          key: data.keyId,
          amount: data.amount,
          currency: data.currency,
          name: "EPR Compass",
          description: training.title || "EPR Premium Webinar",
          order_id: data.orderId,
          prefill: {
            name: `${formData.firstName} ${formData.lastName}`,
            email: formData.email,
            contact: formData.phone,
          },
          handler: function () {
            setSuccessMessage("Payment successful! Check your email for webinar access details.");
            setTimeout(resetAndClose, 2500);
          },
          modal: {
            ondismiss: function () {
              setLoading(false);
            },
          },
          theme: { color: "#07875f" },
        });
        razorpay.open();
        return; // Razorpay modal controls loading state
      }

      // Free webinar
      setSuccessMessage("Registration successful! Check your email for confirmation and Zoom link.");
      setTimeout(resetAndClose, 2000);
    } catch (error) {
      console.error("Registration error:", error);
      setErrorMessage(error.message || "An error occurred during registration");
    } finally {
      setLoading(false);
    }
  };

  /* ── STYLES ── */
  const PRIMARY = "#07875f";
  const PRIMARY_HOVER = "#056c4c";
  const NAVY = isDark ? "#0f172a" : "#ffffff";
  const NAVY_LIGHT = isDark ? "#1e293b" : "#f9fafb";
  const BORDER = isDark ? "#374151" : "#e5e7eb";
  const TEXT_MAIN = isDark ? "#e5e7eb" : "#1f2937";
  const TEXT_MUTED = isDark ? "#9ca3af" : "#6b7280";
  const TEXT_STRONG = isDark ? "#e5e7eb" : "#111827";
  const ERROR_COLOR = isDark ? "#fca5a5" : "#dc2626";
  const ERROR_BG = isDark ? "#451a1a" : "#fef2f2";
  const ERROR_BORDER = isDark ? "#7f1d1d" : "#fecaca";
  const SUCCESS_BG = isDark ? "#064e3b" : "#f0fdf4";
  const SUCCESS_COLOR = isDark ? "#6ee7b7" : "#16a34a";
  const SUCCESS_BORDER = isDark ? "#065f46" : "#bbf7d0";
  const INFO_BG = isDark ? "#422006" : "#fffbeb";
  const INFO_BORDER = isDark ? "#92400e" : "#fde68a";
  const INFO_COLOR = isDark ? "#fbbf24" : "#92400e";

  const inputStyle = (hasError) => ({
    width: "100%",
    padding: "10px 12px",
    border: `1px solid ${hasError ? (isDark ? "#dc2626" : "#fca5a5") : BORDER}`,
    borderRadius: 8,
    fontSize: 14,
    boxSizing: "border-box",
    background: hasError ? ERROR_BG : NAVY,
    color: TEXT_MAIN,
    outline: "none",
    transition: "border-color 0.2s",
  });

  const labelStyle = { display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4, color: TEXT_MUTED };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: isDark ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.5)", display: "flex", alignItems: "center",
      justifyContent: "center", zIndex: 1000, padding: "20px",
      backdropFilter: "blur(4px)",
    }}>
      <div ref={modalRef} tabIndex={-1} style={{
        background: NAVY_LIGHT, borderRadius: 16, maxWidth: 500, width: "100%",
        boxShadow: isDark ? "0 20px 60px rgba(0,0,0,0.5)" : "0 20px 60px rgba(0,0,0,0.15)", maxHeight: "90vh",
        overflowY: "auto", animation: "slideIn 0.3s ease-out",
        border: `1px solid ${BORDER}`,
      }}>
        {/* Header */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "20px 24px", borderBottom: `1px solid ${BORDER}`,
          background: `linear-gradient(135deg, ${PRIMARY}, ${PRIMARY_HOVER})`,
          borderRadius: "16px 16px 0 0",
        }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#fff" }}>
            Register for Webinar
          </h2>
          <button onClick={onClose} style={{
            background: "rgba(255,255,255,0.15)", border: "none", cursor: "pointer",
            color: "#fff", width: 32, height: 32, borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}><X size={16} /></button>
        </div>

        {/* Progress Indicator */}
        <div style={{ display: "flex", gap: 8, padding: "20px 24px 12px", background: NAVY }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{ flex: 1, position: "relative" }}>
              <div style={{
                height: 4, borderRadius: 2,
                background: s <= step ? PRIMARY : BORDER,
                transition: "background 0.3s",
              }} />
              <span style={{
                display: "block", textAlign: "center", fontSize: 10, marginTop: 4,
                color: s <= step ? PRIMARY : TEXT_MUTED,
                fontWeight: s === step ? 700 : 400,
              }}>
                {s === 1 ? "Personal" : s === 2 ? "Professional" : "Confirm"}
              </span>
            </div>
          ))}
        </div>

        {/* Success Message */}
        {successMessage && (
          <div style={{
            margin: "12px 24px 0", padding: "12px 16px", background: SUCCESS_BG,
            color: SUCCESS_COLOR, borderRadius: 8, display: "flex", gap: 10, alignItems: "flex-start",
            border: `1px solid ${SUCCESS_BORDER}`,
          }}>
            <CheckCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
            <span style={{ fontSize: 13 }}>{successMessage}</span>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div style={{
            margin: "12px 24px 0", padding: "12px 16px", background: ERROR_BG,
            color: ERROR_COLOR, borderRadius: 8, display: "flex", gap: 10, alignItems: "flex-start",
            border: `1px solid ${ERROR_BORDER}`,
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
            <span style={{ fontSize: 13 }}>{errorMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <div style={{ padding: "20px 24px 24px" }}>
          <form onSubmit={handleSubmit}>
            {/* Step 1: Personal Info */}
            {step === 1 && (
              <div style={{ animation: "fadeIn 0.2s" }}>
                <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 14, fontWeight: 700, color: PRIMARY }}>
                  Personal Information
                </h3>

                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>First Name *</label>
                  <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} placeholder="John" style={inputStyle(errors.firstName)} />
                  {errors.firstName && <span style={{ fontSize: 12, color: ERROR_COLOR, marginTop: 2, display: "block" }}>{errors.firstName}</span>}
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>Last Name *</label>
                  <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} placeholder="Doe" style={inputStyle(errors.lastName)} />
                  {errors.lastName && <span style={{ fontSize: 12, color: ERROR_COLOR, marginTop: 2, display: "block" }}>{errors.lastName}</span>}
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>Email Address *</label>
                  <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="john@example.com" style={inputStyle(errors.email)} />
                  {errors.email && <span style={{ fontSize: 12, color: ERROR_COLOR, marginTop: 2, display: "block" }}>{errors.email}</span>}
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>Phone Number *</label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="Enter phone number" style={inputStyle(errors.phone)} />
                  {errors.phone && <span style={{ fontSize: 12, color: ERROR_COLOR, marginTop: 2, display: "block" }}>{errors.phone}</span>}
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>Company (Optional)</label>
                  <input type="text" name="company" value={formData.company} onChange={handleInputChange} placeholder="Your Company" style={inputStyle(false)} />
                </div>
              </div>
            )}

            {/* Step 2: Professional Info */}
            {step === 2 && (
              <div style={{ animation: "fadeIn 0.2s" }}>
                <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 14, fontWeight: 700, color: PRIMARY }}>
                  Professional Background
                </h3>

                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>Designation *</label>
                  <input type="text" name="designation" value={formData.designation} onChange={handleInputChange} placeholder="e.g., Compliance Manager" style={inputStyle(errors.designation)} />
                  {errors.designation && <span style={{ fontSize: 12, color: ERROR_COLOR, marginTop: 2, display: "block" }}>{errors.designation}</span>}
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>Experience Level *</label>
                  <select name="experience" value={formData.experience} onChange={handleInputChange} style={inputStyle(errors.experience)}>
                    <option value="">Select level...</option>
                    <option value="beginner">Beginner (New to EPR)</option>
                    <option value="intermediate">Intermediate (Some experience)</option>
                    <option value="advanced">Advanced (Expert level)</option>
                  </select>
                  {errors.experience && <span style={{ fontSize: 12, color: ERROR_COLOR, marginTop: 2, display: "block" }}>{errors.experience}</span>}
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>What are your expectations from this webinar? *</label>
                  <textarea name="expectations" value={formData.expectations} onChange={handleInputChange} placeholder="Tell us what you hope to learn from this webinar..." style={{ ...inputStyle(errors.expectations), minHeight: 80, fontFamily: "inherit", resize: "vertical" }} />
                  {errors.expectations && <span style={{ fontSize: 12, color: ERROR_COLOR, marginTop: 2, display: "block" }}>{errors.expectations}</span>}
                </div>
              </div>
            )}

            {/* Step 3: Confirmation */}
            {step === 3 && (
              <div style={{ animation: "fadeIn 0.2s" }}>
                <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 14, fontWeight: 700, color: PRIMARY }}>
                  Confirm Registration
                </h3>

                <div style={{ background: NAVY, padding: 16, borderRadius: 8, marginBottom: 16, border: `1px solid ${PRIMARY}33` }}>
                  <h4 style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 600, color: PRIMARY }}>
                    📅 Webinar Details
                  </h4>
                  <p style={{ margin: "4px 0", fontSize: 13, color: TEXT_MUTED }}>
                    <strong className="text-white">Title:</strong> {formData.trainingTitle}
                  </p>
                  <p style={{ margin: "4px 0", fontSize: 13, color: TEXT_MUTED }}>
                    <strong style={{ color: TEXT_STRONG }}>Date:</strong> 15th June 2025 | <strong style={{ color: TEXT_STRONG }}>Time:</strong> 7:00 PM IST
                  </p>
                  <p style={{ margin: "4px 0", fontSize: 13, color: TEXT_MUTED }}>
                    <strong style={{ color: TEXT_STRONG }}>Format:</strong> {formData.trainingFormat} | <strong style={{ color: TEXT_STRONG }}>Duration:</strong> {formData.trainingDuration}
                  </p>
                </div>

                <div style={{ background: NAVY, padding: 16, borderRadius: 8, marginBottom: 16, borderLeft: `4px solid ${PRIMARY}` }}>
                  <h4 style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 600, color: PRIMARY }}>
                    👤 Your Registration
                  </h4>
                  <p style={{ margin: "4px 0", fontSize: 13, color: TEXT_MUTED }}>
                    <strong style={{ color: TEXT_STRONG }}>Name:</strong> {formData.firstName} {formData.lastName}
                  </p>
                  <p style={{ margin: "4px 0", fontSize: 13, color: TEXT_MUTED }}>
                    <strong style={{ color: TEXT_STRONG }}>Email:</strong> {formData.email}
                  </p>
                  <p style={{ margin: "4px 0", fontSize: 13, color: TEXT_MUTED }}>
                    <strong style={{ color: TEXT_STRONG }}>Phone:</strong> {formData.phone}
                  </p>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer", fontSize: 12, color: TEXT_MUTED }}>
                    <input type="checkbox" name="agreeToTerms" checked={formData.agreeToTerms} onChange={handleInputChange} style={{ marginTop: 3, cursor: "pointer", accentColor: PRIMARY }} />
                    <span>
                      I agree to the Terms & Conditions and Privacy Policy. <span style={{ color: "#ef4444" }}>*</span>
                    </span>
                  </label>
                  {errors.agreeToTerms && <span style={{ fontSize: 11, color: ERROR_COLOR, marginTop: 4, display: "block" }}>{errors.agreeToTerms}</span>}
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer", fontSize: 12, color: TEXT_MUTED }}>
                    <input type="checkbox" name="agreeToMarketing" checked={formData.agreeToMarketing} onChange={handleInputChange} style={{ marginTop: 3, cursor: "pointer", accentColor: PRIMARY }} />
                    <span>I want to receive updates and offers from EPR Compass</span>
                  </label>
                </div>

                <div style={{ background: INFO_BG, border: `1px solid ${INFO_BORDER}`, padding: 12, borderRadius: 8, marginBottom: 16 }}>
                  <p style={{ margin: 0, fontSize: 12, color: INFO_COLOR }}>
                    {training?.price > 0
                      ? `✓ You will be redirected to secure Razorpay checkout (₹${training.price} + GST). Access details will be emailed after payment.`
                      : "✓ A confirmation email with Zoom link will be sent to your registered email."
                    }
                  </p>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
              <button
                type="button"
                onClick={handlePrevStep}
                disabled={step === 1}
                style={{
                  flex: 1, padding: "12px", border: `1px solid ${BORDER}`, borderRadius: 8,
                  background: NAVY, color: TEXT_MUTED, fontWeight: 600,
                  cursor: step === 1 ? "not-allowed" : "pointer",
                  opacity: step === 1 ? 0.4 : 1, fontSize: 14,
                }}
              >
                Previous
              </button>

              {step < 3 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  style={{
                    flex: 1, padding: "12px", border: "none", borderRadius: 8,
                    background: `linear-gradient(135deg, ${PRIMARY}, ${PRIMARY_HOVER})`,
                    color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: 14,
                    transition: "opacity 0.2s",
                  }}
                  onMouseEnter={(e) => e.target.style.opacity = "0.9"}
                  onMouseLeave={(e) => e.target.style.opacity = "1"}
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    flex: 1, padding: "12px", border: "none", borderRadius: 8,
                    background: `linear-gradient(135deg, ${PRIMARY}, ${PRIMARY_HOVER})`,
                    color: "#fff", fontWeight: 600,
                    cursor: loading ? "not-allowed" : "pointer",
                    fontSize: 14, opacity: loading ? 0.6 : 1,
                    transition: "opacity 0.2s",
                  }}
                  onMouseEnter={(e) => !loading && (e.target.style.opacity = "0.9")}
                  onMouseLeave={(e) => !loading && (e.target.style.opacity = "1")}
                >
                  {loading ? "Processing..." : (training?.price > 0 ? `Pay ₹${training.price} & Register` : "✓ Register Now")}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateY(-30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default WebinarRegistrationForm;

