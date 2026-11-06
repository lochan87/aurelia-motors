import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function ScrollToHash() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      return;
    }

    const targetId = decodeURIComponent(hash.slice(1));
    const timeout = window.setTimeout(() => {
      const target = document.getElementById(targetId);

      if (!target) {
        return;
      }

      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      target.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'start',
      });
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [pathname, hash]);

  return null;
}
