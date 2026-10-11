import axios from 'axios';

const translations = new Map<string, Promise<string>>();
let translationQueue: Promise<unknown> = Promise.resolve();

function splitText(text: string) {
  const chunks: string[] = [];
  let chunk = '';
  for (const token of text.match(/\S+\s*|\s+/g) || []) {
    if (encodeURIComponent(chunk + token).length > 6000 && chunk) {
      chunks.push(chunk);
      chunk = '';
    }
    for (const character of token) {
      if (encodeURIComponent(chunk + character).length > 6000) {
        chunks.push(chunk);
        chunk = '';
      }
      chunk += character;
    }
  }
  if (chunk) chunks.push(chunk);
  return chunks;
}

async function translateChunk(from: string, to: string, text: string) {
  let lastError: unknown;
  for (const origin of [
    'https://translate.googleapis.com',
    'https://clients5.google.com',
  ]) {
    try {
      // Google's browser translation endpoint returns one string per query.
      const { data } = await axios.get(`${origin}/translate_a/t`, {
        params: { client: 'dict-chrome-ex', sl: from, tl: to, q: text },
        timeout: 20000,
      });
      const result = Array.isArray(data) ? data[0] : undefined;
      const translated = Array.isArray(result) ? result[0] : result;
      if (typeof translated === 'string' && translated.trim()) {
        return translated;
      }
      throw new Error('The translation provider returned no translated text.');
    } catch (error) {
      lastError = error;
    }
  }
  throw new Error('The translation provider is unavailable.', {
    cause: lastError,
  });
}

export function translateText(from: string, to: string, text: string) {
  if (typeof text !== 'string' || typeof from !== 'string' || typeof to !== 'string') {
    return Promise.reject(new Error('Source, target, and text are required.'));
  }
  if (!text.trim() || from === to) return Promise.resolve(text);
  if (!/^[a-z]{2,3}(?:-[a-zA-Z]{2,4})?$|^auto$/.test(from) ||
      !/^[a-z]{2,3}(?:-[a-zA-Z]{2,4})?$/.test(to)) {
    return Promise.reject(new Error('Invalid translation language.'));
  }

  const key = JSON.stringify([from, to, text]);
  const cached = translations.get(key);
  if (cached) return cached;

  // Keep bulk scraping from launching hundreds of translation requests at once.
  const promise = translationQueue.then(async () => {
    const translated: string[] = [];
    for (const chunk of splitText(text)) {
      translated.push(await translateChunk(from, to, chunk));
    }
    return translated.join(' ');
  });
  translationQueue = promise.catch(() => undefined);
  translations.set(key, promise);
  promise.catch(() => translations.delete(key));
  if (translations.size > 1000) translations.delete(translations.keys().next().value);
  return promise;
}
