import { useCallback, useSyncExternalStore } from 'react';

/** Follows a CSS media query. */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    [query],
  );
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches);
}

/** Phone layout: the three groups are stacked. */
export const PHONE_QUERY = '(max-width: 719.98px)';
