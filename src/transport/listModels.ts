/**
 * List available models from OrcaRouter and test which ones respond.
 * Reports model ID, context, pricing, and a quick ping result.
 */
import * as dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.ORCAROUTER_API_KEY ?? '';
const baseUrl = process.env.ORCAROUTER_BASE_URL ?? 'https://api.orcarouter.ai/v1';

async function listModels() {
  console.log('=== ORCAROUTER MODEL LIST ===\n');
  try {
    const res = await fetch(`${baseUrl}/models`, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    console.log(`HTTP ${res.status}`);
    if (!res.ok) {
      console.log(await res.text());
      return [];
    }
    const data = await res.json() as any;
    const models: any[] = data.data ?? data.models ?? data ?? [];
    console.log(`Total models: ${models.length}\n`);
    return models;
  } catch (e: any) {
    console.log(`Error: ${e.message}`);
    return [];
  }
}

async function quickPing(modelId: string): Promise<{ ok: boolean; latency: number; status: number; error?: string }> {
  const start = Date.now();
  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: modelId,
        messages: [{ role: 'user', content: 'reply: OK' }],
        max_tokens: 5
      }),
      signal: AbortSignal.timeout(12000)
    });
    const latency = Date.now() - start;
    if (!res.ok) {
      const body = await res.text();
      const err = (() => { try { return JSON.parse(body)?.error?.code ?? body.slice(0, 80); } catch { return body.slice(0, 80); } })();
      return { ok: false, latency, status: res.status, error: err };
    }
    const d = await res.json() as any;
    const content = d.choices?.[0]?.message?.content ?? '';
    return { ok: content.length > 0, latency, status: res.status };
  } catch (e: any) {
    return { ok: false, latency: Date.now() - start, status: 0, error: e.message };
  }
}

const models = await listModels();

// Print all models with name/id
const FREE_CANDIDATES: string[] = [];
for (const m of models) {
  const id: string = m.id ?? m.name ?? '?';
  const ctx = m.context_length ?? m.max_tokens ?? '?';
  const isFree = id.includes('free') || m.pricing?.prompt === '0' || m.pricing?.prompt === 0;
  console.log(`${isFree ? '[FREE]' : '      '} ${id} | ctx:${ctx}`);
  if (isFree) FREE_CANDIDATES.push(id);
}

console.log(`\nFree candidates found: ${FREE_CANDIDATES.length}`);
console.log('\n=== PINGING FREE MODELS ===\n');

// Ping up to 10 free models (sequential to avoid hammering)
const toTest = FREE_CANDIDATES.slice(0, 15);
const live: string[] = [];

for (const id of toTest) {
  process.stdout.write(`  PING ${id.padEnd(50)} → `);
  const result = await quickPing(id);
  if (result.ok) {
    console.log(`✅ ${result.latency}ms`);
    live.push(id);
  } else {
    console.log(`❌ HTTP ${result.status} | ${result.error ?? 'fail'}`);
  }
}

console.log(`\n=== LIVE FREE MODELS (${live.length}) ===`);
live.forEach(id => console.log(`  • ${id}`));
