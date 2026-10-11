import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { BaseKeystoneTypeInfo, StorageStrategy } from '@keystone-6/core/types';

const imageDirectory = path.resolve(process.cwd(), 'public/images');

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
  const bytes = await readFile(imagePath(`${uploaded.id}.${uploaded.extension}`));
  const mime = uploaded.extension === 'jpg' ? 'jpeg' : uploaded.extension;
  return `data:image/${mime};base64,${bytes.toString('base64')}`;
}

export async function storedImage(key: string) {
  const bytes = await readFile(imagePath(key));
  const extension = path.extname(key).slice(1).toLowerCase();
  const contentTypes = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp' };
  return { bytes, contentType: contentTypes[extension] || 'application/octet-stream' };
}
