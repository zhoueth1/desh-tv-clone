import { loadEnvConfig } from '@next/env';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

loadEnvConfig(process.cwd(), process.env.NODE_ENV !== 'production');

async function main() {
  const { keystoneContext, prisma } = await import('../src/keystone/context');
  const { createArticle } = await import('../src/server/database/createArticle');
  const { createPoll } = await import('../src/server/database/createPoll');
  const { createRecommendedArticles } = await import('../src/server/database/createRecommendedArticles');
  const { createStatuses } = await import('../src/server/scraper/types');
  const rollback = new Error('Roll back database verification records.');
  const suffix = randomUUID();
  const image = 'data:image/png;base64,aGVsbG8=';
  let verified = false;
  try {
    await keystoneContext.transaction(async context => {
      const gql = (query: string, variables: Record<string, unknown> = {}) => context.graphql.run<any, any>({ query, variables });
      const name = `verification-${suffix}`;
      const categoryResult = await gql('mutation($name: String!) { createCategory(data: {name: $name, slug: $name}) { id } }', { name });
      assert.ok(categoryResult.createCategory.id);
      const slug = `/article/verification-${suffix}`;
      const statuses = createStatuses();
      const created = await createArticle(slug, image, `Title "with quotes" ${suffix}`, name, '2026-10-11T12:00:00Z', {
        0: [{ type: 'text', content: 'Quoted "text" and backslash \\ preserved. ' }, { type: 'link', content: 'Desh TV', href: 'https://desh.tv' }],
      }, [], false, context.prisma, slug, statuses);
      assert.equal(created.status, 200);
      assert.equal(statuses.completed, 1);
      const read = await gql('query($slug: String!) { article(where: {slug: $slug}) { id image_data content { document } category { name } } }', { slug });
      assert.equal(read.article.image_data, image);
      assert.equal(read.article.category.name, name);
      assert.ok(Array.isArray(read.article.content.document));
      assert.equal(read.article.content.document[0].children[0].text, 'Quoted "text" and backslash \\ preserved. ');
      assert.equal(read.article.content.document[0].children[1].children[0].text, 'Desh TV');
      const changed = await gql('mutation($slug: String!, $title: String!) { updateArticle(where: {slug: $slug}, data: {title: $title}) { image_data } }', { slug, title: `Updated ${suffix}` });
      assert.equal(changed.updateArticle.image_data, image);
      const otherSlug = `/article/verification-related-${suffix}`;
      const other = await gql('mutation($slug: String!, $title: String!) { createArticle(data: {slug: $slug, title: $title, translated_date: "2026-10-11T12:00:00Z"}) { id image_data } }', { slug: otherSlug, title: `Related ${suffix}` });
      assert.equal(other.createArticle.image_data, null);
      assert.equal(await createRecommendedArticles([otherSlug], Number(read.article.id), context.prisma), true);
      const related = await gql('query($slug: String!) { article(where: {slug: $slug}) { recommendedArticles { slug } } }', { slug });
      assert.equal(related.article.recommendedArticles[0].slug, otherSlug);

      const pollSlug = `/polls/verification-${suffix}`;
      const pollResult = await createPoll(pollSlug, image, `Poll ${suffix}`, '2026-10-11T12:00:00Z', { yes: 10, no: 20, 'no-comment': 30 }, context.prisma, statuses);
      assert.equal(pollResult.status, 200);
      const vote = 'mutation($slug: String!, $option: String!) { votePoll(slug: $slug, option: $option) { yes_count no_count no_comment_count image_data } }';
      await Promise.all(Array.from({ length: 6 }, () => gql(vote, { slug: pollSlug, option: 'yes' })));
      await gql(vote, { slug: pollSlug, option: 'no' });
      await gql(vote, { slug: pollSlug, option: 'no-comment' });
      const poll = await gql('query($slug: String!) { poll(where: {slug: $slug}) { yes_count no_count no_comment_count image_data desh_yes_count desh_no_count desh_no_comment_count } }', { slug: pollSlug });
      assert.equal(poll.poll.yes_count, 6);
      assert.equal(poll.poll.no_count, 1);
      assert.equal(poll.poll.no_comment_count, 1);
      assert.equal(poll.poll.image_data, image);
      await createPoll(pollSlug, image, `Poll ${suffix}`, '2026-10-11T12:00:00Z', { yes: 12, no: 22, 'no-comment': 32 }, context.prisma, statuses);
      const refreshed = await gql('query($slug: String!) { poll(where: {slug: $slug}) { yes_count desh_yes_count desh_no_count desh_no_comment_count } }', { slug: pollSlug });
      assert.equal(refreshed.poll.yes_count, 6);
      assert.equal(refreshed.poll.desh_yes_count, 12);
      assert.equal(refreshed.poll.desh_no_count, 22);
      assert.equal(refreshed.poll.desh_no_comment_count, 32);
      const invalid = await context.graphql.raw({ query: vote, variables: { slug: pollSlug, option: 'invalid' } });
      assert.ok(invalid.errors?.length);
      const security = await context.prisma.$queryRaw`SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('User', 'Article', 'Category', 'Poll', '_Article_recommendedArticles')`;
      assert.equal(security.length, 5);
      assert.ok(security.every(table => table.rowsecurity));
      verified = true;
      throw rollback;
    }, { timeout: 20000 });
  } catch (error) {
    if (error !== rollback) throw error;
  } finally {
    await prisma.$disconnect();
  }
  assert.ok(verified);
  console.log('Verified GraphQL create/query/update, scraped document JSON, image preservation, recommendations, atomic poll voting, poll refresh, and RLS. Verification records were rolled back.');
}

main().catch(error => {
  console.error('Database verification failed:', error.message);
  process.exitCode = 1;
});
