// In-memory sliding-window limiter. One instance per route module; state resets
// on redeploy, so upgrade to Redis/Upstash when multi-instance.
export function createRateLimiter(limit: number, windowMs: number, now: () => number = () => Date.now()) {
  const hits = new Map<string, number[]>();
  return (key: string): boolean => {
    const at = now();
    const window = (hits.get(key) ?? []).filter((t) => at - t < windowMs);
    window.push(at);
    hits.set(key, window);
    return window.length > limit;
  };
}
