export const config = { api: { bodyParser: true } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

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
      if (!data.generations || !data.generations[0]) {
        return res.status(500).json({ error: 'Hume returned no audio' });
      }
      res.status(200).json(data);

    } else if (provider === 'elevenlabs') {
      const vid = voiceId || 'onwK4e9ZLuTAKqWW03F9';
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${vid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'xi-api-key': process.env.ELEVENLABS_API_KEY },
        body: JSON.stringify({ text, model_id: 'eleven_turbo_v2_5', voice_settings: { stability: 0.48, similarity_boost: 0.82, style: 0.28, use_speaker_boost: true } })
      });
      if (!response.ok) return res.status(response.status).json({ error: 'ElevenLabs error' });
      const buffer = await response.arrayBuffer();
      res.setHeader('Content-Type', 'audio/mpeg');
      res.status(200).send(Buffer.from(buffer));

    } else {
      res.status(400).json({ error: 'Unknown provider' });
    }
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
}
