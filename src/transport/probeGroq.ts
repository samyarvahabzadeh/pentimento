import * as dotenv from 'dotenv';
dotenv.config();

async function testGroq() {
  const apiKey = process.env.GROQ_API_KEY;
  const models = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'qwen-2.5-32b', 'qwen/qwen3.6-27b'];

  for (const m of models) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: m,
          messages: [{ role: 'user', content: 'Say hello in Persian' }],
          max_tokens: 20,
        }),
      });
      const data = await res.json() as any;
      console.log(`Model: ${m} -> Status: ${res.status}`, data?.choices?.[0]?.message?.content ?? data?.error?.message);
    } catch (e: any) {
      console.log(`Model: ${m} -> Error: ${e.message}`);
    }
  }
}

testGroq();
