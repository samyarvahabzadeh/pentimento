/**
 * Ping a targeted set of non-free models to find one that's live.
 * Focus on models good for Persian + structured output.
 */
import * as dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.ORCAROUTER_API_KEY ?? '';
const baseUrl = process.env.ORCAROUTER_BASE_URL ?? 'https://api.orcarouter.ai/v1';

async function quickPing(modelId: string): Promise<{
  ok: boolean; latency: number; status: number;
  content?: string; error?: string; finishReason?: string;
}> {
  const start = Date.now();
  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: modelId,
        messages: [{ role: 'user', content: 'Reply with exactly the word: ALIVE' }],
        max_tokens: 10
      }),
      signal: AbortSignal.timeout(15000)
    });
    const latency = Date.now() - start;
    if (!res.ok) {
      const body = await res.text();
      const code = (() => { try { return JSON.parse(body)?.error?.code ?? body.slice(0, 80); } catch { return body.slice(0,80); } })();
      return { ok: false, latency, status: res.status, error: code };
    }
    const d = await res.json() as any;
    const content = d.choices?.[0]?.message?.content ?? '';
    const finishReason = d.choices?.[0]?.finish_reason ?? '?';
    return { ok: content.length > 0, latency, status: 200, content, finishReason };
  } catch (e: any) {
    return { ok: false, latency: Date.now() - start, status: 0, error: e.message.slice(0, 60) };
  }
}

// Priority list: Persian-capable, supports JSON output, low-cost
const candidates = [
  // Qwen — excellent multilingual, Persian support
  'qwen/qwen3.5-flash',
  'qwen/qwen3.6-flash',
  'qwen/qwen3.7-flash',
  // DeepSeek non-free
  'deepseek/deepseek-v4-flash',
  // Gemini flash (fast, multilingual)
  'google/gemini-2.5-flash-lite',
  'google/gemini-2.5-flash',
  'google/gemini-3.5-flash-lite',
  // GLM — Chinese/multilingual
  'z-ai/glm-4.5-air',
  'z-ai/glm-4.6',
  // Minimax — multilingual
  'minimax/minimax-m2.5-highspeed',
  // GPT-4.1 nano — cheapest OpenAI
  'openai/gpt-4.1-nano',
];

console.log('=== PAID MODEL AVAILABILITY PROBE ===\n');
const live: Array<{ id: string; latency: number }> = [];

for (const id of candidates) {
  process.stdout.write(`  ${id.padEnd(46)} → `);
  const r = await quickPing(id);
  if (r.ok) {
    console.log(`✅ ${r.latency}ms | "${r.content?.trim()}" | finish:${r.finishReason}`);
    live.push({ id, latency: r.latency });
  } else {
    const label = r.status === 429 ? '429 rate-limited' :
                  r.status === 401 ? '401 unauthorized' :
                  r.status === 404 ? '404 not found' :
                  r.status === 0   ? `timeout/net` :
                  `${r.status} ${r.error ?? ''}`;
    console.log(`❌ ${label}`);
  }
}

console.log(`\n=== LIVE PAID MODELS (${live.length}) ===`);
live.sort((a, b) => a.latency - b.latency);
live.forEach(m => console.log(`  • ${m.id} (${m.latency}ms)`));

if (live.length > 0) {
  console.log(`\nRECOMMENDED TEST MODEL: ${live[0].id}`);
  console.log(`Add to .env: ORCAROUTER_TEST_MODEL=${live[0].id}`);
}
