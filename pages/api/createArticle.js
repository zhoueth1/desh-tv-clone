import { prisma } from '../../src/keystone/context';
import { createArticle } from '../../src/server/database/createArticle';

export const config = { api: { bodyParser: { sizeLimit: '10mb' } } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });
  const { articleSlug, imageData, title, categoryName, translatedDate, paragraphs, recommendedArticleSlugs } = req.body || {};
  if (!articleSlug || !title || !categoryName || !translatedDate || !paragraphs) {
    return res.status(400).json({ error: 'Required article data is missing.' });
  }
  const result = await createArticle(articleSlug, imageData, title, categoryName, translatedDate,
    paragraphs, recommendedArticleSlugs, true, prisma);
  return res.status(result.status).json({ data: result.data ?? null });
}
