import * as dotenv from 'dotenv';
dotenv.config();

async function testGemini36() {
  const key = process.env.GEMINI_API_KEY;
  const m = 'gemini-3.6-flash';
  console.log('Testing:', m);
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: 'سلام' }] }],
      }),
    });
    const data = await res.json() as any;
    console.log(`Status: ${res.status}`, data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? data?.error?.message);
  } catch (e: any) {
    console.log(`Error: ${e.message}`);
  }
}

testGemini36();
