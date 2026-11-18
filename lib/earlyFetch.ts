// Starts the home page's data request from an inline <head> script, so it
// downloads alongside the JavaScript instead of waiting for it. Without this
// the request can't begin until every chunk has downloaded, run and hydrated
// - about 3 s on a slow phone signal, longer than the request itself.
//
// <link rel="preload" as="fetch"> would be the usual tool, but Chrome didn't
// hand the preloaded response to the hook's own fetch() when tested - it
// fetched twice - and Safari's support is patchy. A promise the hook picks up
// itself can't be missed.
//
// The hook takes the early request once, for its first attempt on load.
// Retries, the /live fallback, refreshes and refetch-on-return all make
// their own requests as before, so nothing can be served from it twice.

export const CONDITIONS_PATH = "/api/conditions";

// Only the home page reads this data.
const EARLY_FETCH_PAGE = "/";
const EARLY_FETCH_PATHS = [CONDITIONS_PATH];

declare global {
  interface Window {
    __earlyFetches?: Record<string, Promise<Response> | undefined>;
  }
}

// The inline script. The empty catch on each request stops an offline load
// logging an unhandled rejection before the app has even started; the hook
// still sees the failure, because it awaits the original promise.
export const EARLY_FETCH_SCRIPT = `try{if(location.pathname===${JSON.stringify(EARLY_FETCH_PAGE)}){var e={};${JSON.stringify(EARLY_FETCH_PATHS)}.forEach(function(p){var f=fetch(p);f.catch(function(){});e[p]=f});window.__earlyFetches=e}}catch(_){}`;

// The request the inline script started for `path`, or a new one if there
// was none or it has already been taken. A response body can only be read
// once, so it is handed out once.
export const fetchPreferringEarly = (path: string): Promise<Response> => {
  const early =
    typeof window !== "undefined" ? window.__earlyFetches?.[path] : undefined;
  if (early) {
    delete window.__earlyFetches![path];
    return early;
  }
  return fetch(path);
};
