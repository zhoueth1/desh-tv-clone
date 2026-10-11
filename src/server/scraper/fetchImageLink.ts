import * as cheerio from 'cheerio';
import createError from './createError';
import { ErrorStage } from './types';
import { resolveDeshUrl, scrapeRequest } from './request';

export async function fetchImageLink({ articleUrl, statuses }) {
  try {
    const url = resolveDeshUrl(articleUrl);
    const { data } = await scrapeRequest.get<string>(url);
    const dom = cheerio.load(data);
    const image = dom('.dtl_img_section .img img').first().attr('src') ||
      dom('figure > img').first().attr('data-air-img') ||
      dom('meta[property="og:image"]').attr('content');
    if (!image) throw new Error('The article image could not be found.');
    return resolveDeshUrl(new URL(image, url).toString());
  } catch (error) {
    createError(statuses, 'cantFetchImageLink', articleUrl, ErrorStage.Fetching);
    throw error;
  }
}
