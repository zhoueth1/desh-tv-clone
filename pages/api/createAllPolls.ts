import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../src/keystone/context';
import { createPoll } from '../../src/server/database/createPoll';
import { getImageData } from '../../src/server/scraper/getImageData';
import { parsePollPage } from '../../src/server/scraper/parse';
import { mapWithConcurrency, resolveDeshUrl, scrapeRequest } from '../../src/server/scraper/request';
import { translateText } from '../../src/server/scraper/translate';
import { createStatuses, ErrorStage, ErrorType } from '../../src/server/scraper/types';
import createError from '../../src/server/scraper/createError';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Use POST to scrape polls.' });
  }
  const statuses = createStatuses();
  try {
    const pageUrl = resolveDeshUrl(req.body?.pageUrl);
    const { data } = await scrapeRequest.get<string>(pageUrl);
    const polls = parsePollPage(data, pageUrl);
    await mapWithConcurrency(polls, 2, async (poll) => {
      statuses.attempts++;
      try {
        const title = await translateText('bn', 'en', poll.title);
        const imageData = await getImageData(poll.imageLink, statuses, poll.slug);
        await createPoll(poll.slug, imageData, title, poll.translatedDate, poll.voteCount, prisma, statuses);
      } catch {
        createError(statuses, ErrorType.GeneralCantFetch, poll.slug, ErrorStage.Fetching);
      }
    });
    return res.status(200).json({ statuses });
  } catch {
    return res.status(400).json({ error: 'The Desh TV poll listing could not be fetched.', statuses });
  }
}
