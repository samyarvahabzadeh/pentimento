import * as dotenv from 'dotenv';
dotenv.config();

async function checkGeminiModels() {
  const key = process.env.GEMINI_API_KEY;
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    const data = await res.json() as any;
    if (data.models) {
      console.log('Available Gemini Models:');
      for (const m of data.models) {
        if (m.name.includes('flash') || m.name.includes('gemini')) {
          console.log(` - ${m.name}`);
        }
      }
    } else {
      console.log('Error/Response:', data);
    }
  } catch (e: any) {
    console.log('Fetch error:', e.message);
  }
}

checkGeminiModels();
