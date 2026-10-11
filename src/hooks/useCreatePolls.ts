import useCreatePages from './useCreatePages';

export default function useCreatePolls(
  pageUrl,
  startingPage,
  endingPage,
  setPagesFetched,
  signal,
  setStatuses,
  pagesFetched,
  startFetching
) {
  useCreatePages('Polls', pageUrl, startingPage, endingPage, setPagesFetched, signal, setStatuses, pagesFetched, startFetching);
}