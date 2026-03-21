// api/image.js — Fal.AI FLUX Schnell image generation
// Place this file at /api/image.js in your Vercel project
// Set FAL_KEY environment variable in Vercel dashboard

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const FAL_KEY = process.env.FAL_KEY;
  if (!FAL_KEY) {
    return res.status(500).json({ error: 'FAL_KEY not configured on server' });
  }

  try {
    const {
      prompt,
      image_size = 'landscape_16_9',
      num_inference_steps = 4,
      num_images = 1,
      enable_safety_checker = true,
      output_format = 'jpeg',
      seed
    } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'prompt is required' });
    }

    // Call Fal.AI FLUX Schnell — fastest, cheapest, great quality
    const falRes = await fetch('https://fal.run/fal-ai/flux/schnell', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Key ${FAL_KEY}`
      },
      body: JSON.stringify({
        prompt: prompt.slice(0, 2000), // Fal.AI prompt limit
        image_size,
        num_inference_steps,
        num_images,
        enable_safety_checker,
        output_format,
        ...(seed && { seed })
      })
    });

    if (!falRes.ok) {
      const errText = await falRes.text();
      console.error('[Fal.AI] Error:', falRes.status, errText);
      return res.status(falRes.status).json({
        error: `Fal.AI error: ${falRes.status}`,
        detail: errText.slice(0, 200)
      });
    }

    const data = await falRes.json();

    // Return exactly what client expects: { images: [{ url: '...' }] }
    return res.status(200).json({
      images: data.images || [],
      seed: data.seed,
      prompt: data.prompt
    });

  } catch (err) {
    console.error('[Fal.AI] Server error:', err);
    return res.status(500).json({ error: err.message });
  }
}
