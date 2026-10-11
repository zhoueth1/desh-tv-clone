import axios from 'axios';

export const DESH_ORIGIN = 'https://www.desh.tv';

export const scrapeRequest = axios.create({
  timeout: 30000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; DeshTVArchive/1.0)',
    Accept: 'text/html,application/xhtml+xml,image/*;q=0.9,*/*;q=0.8',
  },
});

export function resolveDeshUrl(value: string) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error('A Desh TV URL is required.');
  }
  const url = new URL(value.trim(), DESH_ORIGIN);
  if (url.pathname.startsWith('/data/desh-tv/')) {
    url.pathname = url.pathname.slice('/data/desh-tv'.length);
    url.protocol = 'https:';
    url.host = 'www.desh.tv';
    url.port = '';
  } else if (url.pathname.startsWith('/article/')) {
    url.pathname = url.pathname.slice('/article'.length);
  }
  if (
    !['desh.tv', 'www.desh.tv'].includes(url.hostname) ||
    url.username ||
    url.password ||
    (url.port && url.port !== '443') ||
    !['http:', 'https:'].includes(url.protocol)
  ) {
    throw new Error('Only Desh TV URLs can be scraped.');
  }
  url.protocol = 'https:';
  url.hostname = 'www.desh.tv';
  url.hash = '';
  return url.toString();
}

export async function mapWithConcurrency<T, R>(
  values: T[],
  concurrency: number,
  mapper: (value: T, index: number) => Promise<R>
): Promise<R[]> {
  const result: R[] = new Array(values.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(concurrency, values.length) }, async () => {
      while (next < values.length) {
        const index = next++;
        result[index] = await mapper(values[index], index);
      }
    })
  );
  return result;
}


