import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchArticle } from '../../src/server/scraper/fetchArticle';
import { createArticle } from '../../src/server/database/createArticle';
import { createRecommendedArticles } from '../../src/server/database/createRecommendedArticles';
import { prisma } from '../../src/keystone/context';
import { parseArticleLinks } from '../../src/server/scraper/parse';
import { mapWithConcurrency, resolveDeshUrl, scrapeRequest } from '../../src/server/scraper/request';
import { createStatuses, ErrorStage, ErrorType } from '../../src/server/scraper/types';
import createError from '../../src/server/scraper/createError';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Use POST to scrape articles.' });
  }
  const statuses = createStatuses();
  try {
    const pageUrl = resolveDeshUrl(req.body?.pageUrl);
    const { data } = await scrapeRequest.get<string>(pageUrl);
    const articleLinks = parseArticleLinks(data, pageUrl);
    const recommendations: { slug: string; links: string[]; articleUrl: string }[] = [];
    await mapWithConcurrency(articleLinks, 2, async (link) => {
      statuses.attempts++;
      const article = await fetchArticle(link, statuses);
      if (article.status !== 200 || !('articleSlug' in article)) return;
      await createArticle(
        article.articleSlug,
        article.articleImageData,
        article.translatedTitle,
        article.categoryName,
        article.translatedDate,
        article.translatedParagraphs,
        article.recommendedArticleSlugs,
        false,
        prisma,
        article.articleUrl,
        statuses
      );
      recommendations.push({
        slug: article.articleSlug,
        links: article.recommendedArticleSlugs,
        articleUrl: article.articleUrl,
      });
    });
    // Targets can appear later in the same listing, so connect after its inserts finish.
    // This also restores links on previously scraped articles when a batch is retried.
    await mapWithConcurrency(recommendations, 2, async ({ slug, links, articleUrl }) => {
      if (!links.length) return;
      try {
        const article = await prisma.article.findUnique({ where: { slug }, select: { id: true } });
        if (article) await createRecommendedArticles(links, article.id, prisma);
      } catch {
        createError(statuses, ErrorType.GeneralCantCreate, articleUrl, ErrorStage.Creation);
      }
    });
    return res.status(200).json({ statuses });
  } catch {
    return res.status(400).json({ error: 'The Desh TV article listing could not be fetched.', statuses });
  }
}
