import { useEffect, useState } from 'react';

const useMediaQuery = (query: string) => {
  const [queryStatus, changeQueryStatus] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const update = () => changeQueryStatus(mediaQuery.matches);
    update();
    mediaQuery.addEventListener('change', update);
    return () => mediaQuery.removeEventListener('change', update);
  }, [query]);

  return queryStatus;
};

export default useMediaQuery;
