'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import {
  ChevronDown, ChevronUp, BookOpen, FileText, Link2,
  Clock, Eye, EyeOff, Lock, Unlock, CheckCircle, Circle,
  Globe, Users, Edit2
} from 'lucide-react';

interface Module {
  id: string;
  code: string;
  title: string;
  objective: string;
  assets: number;
  duration: string;
  status: 'Published' | 'Draft';
  partnerAccess: boolean;
  assignmentLink?: string;
}

interface Program {
  id: string;
  name: string;
  tier: 'Tier 1' | 'Tier 2' | 'Tier 3';
  duration: string;
  modules: Module[];
}

const PROGRAMS: Record<string, Program> = {
  // ── 4 public-website workshops connected from /trainings ─────────────────
  'pwm-rules': {
    id: 'pwm-rules',
    name: 'PWM Rules 2016 & 2022 — Essentials',
    tier: 'Tier 1',
    duration: '1–2 Day Workshop',
    modules: [
      { id: 'm1', code: 'S1', title: 'Introduction to Plastic Waste Management Rules', objective: 'Understand the legislative history, scope and objectives of PWM Rules 2016 and the 2022 amendments', assets: 2, duration: '60 min', status: 'Published', partnerAccess: true },
      { id: 'm2', code: 'S2', title: 'EPR Obligations for Producers & Brand Owners', objective: 'Identify who qualifies as a producer, importer or brand owner and what EPR targets apply to them', assets: 3, duration: '60 min', status: 'Published', partnerAccess: true },
      { id: 'm3', code: 'S3', title: 'CPCB Notifications & State PCB Circulars', objective: 'Navigate key CPCB and State PCB notifications that modify or extend PWM obligations', assets: 2, duration: '45 min', status: 'Published', partnerAccess: true },
      { id: 'm4', code: 'S4', title: 'Documentation & Audit Readiness', objective: 'Prepare the mandatory records, annual returns, and documents needed to pass EPR compliance audits', assets: 3, duration: '60 min', status: 'Published', partnerAccess: true },
      { id: 'm5', code: 'S5', title: 'Waste Categories: Plastic, E-Waste, Battery, Tyre, Oil', objective: 'Map your product portfolio to the correct waste category and applicable EPR rules', assets: 2, duration: '45 min', status: 'Published', partnerAccess: true },
      { id: 'm6', code: 'S6', title: 'Annual Returns & Reporting Cycle', objective: 'Complete annual EPR returns on the CPCB portal within statutory deadlines', assets: 2, duration: '45 min', status: 'Published', partnerAccess: false, assignmentLink: '/assignments/pwm-annual-return' },
    ],
  },
  'epr-portal': {
    id: 'epr-portal',
    name: 'EPR Portal Navigation & Filing',
    tier: 'Tier 1',
    duration: '1 Day Workshop',
    modules: [
      { id: 'm1', code: 'S1', title: 'CPCB EPR Portal Walkthrough', objective: 'Navigate the CPCB EPR portal dashboard, menus and document upload areas confidently', assets: 2, duration: '60 min', status: 'Published', partnerAccess: true },
      { id: 'm2', code: 'S2', title: 'Producer & Brand Owner Registration', objective: 'Complete end-to-end registration for a producer or brand owner on the CPCB EPR portal', assets: 3, duration: '75 min', status: 'Published', partnerAccess: true, assignmentLink: '/assignments/portal-registration-lab' },
      { id: 'm3', code: 'S3', title: 'Form I & Form II Submission', objective: 'File Form I (EPR plan) and Form II (annual return) accurately with supporting documents', assets: 3, duration: '75 min', status: 'Published', partnerAccess: true, assignmentLink: '/assignments/form-submission-lab' },
      { id: 'm4', code: 'S4', title: 'EPR Compass Upload & Management', objective: 'Upload, verify and manage EPR recycling certificates and PRO agreements on the portal', assets: 2, duration: '45 min', status: 'Published', partnerAccess: false },
      { id: 'm5', code: 'S5', title: 'EPR Credit Purchase & Trading', objective: 'Understand the EPR credit marketplace, purchase credits and record transactions on the portal', assets: 2, duration: '45 min', status: 'Published', partnerAccess: false },
      { id: 'm6', code: 'S6', title: 'Quarterly & Annual Filing Workflows', objective: 'Set up a filing calendar and execute quarterly check-ins and annual filings without missing deadlines', assets: 2, duration: '30 min', status: 'Published', partnerAccess: false },
    ],
  },
  'plastic-waste-accounting': {
    id: 'plastic-waste-accounting',
    name: 'Plastic Waste Accounting & Targets',
    tier: 'Tier 1',
    duration: '1–2 Day Workshop',
    modules: [
      { id: 'm1', code: 'S1', title: 'Plastic Packaging EPR Targets', objective: 'Calculate annual EPR targets for rigid, flexible, multi-layer and carry-bag plastic packaging categories', assets: 3, duration: '60 min', status: 'Published', partnerAccess: true },
      { id: 'm2', code: 'S2', title: 'Waste Accounting & Documentation', objective: 'Set up a plastic waste accounting register that satisfies CPCB audit requirements', assets: 2, duration: '60 min', status: 'Published', partnerAccess: true, assignmentLink: '/assignments/waste-accounting-workbook' },
      { id: 'm3', code: 'S3', title: 'Recycling Certificates & Proof of Recycling', objective: 'Source, verify and upload valid recycling certificates from CPCB-registered recyclers', assets: 2, duration: '45 min', status: 'Published', partnerAccess: true },
      { id: 'm4', code: 'S4', title: 'PRO Partnerships & Agreements', objective: 'Evaluate and contract with Producer Responsibility Organisations (PROs) for target fulfilment', assets: 2, duration: '45 min', status: 'Published', partnerAccess: false },
      { id: 'm5', code: 'S5', title: 'Target Calculation & Gap Analysis', objective: 'Identify the gap between your current recycling and your EPR target, and plan remedial action', assets: 3, duration: '60 min', status: 'Published', partnerAccess: false, assignmentLink: '/assignments/gap-analysis-tool' },
      { id: 'm6', code: 'S6', title: 'Best Practices & Case Studies', objective: 'Review real-world examples of compliant plastic waste EPR programmes across FMCG and electronics sectors', assets: 2, duration: '30 min', status: 'Published', partnerAccess: true },
    ],
  },
  'compliance-reporting': {
    id: 'compliance-reporting',
    name: 'Compliance Reporting & EPR Credit Trading',
    tier: 'Tier 1',
    duration: '1–2 Day Workshop',
    modules: [
      { id: 'm1', code: 'S1', title: 'Annual EPR Returns (Form I & II)', objective: 'Structure and file accurate annual EPR returns across all waste categories on the CPCB portal', assets: 3, duration: '75 min', status: 'Published', partnerAccess: true, assignmentLink: '/assignments/annual-return-lab' },
      { id: 'm2', code: 'S2', title: 'Compliance Reporting Timelines', objective: 'Build a compliance calendar covering all statutory deadlines for EPR reporting across categories', assets: 2, duration: '30 min', status: 'Published', partnerAccess: true },
      { id: 'm3', code: 'S3', title: 'EPR Credit Purchase & Trading', objective: 'Navigate the CPCB EPR credit marketplace — pricing, purchase flow, and credit reconciliation', assets: 3, duration: '60 min', status: 'Published', partnerAccess: true },
      { id: 'm4', code: 'S4', title: 'Certificate Procurement Workflows', objective: 'Source and validate EPR certificates from recyclers and PROs to close compliance gaps', assets: 2, duration: '45 min', status: 'Published', partnerAccess: false },
      { id: 'm5', code: 'S5', title: 'Multi-Category EPR Management', objective: 'Manage concurrent EPR obligations across Plastic, E-Waste, Battery, Tyre and Oil categories', assets: 3, duration: '60 min', status: 'Published', partnerAccess: false },
      { id: 'm6', code: 'S6', title: 'Audit Support & Remediation', objective: 'Prepare for CPCB/State PCB audits — common findings, remediation steps and show-cause responses', assets: 2, duration: '30 min', status: 'Published', partnerAccess: false, assignmentLink: '/assignments/audit-checklist' },
    ],
  },
  // ── Category-specific programmes ─────────────────────────────────────────

  // ── Plastic Packaging EPR ────────────────────────────────────────────────
  'plastic-epr-awareness': {
    id: 'plastic-epr-awareness',
    name: 'Plastic Packaging EPR — Awareness Workshop',
    tier: 'Tier 1',
    duration: '1-Day Workshop',
    modules: [
      { id: 'm1', code: 'S1', title: 'Introduction to Plastic Packaging EPR', objective: 'Understand EPR obligations under PWM Rules 2022 for plastic packaging producers', assets: 2, duration: '45 min', status: 'Published', partnerAccess: true },
      { id: 'm2', code: 'S2', title: 'Packaging Categories & EPR Targets', objective: 'Identify rigid, flexible, multi-layer and carry-bag categories and calculate annual targets', assets: 3, duration: '60 min', status: 'Published', partnerAccess: true },
      { id: 'm3', code: 'S3', title: 'CPCB Portal Registration for Plastic Producers', objective: 'Register as a plastic packaging producer/brand owner on the CPCB EPR portal', assets: 2, duration: '60 min', status: 'Published', partnerAccess: true },
      { id: 'm4', code: 'S4', title: 'PROs, Recyclers & Credit Procurement', objective: 'Understand the PRO ecosystem and how to procure EPR credits for target fulfilment', assets: 2, duration: '45 min', status: 'Published', partnerAccess: true },
      { id: 'm5', code: 'S5', title: 'Common Compliance Mistakes & How to Avoid Them', objective: 'Learn the top 10 plastic EPR compliance failures seen in CPCB audits', assets: 2, duration: '30 min', status: 'Published', partnerAccess: true },
    ],
  },
  'plastic-epr-certification': {
    id: 'plastic-epr-certification',
    name: 'Plastic Packaging EPR — Compliance Certification',
    tier: 'Tier 2',
    duration: '4-Week Certification',
    modules: [
      { id: 'm1', code: 'W1', title: 'Plastic Waste Management Rules 2022 — Deep Dive', objective: 'Master all provisions, schedules and compliance obligations of PWM Rules 2022', assets: 4, duration: '3 hrs', status: 'Published', partnerAccess: true },
      { id: 'm2', code: 'W2', title: 'Packaging Categorisation & Target Calculation', objective: 'Calculate EPR targets for all plastic packaging sub-categories with precision', assets: 4, duration: '3 hrs', status: 'Published', partnerAccess: true },
      { id: 'm3', code: 'W3', title: 'CPCB Portal — Advanced Filing', objective: 'Execute Form I, Form II and credit reconciliation filings without errors', assets: 5, duration: '4 hrs', status: 'Published', partnerAccess: true, assignmentLink: '/assignments/plastic-portal-filing' },
      { id: 'm4', code: 'W4', title: 'PRO Selection & Agreement Structuring', objective: 'Evaluate PRO performance, draft agreements, and manage PRO relationships', assets: 3, duration: '3 hrs', status: 'Published', partnerAccess: false },
      { id: 'm5', code: 'W5', title: 'EPR Credit Trading & Reconciliation', objective: 'Purchase, validate and reconcile EPR credits across financial years', assets: 3, duration: '3 hrs', status: 'Published', partnerAccess: false },
      { id: 'm6', code: 'W6', title: 'Extended Producer Responsibility Plan (EPRP)', objective: 'Draft a statutory EPRP document for submission to CPCB', assets: 4, duration: '4 hrs', status: 'Published', partnerAccess: false, assignmentLink: '/assignments/eprp-draft' },
      { id: 'm7', code: 'W7', title: 'State PCB Coordination & Inspection Prep', objective: 'Manage interactions with State PCBs and prepare for compliance inspections', assets: 3, duration: '3 hrs', status: 'Published', partnerAccess: false },
      { id: 'm8', code: 'W8', title: 'Capstone — Full Plastic EPR Compliance Cycle', objective: 'Execute a simulated end-to-end plastic EPR compliance cycle for a producer client', assets: 4, duration: '5 hrs', status: 'Published', partnerAccess: false, assignmentLink: '/assignments/plastic-capstone' },
    ],
  },
  'plastic-epr-consulting': {
    id: 'plastic-epr-consulting',
    name: 'Plastic Packaging EPR — Consulting Mastery',
    tier: 'Tier 3',
    duration: '3-Month Mastery',
    modules: [
      { id: 'm1', code: 'M1', title: 'Building a Plastic EPR Consulting Practice', objective: 'Set up service offerings, pricing models and client acquisition strategy', assets: 4, duration: '1 week', status: 'Published', partnerAccess: false },
      { id: 'm2', code: 'M2', title: 'Multi-Client Portfolio Management', objective: 'Manage 5–15 plastic EPR clients simultaneously with SOPs and checklists', assets: 4, duration: '1 week', status: 'Published', partnerAccess: false },
      { id: 'm3', code: 'M3', title: 'Complex Producer Audits', objective: 'Conduct gap audits for large producers with multi-location, multi-category plastic footprints', assets: 4, duration: '1 week', status: 'Published', partnerAccess: false },
      { id: 'm4', code: 'M4', title: 'PRO & Recycler Ecosystem Mastery', objective: 'Build direct relationships with top PROs and CPCB-registered recyclers', assets: 4, duration: '1 week', status: 'Published', partnerAccess: false },
      { id: 'm5', code: 'M5', title: 'Credit Shortfall & Penalty Mitigation', objective: 'Manage clients with credit shortfalls and negotiate with PCBs for penalty mitigation', assets: 4, duration: '1 week', status: 'Published', partnerAccess: false },
      { id: 'm6', code: 'M6', title: 'Multi-Year EPR Strategy for Producers', objective: 'Design 3-year EPR compliance roadmaps for large FMCG and manufacturing clients', assets: 4, duration: '1 week', status: 'Published', partnerAccess: false },
      { id: 'm7', code: 'M7', title: 'Corporate Reporting & ESG Integration', objective: 'Integrate plastic EPR data into ESG reports and BRSR disclosures', assets: 4, duration: '1 week', status: 'Published', partnerAccess: false },
      { id: 'm8', code: 'M8', title: 'Litigation & Show-Cause Response', objective: 'Draft responses to CPCB/PCB show-cause notices and manage regulatory disputes', assets: 4, duration: '1 week', status: 'Published', partnerAccess: false },
      { id: 'm9', code: 'M9', title: 'Revenue & Retainer Model Design', objective: 'Build recurring annual retainer programmes for plastic EPR clients', assets: 4, duration: '1 week', status: 'Published', partnerAccess: false },
      { id: 'm10', code: 'M10', title: 'Agency Capstone — Plastic EPR Practice Launch', objective: 'Present a fully operational plastic EPR consulting practice plan', assets: 4, duration: '1 week', status: 'Published', partnerAccess: false, assignmentLink: '/assignments/plastic-agency-capstone' },
    ],
  },

  // ── E-Waste EPR ──────────────────────────────────────────────────────────
  'ewaste-epr-awareness': {
    id: 'ewaste-epr-awareness',
    name: 'E-Waste EPR — Awareness Workshop',
    tier: 'Tier 1',
    duration: '1-Day Workshop',
    modules: [
      { id: 'm1', code: 'S1', title: 'E-Waste Management Rules 2022 — Overview', objective: 'Understand EPR obligations for electrical and electronic equipment producers', assets: 2, duration: '45 min', status: 'Published', partnerAccess: true },
      { id: 'm2', code: 'S2', title: 'EEE Categories & EPR Targets', objective: 'Map your products to Schedule I EEE categories and calculate tonnage-based EPR targets', assets: 3, duration: '60 min', status: 'Published', partnerAccess: true },
      { id: 'm3', code: 'S3', title: 'CPCB Portal Registration for E-Waste', objective: 'Register as an EEE producer or importer and link with authorised dismantlers/recyclers', assets: 2, duration: '60 min', status: 'Published', partnerAccess: true },
      { id: 'm4', code: 'S4', title: 'Authorised Dismantler & Recycler Network', objective: 'Understand how to engage CPCB-authorised dismantlers and recyclers for target fulfilment', assets: 2, duration: '45 min', status: 'Published', partnerAccess: true },
      { id: 'm5', code: 'S5', title: 'E-Waste Take-Back & Collection Schemes', objective: 'Design a product take-back scheme that satisfies e-waste EPR collection obligations', assets: 2, duration: '30 min', status: 'Published', partnerAccess: true },
    ],
  },
  'ewaste-epr-certification': {
    id: 'ewaste-epr-certification',
    name: 'E-Waste EPR — Compliance Certification',
    tier: 'Tier 2',
    duration: '4-Week Certification',
    modules: [
      { id: 'm1', code: 'W1', title: 'E-Waste Management Rules 2022 — Deep Dive', objective: 'Master all provisions, targets and obligations under E-Waste Rules 2022', assets: 4, duration: '3 hrs', status: 'Published', partnerAccess: true },
      { id: 'm2', code: 'W2', title: 'EEE Product Mapping & Target Calculation', objective: 'Calculate quarterly and annual EPR targets for all Schedule I EEE categories', assets: 4, duration: '3 hrs', status: 'Published', partnerAccess: true },
      { id: 'm3', code: 'W3', title: 'CPCB Portal — E-Waste Filing', objective: 'Complete Form-I, EPRP, credit certificates and annual returns for e-waste', assets: 5, duration: '4 hrs', status: 'Published', partnerAccess: true, assignmentLink: '/assignments/ewaste-portal-lab' },
      { id: 'm4', code: 'W4', title: 'Dismantler & Recycler Agreements', objective: 'Draft authorisation agreements and track certificate flows from recyclers', assets: 3, duration: '3 hrs', status: 'Published', partnerAccess: false },
      { id: 'm5', code: 'W5', title: 'Extended Producer Responsibility Plan for E-Waste', objective: 'Prepare a statutory EPRP for e-waste producers and get it approved', assets: 4, duration: '4 hrs', status: 'Published', partnerAccess: false, assignmentLink: '/assignments/ewaste-eprp' },
      { id: 'm6', code: 'W6', title: 'EPR Credit Certificate Management', objective: 'Validate, upload and reconcile e-waste EPR credit certificates on the CPCB portal', assets: 3, duration: '3 hrs', status: 'Published', partnerAccess: false },
      { id: 'm7', code: 'W7', title: 'State PCB Authorisations & Inspections', objective: 'Manage State PCB authorisation for collection centres and handle inspection visits', assets: 3, duration: '3 hrs', status: 'Published', partnerAccess: false },
      { id: 'm8', code: 'W8', title: 'Capstone — Full E-Waste Compliance Cycle', objective: 'Simulate a complete e-waste compliance cycle for a laptop/mobile manufacturer', assets: 4, duration: '5 hrs', status: 'Published', partnerAccess: false, assignmentLink: '/assignments/ewaste-capstone' },
    ],
  },
  'ewaste-epr-consulting': {
    id: 'ewaste-epr-consulting',
    name: 'E-Waste EPR — Consulting Mastery',
    tier: 'Tier 3',
    duration: '3-Month Mastery',
    modules: [
      { id: 'm1', code: 'M1', title: 'E-Waste Consulting Practice Setup', objective: 'Define service packages, pricing and go-to-market for e-waste EPR consulting', assets: 4, duration: '1 week', status: 'Published', partnerAccess: false },
      { id: 'm2', code: 'M2', title: 'Large EEE Producer Engagements', objective: 'Manage complex multi-SKU, multi-brand EPR programmes for electronics manufacturers', assets: 4, duration: '1 week', status: 'Published', partnerAccess: false },
      { id: 'm3', code: 'M3', title: 'Refurbisher & Dismantler Ecosystem', objective: 'Build a verified network of CPCB-authorised partners for client fulfilment', assets: 4, duration: '1 week', status: 'Published', partnerAccess: false },
      { id: 'm4', code: 'M4', title: 'Collection Scheme Design & Ops', objective: 'Design and operate a product take-back and collection system for producer clients', assets: 4, duration: '1 week', status: 'Published', partnerAccess: false },
      { id: 'm5', code: 'M5', title: 'Credit Reconciliation at Scale', objective: 'Manage e-waste credit accounts for multiple producer clients simultaneously', assets: 4, duration: '1 week', status: 'Published', partnerAccess: false },
      { id: 'm6', code: 'M6', title: 'Data & Reporting Automation', objective: 'Automate e-waste data capture, tonnage tracking and CPCB portal submissions', assets: 4, duration: '1 week', status: 'Published', partnerAccess: false },
      { id: 'm7', code: 'M7', title: 'Import & Export Compliance', objective: 'Advise on e-waste obligations for importers, second-hand goods traders and exporters', assets: 4, duration: '1 week', status: 'Published', partnerAccess: false },
      { id: 'm8', code: 'M8', title: 'Enforcement & Dispute Management', objective: 'Handle CPCB enforcement actions, penalties and appeals for e-waste non-compliance', assets: 4, duration: '1 week', status: 'Published', partnerAccess: false },
      { id: 'm9', code: 'M9', title: 'Consulting Pricing & Retainers', objective: 'Design annual retainer programmes for e-waste clients with clear SLAs', assets: 4, duration: '1 week', status: 'Published', partnerAccess: false },
      { id: 'm10', code: 'M10', title: 'Agency Capstone — E-Waste Practice Launch', objective: 'Present a fully operational e-waste EPR consulting practice', assets: 4, duration: '1 week', status: 'Published', partnerAccess: false, assignmentLink: '/assignments/ewaste-agency-capstone' },
    ],
  },

  // ── Battery Waste EPR ────────────────────────────────────────────────────
  'battery-epr-awareness': {
    id: 'battery-epr-awareness',
    name: 'Battery Waste EPR — Awareness Workshop',
    tier: 'Tier 1',
    duration: '1-Day Workshop',
    modules: [
      { id: 'm1', code: 'S1', title: 'Battery Waste Management Rules 2022 — Overview', objective: 'Understand EPR obligations for manufacturers, importers and brand owners of batteries', assets: 2, duration: '45 min', status: 'Published', partnerAccess: true },
      { id: 'm2', code: 'S2', title: 'Battery Categories & EPR Targets', objective: 'Map product lines to Lead-Acid, Lithium-Ion, NiMH and other battery categories', assets: 3, duration: '60 min', status: 'Published', partnerAccess: true },
      { id: 'm3', code: 'S3', title: 'CPCB Portal Registration for Battery EPR', objective: 'Register battery producers and link with CPCB-authorised recyclers on the portal', assets: 2, duration: '60 min', status: 'Published', partnerAccess: true },
      { id: 'm4', code: 'S4', title: 'Recycler Network & Collection Systems', objective: 'Engage authorised battery recyclers and design collection point networks', assets: 2, duration: '45 min', status: 'Published', partnerAccess: true },
      { id: 'm5', code: 'S5', title: 'Extended Producer Responsibility Plan for Batteries', objective: 'Understand EPRP requirements and timelines for battery producers', assets: 2, duration: '30 min', status: 'Published', partnerAccess: true },
    ],
  },
  'battery-epr-certification': {
    id: 'battery-epr-certification',
    name: 'Battery Waste EPR — Compliance Certification',
    tier: 'Tier 2',
    duration: '4-Week Certification',
    modules: [
      { id: 'm1', code: 'W1', title: 'Battery Waste Management Rules 2022 — Deep Dive', objective: 'Master all provisions, schedules and compliance timelines for battery EPR', assets: 4, duration: '3 hrs', status: 'Published', partnerAccess: true },
      { id: 'm2', code: 'W2', title: 'Battery Category Mapping & Target Calculation', objective: 'Calculate annual EPR collection targets by battery chemistry and weight category', assets: 4, duration: '3 hrs', status: 'Published', partnerAccess: true },
      { id: 'm3', code: 'W3', title: 'CPCB Portal — Battery EPR Filing', objective: 'Complete battery EPRP, credit certificates and annual returns on the CPCB portal', assets: 5, duration: '4 hrs', status: 'Published', partnerAccess: true, assignmentLink: '/assignments/battery-portal-lab' },
      { id: 'm4', code: 'W4', title: 'Authorised Recycler Agreements', objective: 'Structure agreements with CPCB-authorised battery recyclers and manage certificate flows', assets: 3, duration: '3 hrs', status: 'Published', partnerAccess: false },
      { id: 'm5', code: 'W5', title: 'Collection Network Design & Management', objective: 'Set up and manage a compliant battery collection network across geographies', assets: 3, duration: '3 hrs', status: 'Published', partnerAccess: false },
      { id: 'm6', code: 'W6', title: 'EPR Credit Certificate Validation', objective: 'Verify, upload and reconcile battery EPR credit certificates quarterly', assets: 4, duration: '4 hrs', status: 'Published', partnerAccess: false },
      { id: 'm7', code: 'W7', title: 'Hazardous Waste Linkages & State PCB Rules', objective: 'Navigate the overlap between battery EPR and hazardous waste authorisations', assets: 3, duration: '3 hrs', status: 'Published', partnerAccess: false },
      { id: 'm8', code: 'W8', title: 'Capstone — Full Battery EPR Compliance Cycle', objective: 'Simulate end-to-end compliance for a lithium-ion battery manufacturer', assets: 4, duration: '5 hrs', status: 'Published', partnerAccess: false, assignmentLink: '/assignments/battery-capstone' },
    ],
  },
  'battery-epr-consulting': {
    id: 'battery-epr-consulting',
    name: 'Battery Waste EPR — Consulting Mastery',
    tier: 'Tier 3',
    duration: '3-Month Mastery',
    modules: [
      { id: 'm1', code: 'M1', title: 'Battery EPR Consulting Practice Setup', objective: 'Define service offerings for battery manufacturers, importers and EV sector clients', assets: 4, duration: '1 week', status: 'Published', partnerAccess: false },
      { id: 'm2', code: 'M2', title: 'EV & Lithium-Ion Sector Deep Dive', objective: 'Advise EV OEMs, battery pack makers and importers on EPR compliance strategy', assets: 4, duration: '1 week', status: 'Published', partnerAccess: false },
      { id: 'm3', code: 'M3', title: 'Lead-Acid Battery Sector Expertise', objective: 'Manage EPR for lead-acid battery manufacturers across automotive and UPS sectors', assets: 4, duration: '1 week', status: 'Published', partnerAccess: false },
      { id: 'm4', code: 'M4', title: 'Recycler Network Development', objective: 'Build and manage a verified battery recycler network for multiple clients', assets: 4, duration: '1 week', status: 'Published', partnerAccess: false },
      { id: 'm5', code: 'M5', title: 'Collection System Operations', objective: 'Design, fund and operate battery collection points at retail and service networks', assets: 4, duration: '1 week', status: 'Published', partnerAccess: false },
      { id: 'm6', code: 'M6', title: 'Hazardous Waste Compliance Integration', objective: 'Integrate battery EPR with hazardous waste storage, transport and disposal obligations', assets: 4, duration: '1 week', status: 'Published', partnerAccess: false },
      { id: 'm7', code: 'M7', title: 'Multi-Client Credit Reconciliation', objective: 'Manage battery EPR credit accounts for a portfolio of manufacturer clients', assets: 4, duration: '1 week', status: 'Published', partnerAccess: false },
      { id: 'm8', code: 'M8', title: 'Import & Retail Channel EPR', objective: 'Advise importers and retail distributors on battery EPR responsibilities and pass-through models', assets: 4, duration: '1 week', status: 'Published', partnerAccess: false },
      { id: 'm9', code: 'M9', title: 'Consulting Retainer Design', objective: 'Build annual retainer packages for battery clients with milestone billing', assets: 4, duration: '1 week', status: 'Published', partnerAccess: false },
      { id: 'm10', code: 'M10', title: 'Agency Capstone — Battery EPR Practice Launch', objective: 'Present operational battery EPR consulting practice with client pipeline', assets: 4, duration: '1 week', status: 'Published', partnerAccess: false, assignmentLink: '/assignments/battery-agency-capstone' },
    ],
  },

  // ── Tyre Waste EPR ───────────────────────────────────────────────────────
  'tyre-epr-awareness': {
    id: 'tyre-epr-awareness',
    name: 'Tyre Waste EPR — Awareness Workshop',
    tier: 'Tier 1',
    duration: '1-Day Workshop',
    modules: [
      { id: 'm1', code: 'S1', title: 'Tyre Waste Management Rules — Overview', objective: 'Understand EPR obligations for tyre manufacturers, importers and retreaders', assets: 2, duration: '45 min', status: 'Published', partnerAccess: true },
      { id: 'm2', code: 'S2', title: 'Tyre Categories & EPR Targets', objective: 'Identify passenger, commercial and two-wheeler tyre categories and weight-based EPR targets', assets: 3, duration: '60 min', status: 'Published', partnerAccess: true },
      { id: 'm3', code: 'S3', title: 'CPCB Portal Registration for Tyre EPR', objective: 'Register as a tyre producer and link authorised retreaders/recyclers on the portal', assets: 2, duration: '60 min', status: 'Published', partnerAccess: true },
      { id: 'm4', code: 'S4', title: 'Retreader & Recycler Ecosystem', objective: 'Engage CPCB-authorised retreaders and pyrolysis-based recyclers for target fulfilment', assets: 2, duration: '45 min', status: 'Published', partnerAccess: true },
      { id: 'm5', code: 'S5', title: 'Extended Producer Responsibility Plan for Tyres', objective: 'Prepare an EPRP and understand annual submission requirements', assets: 2, duration: '30 min', status: 'Published', partnerAccess: true },
    ],
  },
  'tyre-epr-certification': {
    id: 'tyre-epr-certification',
    name: 'Tyre Waste EPR — Compliance Certification',
    tier: 'Tier 2',
    duration: '4-Week Certification',
    modules: [
      { id: 'm1', code: 'W1', title: 'Tyre Waste Rules — Regulatory Deep Dive', objective: 'Master tyre EPR provisions, targets, schedules and transition timelines', assets: 4, duration: '3 hrs', status: 'Published', partnerAccess: true },
      { id: 'm2', code: 'W2', title: 'Tyre Category Mapping & Target Calculation', objective: 'Calculate weight-based annual targets for all tyre sub-categories', assets: 4, duration: '3 hrs', status: 'Published', partnerAccess: true },
      { id: 'm3', code: 'W3', title: 'CPCB Portal — Tyre EPR Filing', objective: 'Complete tyre EPRP and annual returns and credit uploads on the CPCB portal', assets: 5, duration: '4 hrs', status: 'Published', partnerAccess: true, assignmentLink: '/assignments/tyre-portal-lab' },
      { id: 'm4', code: 'W4', title: 'Retreader Network & Pyrolysis Recycling', objective: 'Structure agreements with retreaders, crumb rubber makers and pyrolysis operators', assets: 3, duration: '3 hrs', status: 'Published', partnerAccess: false },
      { id: 'm5', code: 'W5', title: 'Collection & Logistics for Waste Tyres', objective: 'Design a waste tyre collection and logistics network for producers', assets: 3, duration: '3 hrs', status: 'Published', partnerAccess: false },
      { id: 'm6', code: 'W6', title: 'EPR Credit Certificate Management', objective: 'Validate retreading and recycling certificates and reconcile on the portal', assets: 4, duration: '4 hrs', status: 'Published', partnerAccess: false },
      { id: 'm7', code: 'W7', title: 'State PCB Tyre Waste Authorisations', objective: 'Navigate state-level tyre waste authorisation requirements alongside national EPR', assets: 3, duration: '3 hrs', status: 'Published', partnerAccess: false },
      { id: 'm8', code: 'W8', title: 'Capstone — Full Tyre EPR Compliance Cycle', objective: 'Simulate end-to-end compliance for a passenger car tyre manufacturer', assets: 4, duration: '5 hrs', status: 'Published', partnerAccess: false, assignmentLink: '/assignments/tyre-capstone' },
    ],
  },
  'tyre-epr-consulting': {
    id: 'tyre-epr-consulting',
    name: 'Tyre Waste EPR — Consulting Mastery',
    tier: 'Tier 3',
    duration: '3-Month Mastery',
    modules: [
      { id: 'm1', code: 'M1', title: 'Tyre EPR Consulting Practice Setup', objective: 'Define services for tyre OEMs, importers, aftermarket brands and retreaders', assets: 4, duration: '1 week', status: 'Published', partnerAccess: false },
      { id: 'm2', code: 'M2', title: 'OEM & Importer Engagements', objective: 'Manage complex tyre EPR programmes for passenger car and commercial vehicle OEMs', assets: 4, duration: '1 week', status: 'Published', partnerAccess: false },
      { id: 'm3', code: 'M3', title: 'Retreader & Recycler Network Management', objective: 'Develop and manage a verified retreader/recycler network for client fulfilment', assets: 4, duration: '1 week', status: 'Published', partnerAccess: false },
      { id: 'm4', code: 'M4', title: 'Pyrolysis & Advanced Recycling', objective: 'Advise clients on emerging pyrolysis-based and advanced tyre recycling models', assets: 4, duration: '1 week', status: 'Published', partnerAccess: false },
      { id: 'm5', code: 'M5', title: 'Collection System Design', objective: 'Design national tyre collection networks using dealers, service centres and drop-off points', assets: 4, duration: '1 week', status: 'Published', partnerAccess: false },
      { id: 'm6', code: 'M6', title: 'Multi-Year Target Strategy', objective: 'Develop 3-year tyre EPR compliance roadmaps aligned with rising regulatory targets', assets: 4, duration: '1 week', status: 'Published', partnerAccess: false },
      { id: 'm7', code: 'M7', title: 'Credit Shortfall Management', objective: 'Manage situations where client targets cannot be met and negotiate PCB remediation plans', assets: 4, duration: '1 week', status: 'Published', partnerAccess: false },
      { id: 'm8', code: 'M8', title: 'Aftermarket & Retreader Channel EPR', objective: 'Advise aftermarket tyre brands and retreaders on their EPR obligations', assets: 4, duration: '1 week', status: 'Published', partnerAccess: false },
      { id: 'm9', code: 'M9', title: 'Consulting Revenue & Retainer Design', objective: 'Build annual service packages with tyre industry clients', assets: 4, duration: '1 week', status: 'Published', partnerAccess: false },
      { id: 'm10', code: 'M10', title: 'Agency Capstone — Tyre EPR Practice Launch', objective: 'Present operational tyre EPR consulting practice with client and recycler pipeline', assets: 4, duration: '1 week', status: 'Published', partnerAccess: false, assignmentLink: '/assignments/tyre-agency-capstone' },
    ],
  },

  // ── Category 5: ELV EPR ───────────────────────────────────────────────────
  'elv-epr-awareness': {
    id: 'elv-epr-awareness',
    name: 'End-of-Life Vehicles (ELV) EPR — Awareness Workshop',
    tier: 'Tier 1',
    duration: '1-Day Workshop',
    modules: [
      { id: 'm1', code: 'S1', title: 'ELV EPR Regulatory Framework', objective: 'Understand ELV obligations for vehicle manufacturers and importers under Draft ELV Rules', assets: 2, duration: '45 min', status: 'Published', partnerAccess: true },
      { id: 'm2', code: 'S2', title: 'Vehicle Categories & EPR Targets', objective: 'Map passenger cars, two-wheelers, commercial vehicles to EPR weight-based targets', assets: 2, duration: '60 min', status: 'Published', partnerAccess: true },
      { id: 'm3', code: 'S3', title: 'Authorised Vehicle Scrapping Facilities (AVSFs)', objective: 'Understand the AVSF ecosystem, registration, and how to link with them for EPR', assets: 2, duration: '60 min', status: 'Published', partnerAccess: true },
      { id: 'm4', code: 'S4', title: 'Material Recovery & Recycling in ELV', objective: 'Identify recoverable materials (steel, aluminium, copper, plastic) in ELVs for EPR credit', assets: 2, duration: '45 min', status: 'Published', partnerAccess: true },
      { id: 'm5', code: 'S5', title: 'ELV Take-Back Scheme Design', objective: 'Design a compliant vehicle take-back and end-of-life scheme for manufacturers', assets: 2, duration: '30 min', status: 'Published', partnerAccess: true },
    ],
  },
  'elv-epr-certification': {
    id: 'elv-epr-certification',
    name: 'End-of-Life Vehicles (ELV) EPR — Compliance Certification',
    tier: 'Tier 2',
    duration: '4-Week Certification',
    modules: [
      { id: 'm1', code: 'W1', title: 'ELV Rules — Regulatory Deep Dive', objective: 'Master all provisions of India\'s Draft ELV Recycling Rules and MoRTH guidelines', assets: 3, duration: '3 hrs', status: 'Published', partnerAccess: true },
      { id: 'm2', code: 'W2', title: 'Vehicle Fleet Mapping & Target Calculation', objective: 'Calculate EPR recycling targets by vehicle type, weight and production volume', assets: 3, duration: '3 hrs', status: 'Published', partnerAccess: true },
      { id: 'm3', code: 'W3', title: 'AVSF Registration & Linkage', objective: 'Guide clients through AVSF linkage on the VAHAN/MoRTH platform and EPR portal', assets: 3, duration: '4 hrs', status: 'Published', partnerAccess: true, assignmentLink: '/assignments/elv-avsf-lab' },
      { id: 'm4', code: 'W4', title: 'Certificate of Deposit (COD) Management', objective: 'Manage Certificates of Deposit from AVSFs to prove EPR target fulfilment', assets: 3, duration: '3 hrs', status: 'Published', partnerAccess: false },
      { id: 'm5', code: 'W5', title: 'Scrap Value & Revenue Sharing Models', objective: 'Structure scrap revenue sharing between OEMs, dealers and AVSFs', assets: 3, duration: '3 hrs', status: 'Draft', partnerAccess: false },
      { id: 'm6', code: 'W6', title: 'Extended Producer Responsibility Plan for ELV', objective: 'Draft and submit an ELV EPRP with material recovery targets by year', assets: 3, duration: '4 hrs', status: 'Draft', partnerAccess: false, assignmentLink: '/assignments/elv-eprp' },
      { id: 'm7', code: 'W7', title: 'State Motor Vehicle Dept & PCB Interactions', objective: 'Navigate the overlap between motor vehicle scrapping rules and state environmental approvals', assets: 3, duration: '3 hrs', status: 'Draft', partnerAccess: false },
      { id: 'm8', code: 'W8', title: 'Capstone — Full ELV EPR Compliance Cycle', objective: 'Simulate end-to-end ELV EPR compliance for a passenger car OEM', assets: 3, duration: '5 hrs', status: 'Draft', partnerAccess: false, assignmentLink: '/assignments/elv-capstone' },
    ],
  },
  'elv-epr-consulting': {
    id: 'elv-epr-consulting',
    name: 'End-of-Life Vehicles (ELV) EPR — Consulting Mastery',
    tier: 'Tier 3',
    duration: '3-Month Mastery',
    modules: [
      { id: 'm1', code: 'M1', title: 'ELV Consulting Practice Setup', objective: 'Define services for automotive OEMs, importers, dealers and AVSF operators', assets: 3, duration: '1 week', status: 'Published', partnerAccess: false },
      { id: 'm2', code: 'M2', title: 'OEM ELV Strategy Advisory', objective: 'Design comprehensive ELV EPR strategies for passenger car and two-wheeler manufacturers', assets: 3, duration: '1 week', status: 'Published', partnerAccess: false },
      { id: 'm3', code: 'M3', title: 'AVSF Network Development', objective: 'Help clients build or access a national AVSF network for scale ELV processing', assets: 3, duration: '1 week', status: 'Published', partnerAccess: false },
      { id: 'm4', code: 'M4', title: 'Material Recovery Optimisation', objective: 'Advise AVSFs and OEMs on maximising material recovery rates for EPR credit', assets: 3, duration: '1 week', status: 'Draft', partnerAccess: false },
      { id: 'm5', code: 'M5', title: 'ELV Data & Tracking Systems', objective: 'Implement vehicle tracking systems from sale to end-of-life for EPR reporting', assets: 3, duration: '1 week', status: 'Draft', partnerAccess: false },
      { id: 'm6', code: 'M6', title: 'Import & Second-Hand Vehicle EPR', objective: 'Advise importers of used vehicles on ELV EPR obligations and take-back models', assets: 3, duration: '1 week', status: 'Draft', partnerAccess: false },
      { id: 'm7', code: 'M7', title: 'Fleet Operator & Leasing Company EPR', objective: 'Design ELV take-back programmes for large fleet operators and vehicle leasing firms', assets: 3, duration: '1 week', status: 'Draft', partnerAccess: false },
      { id: 'm8', code: 'M8', title: 'Regulatory Engagement & Advocacy', objective: 'Engage with MoRTH, CPCB and State PCBs on ELV rule interpretations', assets: 3, duration: '1 week', status: 'Draft', partnerAccess: false },
      { id: 'm9', code: 'M9', title: 'Consulting Retainer Design for Automotive', objective: 'Build retainer programmes for OEM and tier-1 automotive supplier clients', assets: 3, duration: '1 week', status: 'Draft', partnerAccess: false },
      { id: 'm10', code: 'M10', title: 'Agency Capstone — ELV EPR Practice Launch', objective: 'Present operational ELV EPR consulting practice targeting automotive OEMs', assets: 3, duration: '1 week', status: 'Draft', partnerAccess: false, assignmentLink: '/assignments/elv-agency-capstone' },
    ],
  },
  // ── Category 6: Used Oil EPR ──────────────────────────────────────────────
  'usedoil-epr-awareness': {
    id: 'usedoil-epr-awareness',
    name: 'Used Oil EPR — Awareness Workshop',
    tier: 'Tier 1',
    duration: '1-Day Workshop',
    modules: [
      { id: 'm1', code: 'S1', title: 'Used Oil Management Rules — Overview', objective: 'Understand EPR and collection obligations for lubricant oil producers and importers', assets: 2, duration: '45 min', status: 'Published', partnerAccess: true },
      { id: 'm2', code: 'S2', title: 'Oil Categories & EPR Targets', objective: 'Identify automotive, industrial and transformer oil categories and applicable EPR targets', assets: 2, duration: '60 min', status: 'Published', partnerAccess: true },
      { id: 'm3', code: 'S3', title: 'CPCB Portal Registration for Used Oil EPR', objective: 'Register lubricant producers and link with authorised used oil recyclers/re-refiners', assets: 2, duration: '60 min', status: 'Published', partnerAccess: true },
      { id: 'm4', code: 'S4', title: 'Re-Refining & Recycler Ecosystem', objective: 'Understand the CPCB-authorised re-refining sector and how to procure EPR credits', assets: 2, duration: '45 min', status: 'Published', partnerAccess: true },
      { id: 'm5', code: 'S5', title: 'Collection Network Design for Used Oil', objective: 'Design compliant used oil collection points at service stations, workshops and dealers', assets: 2, duration: '30 min', status: 'Published', partnerAccess: true },
    ],
  },
  'usedoil-epr-certification': {
    id: 'usedoil-epr-certification',
    name: 'Used Oil EPR — Compliance Certification',
    tier: 'Tier 2',
    duration: '4-Week Certification',
    modules: [
      { id: 'm1', code: 'W1', title: 'Used Oil Management Rules — Regulatory Deep Dive', objective: 'Master all provisions of India\'s Used Oil Management Rules and EPR obligations', assets: 3, duration: '3 hrs', status: 'Published', partnerAccess: true },
      { id: 'm2', code: 'W2', title: 'Oil Volume Mapping & Target Calculation', objective: 'Calculate annual EPR targets based on lubricant production and import volumes', assets: 3, duration: '3 hrs', status: 'Published', partnerAccess: true },
      { id: 'm3', code: 'W3', title: 'CPCB Portal — Used Oil EPR Filing', objective: 'Complete EPRP filing, credit certificates and annual returns for used oil producers', assets: 3, duration: '4 hrs', status: 'Published', partnerAccess: true, assignmentLink: '/assignments/usedoil-portal-lab' },
      { id: 'm4', code: 'W4', title: 'Re-Refiner & Recycler Agreements', objective: 'Structure agreements with CPCB-authorised re-refiners and validate certificate flows', assets: 3, duration: '3 hrs', status: 'Published', partnerAccess: false },
      { id: 'm5', code: 'W5', title: 'Hazardous Waste Compliance for Used Oil', objective: 'Navigate the overlap between used oil EPR and hazardous waste storage/transport rules', assets: 3, duration: '3 hrs', status: 'Published', partnerAccess: false },
      { id: 'm6', code: 'W6', title: 'Collection Point Network Management', objective: 'Set up and audit used oil collection points at channel partners', assets: 3, duration: '4 hrs', status: 'Draft', partnerAccess: false },
      { id: 'm7', code: 'W7', title: 'Extended Producer Responsibility Plan for Used Oil', objective: 'Draft and submit a used oil EPRP with collection and recycling targets', assets: 3, duration: '3 hrs', status: 'Draft', partnerAccess: false, assignmentLink: '/assignments/usedoil-eprp' },
      { id: 'm8', code: 'W8', title: 'Capstone — Full Used Oil Compliance Cycle', objective: 'Simulate end-to-end compliance for a major automotive lubricant brand', assets: 3, duration: '5 hrs', status: 'Draft', partnerAccess: false, assignmentLink: '/assignments/usedoil-capstone' },
    ],
  },
  'usedoil-epr-consulting': {
    id: 'usedoil-epr-consulting',
    name: 'Used Oil EPR — Consulting Mastery',
    tier: 'Tier 3',
    duration: '3-Month Mastery',
    modules: [
      { id: 'm1', code: 'M1', title: 'Used Oil Consulting Practice Setup', objective: 'Define services for lubricant OEMs, importers, and industrial oil users', assets: 3, duration: '1 week', status: 'Published', partnerAccess: false },
      { id: 'm2', code: 'M2', title: 'Automotive Lubricants Sector', objective: 'Advise major automotive lubricant brands on used oil EPR strategy and operations', assets: 3, duration: '1 week', status: 'Published', partnerAccess: false },
      { id: 'm3', code: 'M3', title: 'Industrial & Transformer Oil Sector', objective: 'Manage EPR for industrial lubricant and transformer oil producers separately', assets: 3, duration: '1 week', status: 'Published', partnerAccess: false },
      { id: 'm4', code: 'M4', title: 'Re-Refiner Network Management', objective: 'Build and audit a network of CPCB-authorised re-refiners for client portfolios', assets: 3, duration: '1 week', status: 'Draft', partnerAccess: false },
      { id: 'm5', code: 'M5', title: 'Collection System Design & Ops', objective: 'Design national used oil collection systems through dealer and service networks', assets: 3, duration: '1 week', status: 'Draft', partnerAccess: false },
      { id: 'm6', code: 'M6', title: 'Hazardous Waste Compliance Integration', objective: 'Integrate used oil EPR with hazardous waste transport and disposal compliance', assets: 3, duration: '1 week', status: 'Draft', partnerAccess: false },
      { id: 'm7', code: 'M7', title: 'Multi-Client Credit Portfolio', objective: 'Manage EPR credit accounts for a portfolio of lubricant brand clients', assets: 3, duration: '1 week', status: 'Draft', partnerAccess: false },
      { id: 'm8', code: 'M8', title: 'Channel Partner EPR Pass-Through', objective: 'Design EPR pass-through models for distributors, dealers and service stations', assets: 3, duration: '1 week', status: 'Draft', partnerAccess: false },
      { id: 'm9', code: 'M9', title: 'Consulting Revenue Model Design', objective: 'Build retainer and project-based pricing for used oil clients', assets: 3, duration: '1 week', status: 'Draft', partnerAccess: false },
      { id: 'm10', code: 'M10', title: 'Agency Capstone — Used Oil Practice Launch', objective: 'Present operational used oil EPR consulting practice', assets: 3, duration: '1 week', status: 'Draft', partnerAccess: false, assignmentLink: '/assignments/usedoil-agency-capstone' },
    ],
  },
  // ── Category 7: C&D Waste EPR ─────────────────────────────────────────────
  'cdn-epr-awareness': {
    id: 'cdn-epr-awareness',
    name: 'Construction & Demolition Waste EPR — Awareness Workshop',
    tier: 'Tier 1',
    duration: '1-Day Workshop',
    modules: [
      { id: 'm1', code: 'S1', title: 'C&D Waste Management Rules — Overview', objective: 'Understand EPR obligations for construction material producers under C&D Waste Rules', assets: 2, duration: '45 min', status: 'Published', partnerAccess: true },
      { id: 'm2', code: 'S2', title: 'C&D Waste Categories & EPR Targets', objective: 'Identify concrete, brick, metal, wood, glass and gypsum categories and EPR targets', assets: 2, duration: '60 min', status: 'Published', partnerAccess: true },
      { id: 'm3', code: 'S3', title: 'CPCB Portal Registration for C&D EPR', objective: 'Register construction material producers on the EPR portal and link with C&D waste processors', assets: 2, duration: '60 min', status: 'Published', partnerAccess: true },
      { id: 'm4', code: 'S4', title: 'C&D Waste Processor & Recycler Ecosystem', objective: 'Engage authorised C&D waste processing facilities for EPR target fulfilment', assets: 2, duration: '45 min', status: 'Published', partnerAccess: true },
      { id: 'm5', code: 'S5', title: 'Sustainable Construction & EPR Strategy', objective: 'Align EPR obligations with green building certifications and sustainability targets', assets: 2, duration: '30 min', status: 'Published', partnerAccess: true },
    ],
  },
  'cdn-epr-certification': {
    id: 'cdn-epr-certification',
    name: 'Construction & Demolition Waste EPR — Compliance Certification',
    tier: 'Tier 2',
    duration: '4-Week Certification',
    modules: [
      { id: 'm1', code: 'W1', title: 'C&D Waste Rules — Regulatory Deep Dive', objective: 'Master all provisions of C&D Waste Management Rules and EPR obligations', assets: 3, duration: '3 hrs', status: 'Published', partnerAccess: true },
      { id: 'm2', code: 'W2', title: 'Material Volume Mapping & Target Calculation', objective: 'Calculate EPR targets based on construction material production and import volumes', assets: 3, duration: '3 hrs', status: 'Published', partnerAccess: true },
      { id: 'm3', code: 'W3', title: 'CPCB Portal — C&D EPR Filing', objective: 'Complete C&D EPRP, credit certificates and annual returns on the CPCB portal', assets: 3, duration: '4 hrs', status: 'Published', partnerAccess: true, assignmentLink: '/assignments/cdn-portal-lab' },
      { id: 'm4', code: 'W4', title: 'C&D Processor Agreements', objective: 'Structure agreements with authorised C&D waste processors and recyclers', assets: 3, duration: '3 hrs', status: 'Published', partnerAccess: false },
      { id: 'm5', code: 'W5', title: 'Deconstruction & Material Recovery', objective: 'Advise on deconstruction practices that maximise material recovery for EPR credit', assets: 3, duration: '3 hrs', status: 'Draft', partnerAccess: false },
      { id: 'm6', code: 'W6', title: 'Extended Producer Responsibility Plan for C&D', objective: 'Draft a C&D EPRP covering all material categories for submission', assets: 3, duration: '4 hrs', status: 'Draft', partnerAccess: false, assignmentLink: '/assignments/cdn-eprp' },
      { id: 'm7', code: 'W7', title: 'Urban Local Body & State PCB Coordination', objective: 'Manage interactions with ULBs and State PCBs on C&D waste compliance', assets: 3, duration: '3 hrs', status: 'Draft', partnerAccess: false },
      { id: 'm8', code: 'W8', title: 'Capstone — Full C&D EPR Compliance Cycle', objective: 'Simulate end-to-end compliance for a cement or glass producer', assets: 3, duration: '5 hrs', status: 'Draft', partnerAccess: false, assignmentLink: '/assignments/cdn-capstone' },
    ],
  },
  'cdn-epr-consulting': {
    id: 'cdn-epr-consulting',
    name: 'Construction & Demolition Waste EPR — Consulting Mastery',
    tier: 'Tier 3',
    duration: '3-Month Mastery',
    modules: [
      { id: 'm1', code: 'M1', title: 'C&D EPR Consulting Practice Setup', objective: 'Define services for cement, steel, glass, brick and insulation material producers', assets: 3, duration: '1 week', status: 'Published', partnerAccess: false },
      { id: 'm2', code: 'M2', title: 'Cement & Concrete Sector', objective: 'Manage complex C&D EPR obligations for cement producers and ready-mix concrete companies', assets: 3, duration: '1 week', status: 'Published', partnerAccess: false },
      { id: 'm3', code: 'M3', title: 'Steel & Metal in Construction', objective: 'Advise structural steel and rebar producers on C&D waste EPR obligations', assets: 3, duration: '1 week', status: 'Published', partnerAccess: false },
      { id: 'm4', code: 'M4', title: 'Glass, Gypsum & Insulation Sector', objective: 'Handle EPR for glass, plasterboard and insulation material producers', assets: 3, duration: '1 week', status: 'Draft', partnerAccess: false },
      { id: 'm5', code: 'M5', title: 'C&D Processor Network Development', objective: 'Build a national network of authorised C&D processing facilities for clients', assets: 3, duration: '1 week', status: 'Draft', partnerAccess: false },
      { id: 'm6', code: 'M6', title: 'Green Building & EPR Integration', objective: 'Align EPR compliance with IGBC/GRIHA green building certification requirements', assets: 3, duration: '1 week', status: 'Draft', partnerAccess: false },
      { id: 'm7', code: 'M7', title: 'Real Estate Developer Advisory', objective: 'Advise real estate developers on C&D waste obligations during demolition and construction', assets: 3, duration: '1 week', status: 'Draft', partnerAccess: false },
      { id: 'm8', code: 'M8', title: 'Urban Infrastructure Project EPR', objective: 'Manage EPR for large infrastructure projects — roads, metro, ports', assets: 3, duration: '1 week', status: 'Draft', partnerAccess: false },
      { id: 'm9', code: 'M9', title: 'Consulting Retainer Design', objective: 'Build project-based and annual retainer offerings for C&D sector clients', assets: 3, duration: '1 week', status: 'Draft', partnerAccess: false },
      { id: 'm10', code: 'M10', title: 'Agency Capstone — C&D Practice Launch', objective: 'Present operational C&D waste EPR consulting practice', assets: 3, duration: '1 week', status: 'Draft', partnerAccess: false, assignmentLink: '/assignments/cdn-agency-capstone' },
    ],
  },
  // ── Category 8: Non-Ferrous Materials EPR ────────────────────────────────
  'nonferrous-epr-awareness': {
    id: 'nonferrous-epr-awareness',
    name: 'Non-Ferrous Materials EPR — Awareness Workshop',
    tier: 'Tier 1',
    duration: '1-Day Workshop',
    modules: [
      { id: 'm1', code: 'S1', title: 'Non-Ferrous Materials EPR — Regulatory Framework', objective: 'Understand emerging EPR obligations for aluminium, copper, zinc and precious metal producers', assets: 2, duration: '45 min', status: 'Published', partnerAccess: true },
      { id: 'm2', code: 'S2', title: 'Non-Ferrous Material Categories & Targets', objective: 'Identify aluminium packaging, copper wiring, zinc coatings and their EPR target structures', assets: 2, duration: '60 min', status: 'Published', partnerAccess: true },
      { id: 'm3', code: 'S3', title: 'CPCB Portal Registration for Non-Ferrous EPR', objective: 'Register non-ferrous material producers and link with authorised secondary metal smelters', assets: 2, duration: '60 min', status: 'Published', partnerAccess: true },
      { id: 'm4', code: 'S4', title: 'Secondary Metal Smelter & Recycler Network', objective: 'Understand the CPCB-authorised secondary smelter ecosystem for EPR credit procurement', assets: 2, duration: '45 min', status: 'Published', partnerAccess: true },
      { id: 'm5', code: 'S5', title: 'Circular Economy Strategy for Non-Ferrous', objective: 'Align non-ferrous EPR with circular economy and critical mineral recovery goals', assets: 2, duration: '30 min', status: 'Published', partnerAccess: true },
    ],
  },
  'nonferrous-epr-certification': {
    id: 'nonferrous-epr-certification',
    name: 'Non-Ferrous Materials EPR — Compliance Certification',
    tier: 'Tier 2',
    duration: '4-Week Certification',
    modules: [
      { id: 'm1', code: 'W1', title: 'Non-Ferrous EPR Rules — Regulatory Deep Dive', objective: 'Master EPR regulations for aluminium, copper, zinc and other non-ferrous metals', assets: 3, duration: '3 hrs', status: 'Published', partnerAccess: true },
      { id: 'm2', code: 'W2', title: 'Material Volume Mapping & Target Calculation', objective: 'Calculate EPR targets for non-ferrous materials by production and import volume', assets: 3, duration: '3 hrs', status: 'Published', partnerAccess: true },
      { id: 'm3', code: 'W3', title: 'CPCB Portal — Non-Ferrous EPR Filing', objective: 'Complete EPRP, credit certificates and annual returns for non-ferrous producers', assets: 3, duration: '4 hrs', status: 'Published', partnerAccess: true, assignmentLink: '/assignments/nonferrous-portal-lab' },
      { id: 'm4', code: 'W4', title: 'Secondary Smelter Agreements', objective: 'Structure agreements with CPCB-authorised secondary smelters and recyclers', assets: 3, duration: '3 hrs', status: 'Published', partnerAccess: false },
      { id: 'm5', code: 'W5', title: 'Critical Mineral Recovery & EPR Credits', objective: 'Understand how critical mineral recovery from secondary sources generates EPR credits', assets: 3, duration: '3 hrs', status: 'Draft', partnerAccess: false },
      { id: 'm6', code: 'W6', title: 'Extended Producer Responsibility Plan for Non-Ferrous', objective: 'Draft an EPRP covering all non-ferrous material categories', assets: 3, duration: '4 hrs', status: 'Draft', partnerAccess: false, assignmentLink: '/assignments/nonferrous-eprp' },
      { id: 'm7', code: 'W7', title: 'Export & Import Trade Compliance', objective: 'Navigate EPR obligations for exporters and importers of non-ferrous scrap and metal', assets: 3, duration: '3 hrs', status: 'Draft', partnerAccess: false },
      { id: 'm8', code: 'W8', title: 'Capstone — Full Non-Ferrous EPR Compliance Cycle', objective: 'Simulate end-to-end compliance for an aluminium packaging producer', assets: 3, duration: '5 hrs', status: 'Draft', partnerAccess: false, assignmentLink: '/assignments/nonferrous-capstone' },
    ],
  },
  'nonferrous-epr-consulting': {
    id: 'nonferrous-epr-consulting',
    name: 'Non-Ferrous Materials EPR — Consulting Mastery',
    tier: 'Tier 3',
    duration: '3-Month Mastery',
    modules: [
      { id: 'm1', code: 'M1', title: 'Non-Ferrous Consulting Practice Setup', objective: 'Define services for aluminium, copper, zinc, lead and precious metal producers', assets: 3, duration: '1 week', status: 'Published', partnerAccess: false },
      { id: 'm2', code: 'M2', title: 'Aluminium Sector EPR', objective: 'Manage EPR for aluminium packaging, extrusion and rolling mill producers', assets: 3, duration: '1 week', status: 'Published', partnerAccess: false },
      { id: 'm3', code: 'M3', title: 'Copper & Electrical Sector EPR', objective: 'Advise copper wire, cable and transformer producers on EPR obligations', assets: 3, duration: '1 week', status: 'Published', partnerAccess: false },
      { id: 'm4', code: 'M4', title: 'Zinc, Lead & Battery Metal Sector', objective: 'Handle EPR for zinc coating, lead ingot and lead-acid battery material producers', assets: 3, duration: '1 week', status: 'Draft', partnerAccess: false },
      { id: 'm5', code: 'M5', title: 'Secondary Smelter Network Management', objective: 'Build and audit a verified secondary smelter network for client EPR fulfilment', assets: 3, duration: '1 week', status: 'Draft', partnerAccess: false },
      { id: 'm6', code: 'M6', title: 'Critical Mineral Strategy', objective: 'Advise clients on integrating EPR compliance with critical mineral recovery and value creation', assets: 3, duration: '1 week', status: 'Draft', partnerAccess: false },
      { id: 'm7', code: 'M7', title: 'Export-Import Trade Advisory', objective: 'Advise scrap traders and exporters on non-ferrous EPR obligations and documentation', assets: 3, duration: '1 week', status: 'Draft', partnerAccess: false },
      { id: 'm8', code: 'M8', title: 'Multi-Alloy & Composite Material EPR', objective: 'Handle complex EPR for products combining ferrous, non-ferrous and composite materials', assets: 3, duration: '1 week', status: 'Draft', partnerAccess: false },
      { id: 'm9', code: 'M9', title: 'Consulting Revenue Model Design', objective: 'Build service packages for non-ferrous sector clients with annual retainers', assets: 3, duration: '1 week', status: 'Draft', partnerAccess: false },
      { id: 'm10', code: 'M10', title: 'Agency Capstone — Non-Ferrous Practice Launch', objective: 'Present operational non-ferrous EPR consulting practice', assets: 3, duration: '1 week', status: 'Draft', partnerAccess: false, assignmentLink: '/assignments/nonferrous-agency-capstone' },
    ],
  },

  // ── Certification tiers ───────────────────────────────────────────────────
  'tier-1': {
    id: 'tier-1',
    name: 'EPR Essentials',
    tier: 'Tier 1',
    duration: '2-Day Intensive',
    modules: [
      { id: 'm1', code: 'M1', title: 'EPR Framework Overview', objective: 'Understand the fundamentals of Extended Producer Responsibility and its regulatory basis in India', assets: 3, duration: '90 min', status: 'Published', partnerAccess: true, assignmentLink: '/assignments/m1-quiz' },
      { id: 'm2', code: 'M2', title: 'Regulatory Landscape (PWM/E-Waste/Battery Rules)', objective: 'Navigate all major EPR rules — Plastic Waste, E-Waste, Battery & Tyre — and their compliance timelines', assets: 5, duration: '120 min', status: 'Published', partnerAccess: true, assignmentLink: '/assignments/m2-assignment' },
      { id: 'm3', code: 'M3', title: 'CPCB Portal Registration', objective: 'Complete end-to-end registration on the CPCB EPR portal for any waste category', assets: 4, duration: '90 min', status: 'Published', partnerAccess: true, assignmentLink: '/assignments/m3-lab' },
      { id: 'm4', code: 'M4', title: 'EPR Credit Calculation', objective: 'Calculate EPR credit obligations, targets, and shortfall penalties accurately', assets: 3, duration: '60 min', status: 'Published', partnerAccess: false, assignmentLink: '/assignments/m4-workbook' },
      { id: 'm5', code: 'M5', title: 'Producer Responsibilities & Targets', objective: 'Define producer categories, annual targets, and collection responsibilities under EPR rules', assets: 2, duration: '90 min', status: 'Published', partnerAccess: false },
      { id: 'm6', code: 'M6', title: 'Compliance Documentation', objective: 'Prepare all mandatory compliance documents, returns, and annual reports for regulators', assets: 4, duration: '60 min', status: 'Draft', partnerAccess: false, assignmentLink: '/assignments/m6-templates' },
      { id: 'm7', code: 'M7', title: 'Practical Case Studies', objective: 'Apply EPR compliance knowledge to real-world producer scenarios across industries', assets: 5, duration: '90 min', status: 'Published', partnerAccess: true },
      { id: 'm8', code: 'M8', title: 'Assessment & Certification', objective: 'Demonstrate competency across all Tier 1 modules and earn EPR Essentials certification', assets: 2, duration: '60 min', status: 'Published', partnerAccess: false, assignmentLink: '/assignments/m8-final' },
    ]
  },
  'tier-2': {
    id: 'tier-2',
    name: 'EPR Consultant Pro',
    tier: 'Tier 2',
    duration: '3-Month Mastery',
    modules: [
      { id: 'm1', code: 'W1', title: 'CPCB Portal Mastery — Advanced Navigation', objective: 'Master all portal features including credit transfers, PRO linkage, and multi-category filings', assets: 6, duration: '4 hrs', status: 'Published', partnerAccess: true },
      { id: 'm2', code: 'W2', title: 'E-Waste & Battery Filing Deep Dive', objective: 'Execute complex E-waste and Battery EPR filings with PRO coordination', assets: 5, duration: '4 hrs', status: 'Published', partnerAccess: true },
      { id: 'm3', code: 'W3', title: 'Tyre & Plastic Waste Advanced Compliance', objective: 'Handle tyre waste extended targets and plastic waste credit reconciliation', assets: 4, duration: '3 hrs', status: 'Published', partnerAccess: true },
      { id: 'm4', code: 'W4', title: 'Client Acquisition for EPR Consultants', objective: 'Build a pipeline of producer clients using proven outreach and pitch frameworks', assets: 7, duration: '5 hrs', status: 'Published', partnerAccess: false },
      { id: 'm5', code: 'W5', title: 'Consulting Toolkit & Deliverables', objective: 'Create professional compliance reports, gap analyses, and client presentations', assets: 8, duration: '4 hrs', status: 'Published', partnerAccess: false },
      { id: 'm6', code: 'W6', title: 'Pricing & Proposal Writing', objective: 'Price EPR consulting engagements and write winning proposals', assets: 4, duration: '3 hrs', status: 'Draft', partnerAccess: false },
      { id: 'm7', code: 'W7', title: 'State PCB Interactions & Hearings', objective: 'Prepare clients for State PCB inspections and manage regulatory communications', assets: 5, duration: '4 hrs', status: 'Published', partnerAccess: true },
      { id: 'm8', code: 'W8', title: 'Mock Filings — Plastic Waste', objective: 'Complete a full mock filing cycle for a hypothetical plastic waste producer', assets: 3, duration: '5 hrs', status: 'Published', partnerAccess: false },
      { id: 'm9', code: 'W9', title: 'Mock Filings — E-Waste', objective: 'Complete a full mock filing cycle for a hypothetical e-waste producer with PRO', assets: 3, duration: '5 hrs', status: 'Draft', partnerAccess: false },
      { id: 'm10', code: 'W10', title: 'Portfolio Building & LinkedIn Presence', objective: 'Build a consulting portfolio and establish authority in the EPR compliance space', assets: 4, duration: '3 hrs', status: 'Draft', partnerAccess: false },
      { id: 'm11', code: 'W11', title: 'Client Retention & Recurring Revenue', objective: 'Design annual compliance retainers and build long-term client relationships', assets: 5, duration: '4 hrs', status: 'Draft', partnerAccess: false },
      { id: 'm12', code: 'W12', title: 'Capstone — Full Consulting Engagement', objective: 'Execute end-to-end consulting engagement for a simulated enterprise producer client', assets: 4, duration: '6 hrs', status: 'Draft', partnerAccess: false },
    ]
  },
  'tier-3': {
    id: 'tier-3',
    name: 'EPR Agency Master',
    tier: 'Tier 3',
    duration: '6-Month Agency Program',
    modules: [
      { id: 'm1', code: 'M1', title: 'Agency Foundation & Business Setup', objective: 'Legally establish and brand your EPR compliance agency', assets: 6, duration: '1 week', status: 'Published', partnerAccess: false },
      { id: 'm2', code: 'M2', title: 'Service Productization', objective: 'Package EPR compliance services into scalable, priceable products', assets: 5, duration: '1 week', status: 'Published', partnerAccess: false },
      { id: 'm3', code: 'M3', title: 'Team Building & SOPs', objective: 'Hire, train, and manage an EPR compliance team with standardized operating procedures', assets: 7, duration: '2 weeks', status: 'Published', partnerAccess: false },
      { id: 'm4', code: 'M4', title: 'Enterprise Client Management', objective: 'Onboard, manage, and retain large enterprise producer clients', assets: 6, duration: '2 weeks', status: 'Published', partnerAccess: false },
      { id: 'm5', code: 'M5', title: 'Technology & Automation', objective: 'Implement compliance tracking tools and automate client reporting workflows', assets: 5, duration: '1 week', status: 'Draft', partnerAccess: false },
      { id: 'm6', code: 'M6', title: 'Financial Management for EPR Agencies', objective: 'Manage agency cash flow, invoicing, and profitability metrics', assets: 4, duration: '1 week', status: 'Draft', partnerAccess: false },
      { id: 'm7', code: 'M7', title: 'Growth & Scale Strategy', objective: 'Develop 12-month growth roadmap and identify expansion opportunities', assets: 5, duration: '2 weeks', status: 'Draft', partnerAccess: false },
      { id: 'm8', code: 'M8', title: 'Agency Capstone & Mentorship', objective: 'Present agency business plan and receive expert mentor feedback', assets: 3, duration: '1 week', status: 'Draft', partnerAccess: false },
    ]
  }
};

