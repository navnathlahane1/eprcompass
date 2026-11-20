import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Women Empowerment program application. Accepts the full applicant profile +
// an optional resume (multipart), screens the profile server-side, stores the
// application + resume + a CRM lead, and returns the eligibility verdict.
// Only "qualified" applicants are allowed to proceed to payment.

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase env');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HIGHER_QUALS = ['Pursuing Graduation', 'Pursuing Post Graduation', 'Graduate', 'Post Graduate', 'Diploma', 'Professional Degree'];

function screen(p: { qualification: string; age: number | null; motivation: string; hasResume: boolean }) {
  let score = 0;
  const reasons: string[] = [];
  if (HIGHER_QUALS.includes(p.qualification)) { score += 50; reasons.push('Graduate-level qualification'); }
  else if (p.qualification === '12th Pass') { score += 25; reasons.push('12th pass'); }
  else { reasons.push('Qualification below 12th'); }
  if (p.age == null || p.age >= 18) score += 10; else reasons.push('Below 18');
  if (p.motivation.trim().length >= 30) { score += 20; reasons.push('Clear motivation'); }
  if (p.hasResume) { score += 20; reasons.push('Resume provided'); }

  let status: 'qualified' | 'review' | 'rejected';
  if (HIGHER_QUALS.includes(p.qualification) && (p.age == null || p.age >= 18) && score >= 60) status = 'qualified';
  else if (score >= 35) status = 'review';
  else status = 'rejected';
  return { status, score, reasons };
}

const MESSAGES: Record<string, string> = {
  qualified: 'Congratulations! Your profile is a strong fit for the program. Secure your seat below.',
  review: 'Thank you! Your profile is under review — our team will reach out to you shortly.',
  rejected: 'Thanks for applying. Based on the current cohort criteria we\'ll keep your profile on our waitlist and contact you if a fit opens up.',
};

export async function POST(req: Request) {
  try {
    const supabase = getSupabaseAdmin();
    const form = await req.formData();
    const get = (k: string) => String(form.get(k) ?? '').trim();

    const name = get('name');
    const email = get('email');
    const mobile = get('mobile');
    const qualification = get('qualification');
    const motivation = get('motivation');
    const ageRaw = get('age');
    const age = ageRaw ? parseInt(ageRaw, 10) : null;
    const expRaw = get('experience_years');
    const program = get('program') || 'women_empowerment';
    const PROGRAM_META: Record<string, { source: string; page: string; label: string; tag: string }> = {
      students: { source: 'Student Program', page: '/students', label: 'Student', tag: 'student-program' },
      internship: { source: 'Internship Program', page: '/internship', label: 'Internship', tag: 'internship-program' },
      women_empowerment: { source: 'Women Empowerment', page: '/women-empowerment', label: 'Women', tag: 'women-program' },
    };
    const meta = PROGRAM_META[program] || PROGRAM_META.women_empowerment;

    if (!name || !email || !mobile) return NextResponse.json({ success: false, error: 'name, email and mobile are required' }, { status: 400 });
    if (!EMAIL_RE.test(email)) return NextResponse.json({ success: false, error: 'A valid email is required' }, { status: 400 });
    if (mobile.replace(/\D/g, '').length < 8) return NextResponse.json({ success: false, error: 'A valid mobile number is required' }, { status: 400 });

    // ── Resume upload (optional) ─────────────────────────────────────────────
    let resumePath: string | null = null;
    let resumeName: string | null = null;
    const resume = form.get('resume') as File | null;
    if (resume && typeof resume === 'object' && typeof (resume as any).arrayBuffer === 'function' && resume.size > 0) {
      if (resume.size <= 8 * 1024 * 1024) {
        const ext = (resume.name?.split('.').pop() || 'pdf').toLowerCase().replace(/[^a-z0-9]/g, '');
        const objectName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const bytes = new Uint8Array(await resume.arrayBuffer());
        const { error: upErr } = await supabase.storage
          .from('women-program-resumes')
          .upload(objectName, bytes, { contentType: resume.type || 'application/octet-stream', upsert: false });
        if (!upErr) { resumePath = objectName; resumeName = resume.name || objectName; }
      }
    }

    // ── Screen ───────────────────────────────────────────────────────────────
    const verdict = screen({ qualification, age, motivation, hasResume: Boolean(resumePath) });

    // ── Persist application ──────────────────────────────────────────────────
    const { data: app, error: appErr } = await (supabase as any)
      .from('women_program_applications')
      .insert({
        name, email, mobile, age, program,
        city: get('city') || null,
        qualification: qualification || null,
        field_of_study: get('field_of_study') || null,
        current_status: get('current_status') || null,
        experience_years: expRaw ? Number(expRaw) : null,
        motivation: motivation || null,
        resume_path: resumePath,
        resume_name: resumeName,
        screening_status: verdict.status,
        screening_score: verdict.score,
        screening_reasons: verdict.reasons,
        payment_status: 'pending',
      })
      .select('id')
      .single();

    if (appErr) return NextResponse.json({ success: false, error: appErr.message }, { status: 500 });

    // ── CRM lead (best-effort) ───────────────────────────────────────────────
    try {
      await (supabase as any).from('leads').insert({
        name, email, phone: mobile, mobile: mobile.replace(/\D/g, ''),
        source: meta.source,
        medium: 'website',
        page_visited: meta.page,
        status: 'New', lead_status: 'New',
        lead_temperature: verdict.status === 'qualified' ? 'Hot' : 'Warm',
        compliance_status: `Screening: ${verdict.status}`,
        description: `${meta.label} program application — ${verdict.status} (score ${verdict.score}). ${qualification || ''}, ${get('city') || ''}.`.slice(0, 1000),
        tags: [meta.tag, verdict.status],
      });
    } catch { /* non-blocking */ }

    return NextResponse.json({
      success: true,
      application_id: app.id,
      status: verdict.status,
      qualified: verdict.status === 'qualified',
      message: MESSAGES[verdict.status],
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: String(error?.message || 'Application failed') }, { status: 500 });
  }
}
