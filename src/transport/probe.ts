/**
 * Multi-provider probe — tests Groq, Gemini, and OrcaRouter in sequence.
 * Reports HTTP status, latency, content length, finish_reason, parse result.
 * API keys are NEVER printed.
 */
import * as dotenv from 'dotenv';
dotenv.config();

interface ProbeResult {
  provider: string;
  model: string;
  status: number;
  latencyMs: number;
  contentLength: number;
  finishReason: string;
  parseSuccess: boolean;
  parseError?: string;
  available: boolean;
  failReason?: string;
  retryAfter?: string;
}

async function probeOpenAICompatible(
  providerName: string,
  baseUrl: string,
  apiKey: string,
  model: string
): Promise<ProbeResult> {
  const base: ProbeResult = {
    provider: providerName, model,
    status: 0, latencyMs: 0, contentLength: 0,
    finishReason: '?', parseSuccess: false, available: false
  };

  if (!apiKey) {
    return { ...base, failReason: 'API key not set in .env' };
  }

  const start = Date.now();
  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'You are a test assistant. Reply only with valid JSON.' },
          { role: 'user', content: 'Reply with this exact JSON: {"status":"alive","lang":"fa"}' }
        ],
        response_format: { type: 'json_object' },
        max_tokens: 30,
      }),
      signal: AbortSignal.timeout(20_000),
    });

    const latencyMs = Date.now() - start;
    const retryAfter = res.headers.get('retry-after') ?? undefined;
    const bodyText = await res.text();

    if (!res.ok) {
      let code = '?';
      try { code = JSON.parse(bodyText)?.error?.code ?? JSON.parse(bodyText)?.error?.message?.slice(0, 60) ?? bodyText.slice(0, 60); } catch {}
      return { ...base, status: res.status, latencyMs, retryAfter, failReason: code, available: false };
    }

    let data: any;
    try { data = JSON.parse(bodyText); } catch {
      return { ...base, status: res.status, latencyMs, failReason: 'response not JSON', available: false };
    }

    const content: string = data.choices?.[0]?.message?.content ?? '';
    const finishReason: string = data.choices?.[0]?.finish_reason ?? '?';
    const returnedModel: string = data.model ?? model;

    let parseSuccess = false;
    let parseError: string | undefined;
    if (content) {
      try { JSON.parse(content); parseSuccess = true; } catch (e: any) { parseError = e.message; }
    }

    return {
      ...base,
      model: returnedModel,
      status: res.status,
      latencyMs,
      contentLength: content.length,
      finishReason,
      parseSuccess,
      parseError,
      available: content.length > 0,
    };
  } catch (e: any) {
    return { ...base, latencyMs: Date.now() - start, failReason: e.message?.slice(0, 80) ?? 'network error', available: false };
  }
}

async function probeGemini(apiKey: string, model: string): Promise<ProbeResult> {
  const base: ProbeResult = {
    provider: 'gemini', model,
    status: 0, latencyMs: 0, contentLength: 0,
    finishReason: '?', parseSuccess: false, available: false
  };

  if (!apiKey) {
    return { ...base, failReason: 'GEMINI_API_KEY not set in .env' };
  }

  const start = Date.now();
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: 'Reply with this exact JSON: {"status":"alive","lang":"fa"}' }] }],
        generationConfig: { responseMimeType: 'application/json', maxOutputTokens: 30 },
      }),
      signal: AbortSignal.timeout(20_000),
    });

    const latencyMs = Date.now() - start;
    const bodyText = await res.text();

    if (!res.ok) {
      let msg = '?';
      try { msg = JSON.parse(bodyText)?.error?.message?.slice(0, 80) ?? bodyText.slice(0, 60); } catch {}
      return { ...base, status: res.status, latencyMs, failReason: msg };
    }

    const data = JSON.parse(bodyText);
    const content: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const finishReason: string = data?.candidates?.[0]?.finishReason ?? '?';

    let parseSuccess = false;
    let parseError: string | undefined;
    if (content) {
      try { JSON.parse(content); parseSuccess = true; } catch (e: any) { parseError = e.message; }
    }

    return {
      ...base, status: res.status, latencyMs, contentLength: content.length,
      finishReason, parseSuccess, parseError, available: content.length > 0,
    };
  } catch (e: any) {
    return { ...base, latencyMs: Date.now() - start, failReason: e.message?.slice(0, 80) ?? 'error', available: false };
  }
}

function print(r: ProbeResult) {
  const icon = r.available ? '✅' : '❌';
  console.log(`\n${icon} ${r.provider.toUpperCase()} — ${r.model}`);
  console.log(`   HTTP: ${r.status || '(no response)'} | latency: ${r.latencyMs}ms`);
  if (r.available) {
    console.log(`   contentLength: ${r.contentLength} | finishReason: ${r.finishReason}`);
    console.log(`   parseSuccess: ${r.parseSuccess}${r.parseError ? ' — ' + r.parseError : ''}`);
  } else {
    console.log(`   FAIL: ${r.failReason ?? 'unknown'}${r.retryAfter ? ` | retry-after: ${r.retryAfter}s` : ''}`);
  }
}

// ── Run probes ──────────────────────────────────────────────────────────────
console.log('=== PROVIDER PROBE ===\n');
console.log('(API keys not shown)');

const groqResult = await probeOpenAICompatible(
  'groq',
  (process.env.GROQ_BASE_URL ?? 'https://api.groq.com/openai/v1').replace(/\/$/, ''),
  process.env.GROQ_API_KEY ?? '',
  process.env.GROQ_MODEL ?? 'qwen/qwen3.6-27b'
);
print(groqResult);

const geminiResult = await probeGemini(
  process.env.GEMINI_API_KEY ?? '',
  process.env.GEMINI_MODEL ?? 'gemini-2.0-flash'
);
print(geminiResult);

const orcaResult = await probeOpenAICompatible(
  'orcarouter',
  process.env.ORCAROUTER_BASE_URL ?? 'https://api.orcarouter.ai/v1',
  process.env.ORCAROUTER_API_KEY ?? '',
  process.env.ORCAROUTER_PRIMARY_MODEL ?? 'deepseek/deepseek-v4-flash-free'
);
print(orcaResult);

console.log('\n=== SUMMARY ===');
const live = [groqResult, geminiResult, orcaResult].filter(r => r.available);
if (live.length === 0) {
  console.log('❌ No providers available. Add API keys to .env and re-run.');
} else {
  live.forEach(r => console.log(`✅ ${r.provider} (${r.model}) — ${r.latencyMs}ms`));
  console.log(`\nRECOMMENDED: ${live[0].provider} | Set ACTIVE_PROVIDER=${live[0].provider} in .env`);
}
