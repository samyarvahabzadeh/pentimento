/**
 * Deep account diagnostic for OrcaRouter.
 * Checks account info, balance, and which endpoints are accessible.
 */
import * as dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.ORCAROUTER_API_KEY ?? '';
const baseUrl = process.env.ORCAROUTER_BASE_URL ?? 'https://api.orcarouter.ai/v1';

async function get(path: string) {
  const res = await fetch(`${baseUrl}${path}`, {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  }).catch(e => null);
  if (!res) return { status: 0, body: 'network error' };
  const body = await res.text().catch(() => '');
  return { status: res.status, body };
}

console.log('=== ORCAROUTER ACCOUNT DIAGNOSTIC ===\n');

// Try common account endpoints
const endpoints = [
  '/account',
  '/balance',
  '/user',
  '/me',
  '/usage',
  '/credits',
];

for (const ep of endpoints) {
  const r = await get(ep);
  if (r.status === 200) {
    console.log(`✅ ${ep}: ${r.body.slice(0, 200)}`);
  } else {
    console.log(`   ${ep}: HTTP ${r.status} | ${r.body.slice(0, 120)}`);
  }
}

// Also check retry-after on free models to know exact wait time
console.log('\n=== FREE MODEL RETRY-AFTER ===');
const freeModels = ['deepseek/deepseek-v4-flash-free', 'qwen/qwen3.8-27b-free', 'tencent/hy3-free'];
for (const model of freeModels) {
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages: [{ role: 'user', content: 'hi' }], max_tokens: 5 })
  });
  const retryAfter = res.headers.get('retry-after');
  const body = await res.text();
  const code = (() => { try { return JSON.parse(body)?.error?.code; } catch { return '?'; } })();
  console.log(`  ${model}: HTTP ${res.status} | code:${code} | retry-after:${retryAfter ?? 'none'}s`);
}
