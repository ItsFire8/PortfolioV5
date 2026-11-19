"use client";

import { useEffect, useState } from "react";

/** Current time, ticking every `interval` ms. Returns null during SSR/first render to avoid hydration mismatches. */
export function useNow(interval = 1000): Date | null {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    let t: ReturnType<typeof setTimeout>;
    const tick = () => {
      setNow(new Date());
      t = setTimeout(tick, interval - (Date.now() % interval));
    };
    t = setTimeout(tick, interval - (Date.now() % interval));
    return () => clearTimeout(t);
  }, [interval]);
  return now;
}
