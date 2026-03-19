export const config = { api: { bodyParser: true } };

const NEXUS_TOKEN = 'nx_83c8a0f2fea04883418d0da02d49eef0';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const token = req.headers['x-nexus-token'];
  if (token !== NEXUS_TOKEN) return res.status(403).json({ error: 'Forbidden' });

  const { provider, text, genre, voiceId } = req.body || {};
  if (!provider || !text) return res.status(400).json({ error: 'Missing provider or text' });

  try {
    if (provider === 'hume') {
      const response = await fetch('https://api.hume.ai/v0/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Hume-Api-Key': process.env.HUME_API_KEY },
        body: JSON.stringify({ utterances: [{ text, description: genre || '' }], format: { type: 'mp3' }, num_generations: 1 })
      });
      const data = await response.json();
      res.status(response.status).json(data);

    } else if (provider === 'elevenlabs') {
      const vid = voiceId || 'onwK4e9ZLuTAKqWW03F9';
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${vid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'xi-api-key': process.env.ELEVENLABS_API_KEY },
        body: JSON.stringify({ text, model_id: 'eleven_turbo_v2_5', voice_settings: { stability: 0.48, similarity_boost: 0.82, style: 0.28, use_speaker_boost: true } })
      });
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
