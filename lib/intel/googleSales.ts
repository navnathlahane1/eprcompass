const MAPS = 'https://maps.googleapis.com/maps/api';
const CSE = 'https://www.googleapis.com/customsearch/v1';

export function mapsKey() {
  return String(process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_API_KEY || '').trim();
}

export function customSearchCx() {
  return String(process.env.GOOGLE_CUSTOM_SEARCH_CX || process.env.GOOGLE_CSE_CX || '').trim();
}

export type SearchHit = {
  title: string;
  link: string;
  snippet: string;
  kind: 'website' | 'cpcb_pdf' | 'spcb_pdf' | 'other';
};

function classifyHit(link: string, title: string): SearchHit['kind'] {
  const u = link.toLowerCase();
  const t = title.toLowerCase();
  if (u.endsWith('.pdf') && (u.includes('cpcb') || t.includes('cpcb') || t.includes('epr'))) return 'cpcb_pdf';
  if (u.endsWith('.pdf') && (u.includes('spcb') || u.includes('mpcb') || t.includes('consent'))) return 'spcb_pdf';
  if (u.endsWith('.pdf')) return 'cpcb_pdf';
  return 'website';
}

export async function customSearch(query: string, num = 8): Promise<SearchHit[]> {
  const key = mapsKey();
  const cx = customSearchCx();
  if (!key) throw new Error('GOOGLE_MAPS_API_KEY missing');
  if (!cx) throw new Error('GOOGLE_CUSTOM_SEARCH_CX missing — create a Programmable Search Engine and paste the cx id');
  const url = `${CSE}?key=${encodeURIComponent(key)}&cx=${encodeURIComponent(cx)}&q=${encodeURIComponent(query)}&num=${num}`;
  const res = await fetch(url);
  const body = await res.json();
  if (!res.ok || body.error) {
    throw new Error(body.error?.message || body.error_message || `Custom Search HTTP ${res.status}`);
  }
  return (body.items || []).map((item: { title?: string; link?: string; snippet?: string }) => {
    const title = String(item.title || '');
    const link = String(item.link || '');
    return { title, link, snippet: String(item.snippet || ''), kind: classifyHit(link, title) };
  });
}

export async function searchCompanyWebAndDocs(name: string, state?: string | null) {
  const where = [name, state, 'India'].filter(Boolean).join(' ');
  const [web, pdfs] = await Promise.all([
    customSearch(`${where} official website`, 5),
    customSearch(`${where} CPCB EPR registration OR authorization OR consent filetype:pdf`, 8),
  ]);
  const websites = web.filter((h) => h.kind === 'website');
  const docs = pdfs.filter((h) => h.kind !== 'website' || h.link.toLowerCase().endsWith('.pdf'));
  return { websites, docs };
}

export type DriveLeg = {
  company_id: string;
  company_name: string;
  distance_km: number | null;
  duration_min: number | null;
  status: string;
};

export async function driveTimes(
  origin: { lat: number; lng: number },
  dests: { company_id: string; company_name: string; lat: number; lng: number }[],
): Promise<DriveLeg[]> {
  const key = mapsKey();
  if (!key) throw new Error('GOOGLE_MAPS_API_KEY missing');
  if (!dests.length) return [];
  const origins = `${origin.lat},${origin.lng}`;
  const destinations = dests.map((d) => `${d.lat},${d.lng}`).join('|');
  const url = `${MAPS}/distancematrix/json?origins=${encodeURIComponent(origins)}&destinations=${encodeURIComponent(destinations)}&mode=driving&region=in&key=${encodeURIComponent(key)}`;
  const res = await fetch(url);
  const body = await res.json();
  if (!res.ok || (body.status && body.status !== 'OK')) {
    throw new Error(body.error_message || body.status || `Distance Matrix HTTP ${res.status}`);
  }
  const elements = body.rows?.[0]?.elements || [];
  return dests.map((d, i) => {
    const el = elements[i] || {};
    return {
      company_id: d.company_id,
      company_name: d.company_name,
      distance_km: el.distance?.value != null ? Math.round((el.distance.value / 1000) * 10) / 10 : null,
      duration_min: el.duration?.value != null ? Math.round(el.duration.value / 60) : null,
      status: el.status || 'UNKNOWN',
    };
  });
}

export async function parseDocumentWithDocumentAi(fileUrl: string) {
  const processor = String(process.env.GOOGLE_DOCUMENT_AI_PROCESSOR || '').trim();
  if (!processor) {
    return {
      skipped: true,
      hint: 'Set GOOGLE_DOCUMENT_AI_PROCESSOR to projects/PROJECT/locations/LOCATION/processors/ID',
    };
  }
  const pdfRes = await fetch(fileUrl);
  if (!pdfRes.ok) throw new Error(`Could not download PDF (${pdfRes.status})`);
  const buf = Buffer.from(await pdfRes.arrayBuffer());
  const content = buf.toString('base64');
  const mimeType = pdfRes.headers.get('content-type') || 'application/pdf';

  let accessToken = String(process.env.GOOGLE_CLOUD_ACCESS_TOKEN || '').trim();
  if (!accessToken) {
    try {
      const { GoogleAuth } = await import('google-auth-library');
      const auth = new GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
        credentials: process.env.GOOGLE_SHEETS_CLIENT_EMAIL
          ? {
              client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
              private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            }
          : undefined,
      });
      const client = await auth.getClient();
      const tok = await client.getAccessToken();
      accessToken = String(tok?.token || tok || '');
    } catch (err) {
      throw new Error(
        `Document AI needs a service account (GOOGLE_SHEETS_* or GOOGLE_APPLICATION_CREDENTIALS). ${err instanceof Error ? err.message : ''}`,
      );
    }
  }
  if (!accessToken) throw new Error('No Google access token for Document AI');

  const endpoint = `https://us-documentai.googleapis.com/v1/${processor}:process`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ rawDocument: { content, mimeType } }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error?.message || `Document AI HTTP ${res.status}`);
  const text = String(body.document?.text || '').slice(0, 20000);
  return { skipped: false, text, entities: body.document?.entities || [] };
}
