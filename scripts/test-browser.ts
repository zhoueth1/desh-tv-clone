import { loadEnvConfig } from '@next/env';
import { chromium, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { mkdir } from 'node:fs/promises';

loadEnvConfig(process.cwd());
const origin = process.env.TEST_BASE_URL || 'http://localhost:3000';
const allowWrites = process.env.TEST_ALLOW_WRITES === '1';
const channel =
  process.env.BROWSER_CHANNEL ||
  (process.platform === 'win32' ? 'msedge' : undefined);

async function graphql(query: string, variables: Record<string, unknown> = {}) {
  const response = await fetch(`${origin}/api/graphql`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  const result = await response.json();
  if (!response.ok || result.errors)
    throw new Error(
      JSON.stringify(result.errors || { status: response.status }),
    );
  return result.data;
}

async function main() {
  if (
    allowWrites &&
    !['localhost', '127.0.0.1'].includes(new URL(origin).hostname)
  ) {
    throw new Error(
      'Browser voting fixtures must use an isolated localhost test server.',
    );
  }
  const data = await graphql(
    '{ articlesCount articles(take: 1) { slug title } pollsCount }',
  );
  const browser = await chromium.launch({ headless: true, channel });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  let pollSlug: string | undefined;
  try {
    await mkdir('tmp/browser-verification', { recursive: true });
    await page.goto(origin, { waitUntil: 'networkidle' });
    await expect(page.getByText('Top Stories', { exact: true })).toBeVisible();
    await expect
      .poll(() =>
        page
          .locator('#__next > div')
          .evaluate((element) => getComputedStyle(element).opacity),
      )
      .toBe('1');
    await page.waitForTimeout(1100); // Allow the existing page fade animation to finish.
    await page.screenshot({
      path: 'tmp/browser-verification/home-desktop.png',
      fullPage: true,
    });
    if (data.articlesCount > 10) {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await expect
        .poll(() => page.locator('[id^="article-"]').count())
        .toBeGreaterThan(10);
    }
    if (data.articles[0]) {
      await page.goto(`${origin}${data.articles[0].slug}`, {
        waitUntil: 'networkidle',
      });
      await expect(
        page.getByRole('heading', {
          name: data.articles[0].title,
          exact: true,
        }),
      ).toBeVisible();
      await page.waitForTimeout(1100); // Allow the existing page fade animation to finish.
      await page.screenshot({
        path: 'tmp/browser-verification/article-desktop.png',
        fullPage: true,
      });
    }
    const missing = await page.goto(
      `${origin}/article/verification/not-a-real-article`,
      { waitUntil: 'networkidle' },
    );
    expect(missing?.status()).toBe(404);
    await page.goto(`${origin}/category/national`, {
      waitUntil: 'networkidle',
    });
    await expect(
      page.getByText('NATIONAL', { exact: true }).last(),
    ).toBeVisible();
    await page.goto(`${origin}/category/polls`, { waitUntil: 'networkidle' });
    await expect(page.getByText('POLLS', { exact: true }).last()).toBeVisible();

    if (allowWrites) {
      pollSlug = `/polls/browser-verification-${randomUUID()}`;
      const title = `Browser vote verification ${randomUUID()}`;
      await graphql(
        'mutation($slug: String!, $title: String!) { createPoll(data: {slug: $slug, title: $title, translated_date: "2026-10-11T12:00:00Z"}) { id } }',
        { slug: pollSlug, title },
      );
      await page.reload({ waitUntil: 'networkidle' });
      const block = page
        .getByRole('heading', { name: title, exact: true })
        .locator('xpath=../..');
      await block.locator('.yes').click();
      await block.getByRole('button', { name: 'SUBMIT', exact: true }).click();
      await expect(
        block.getByText('Total Votes: 1', { exact: true }),
      ).toBeVisible();
      const voted = await graphql(
        'query($slug: String!) { poll(where: {slug: $slug}) { yes_count } }',
        { slug: pollSlug },
      );
      expect(voted.poll.yes_count).toBe(1);
    }

    await page.goto(`${origin}/dashboard`, { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(`${origin}/coolkidsonly`);
    await page
      .getByPlaceholder('Username')
      .fill(process.env.ADMIN_USERNAME || 'admin');
    await page
      .getByPlaceholder('Password')
      .fill(process.env.ADMIN_PASSWORD || 'password');
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();
    await expect(page).toHaveURL(`${origin}/dashboard`);
    await expect(
      page.getByText('Fetch All polls:', { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText('Fetch All articles:', { exact: true }),
    ).toBeVisible();

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(origin, { waitUntil: 'networkidle' });
    await expect(page.getByText('Top Stories', { exact: true })).toBeVisible();
    await page.waitForTimeout(1100); // Allow the existing page fade animation to finish.
    await page.screenshot({
      path: 'tmp/browser-verification/home-mobile.png',
      fullPage: true,
    });
    await page.getByRole('button').first().click();
    await page.getByRole('button', { name: 'NATIONAL', exact: true }).click();
    await expect(page).toHaveURL(`${origin}/category/national`);
    await expect(
      page.getByRole('button', { name: 'NATIONAL', exact: true }),
    ).not.toBeInViewport();
    expect(pageErrors).toEqual([]);
    console.log(
      'Verified desktop/mobile rendering, article/404 routes, infinite scrolling, categories, polls, login/dashboard, mobile menu navigation, and zero browser runtime errors.' +
        (allowWrites
          ? ' A temporary poll also verified browser-to-GraphQL voting.'
          : ''),
    );
  } finally {
    if (pollSlug)
      await graphql(
        'mutation($slug: String!) { deletePoll(where: {slug: $slug}) { id } }',
        { slug: pollSlug },
      );
    await browser.close();
  }
}
main().catch((error) => {
  console.error('Browser verification failed:', error.message);
  process.exitCode = 1;
});
