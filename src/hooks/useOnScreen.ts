import { useState, useEffect } from 'react';

function useOnScreen(element, rootMargin = '0px') {
  const [isInViewport, setIsInViewport] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInViewport(entry.isIntersecting);
      },
      { rootMargin }
    );
    if (element.current) {
      observer.observe(element.current);
    }
    return () => {
      observer.disconnect();
    };
  });

  return isInViewport;
}

export default useOnScreen;
