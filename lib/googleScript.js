/**
 * Frontend helper for posting form data directly to Google Apps Script.
 */
import { trackEvent } from "./analytics";

export function getGoogleScriptUrl() {
  return process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL?.trim() || "";
}

export async function submitToGoogleScript(payload) {
  // Primary path: persist in app database via public API route.
  try {
    const response = await fetch("/api/public/forms/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json().catch(() => ({}));
    if (response.ok && result?.success) {
      trackEvent("Lead Form Submitted", { form_type: payload?.type || "unknown" });
      return result;
    }

    const fallbackMessage = result?.error || result?.message || "Failed to submit form. Please try again.";
    throw new Error(fallbackMessage);
  } catch (primaryError) {
    // Fallback path: direct Apps Script post for backward compatibility.
    const scriptUrl = getGoogleScriptUrl();
    if (!scriptUrl) throw primaryError;
    let response;

    try {
      response = await fetch(scriptUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
      });
    } catch {
      throw new Error(
        "Unable to submit form right now. Check /api/public/forms/submit route availability or Google Script deployment and retry."
      );
    }

    const raw = await response.text();
    let result;
    try {
      result = raw ? JSON.parse(raw) : {};
    } catch {
      result = { status: response.ok ? "success" : "error", message: raw };
    }

    if (!response.ok || result.status !== "success") {
      const message = result.message || primaryError?.message || "Failed to submit form. Please try again.";
      throw new Error(message);
    }

    trackEvent("Lead Form Submitted", { form_type: payload?.type || "unknown" });
    return result;
  }
}

export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const dataUrl = reader.result || "";
      const base64 = typeof dataUrl === "string" ? dataUrl.split(",")[1] : "";
      resolve(base64 || "");
    };
    reader.onerror = (error) => reject(error);
  });
}
