import { getImageData } from './getImageData';
import { parseArticlePage } from './parse';
import { translateText } from './translate';
import { resolveDeshUrl, scrapeRequest } from './request';
import createError from './createError';
import { ErrorStage, ErrorType } from './types';

export async function fetchArticle(articleUrl: string, statuses?) {
  try {
    const url = resolveDeshUrl(articleUrl);
    const { data } = await scrapeRequest.get<string>(url);
    const article = parseArticlePage(data, url);
    const translatedTitle = await translateText('bn', 'en', article.title);
    const translatedParagraphs = [];
    for (const paragraph of article.paragraphs) {
      translatedParagraphs.push([{ type: 'text', content: await translateText('bn', 'en', paragraph) }]);
    }
    return {
      articleUrl: article.articleUrl,
      articleSlug: article.articleSlug,
      categoryName: article.categoryName,
      translatedDate: article.translatedDate,
      translatedTitle,
      translatedParagraphs,
      articleImageData: await getImageData(article.imageLink, statuses, url),
      recommendedArticleSlugs: article.recommendedArticleSlugs,
      status: 200,
    };
  } catch {
    createError(statuses, ErrorType.GeneralCantFetch, articleUrl, ErrorStage.Fetching);
    return { status: 400, articleUrl };
  }
}

