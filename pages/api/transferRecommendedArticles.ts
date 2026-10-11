import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../src/keystone/context';
import { readLegacyRows } from '../../src/server/database/legacy';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });
  if (!process.env.OLD_DATABASE_URL) return res.status(400).json({ error: 'OLD_DATABASE_URL must be configured to transfer legacy data.' });
  try {
    const relations = await readLegacyRows('recommended_articles');
    let count = 0;
    for (const relation of relations) {
      const id = Number(relation.article_id);
      const recommendedId = Number(relation.recommended_article_id);
      const expected = new Set([id, recommendedId]).size;
      if (await prisma.article.count({ where: { id: { in: [id, recommendedId] } } }) !== expected) continue;
      await prisma.article.update({ where: { id }, data: { recommendedArticles: { connect: { id: recommendedId } } } });
      count++;
    }
    return res.status(200).json({ count });
  } catch (error) {
    console.error('Recommended article transfer failed:', error.message);
    return res.status(400).json({ error: 'Unable to transfer recommendations from the legacy database.' });
  }
}
