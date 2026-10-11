import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../src/keystone/context';
import { readLegacyRows } from '../../src/server/database/legacy';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });
  if (!process.env.OLD_DATABASE_URL) return res.status(400).json({ error: 'OLD_DATABASE_URL must be configured to transfer legacy data.' });
  try {
    const categories = await readLegacyRows('categories');
    const result = await prisma.category.createMany({
      data: categories.map(category => ({ id: Number(category.id), name: category.name, slug: category.slug })),
      skipDuplicates: true,
    });
    await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('"Category"', 'id'), COALESCE(MAX(id), 1), COUNT(*) > 0) FROM "Category"`;
    return res.status(200).json({ count: result.count });
  } catch (error) {
    console.error('Category transfer failed:', error.message);
    return res.status(400).json({ error: 'Unable to transfer categories from the legacy database.' });
  }
}
