// api/claude.js
// Vercel Serverless Function — proxies requests to Anthropic API
// Your ANTHROPIC_API_KEY is stored as a Vercel environment variable,
// never exposed to the browser.

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Basic origin check (replace with your actual Vercel domain once deployed)
  const origin = req.headers.origin || '';
  const allowed = [
    'https://your-app.vercel.app',   // ← replace with your Vercel URL
    'http://localhost:3000',          // for local dev
    'http://localhost:5500',          // VS Code Live Server
    'http://127.0.0.1:5500',
  ];
  // In production uncomment this block:
  // if (!allowed.includes(origin)) {
  //   return res.status(403).json({ error: 'Forbidden' });
  // }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server misconfigured: missing API key' });
  }

  try {
    const body = req.body;

    // Validate required fields
    if (!body || !body.messages || !body.model) {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    // Forward to Anthropic
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    // Forward the status and response
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(response.status).json(data);

  } catch (err) {
    console.error('[NEXUS proxy] Error:', err);
    return res.status(500).json({ error: 'Proxy error', message: err.message });
  }
}

// Handle CORS preflight
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4mb',
    },
  },
};
