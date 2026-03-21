// api/image.js — Gemini image generation for NEXUS
// Place at /api/image.js in your Vercel project root
// Uses the SAME GEMINI_API_KEY as /api/story.js — no new key needed!
// Model: gemini-3.1-flash-image-preview ($0.045/image, free tier: 500/day)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const API_KEY = process.env.GEMINI_API_KEY;
  if (!API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not configured on server' });
  }

  const { prompt } = req.body;
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'prompt is required' });
  }

  try {
    const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent';

    const geminiRes = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': API_KEY
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt.slice(0, 2000) }]
        }],
        generationConfig: {
          responseModalities: ['TEXT', 'IMAGE']
        }
      })
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('[Gemini Image] Error:', geminiRes.status, errText.slice(0, 300));
      return res.status(geminiRes.status).json({
        error: `Gemini API error: ${geminiRes.status}`,
        detail: errText.slice(0, 200)
      });
    }

    const data = await geminiRes.json();

    // Find the image part in the response
    const parts = data?.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find(p => p.inlineData && p.inlineData.mimeType?.startsWith('image/'));

    if (!imagePart) {
      console.error('[Gemini Image] No image in response:', JSON.stringify(data).slice(0, 300));
      return res.status(502).json({ error: 'Gemini returned no image' });
    }

    // Return base64 image data + mime type to client
    return res.status(200).json({
      imageData: imagePart.inlineData.data,
      mimeType: imagePart.inlineData.mimeType
    });

  } catch (err) {
    console.error('[Gemini Image] Server error:', err);
    return res.status(500).json({ error: err.message });
  }
}
