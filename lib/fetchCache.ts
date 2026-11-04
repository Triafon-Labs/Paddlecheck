// Kept in one place so every upstream fetch (river, weather, upstream,
// warnings) agrees on the same cache window - a mismatched value on any one
// of them would silently drag /api/conditions' effective cache interval down
// to the shortest one in use.
export const CONDITIONS_REVALIDATE_SECONDS = 900;

export interface FetchLiveness {
  // When true, bypasses the cache entirely for a genuinely live upstream
  // fetch - used by /api/conditions/live to force fresh data on demand.
  live?: boolean;
}

export const fetchCacheOptions = ({ live }: FetchLiveness = {}): RequestInit =>
  live
    ? { cache: "no-store" }
    : { next: { revalidate: CONDITIONS_REVALIDATE_SECONDS } };
