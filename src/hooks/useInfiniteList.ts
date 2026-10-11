import { useEffect, useState } from 'react';

export default function useInfiniteList<T extends { slug: string }>(
  initialItems: T[],
  isVisible: boolean,
  pageSize: number,
  loadMore: (skip: number, signal: AbortSignal) => Promise<T[]>
) {
  const [state, setState] = useState({
    source: initialItems,
    items: initialItems,
    offset: initialItems.length,
    hasMore: initialItems.length >= pageSize,
  });

  useEffect(() => {
    if (state.source !== initialItems) {
      setState({
        source: initialItems,
        items: initialItems,
        offset: initialItems.length,
        hasMore: initialItems.length >= pageSize,
      });
      return;
    }
    if (!isVisible || !state.hasMore) return;

    const controller = new AbortController();
    loadMore(state.offset, controller.signal)
      .then((nextItems) => {
        if (controller.signal.aborted) return;
        setState((previous) => {
          if (previous.source !== initialItems) return previous;
          const existing = new Set(previous.items.map((item) => item.slug));
          const additions = nextItems.filter((item) => !existing.has(item.slug));
          return {
            ...previous,
            items: [...previous.items, ...additions],
            offset: previous.offset + nextItems.length,
            hasMore: nextItems.length >= pageSize && additions.length > 0,
          };
        });
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        console.error('Unable to load more items', error);
        setState((previous) => ({ ...previous, hasMore: false }));
      });

    return () => controller.abort();
  }, [initialItems, isVisible, loadMore, pageSize, state]);

  return state.source === initialItems
    ? state
    : { items: initialItems, hasMore: initialItems.length >= pageSize };
}
