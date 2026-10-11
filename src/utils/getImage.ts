import request from './request';

export default async function getImage(imageLink: string) {
  const { data } = await request.post('/api/image', { url: imageLink });
  return data.data;
}
