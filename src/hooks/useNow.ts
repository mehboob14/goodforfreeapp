import { useEffect, useState } from 'react';

/**
 * Returns a Date that updates on an interval.
 * @param everySeconds true ticks once per second, false ticks once per minute
 * (saves battery when seconds aren't shown).
 */
export function useNow(everySeconds: boolean): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const intervalMs = everySeconds ? 1000 : 1000 * 30;
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [everySeconds]);

  return now;
}
