import fetchListing from './listingScrape';

export default async function fetchNewArticles(category: string, numOfScrolls: number) {
  return { category, ...await fetchListing(`${category}?start=${numOfScrolls * 20}`, 20) };
}
