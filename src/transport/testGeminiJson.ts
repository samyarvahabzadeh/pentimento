import * as dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY ?? '';
const model = process.env.GEMINI_MODEL ?? 'gemini-3.5-flash';

console.log(`Testing JSON generation with ${model}...`);
const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

const start = Date.now();
const res = await fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    contents: [
      {
        role: 'user',
        parts: [{ text: 'پاسخ را با یک شیء JSON با کلیدهای status و message برگردان. message باید فارسی باشد.' }]
      }
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.7,
      maxOutputTokens: 1024,
    }
  })
});

const latency = Date.now() - start;
console.log(`HTTP Status: ${res.status} | Latency: ${latency}ms`);
const data = await res.json() as any;
console.log('Response JSON:');
console.log(JSON.stringify(data, null, 2));
