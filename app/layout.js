import { Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { ThemeProvider } from "../components/ThemeProvider";
import WhatsAppWidget from "../components/WhatsAppWidget";

import AppShell from "../components/AppShell";
import AuthSync from "../components/AuthSync";
import AmplitudeInit from "../components/AmplitudeInit";

const SITE_URL = "http://localhost:3000";

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "EPR Compass",
      legalName: "Neubrain Solutions Pvt. Ltd.",
      url: SITE_URL,
      logo: `${SITE_URL}/imgs/epr-compass/epr-compass-platform.png`,
      sameAs: ["http://localhost:3000/blog"],
      knowsAbout: [
        "Extended Producer Responsibility",
        "EPR certificate",
        "CPCB EPR registration",
        "Plastic Waste Management Rules",
        "E-waste EPR",
        "Battery waste EPR",
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: "EPR Compass",
      url: SITE_URL,
      description: "Extended Producer Responsibility (EPR) compliance SaaS for India: obligations, CPCB registration workflows, certificates, returns, deadlines and audit-ready records.",
      inLanguage: "en-IN",
      publisher: { "@id": `${SITE_URL}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: `${SITE_URL}/blog?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
      hasPart: [
        { "@id": `${SITE_URL}/terms-and-conditions#webpage` },
        { "@id": `${SITE_URL}/privacy-policy#webpage` },
      ],
    },
    {
      "@type": "WebPage",
      "@id": `${SITE_URL}/terms-and-conditions#webpage`,
      url: `${SITE_URL}/terms-and-conditions`,
      name: "Terms & Conditions",
      isPartOf: { "@id": `${SITE_URL}/#website` },
    },
    {
      "@type": "WebPage",
      "@id": `${SITE_URL}/privacy-policy#webpage`,
      url: `${SITE_URL}/privacy-policy`,
      name: "Privacy Policy",
      isPartOf: { "@id": `${SITE_URL}/#website` },
    },
  ],
};


const jakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#28104f" },
    { media: "(prefers-color-scheme: dark)", color: "#28104f" },
  ],
};

export const metadata = {
  title: {
    default: "EPR Compass — EPR Compliance Software for India",
    template: "%s | EPR Compass",
  },
  description: "EPR Compass is EPR compliance software for producers, importers, brand owners and compliance teams. Track obligations, CPCB workflows, certificates, returns, deadlines and audit-ready records.",
  keywords: "EPR, Extended Producer Responsibility, EPR India, EPR certificate, EPR registration, CPCB EPR portal, Plastic Waste Management, PWM Rules, e-waste EPR, battery EPR, tyre EPR, EPR credits, EPR trading, PIBO, PRO, environmental compensation, plastic packaging EPR",
  authors: [{ name: "EPR Compass" }],
  creator: "EPR Compass",
  publisher: "EPR Compass",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "EPR Compass — EPR Compliance Software for India",
    description: "Manage CPCB workflows, EPR certificates, PWM Rules, e-waste, battery filings, credit trading and audit records in one SaaS platform.",
    url: SITE_URL,
    siteName: "EPR Compass",
    locale: "en_IN",
    type: "website",
    images: [{ url: `${SITE_URL}/imgs/blog-what-is-epr.jpg`, alt: "EPR compliance in India — EPR Compass" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "EPR Compass — EPR Compliance Software",
    description: "Track obligations, filings, certificates, credits and audit-ready records in one EPR SaaS platform.",
    images: [`${SITE_URL}/imgs/blog-what-is-epr.jpg`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/imgs/epr-compass/epr-compass-platform.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/imgs/epr-compass/epr-compass-platform.png",
    apple: [
      { url: "/imgs/epr-compass/epr-compass-platform.png", sizes: "512x512", type: "image/png" },
    ],
  },
};






export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Marketing pixels remain disabled pending a separate consent policy. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <link rel="manifest" href="/imgs/site.webmanifest" />
      </head>
      <body
        className={`${jakarta.variable} ${spaceGrotesk.variable} antialiased bg-white dark:bg-gray-900`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-lg focus:bg-teal-600 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg"
        >
          Skip to main content
        </a>
        <AuthSync />
        <AmplitudeInit />
        <ThemeProvider>
          <Suspense fallback={null}>
            <AppShell>{children}</AppShell>
          </Suspense>
        </ThemeProvider>
        <WhatsAppWidget />

      </body>
    </html>
  );
}

