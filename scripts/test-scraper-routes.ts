import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd(), process.env.NODE_ENV !== 'production');

async function main() {
  const databaseUrl = new URL(process.env.DATABASE_URL || '');
  assert.ok(['127.0.0.1', 'localhost', '[::1]'].includes(databaseUrl.hostname),
    'Run this route integration check against a local PostgreSQL database.');
  const { prisma } = await import('../src/keystone/context');
  const { scrapeRequest } = await import('../src/server/scraper/request');
  const { default: handler } = await import('../pages/api/createAllArticles');
  const categoryName = `scraper-check-${randomUUID().replace(/[0-9]/g, 'x')}`;
  const firstId = Date.now();
  const paths = [`/${categoryName}/${firstId}`, `/${categoryName}/${firstId + 1}`];
  const slugs = paths.map(path => '/article' + path);
  const pageUrl = 'https://www.desh.tv/route-test-listing';
  const articleHtml = (index: number) => `<h1>Route verification headline ${index}</h1>
    <div class="rpt_info_section"><span class="entry_update">১১ অক্টোবর ২০২৬, ২১:৩০</span></div>
    <div class="dtl_content_section"><p>Route verification content.</p></div>
    <div class="dtl_img_section"><div class="img"><img src="/assets/route-test.png"></div></div>
    <div id="related_more"><a href="${paths[1 - index]}">Related article</a></div>`;
  const originalGet = scrapeRequest.get;
  let categoryId: number | undefined;
  try {
    categoryId = (await prisma.category.create({ data: { name: categoryName, slug: '/' + categoryName } })).id;
    // Only upstream responses are fixtures; this invokes the actual API handler and real Prisma client.
    scrapeRequest.get = (async (url: string) => {
      const parsed = new URL(url);
      if (url === pageUrl) return {
        data: paths.map(path => `<a href="${path}">Article</a>`).join(''), headers: {},
      };
      const index = paths.indexOf(parsed.pathname);
      if (index !== -1) return { data: articleHtml(index), headers: {} };
      if (parsed.pathname === '/assets/route-test.png') return {
        data: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aK7sAAAAASUVORK5CYII=', 'base64'),
        headers: { 'content-type': 'image/png' },
      };
      throw new Error('Unexpected upstream request in route integration check.');
    }) as typeof scrapeRequest.get;

    async function callRoute() {
      let statusCode = 0;
      let response: any;
      const res = {
        status(code: number) { statusCode = code; return this; },
        json(value: unknown) { response = value; return this; },
        setHeader() {},
      };
      await handler({ method: 'POST', body: { pageUrl } } as any, res as any);
      assert.equal(statusCode, 200);
      return response.statuses;
    }
    const created = await callRoute();
    assert.equal(created.completed, 2);
    assert.equal(created.fetchingErrors, 0);
    assert.equal(created.creationErrors, 0);
    const articles = await prisma.article.findMany({
      where: { slug: { in: slugs } },
      select: { slug: true, recommendedArticles: { select: { slug: true } } },
    });
    assert.equal(articles.length, 2);
    for (const article of articles) {
      assert.equal(article.recommendedArticles.length, 1);
      assert.equal(article.recommendedArticles[0].slug, slugs[1 - slugs.indexOf(article.slug)]);
    }

    const retried = await callRoute();
    assert.equal(retried.completed, 0);
    assert.equal(retried.creationErrors, 2);
    const existing = await prisma.article.findUnique({
      where: { slug: slugs[0] },
      select: { recommendedArticles: { select: { slug: true } } },
    });
    assert.equal(existing.recommendedArticles.length, 1);
    console.log('Verified actual bulk article API handler inserts both articles, links targets created later in the batch, and retains links on duplicate retries.');
  } finally {
    scrapeRequest.get = originalGet;
    await prisma.article.deleteMany({ where: { slug: { in: slugs } } });
    if (categoryId) await prisma.category.delete({ where: { id: categoryId } });
    await prisma.$disconnect();
  }
}

main().catch(error => {
  console.error('Scraper route verification failed:', error.message);
  process.exitCode = 1;
});
