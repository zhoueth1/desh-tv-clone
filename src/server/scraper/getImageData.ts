import { ErrorStage } from './types';
import createError from './createError';
import { resolveDeshUrl, scrapeRequest } from './request';

export async function getImageData(imageLink: string, statuses?, articleUrl = imageLink) {
  try {
    const { data, headers } = await scrapeRequest.get(resolveDeshUrl(imageLink), {
      responseType: 'arraybuffer',
      maxContentLength: 20 * 1024 * 1024,
    });
    const mime = String(headers['content-type'] || '').split(';')[0];
    if (!mime.startsWith('image/') || !data.byteLength) {
      throw new Error('The image URL did not return an image.');
    }
    return `data:${mime};base64,${Buffer.from(data).toString('base64')}`;
  } catch (error) {
    createError(statuses, 'cantFetchImage', articleUrl, ErrorStage.Fetching);
    throw error;
  }
}
