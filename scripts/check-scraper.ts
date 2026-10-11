import assert from 'node:assert/strict';
import { fetchArticle } from '../src/server/scraper/fetchArticle';
import { parseArticleLinks, parsePollPage } from '../src/server/scraper/parse';
import { getImageData } from '../src/server/scraper/getImageData';
import { resolveDeshUrl, scrapeRequest } from '../src/server/scraper/request';
import { translateText } from '../src/server/scraper/translate';
import { createStatuses } from '../src/server/scraper/types';

async function main() {
  const listingUrl = resolveDeshUrl('/templates/desh-web/all_news_page/more_news_ajax.php?page=0');
  const { data: listing } = await scrapeRequest.get<string>(listingUrl);
  const links = parseArticleLinks(listing, listingUrl);
  assert.ok(links.length > 0, 'The article listing contains no readable articles.');
  const statuses = createStatuses();
  const article = await fetchArticle(links[0], statuses);
  assert.equal(article.status, 200, 'The live article could not be scraped and translated.');
  assert.ok('articleSlug' in article);
  assert.ok(article.translatedParagraphs.length > 0);
  assert.ok(article.recommendedArticleSlugs.length > 0, 'Live recommendations were not extracted.');
  assert.ok(article.articleImageData.startsWith('data:image/'));
  assert.equal(await translateText('bn', 'en', 'স্বাস্থ্য'), 'health');

  const pollUrl = resolveDeshUrl('/templates/desh-web/opinion_poll/parent_content_list_ajax_new.php?page=0');
  const { data: pollHtml } = await scrapeRequest.get<string>(pollUrl);
  const polls = parsePollPage(pollHtml, pollUrl);
  assert.ok(polls.length > 0, 'The live poll listing contains no readable polls.');
  assert.ok((await getImageData(polls[0].imageLink)).startsWith('data:image/'));
  assert.ok(await translateText('bn', 'en', polls[0].title));
  console.log(JSON.stringify({
    articlesFound: links.length,
    articleSlug: article.articleSlug,
    translatedParagraphs: article.translatedParagraphs.length,
    recommendationsFound: article.recommendedArticleSlugs.length,
    articleImageBytes: Buffer.from(article.articleImageData.split(',')[1], 'base64').length,
    pollsFound: polls.length,
    firstPollVotes: polls[0].voteCount,
    fetchingErrors: statuses.fetchingErrors,
  }, null, 2));
}

main().catch(error => {
  console.error('Scraper check failed:', error.message);
  process.exitCode = 1;
});

