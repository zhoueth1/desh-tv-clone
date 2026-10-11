import { prisma } from '../../src/keystone/context';
import { getRecommendedArticles } from '../../src/server/database/recommendedArticles';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });
  const articleSlug = req.body?.articleSlug;
  if (typeof articleSlug !== 'string') return res.status(400).json({ error: 'articleSlug is required.' });
  try {
    const article = await prisma.article.findUnique({ where: { slug: articleSlug } });
    if (!article) return res.status(400).json({ data: null });
    const recommended = await getRecommendedArticles(article.id, prisma);
    return res.status(200).json({ data: {
      image_data: article.image_data, title: article.title, translated_date: article.translated_date,
      paragraphs: article.content,
      recommended_article_titles: recommended.recommendedArticleTitles,
      recommended_article_images: recommended.recommendedArticleImageData,
      recommended_article_links: recommended.recommendedArticleLinks,
    } });
  } catch (error) {
    console.error('Article lookup failed:', error.message);
    return res.status(500).json({ error: 'Unable to load the article.' });
  }
}
