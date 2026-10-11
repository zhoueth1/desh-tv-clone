import useCreatePages from './useCreatePages';

export default function useCreateArticles(
  pageUrl,
  startingPage,
  endingPage,
  setPagesFetched,
  signal,
  setStatuses,
  pagesFetched,
  startFetching
) {
  useCreatePages('Articles', pageUrl, startingPage, endingPage, setPagesFetched, signal, setStatuses, pagesFetched, startFetching);
}