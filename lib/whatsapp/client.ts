import { TEMPLATES, TemplateName } from './templates';

export { TEMPLATES };
export type { TemplateName };

function getConfig() {
  const token = process.env.WHATSAPP_API_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneId) throw new Error('Missing WHATSAPP_API_TOKEN or WHATSAPP_PHONE_NUMBER_ID');
  return { token, phoneId };
}

async function callApi(phoneId: string, token: string, body: object) {
  const res = await fetch(
    `https://graph.facebook.com/v19.0/${phoneId}/messages`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );
  const data = await res.json() as Record<string, unknown>;
  return { success: res.ok, status: res.status, data };
}

export async function sendTextMessage(phone: string, message: string) {
  const { token, phoneId } = getConfig();
  return callApi(phoneId, token, {
    messaging_product: 'whatsapp',
    to: phone,
    type: 'text',
    text: { body: message },
  });
}

export async function sendTemplateMessage(
  phone: string,
  templateName: TemplateName | string,
  params: string[] = []
) {
  const { token, phoneId } = getConfig();
  const components = params.length
    ? [{
        type: 'body',
        parameters: params.map(text => ({ type: 'text', text })),
      }]
    : [];

  return callApi(phoneId, token, {
    messaging_product: 'whatsapp',
    to: phone,
    type: 'template',
    template: {
      name: templateName,
      language: { code: 'en' },
      components,
    },
  });
}
