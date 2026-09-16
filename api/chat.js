// Vercel Serverless Function (Node.js)
// Allows running ScreenTime Gatekeeper AI with server-side environment variables
// Configurable on Vercel: GEMINI_API_KEY, OPENAI_API_KEY, or GROQ_API_KEY

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, history = [], provider = 'gemini', model, apiKey: clientApiKey } = req.body || {};

  if (!message) {
    return res.status(400).json({ error: 'Missing user message.' });
  }

  const geminiKey = clientApiKey || process.env.GEMINI_API_KEY;
  const openaiKey = clientApiKey || process.env.OPENAI_API_KEY;
  const groqKey = clientApiKey || process.env.GROQ_API_KEY;

  const systemPrompt = `You are "Friday", an intelligent ScreenTime Gatekeeper and mindful digital habits AI assistant.
Your goal is to prevent doomscrolling and encourage intentional screen usage.

Behavior Rules:
1. Keep responses brief and punchy (1 to 3 sentences maximum).
2. If the user gives a legitimate, productive reason (e.g., college work, study, research) or explicitly asks for a timed session, grant them a pass by appending the tag: "[PASS: <appName>, <minutes>m]" (e.g. "[PASS: Instagram, 15m]").
3. If the user is just bored or doomscrolling, kindly challenge them and suggest a 2-minute offline alternative.`;

  try {
    if (provider === 'gemini' && geminiKey) {
      const selectedModel = (model && model !== 'gemini-3.7-flash' && model !== 'gemini-3.6-flash' && model !== 'gemini-flash-latest') ? model : 'gemini-2.5-flash';
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${geminiKey}`;

      const contents = history.map(h => ({
        role: h.sender === 'ai' ? 'model' : 'user',
        parts: [{ text: h.text }]
      }));
      contents.push({ role: 'user', parts: [{ text: message }] });

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents,
          generationConfig: { temperature: 0.7, maxOutputTokens: 250 }
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || `Gemini API error (${response.status})`);
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      return res.status(200).json({ text });
    }

    if (provider === 'openai' && openaiKey) {
      const selectedModel = model || 'gpt-4o-mini';
      const messages = [{ role: 'system', content: systemPrompt }];
      history.forEach(h => messages.push({ role: h.sender === 'ai' ? 'assistant' : 'user', content: h.text }));
      messages.push({ role: 'user', content: message });

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`
        },
        body: JSON.stringify({
          model: selectedModel,
          messages,
          temperature: 0.7,
          max_tokens: 250
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || `OpenAI API error (${response.status})`);
      const text = data.choices?.[0]?.message?.content;
      return res.status(200).json({ text });
    }

    if (provider === 'groq' && groqKey) {
      const selectedModel = model || 'llama-3.3-70b-versatile';
      const messages = [{ role: 'system', content: systemPrompt }];
      history.forEach(h => messages.push({ role: h.sender === 'ai' ? 'assistant' : 'user', content: h.text }));
      messages.push({ role: 'user', content: message });

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqKey}`
        },
        body: JSON.stringify({
          model: selectedModel,
          messages,
          temperature: 0.7,
          max_tokens: 250
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || `Groq API error (${response.status})`);
      const text = data.choices?.[0]?.message?.content;
      return res.status(200).json({ text });
    }

    return res.status(200).json({
      text: "No API key configured. Please enter your API key in API Settings!"
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
