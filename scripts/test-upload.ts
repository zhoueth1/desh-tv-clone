import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { unlink } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';

const origin = process.env.TEST_BASE_URL || 'http://localhost:3000';
const imageDirectory = process.env.NETLIFY
  ? path.join(tmpdir(), 'desh-tv-images')
  : path.join(process.cwd(), 'public/images');

async function graphql(query: string, variables: Record<string, unknown>) {
  const response = await fetch(`${origin}/api/graphql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  const result = await response.json();
  if (result.errors) throw new Error(JSON.stringify(result.errors));
  assert.ok(response.ok);
  return result.data;
}

async function main() {
  const suffix = randomUUID();
  const slug = `/article/verification-upload-${suffix}`;
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aXioAAAAASUVORK5CYII=', 'base64');
  const form = new FormData();
  form.set('operations', JSON.stringify({
    query: 'mutation($slug: String!, $title: String!, $image: Upload!) { createArticle(data: {slug: $slug, title: $title, translated_date: "2026-10-11T12:00:00Z", image: {upload: $image}}) { id image_data image { id extension width height url } } }',
    variables: { slug, title: `Upload ${suffix}`, image: null },
  }));
  form.set('map', JSON.stringify({ '0': ['variables.image'] }));
  form.set('0', new Blob([png], { type: 'image/png' }), 'verification.png');
  let key: string | undefined;
  try {
    const response = await fetch(`${origin}/api/graphql`, {
      method: 'POST',
      headers: { 'GraphQL-Require-Preflight': '1' },
      body: form,
    });
    const result = await response.json();
    if (result.errors) throw new Error(JSON.stringify(result.errors));
    assert.ok(response.ok);
    const article = result.data.createArticle;
    key = `${article.image.id}.${article.image.extension}`;
    assert.equal(article.image.width, 1);
    assert.equal(article.image.height, 1);
    assert.equal(article.image_data, `data:image/png;base64,${png.toString('base64')}`);
    const imageResponse = await fetch(`${origin}/images/${key}`);
    assert.equal(imageResponse.status, 200);
    assert.equal(imageResponse.headers.get('content-type'), 'image/png');
    assert.deepEqual(Buffer.from(await imageResponse.arrayBuffer()), png);
    if (['localhost', '127.0.0.1'].includes(new URL(origin).hostname)) {
      // Simulate a cold function instance with no upload file on disk.
      await unlink(path.join(imageDirectory, key));
    }
    const apiResponse = await fetch(`${origin}/api/uploads/${key}`);
    assert.equal(apiResponse.status, 200);
    assert.deepEqual(Buffer.from(await apiResponse.arrayBuffer()), png);
    const updated = await graphql('mutation($slug: String!, $title: String!) { updateArticle(where: {slug: $slug}, data: {title: $title}) { image_data } }', { slug, title: `Updated upload ${suffix}` });
    assert.equal(updated.updateArticle.image_data, article.image_data);
    console.log('Verified HTTP GraphQL multipart upload, persisted image bytes, image routes, and preservation on article update.');
  } finally {
    await graphql('mutation($slug: String!) { deleteArticle(where: {slug: $slug}) { id } }', { slug }).catch(() => undefined);
    if (key && /^[A-Za-z0-9_-]+\.[A-Za-z0-9]+$/.test(key)) {
      await unlink(path.join(imageDirectory, key)).catch(() => undefined);
    }
  }
}

main().catch(error => {
  console.error('Upload verification failed:', error.message);
  process.exitCode = 1;
});
