import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import type { BaseKeystoneTypeInfo, KeystoneContext, StorageStrategy } from '@keystone-6/core/types';

// Netlify functions have a read-only bundle. Uploaded bytes are also saved in
// Article.image_data, so temporary files are needed only while ingesting uploads.
const imageDirectory = (process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME)
  ? path.join(tmpdir(), 'desh-tv-images')
  : path.resolve(process.cwd(), 'public/images');

function imagePath(key: string) {
  if (!/^[A-Za-z0-9_-]+\.[A-Za-z0-9]+$/.test(key)) {
    throw new Error('Invalid image storage key.');
  }
  return path.join(imageDirectory, key);
}

export const imageStorage: StorageStrategy<BaseKeystoneTypeInfo> = {
  async put(key, stream) {
    await mkdir(imageDirectory, { recursive: true });
    await writeFile(imagePath(key), stream);
  },
  async delete(key) {
    await unlink(imagePath(key)).catch(error => {
      if (error.code !== 'ENOENT') throw error;
    });
  },
  url(key) {
    const baseUrl = process.env.BASE_URL || process.env.NEXT_PUBLIC_HOST_URL || 'http://localhost:3000';
    return `${baseUrl.replace(/\/$/, '')}/images/${encodeURIComponent(key)}`;
  },
};

export async function resolveImageData({ resolvedData, inputData, item }: any) {
  if (Object.prototype.hasOwnProperty.call(inputData, 'image_data')) {
    return resolvedData.image_data;
  }
  if (!Object.prototype.hasOwnProperty.call(inputData, 'image')) {
    return item?.image_data ?? null;
  }
  const uploaded = resolvedData.image;
  if (!uploaded?.id || !uploaded?.extension) return null;
  const bytes = await readFile(/* turbopackIgnore: true */ imagePath(`${uploaded.id}.${uploaded.extension}`));
  const mime = uploaded.extension === 'jpg' ? 'jpeg' : uploaded.extension;
  return `data:image/${mime};base64,${bytes.toString('base64')}`;
}

export async function storedImage(key: string, context?: Pick<KeystoneContext, 'prisma'>) {
  const filePath = imagePath(key);
  let bytes: Buffer;
  try {
    bytes = await readFile(/* turbopackIgnore: true */ filePath);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    // Serve the persisted copy across cold starts and redeploys.
    const separator = key.lastIndexOf('.');
    const article = await context?.prisma.article.findFirst({
      where: { image_id: key.slice(0, separator), image_extension: key.slice(separator + 1) },
      select: { image_data: true },
    });
    const image = article?.image_data?.match(/^data:image\/[a-zA-Z0-9.+-]+;base64,([A-Za-z0-9+/=]+)$/);
    if (!image) throw error;
    bytes = Buffer.from(image[1], 'base64');
  }
  const extension = path.extname(key).slice(1).toLowerCase();
  const contentTypes = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp' };
  return { bytes, contentType: contentTypes[extension] || 'application/octet-stream' };
}
