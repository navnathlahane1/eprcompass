export const metadata = {
  title: "Live EPR Compliance Webinar",
  description: "Join our live webinar on EPR Compliance. Learn CPCB portal registration, target-setting, PRO partnerships & EPR credit trading from industry experts. Free registration with certificate.",
  keywords: "EPR webinar, CPCB portal, EPR compliance, Live training, EPR certificate, Plastic waste management",
  openGraph: {
    title: "Live EPR Compliance Webinar",
    description: "Learn about EPR compliance under India's PWM Rules 2022 with practical guidance from EPR Compass.",
    url: "https://eprcertificate.com/webinar",
    type: "article",
    images: [{
      url: "https://eprcertificate.com/imgs/epr-webinar-og.jpg",
      width: 1200,
      height: 630,
      alt: "EPR Compliance Webinar"
    }]
  },
  robots: "index, follow",
};

export default function WebinarLayout({ children }) {
  return children;
}
