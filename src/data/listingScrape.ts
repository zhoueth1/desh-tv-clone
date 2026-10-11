import * as cheerio from 'cheerio';
import request from '../utils/request';
import getTranslatedText from '../utils/getTranslatedText';
import fetchImageLink from './imageScrape';
import getImage from '../utils/getImage';

export default async function fetchListing(path: string, limit: number) {
  const { data } = await request.get(`/data/desh-tv/${path.replace(/^\//, '')}`);
  const dom = cheerio.load(data);
  const articles = new Map<string, string>();
  dom('a[href]').each((_, anchor) => {
    const href = dom(anchor).attr('href');
    try {
      const url = new URL(href, 'https://www.desh.tv');
      if (!['desh.tv', 'www.desh.tv'].includes(url.hostname) ||
          !/^\/[a-z-]+\/(?:[^/]+\/)?\d+\/?$/.test(url.pathname) ||
          url.pathname.startsWith('/opinion-poll/')) return;
      const title = dom(anchor).attr('title') ||
        dom(anchor).find('h1,h2,h3,h4,h5,p').first().text().trim() ||
        dom(anchor).text().trim() ||
        dom(anchor).find('img').attr('alt') || '';
      if (!articles.has(url.toString()) || title) articles.set(url.toString(), title);
    } catch { /* Ignore navigation links without a valid article URL. */ }
  });
  const entries = Array.from(articles.entries()).filter(([, title]) => title).slice(0, limit);
  const urls = entries.map(([url]) => url);
  const translatedTitles: string[] = [];
  const imageLinks: string[] = [];
  const imageData: string[] = [];
  for (const [url, title] of entries) {
    translatedTitles.push(await getTranslatedText('bn', 'en', title));
    const imageLink = await fetchImageLink({ articleUrl: url });
    imageLinks.push(imageLink);
    imageData.push(await getImage(imageLink));
  }
  return { urls, translatedTitles, imageLinks, imageData };
}
