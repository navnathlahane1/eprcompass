"use client";

import { usePathname } from "next/navigation";
import PageTransition from "./PageTransition";
import Navbar from "./Navbar";
import Footer from "./Footer";

const HIDE_CHROME_PREFIXES = [
  "/login",
  "/auth",
  "/admin",
  "/intel",
  "/portal",
  "/account",
  "/notifications",
  "/welcome",
  "/cepc",
  "/recycler-portal",
  "/recycler",
  "/legal-portal",
  "/partner",
  "/dashboard",
  "/onboarding",
  "/unauthorized",
  "/telecalling",
  "/iam",
  "/manager",
  "/taskmanager",
  "/finance",
  "/academy",
  "/tendering",
  "/comms",
  "/knowledge",
  "/ops",
  "/women-empowerment",
  "/students",
  "/internship",
  "/cepc-for-",
  "/freelancer-network",
  "/pay/",
];

// Pages that keep the Navbar but use their own inline footer
const HIDE_FOOTER_PREFIXES = [];

export default function AppShell({ children }) {
  const pathname = usePathname();

  const hideChrome = HIDE_CHROME_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix)
  );

  const hideFooter = hideChrome || HIDE_FOOTER_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix)
  );

  const showNavbar = !hideChrome;
  const showFooter = !hideFooter;
  const publicLandingRoute = ["/cepc-for-", "/students", "/internship", "/freelancer-network"]
    .some((prefix) => pathname.startsWith(prefix));
  const useInternalTheme = hideChrome && !publicLandingRoute;

  return (
    <>
      {showNavbar && <Navbar />}
      <PageTransition>
        <div id="main-content" tabIndex={-1} style={{ scrollMarginTop: pathname === "/" ? 64 : 100 }} className={`min-h-screen ${useInternalTheme ? "epr-internal" : showNavbar ? "epr-public pb-20 md:pb-0" : ""}`}>{children}</div>
      </PageTransition>
      {showFooter && <Footer home={pathname === "/"} />}
    </>
  );
}
