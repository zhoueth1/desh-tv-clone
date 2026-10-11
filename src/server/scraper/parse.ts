import * as cheerio from 'cheerio';
import moment from 'moment';
import 'moment/locale/bn';
import { resolveDeshUrl } from './request';

// Registering a Moment locale changes its global default; the archive displays English dates.
moment.locale('en');

export function parseDeshDate(value: string) {
  const text = value.replace(/\s+/g, ' ').trim();
  const date = moment.parseZone(
    text.includes('GMT') ? text : `${text} +06:00`,
    ['DD MMMM YYYY, HH:mm ZZ', 'DD MMMM YYYY, HH:mm | GMT ZZ'],
    'bn',
    false
  );
  if (!date.isValid()) throw new Error('The publication date could not be read.');
  return date.valueOf();
}

export function parseArticlePage(html: string, articleUrl: string) {
  const url = new URL(resolveDeshUrl(articleUrl));
  const dom = cheerio.load(html);
  const title = dom('h1').first().text().trim();
  const dateText = dom('.rpt_info_section > .entry_update').first().text().trim();
  const paragraphs = dom('.dtl_content_section > p').toArray()
    .map((paragraph) => dom(paragraph).text().trim())
    .filter(Boolean);
  const image = dom('.dtl_img_section .img img').first().attr('src') ||
    dom('meta[property="og:image"]').attr('content');
  if (!title || !dateText || !paragraphs.length || !image) {
    throw new Error('The article is missing a title, publication date, content, or image.');
  }
  const categoryName = url.pathname.split('/').filter(Boolean)[0];
  const articleSlug = `/article${url.pathname.replace(/\/$/, '')}`;
  const recommendedArticleSlugs = parseArticleLinks(
    dom('#related_more, #related_news, .related-more-news, .more_dtl_news').toString(),
    url.toString()
  ).map((link) => `/article${new URL(link).pathname.replace(/\/$/, '')}`)
    .filter((slug) => slug !== articleSlug);
  return {
    articleUrl: url.toString(),
    articleSlug: `/article${url.pathname.replace(/\/$/, '')}`,
    categoryName,
    title,
    translatedDate: parseDeshDate(dateText),
    paragraphs,
    imageLink: resolveDeshUrl(new URL(image, url).toString()),
    recommendedArticleSlugs,
  };
}

export function parseArticleLinks(html: string, pageUrl: string) {
  const dom = cheerio.load(html);
  const links = dom('a[href]').toArray().flatMap((anchor) => {
    try {
      const url = new URL(resolveDeshUrl(new URL(dom(anchor).attr('href'), pageUrl).toString()));
      if (!/^\/[a-z-]+\/(?:[^/]+\/)?\d+\/?$/.test(url.pathname) ||
          url.pathname.startsWith('/opinion-poll/')) return [];
      return [url.toString()];
    } catch {
      return [];
    }
  });
  return Array.from(new Set(links));
}

export function parsePollPage(html: string, pageUrl: string) {
  const dom = cheerio.load(html);
  const polls = new Map<string, {
    slug: string; imageLink: string; title: string; translatedDate: number;
    voteCount: { yes: number; no: number; 'no-comment': number };
  }>();
  dom('.poll_block').each((_, element) => {
    const block = dom(element);
    const href = block.find('a[href]').first().attr('href');
    const image = block.find('.imgWrep > img').first().attr('src');
    const title = block.find('a > p').first().text().trim();
    const date = block.parent().find('.poll_time').first().text().trim();
    if (!href || !image || !title || !date) throw new Error('A poll is missing required data.');
    const id = new URL(href, pageUrl).pathname.split('/').filter(Boolean).pop();
    const slug = `/polls/${id}`;
    if (polls.has(slug)) return;
    const normalizedVotes = block.find('.total-vote').first().text()
      .replace(/[\u09e6-\u09ef]/g, (digit) => String(digit.charCodeAt(0) - 0x09e6));
    const totalVotes = Number(normalizedVotes.replace(/[^0-9]/g, ''));
    const percentages = block.find('.options_block .progress').toArray().slice(0, 3)
      .map((progress) => Number(dom(progress).attr('data')));
    if (percentages.length !== 3 || percentages.some((value) => !Number.isFinite(value))) {
      throw new Error('A poll is missing its vote results.');
    }
    polls.set(slug, {
      slug,
      imageLink: resolveDeshUrl(new URL(image, pageUrl).toString()),
      title,
      translatedDate: parseDeshDate(date),
      voteCount: {
        yes: Math.round(totalVotes * percentages[0] / 100),
        no: Math.round(totalVotes * percentages[1] / 100),
        'no-comment': Math.round(totalVotes * percentages[2] / 100),
      },
    });
  });
  return Array.from(polls.values());
}


