import { useEffect } from 'react';
import axios from 'axios';
import request from '../utils/request';

export default function useCreatePages(
  creationObject,
  pageUrl,
  startingPage,
  endingPage,
  setPagesFetched,
  signal,
  setStatuses,
  pagesFetched,
  startFetching
) {
  useEffect(() => {
    if (!startFetching || signal?.aborted || pagesFetched > endingPage - startingPage) return;

    const controller = new AbortController();
    const abort = () => controller.abort();
    signal?.addEventListener('abort', abort, { once: true });
    const url = new URL(pageUrl);
    url.searchParams.set('page', String(startingPage + pagesFetched));

    const updateStatuses = (statuses) => {
      setStatuses((previous) => ({
        completed: previous.completed + statuses.completed,
        attempts: previous.attempts + statuses.attempts,
        fetchingErrors: previous.fetchingErrors + statuses.fetchingErrors,
        creationErrors: previous.creationErrors + statuses.creationErrors,
        errors: { ...previous.errors, ...statuses.errors },
      }));
      setPagesFetched((previous) => previous + 1);
    };

    request.post(`/api/createAll${creationObject}`, { pageUrl: url.href }, { signal: controller.signal })
      .then(({ data }) => {
        if (!controller.signal.aborted) updateStatuses(data.statuses);
      })
      .catch((error) => {
        if (controller.signal.aborted || axios.isCancel(error)) return;
        updateStatuses({
          completed: 0,
          attempts: 1,
          fetchingErrors: 1,
          creationErrors: 0,
          errors: {
            [url.href]: {
              fetching: [error.response?.data?.error || error.message || 'Unable to fetch page'],
              creation: [],
            },
          },
        });
      });

    return () => {
      controller.abort();
      signal?.removeEventListener('abort', abort);
    };
  }, [creationObject, pageUrl, startingPage, endingPage, setPagesFetched, signal, setStatuses, pagesFetched, startFetching]);
}
