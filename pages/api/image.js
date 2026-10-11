import { getImageData } from '../../src/server/scraper/getImageData';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Use POST to fetch an image.' });
  }
  try {
    const data = await getImageData(req.body?.url);
    return res.status(200).json({ data });
  } catch {
    return res.status(400).json({ error: 'The Desh TV image could not be fetched.' });
  }
}
