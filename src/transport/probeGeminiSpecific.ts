import * as dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY ?? '';
console.log('=== GEMINI DIRECT MODEL PROBE ===');

const modelsToTest = [
  'gemini-2.5-flash-lite',
  'gemini-3.5-flash',
  'gemini-3.6-flash',
  'gemini-flash-latest',
  'gemini-flash-lite-latest',
  'gemini-3.1-flash-lite-preview',
];

for (const m of modelsToTest) {
  const start = Date.now();
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: 'سلام، فقط بنویس: سلام پنتیمنتو' }] }],
        generationConfig: { maxOutputTokens: 30 }
      }),
      signal: AbortSignal.timeout(10000)
    });
    const latency = Date.now() - start;
    if (res.ok) {
      const data = await res.json() as any;
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      console.log(`✅ ${m.padEnd(30)} → HTTP 200 | Latency: ${latency}ms | "${text.trim()}"`);
    } else {
      const errText = await res.text();
      let errSummary = errText.slice(0, 80);
      try { errSummary = JSON.parse(errText)?.error?.message?.slice(0, 80) ?? errSummary; } catch {}
      console.log(`❌ ${m.padEnd(30)} → HTTP ${res.status} | ${errSummary}`);
    }
  } catch (e: any) {
    console.log(`❌ ${m.padEnd(30)} → Exception: ${e.message}`);
  }
}
