import getImage from '../utils/getImage';
import getTranslatedText from '../utils/getTranslatedText';
import request from '../utils/request';
import getArticle from '../utils/getArticle';
import createArticle from '../utils/createArticle';
import _ from 'lodash';
import { parseArticlePage } from '../server/scraper/parse';

export const fetchArticleFromDB = async (articleSlug: string) => {
  const response = await getArticle(articleSlug);
  if (!response?.data) return null;
  const article = response.data;
  const document = typeof article.paragraphs === 'string'
    ? JSON.parse(article.paragraphs) : article.paragraphs;
  return {
    translatedDate: article.translated_date,
    translatedTitle: _.unescape(article.title),
    translatedParagraphs: document,
    articleImageData: article.image_data,
    recommendedArticleTitles: (article.recommended_article_titles || []).map(_.unescape),
    recommendedArticleImageData: article.recommended_article_images || [],
    recommendedArticleLinks: article.recommended_article_links || [],
  };
};

export const createArticleToDB = async (articleSlug: string) => {
  const url = new URL(articleSlug.replace(/^\/article\//, '/'), 'https://www.desh.tv');
  const article = await fetchArticle(url.toString());
  const categoryName = url.pathname.split('/').filter(Boolean)[0];
  const result = await createArticle(
    articleSlug, article.articleImageData, article.translatedTitle, categoryName,
    article.translatedDate,
    article.translatedParagraphs.map((content) => [{ type: 'text', content }]),
    article.recommendedArticleSlugs
  );
  if (!result?.data) throw new Error('The article could not be saved.');
  return await fetchArticleFromDB(articleSlug);
};

export default async function fetchArticle(articleUrl: string) {
  const url = new URL(articleUrl, 'https://www.desh.tv');
  const { data } = await request.get(`/data/desh-tv${url.pathname}${url.search}`);
  const article = parseArticlePage(data, articleUrl);
  const translatedTitle = await getTranslatedText('bn', 'en', article.title);
  const translatedParagraphs: string[] = [];
  for (const paragraph of article.paragraphs) {
    translatedParagraphs.push(await getTranslatedText('bn', 'en', paragraph));
  }
  return {
    translatedDate: article.translatedDate,
    translatedTitle,
    translatedParagraphs,
    articleImageData: await getImage(article.imageLink),
    recommendedArticleSlugs: article.recommendedArticleSlugs,
  };
}
