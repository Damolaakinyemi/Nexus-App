export const config = { api: { bodyParser: true } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { provider, text, genre, voiceId } = req.body || {};

  if (!provider || !text) {
    return res.status(400).json({ error: 'Missing provider or text' });
  }

  try {
    if (provider === 'hume') {
      const response = await fetch('https://api.hume.ai/v0/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Hume-Api-Key': process.env.HUME_API_KEY
        },
        body: JSON.stringify({
          utterances: [{ text, description: genre || '' }],
          format: { type: 'mp3' },
          num_generations: 1
        })
      });
      const data = await response.json();
      res.status(response.status).json(data);

    } else if (provider === 'elevenlabs') {
      const vid = voiceId || 'onwK4e9ZLuTAKqWW03F9';
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${vid}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'xi-api-key': process.env.ELEVENLABS_API_KEY
          },
          body: JSON.stringify({
            text,
            model_id: 'eleven_turbo_v2_5',
            voice_settings: {
              stability: 0.48,
              similarity_boost: 0.82,
              style: 0.28,
              use_speaker_boost: true
            }
          })
        }
      );
      const buffer = await response.arrayBuffer();
      res.setHeader('Content-Type', 'audio/mpeg');
      res.status(200).send(Buffer.from(buffer));

    } else {
      res.status(400).json({ error: 'Unknown provider: ' + provider });
    }
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
}
```

6. Click **Commit changes**

---

Then go back to the root of your repo and do the same for `vercel.json` — create it at the top level, **not** inside the `api` folder. Your final repo structure should look like this:
```
Nexus-App/
├── api/
│   ├── story.js
│   └── voice.js        ← new
├── vercel.json         ← new
├── index.html
├── adventure.mp3
├── fantasy.mp3
└── ... (rest of mp3s)
