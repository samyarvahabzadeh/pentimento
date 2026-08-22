/**
 * Discover available models on Groq and Gemini.
 */
import * as dotenv from 'dotenv';
dotenv.config();

const groqKey = process.env.GROQ_API_KEY ?? '';
const geminiKey = process.env.GEMINI_API_KEY ?? '';

// ── Groq models ───────────────────────────────────────────────────────────────
console.log('=== GROQ AVAILABLE MODELS ===\n');
try {
  const res = await fetch('https://api.groq.com/openai/v1/models', {
    headers: { 'Authorization': `Bearer ${groqKey}` }
  });
  if (res.ok) {
    const d = await res.json() as any;
    const models: any[] = d.data ?? [];
    // Filter for text/chat models (exclude whisper, tts)
    const chat = models
      .filter(m => !m.id.includes('whisper') && !m.id.includes('tts') && !m.id.includes('guard'))
      .sort((a, b) => a.id.localeCompare(b.id));
    chat.forEach(m => console.log(`  ${m.id} | ctx:${m.context_window ?? '?'}`));
    console.log(`\nTotal chat models: ${chat.length}`);
  } else {
    const t = await res.text();
    console.log(`HTTP ${res.status}: ${t.slice(0, 200)}`);
  }
} catch (e: any) {
  console.log(`Error: ${e.message}`);
}

// ── Gemini models ─────────────────────────────────────────────────────────────
console.log('\n=== GEMINI AVAILABLE MODELS ===\n');
try {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${geminiKey}`);
  if (res.ok) {
    const d = await res.json() as any;
    const models: any[] = d.models ?? [];
    // Only chat-capable models
    const chat = models.filter(m =>
      m.supportedGenerationMethods?.includes('generateContent') &&
      !m.name.includes('embedding') && !m.name.includes('aqa')
    ).sort((a, b) => a.name.localeCompare(b.name));
    chat.forEach(m => {
      const id = m.name.replace('models/', '');
      const ctx = m.inputTokenLimit ?? '?';
      console.log(`  ${id} | ctx:${ctx} | "${m.displayName}"`);
    });
    console.log(`\nTotal chat models: ${chat.length}`);
  } else {
    const t = await res.text();
    console.log(`HTTP ${res.status}: ${t.slice(0, 200)}`);
  }
} catch (e: any) {
  console.log(`Error: ${e.message}`);
}
