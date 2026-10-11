import assert from 'node:assert/strict';
import { test } from 'node:test';
import moment from 'moment';
import { parseArticleLinks, parseArticlePage, parseDeshDate, parsePollPage } from '../src/server/scraper/parse';
import { mapWithConcurrency, resolveDeshUrl } from '../src/server/scraper/request';
import createError from '../src/server/scraper/createError';
import { createStatuses, ErrorStage } from '../src/server/scraper/types';

test('article links resolve both hosts and relative paths, deduplicate, and exclude navigation', () => {
  const html = `<a href="https://desh.tv/national/42">First</a>
    <a href="/national/42">Duplicate</a><a href="/sports/43">Sport</a>
    <a href="/opinion-poll/44">Poll</a><a href="https://example.org/news/45">External</a>
    <a href="/national">Category</a><a>No href</a>`;
  assert.deepEqual(parseArticleLinks(html, 'https://desh.tv/'), [
    'https://www.desh.tv/national/42', 'https://www.desh.tv/sports/43'
  ]);
});

test('Bengali publication dates preserve the Bangladesh timezone', () => {
  assert.equal(new Date(parseDeshDate('১১ অক্টোবর ২০২৬, ২১:৩০')).toISOString(), '2026-10-11T15:30:00.000Z');
  assert.equal(moment.locale(), 'en');
});

test('article parsing keeps nested paragraph text and safely resolves the slug and image', () => {
  const article = parseArticlePage(`<h1>Example headline</h1>
    <div class="rpt_info_section"><span class="entry_update">১১ অক্টোবর ২০২৬, ২১:৩০</span></div>
    <div class="dtl_content_section"><p>Before <a href="/national/43">linked text</a> after.</p><p><strong>Another paragraph.</strong></p><p></p></div>
    <div class="dtl_img_section"><div class="img"><img src="/assets/example.png"></div></div>`,
    'https://desh.tv/national/42');
  assert.equal(article.articleSlug, '/article/national/42');
  assert.equal(article.categoryName, 'national');
  assert.deepEqual(article.paragraphs, ['Before linked text after.', 'Another paragraph.']);
  assert.equal(article.imageLink, 'https://www.desh.tv/assets/example.png');
  assert.throws(() => parseArticlePage('<h1>Missing article</h1>', 'https://desh.tv/national/42'));
});

test('poll parsing deduplicates mobile markup and converts percentages to actual votes', () => {
  const poll = `<div><div class="poll_time">২৩ আগস্ট ২০২৫, ১৬:৩৭</div>
    <div class="poll_block"><a href="/opinion-poll/example/56"><span class="imgWrep"><img src="/assets/poll.jpg"></span></a>
    <a href="/opinion-poll/56"><p>Example poll question?</p></a>
    <div class="options_block"><span class="progress" data="71.428571428571"></span>
    <span class="progress" data="28.571428571429"></span><span class="progress" data="0"></span>
    <div class="total-vote">মোট ভোটদাতাঃ ৭ জন</div></div></div></div>`;
  const results = parsePollPage(poll + poll, 'https://www.desh.tv/');
  assert.equal(results.length, 1);
  assert.equal(results[0].slug, '/polls/56');
  assert.deepEqual(results[0].voteCount, { yes: 5, no: 2, 'no-comment': 0 });
});

test('scraping accepts the existing proxy URL format and rejects unrelated servers', () => {
  assert.equal(resolveDeshUrl('http://localhost:3000/data/desh-tv/national/42'), 'https://www.desh.tv/national/42');
  assert.equal(resolveDeshUrl('/article/national/42'), 'https://www.desh.tv/national/42');
  assert.throws(() => resolveDeshUrl('http://127.0.0.1:5432/'));
  assert.throws(() => resolveDeshUrl('https://desh.tv@example.org/'));
});

test('article workers bound concurrency while preserving listing order', async () => {
  let active = 0;
  let maximum = 0;
  const values = await mapWithConcurrency([1, 2, 3, 4], 2, async (value) => {
    maximum = Math.max(maximum, ++active);
    await new Promise(resolve => setTimeout(resolve, 5));
    active--;
    return value * 2;
  });
  assert.deepEqual(values, [2, 4, 6, 8]);
  assert.equal(maximum, 2);
});

test('fetch and creation errors are recorded synchronously for the summary', () => {
  const statuses = createStatuses();
  createError(statuses, 'upstream', '/article/national/42', ErrorStage.Fetching);
  createError(statuses, 'database', '/article/national/42', ErrorStage.Creation);
  assert.equal(statuses.fetchingErrors, 1);
  assert.equal(statuses.creationErrors, 1);
  assert.deepEqual(statuses.errors['/article/national/42'], {
    fetching: ['upstream'], creation: ['database']
  });
});



test('recommendations use related sections, exclude navigation and self links, and deduplicate', () => {
  const article = parseArticlePage(`<h1>Example headline</h1>
    <div class="rpt_info_section"><span class="entry_update">১১ অক্টোবর ২০২৬, ২১:৩০</span></div>
    <div class="dtl_content_section"><p>Content with an unrelated <a href="/sports/99">article citation</a>.</p></div>
    <div class="dtl_img_section"><div class="img"><img src="/assets/example.png"></div></div>
    <nav><a href="/national/98">Unrelated navigation</a></nav>
    <div id="related_more"><a href="/national/43">Next</a><a href="https://desh.tv/national/43">Duplicate host</a>
      <a href="/national/42">Self</a><a href="https://example.org/national/45">External</a></div>
    <div class="more_dtl_news"><a href="/sports/44">Another recommendation</a><a href="/sports/44">Duplicate image</a></div>`,
    'https://www.desh.tv/national/42');
  assert.deepEqual(article.recommendedArticleSlugs, ['/article/national/43', '/article/sports/44']);
});
