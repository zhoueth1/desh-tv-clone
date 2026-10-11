import * as cheerio from 'cheerio';
import type { NextApiRequest, NextApiResponse } from 'next';
import { resolveDeshUrl, scrapeRequest } from '../../src/server/scraper/request';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Use POST to read category pages.' });
  }
  try {
    const pageUrl = resolveDeshUrl(req.body?.pageUrl);
    const { data } = await scrapeRequest.get<string>(pageUrl);
    const dom = cheerio.load(data);
    const summary = dom('.col-md-2.d-flex.col-4.justify-content-center.justify-content-md-end.text-center.text-md-right').text()
      .replace(/[\u09e6-\u09ef]/g, (digit) => String(digit.charCodeAt(0) - 0x09e6));
    const lastPage = summary.match(/\/\s*(\d+)/)?.[1];
    const pages = dom('a[href]').toArray().map((anchor) => {
      try {
        const url = new URL(dom(anchor).attr('href'), pageUrl);
        return Number(url.searchParams.get('page')) || 0;
      } catch { return 0; }
    });
    return res.status(200).json({ categoryMaxPages: Number(lastPage) || Math.max(1, ...pages) });
  } catch {
    return res.status(400).json({ error: 'The category listing could not be fetched.' });
  }
}
