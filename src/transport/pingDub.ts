import * as dotenv from 'dotenv';
dotenv.config();

const res = await fetch('https://api.orcarouter.ai/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + process.env.ORCAROUTER_API_KEY
  },
  body: JSON.stringify({
    model: 'orca/dub',
    messages: [{ role: 'user', content: 'به فارسی بگو: سلام، من آنلاینم.' }],
    max_tokens: 40
  })
});

console.log('HTTP', res.status);
const body = await res.text();
console.log(body);
