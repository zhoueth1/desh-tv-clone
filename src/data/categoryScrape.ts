import fetchListing from './listingScrape';

export default async function fetchCategoryPage(category: string) {
  return { category, ...await fetchListing(category, 25) };
}
