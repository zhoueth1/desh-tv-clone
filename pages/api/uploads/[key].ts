import type { NextApiRequest, NextApiResponse } from 'next';
import { storedImage } from '../../../src/keystone/storage';
import { keystoneContext } from '../../../src/keystone/context';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return res.status(405).json({ error: 'Method not allowed.' });
  }
  const key = req.query.key;
  if (typeof key !== 'string') return res.status(400).json({ error: 'An image key is required.' });
  try {
    const { bytes, contentType } = await storedImage(key, keystoneContext);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', bytes.length);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    return res.status(200).end(req.method === 'HEAD' ? undefined : bytes);
  } catch {
    return res.status(404).json({ error: 'Image not found.' });
  }
}
