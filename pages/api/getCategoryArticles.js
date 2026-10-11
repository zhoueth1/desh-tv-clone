import { prisma } from '../../src/keystone/context';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });
  const categoryName = req.body?.categoryName;
  if (typeof categoryName !== 'string') return res.status(400).json({ error: 'categoryName is required.' });
  try {
    const results = await prisma.article.findMany({ where: { category: { name: categoryName } } });
    return res.status(200).json({ results });
  } catch (error) {
    console.error('Category lookup failed:', error.message);
    return res.status(500).json({ error: 'Unable to load category articles.' });
  }
}
