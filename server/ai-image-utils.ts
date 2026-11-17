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

// Free-tier accounts, used in order: when one runs out of its daily neurons the next one takes over.
// Add more with CLOUDFLARE_ACCOUNT_ID_3 / CLOUDFLARE_AI_TOKEN_3, etc.
const ACCOUNTS: { id: string; token: string; label: string }[] = [];
if (CF_ACCOUNT_ID && CF_AI_TOKEN) ACCOUNTS.push({ id: CF_ACCOUNT_ID, token: CF_AI_TOKEN, label: 'account 1' });
for (let n = 2; process.env[`CLOUDFLARE_ACCOUNT_ID_${n}`] && process.env[`CLOUDFLARE_AI_TOKEN_${n}`]; n++) {
  ACCOUNTS.push({ id: process.env[`CLOUDFLARE_ACCOUNT_ID_${n}`]!, token: process.env[`CLOUDFLARE_AI_TOKEN_${n}`]!, label: `account ${n}` });
}
let current = 0;

export async function generateImage(prompt: string, steps: number = STEPS): Promise<Buffer> {
  if (!ACCOUNTS.length) throw new Error('Missing Cloudflare_Account_ID or CLOUDFLARE_AI_TOKEN in .env');
  while (current < ACCOUNTS.length) {
    try {
      return await generateWith(ACCOUNTS[current], prompt, steps);
    } catch (e) {
      if (!(e instanceof QuotaError)) throw e;
      current++;
      if (current < ACCOUNTS.length) process.stdout.write(`(daily limit reached, switching to Cloudflare ${ACCOUNTS[current].label}) `);
      else throw e;
    }
  }
  throw new QuotaError('All Cloudflare accounts have used up their daily free allocation');
}

async function generateWith(acct: { id: string; token: string; label: string }, prompt: string, steps: number): Promise<Buffer> {
  const url = `https://api.cloudflare.com/client/v4/accounts/${acct.id}/ai/run/${MODEL}`;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${acct.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, steps }),
    });
    const text = await res.text();
    if (res.ok) {
      const b64 = JSON.parse(text)?.result?.image;
      if (!b64) throw new Error('No image in response: ' + text.slice(0, 200));
      return Buffer.from(b64, 'base64');
    }
    if (res.status === 401 || res.status === 403) {
      throw new Error(`Cloudflare auth failed (${res.status}). Check the token for ${acct.label} has Workers AI permission.`);
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
