// WhatsApp community invite links shown after a successful payment/application
// on each audience-targeted landing page. Keys match the page's route slug
// (e.g. "cepc-for-ca-firms") or the program's short id (e.g. "students").
export const WHATSAPP_COMMUNITIES = {
  'cepc-for-ca-firms': { name: 'CEPC for CA Firms', link: 'https://chat.whatsapp.com/liOxMaCFbcPIMziiFOIJOI' },
  'cepc-for-company-secretaries': { name: 'CEPC for Company Secretaries', link: 'https://chat.whatsapp.com/GIsFTuaWZW92SX8x3zdE7W' },
  'cepc-for-corporate-lawyers': { name: 'CEPC for Corporate Lawyers', link: 'https://chat.whatsapp.com/CI1pj12AmnV6qtt2M260mV' },
  'cepc-for-environmental-lawyers': { name: 'CEPC for Environmental Lawyers', link: 'https://chat.whatsapp.com/LG1qSZ5TzLrKBdeHwrwXk8' },
  'cepc-for-ehs-consultants': { name: 'CEPC for EHS Consultants', link: 'https://chat.whatsapp.com/CWroEhiSgLd31OzlhEHFgB' },
  'cepc-for-esg-consultants': { name: 'CEPC for ESG Consultants', link: 'https://chat.whatsapp.com/LCXXpW0FEyg5ydudvyowa5' },
  'cepc-for-fmcg-consultants': { name: 'CEPC for FMCG Consultants', link: 'https://chat.whatsapp.com/DnvQh8qECxH0mIS2AEAPrm' },
  'cepc-for-hr-and-ld': { name: 'CEPC for HR and L&D', link: 'https://chat.whatsapp.com/IUobgcVdx703y5yVQflhxR' },
  'cepc-for-import-consultants': { name: 'CEPC for Import Consultants', link: 'https://chat.whatsapp.com/GhEEWQjR8Th25TYRLYkUWh' },
  'cepc-for-iso-auditors': { name: 'CEPC for ISO Auditors', link: 'https://chat.whatsapp.com/HprgmOwfYg59IJ8OXZ1lB8' },
  'cepc-for-pharma-consultants': { name: 'CEPC for Pharma Consultants', link: 'https://chat.whatsapp.com/LLM9tDOygSlDlQzobvzY1v' },
  'cepc-for-supply-chain-consultants': { name: 'CEPC for Supply Chain Consultants', link: 'https://chat.whatsapp.com/GwhJsVXX97vDMniKJZXpt6' },
  'cepc-for-startup-incubators': { name: 'CEPC for Startup Incubators', link: 'https://chat.whatsapp.com/ExRBEJ1uQQZDCLnuxc09XL' },
  'cepc-for-trade-associations': { name: 'CEPC for Trade Associations', link: 'https://chat.whatsapp.com/D1IWxDIPJZMJGrP22FscxN' },
  'cepc-for-waste-management': { name: 'CEPC for Waste Management', link: 'https://chat.whatsapp.com/GoPHj9Buh7FD1OaPOR6kFs' },
  'women-empowerment': { name: 'Women Empowerment Program', link: 'https://chat.whatsapp.com/GjSNINAt4UQDBHsjE9puEP' },
  'students': { name: 'Student Career Launchpad', link: 'https://chat.whatsapp.com/FIS0J31UYy046OKPnZJNCV' },
  'internship': { name: 'Environmental Compliance Internship Program', link: 'https://chat.whatsapp.com/HvTxosoT89FDGn28kLHs8g' },
  'freelancer-network': { name: 'Environmental Compliance Freelancer Program', link: 'https://chat.whatsapp.com/GHU6UhZPCJ7HFyriSXghcM' },
};

// Converts a CepcLandingClient `moduleKey` prop (e.g. "cepc_ca_firms") into
// its route-slug form (e.g. "cepc-for-ca-firms") used as the map key above.
export function moduleKeyToSlug(moduleKey) {
  if (!moduleKey) return null;
  return moduleKey.replace(/^cepc_/, 'cepc-for-').replace(/_/g, '-');
}

export function getWhatsAppCommunity(key) {
  if (!key) return null;
  return WHATSAPP_COMMUNITIES[key] || null;
}
