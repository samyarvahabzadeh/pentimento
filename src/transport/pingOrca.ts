/**
 * Ping OrcaRouter free model with larger token limit to verify actual response.
 */
import * as dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.ORCAROUTER_API_KEY ?? '';
const model = process.env.ORCAROUTER_PRIMARY_MODEL ?? 'deepseek/deepseek-v4-flash-free';
const baseUrl = process.env.ORCAROUTER_BASE_URL ?? 'https://api.orcarouter.ai/v1';

console.log(`Testing: ${model}`);
const start = Date.now();
const res = await fetch(`${baseUrl}/chat/completions`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
  body: JSON.stringify({
    model,
    messages: [
      { role: 'system', content: 'Reply only with valid JSON.' },
      { role: 'user', content: 'Reply with: {"status":"alive","lang":"fa","test":true}' }
    ],
    max_tokens: 100
  })
});
const latency = Date.now() - start;
console.log(`HTTP ${res.status} | latency: ${latency}ms`);
const body = await res.text();
console.log(`body: ${body.slice(0, 500)}`);

// Parse
try {
  const d = JSON.parse(body);
  const content = d.choices?.[0]?.message?.content ?? '';
  const finishReason = d.choices?.[0]?.finish_reason ?? '?';
  const returnedModel = d.model ?? '?';
  console.log(`\nmodel returned: ${returnedModel}`);
  console.log(`finish_reason: ${finishReason}`);
  console.log(`content: ${content}`);
  try { JSON.parse(content); console.log('content parse: OK'); }
  catch (e) { console.log('content parse: FAIL'); }
} catch { console.log('response parse: FAIL'); }
