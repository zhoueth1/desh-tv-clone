import * as cheerio from 'cheerio';
import request from '../utils/request';

export default async function fetchImageLink({ articleUrl }: { articleUrl: string }) {
  const url = new URL(articleUrl.replace(/^\/article\//, '/'), 'https://www.desh.tv');
  if (!['desh.tv', 'www.desh.tv'].includes(url.hostname)) {
    throw new Error('Only Desh TV article URLs are supported.');
  }
  const { data } = await request.get(`/data/desh-tv${url.pathname}${url.search}`);
  const dom = cheerio.load(data);
  const image = dom('.dtl_img_section .img img').first().attr('src') ||
    dom('figure > img').first().attr('data-air-img') ||
    dom('meta[property="og:image"]').attr('content');
  if (!image) throw new Error('The article image could not be found.');
  return new URL(image, url).toString();
}
