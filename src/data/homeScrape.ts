import fetchListing from './listingScrape';

export default async function fetchHomePage() {
  const data = await fetchListing('', 5);
  return {
    ...data,
    categories: data.urls.map((url) => new URL(url).pathname.split('/').filter(Boolean)[0]),
  };
}
