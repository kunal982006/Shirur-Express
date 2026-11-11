// Shared helpers for generating images with Cloudflare Workers AI (FLUX, free tier: 10,000 Neurons/day).
import 'dotenv/config';

export const CF_ACCOUNT_ID = process.env.Cloudflare_Account_ID || process.env.CLOUDFLARE_ACCOUNT_ID;
export const CF_AI_TOKEN = process.env.CLOUDFLARE_AI_TOKEN;
const MODEL = '@cf/black-forest-labs/flux-1-schnell';
const STEPS = 6; // 4-8 allowed; higher = better quality, more neurons

export const SALON_STYLE =
  'professional beauty salon photography, modern clean Indian beauty parlour, soft natural lighting, ' +
  'high detail, realistic, sharp focus, square composition, no text, no signboards, no letters, no watermark, no logo';

export class QuotaError extends Error {}

export const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export async function generateImage(prompt: string, steps: number = STEPS): Promise<Buffer> {
  if (!CF_ACCOUNT_ID || !CF_AI_TOKEN) throw new Error('Missing Cloudflare_Account_ID or CLOUDFLARE_AI_TOKEN in .env');
  const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run/${MODEL}`;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${CF_AI_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, steps }),
    });
    const text = await res.text();
    if (res.ok) {
      const b64 = JSON.parse(text)?.result?.image;
      if (!b64) throw new Error('No image in response: ' + text.slice(0, 200));
      return Buffer.from(b64, 'base64');
    }
    if (res.status === 401 || res.status === 403) {
      throw new Error(`Cloudflare auth failed (${res.status}). Check CLOUDFLARE_AI_TOKEN has Workers AI permission.`);
    }
    if (res.status === 429 || /neuron|quota|limit|capacity/i.test(text)) {
      if (res.status === 429 && attempt < 3 && !/neuron|daily/i.test(text)) {
        await new Promise(r => setTimeout(r, 5000 * attempt));
        continue;
      }
      throw new QuotaError(text.slice(0, 300));
    }
    if (attempt === 3) throw new Error(`HTTP ${res.status}: ${text.slice(0, 300)}`);
    await new Promise(r => setTimeout(r, 3000 * attempt));
  }
  throw new Error('unreachable');
}
