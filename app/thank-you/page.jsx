import { Suspense } from "react";
import ThankYouContent from "./ThankYouContent";

export const metadata = {
  title: "Thank You | EPR Compass",
  description: "Thank you for contacting EPR Compass. Our team will follow up soon.",
};

export default function ThankYouPage() {
  return (
    <Suspense fallback={null}>
      <ThankYouContent />
    </Suspense>
  );
}

