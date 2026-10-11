import { translateText } from '../../src/server/scraper/translate';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Use POST to translate text.' });
  }
  if (typeof req.body?.text !== 'string' || !req.body?.from || !req.body?.to) {
    return res.status(400).json({ error: 'Source, target, and text are required.' });
  }
  try {
    const data = await translateText(req.body.from, req.body.to, req.body.text);
    return res.status(200).json({ data });
  } catch {
    return res.status(502).json({ error: 'The translation provider is unavailable.' });
  }
}