const TIER_COLORS: Record<string, string> = {
  'Tier 1': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  'Tier 2': 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
  'Tier 3': 'bg-violet-500/15 text-violet-400 border-violet-500/30',
};

export default function ProgramCurriculumPage() {
  const params = useParams();
  const programId = (params?.programId as string) || 'tier-1';
  const program = PROGRAMS[programId] || PROGRAMS['tier-1'];

  const [expanded, setExpanded] = useState<Set<string>>(new Set([program.modules[0]?.id]));
  const [modules, setModules] = useState<Module[]>(program.modules);

  const toggle = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleStatus = (id: string) => {
    setModules(prev => prev.map(m => m.id === id ? { ...m, status: m.status === 'Published' ? 'Draft' : 'Published' } : m));
  };

  const togglePartner = (id: string) => {
    setModules(prev => prev.map(m => m.id === id ? { ...m, partnerAccess: !m.partnerAccess } : m));
  };

  const publishAll = () => setModules(prev => prev.map(m => ({ ...m, status: 'Published' })));
  const draftAll = () => setModules(prev => prev.map(m => ({ ...m, status: 'Draft' })));

  const published = modules.filter(m => m.status === 'Published').length;

  return (
    <div className="min-h-screen bg-[#060910] text-white p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-white">{program.name}</h1>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${TIER_COLORS[program.tier]}`}>{program.tier}</span>
          </div>
          <p className="text-slate-400 text-sm">{program.duration} · {modules.length} modules · {published}/{modules.length} published</p>
        </div>
        <div className="flex gap-3">
          <button onClick={draftAll} className="flex items-center gap-2 border border-slate-700 text-slate-300 hover:bg-slate-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <EyeOff className="w-4 h-4" /> Draft All
          </button>
          <button onClick={publishAll} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Globe className="w-4 h-4" /> Publish All
          </button>
        </div>
      </div>

      {/* Curriculum Accordion */}
      <div className="space-y-2">
        {modules.map((mod, idx) => {
          const isOpen = expanded.has(mod.id);
          return (
            <div key={mod.id} className="bg-[#0c1022] border border-slate-800/80 rounded-xl overflow-hidden hover:border-slate-700 transition-colors">
              {/* Row Header */}
              <div
                className="flex items-center gap-4 p-4 cursor-pointer"
                onClick={() => toggle(mod.id)}
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-indigo-400 text-xs font-bold">{mod.code}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-200 font-medium text-sm">{mod.title}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${mod.status === 'Published' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'}`}>
                      {mod.status}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-slate-500 text-xs">
                  <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{mod.assets} assets</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{mod.duration}</span>
                  {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>

              {/* Expanded Content */}
              {isOpen && (
                <div className="border-t border-slate-800/80 p-4 bg-[#080d1a]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">Learning Objective</p>
                      <p className="text-slate-300 text-sm">{mod.objective}</p>
                    </div>
                    <div className="space-y-2">
                      {mod.assignmentLink && (
                        <div className="flex items-center gap-2 text-sm text-indigo-400">
                          <Link2 className="w-3.5 h-3.5" />
                          <span>Assignment: </span>
                          <a href={mod.assignmentLink} className="underline text-indigo-300">{mod.assignmentLink}</a>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>{mod.assets} content assets linked</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 pt-3 border-t border-slate-800/60">
                    <button
                      onClick={() => toggleStatus(mod.id)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${mod.status === 'Published' ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20' : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'}`}
                    >
                      {mod.status === 'Published' ? <><EyeOff className="w-3 h-3" /> Set to Draft</> : <><Eye className="w-3 h-3" /> Publish</>}
                    </button>
                    <button
                      onClick={() => togglePartner(mod.id)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${mod.partnerAccess ? 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20' : 'bg-slate-800 border border-slate-700 text-slate-400 hover:bg-slate-700'}`}
                    >
                      {mod.partnerAccess ? <><Unlock className="w-3 h-3" /> Partner Access ON</> : <><Lock className="w-3 h-3" /> Partner Access OFF</>}
                    </button>
                    <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 border border-slate-700 text-slate-400 hover:bg-slate-700 transition-colors">
                      <Edit2 className="w-3 h-3" /> Edit Module
                    </button>
                    <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 border border-slate-700 text-slate-400 hover:bg-slate-700 transition-colors">
                      <Users className="w-3 h-3" /> View Enrolled
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

