import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../src/keystone/context';
import { categoryList } from '../../src/constants';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });
  try {
    let count = 0;
    for (const name of categoryList) {
      const slug = `/${name}`;
      if (!await prisma.category.findFirst({ where: { slug } })) {
        await prisma.category.create({ data: { name, slug } });
        count++;
      }
    }
    return res.status(200).json({ test: { count } });
  } catch (error) {
    console.error('Category setup failed:', error.message);
    return res.status(500).json({ error: 'Unable to initialize categories.' });
  }
}
