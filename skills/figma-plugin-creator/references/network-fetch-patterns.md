# Network fetch from plugin UI — patterns and gotchas

Read this before scaffolding or auditing any plugin whose `ui.html` calls `fetch()` for external data (an icon set, a font list, any CDN-hosted asset).

## The null-origin CORS wall (confirmed, not theoretical)
`ui.html` runs in a sandboxed `data:` URL iframe — origin `'null'`. Some CDNs reject that outright:
- **unpkg.com: rejects.** CORS block + `500 Internal Server Error`, on the DIRECT request (not just a redirect). Pinning the version to avoid the `@latest` redirect is NOT sufficient on its own.
- **cdn.jsdelivr.net: works.** Documented unconditional `Access-Control-Allow-Origin: *` on every response.

**Rule:** default to jsdelivr for npm-hosted assets (`https://cdn.jsdelivr.net/npm/{package}@{version}/{path}`), always with a pinned exact version. Add the domain to `manifest.json`'s `networkAccess.allowedDomains`.

## Diagnosing a "nothing loads" bug
In order, cheapest-and-most-decisive first:
1. **Ask for the actual browser console** (right-click plugin UI → Inspect → Console → reproduce → copy the red error lines). This is the ONLY way to see a CORS rejection — no remote/API diagnostic can see it.
2. Only after that: check code correctness, retry/concurrency logic, deployment/re-import freshness. Do not spend a long diagnostic session re-verifying deployment/re-import or retry logic before asking for the console — a CORS wall looks identical to "stale code" or "flaky network" from every angle except the console.

## The house pattern: bounded concurrency + retry + honest failure
For any grid/list that lazy-loads many external resources via `IntersectionObserver` (e.g. an icon picker), copy the two functions in `assets/fetch-queue.js` into the plugin's `ui.html` `<script>` (inlined, for the same reason ui-base is — a relative `src` does not resolve in a single-document UI). `tests/test-fetch-queue.mjs` executes them.

- **`createFetchQueue(6)`** returns `queuedFetch(job)`: at most six jobs in flight, each caller gets its own job's result or rejection. A job that throws synchronously rejects too, rather than leaking its slot.
- **`retryOrFail(card, observer, maxRetries)`** goes in the observer callback's failure branch: per-item bounded retry (2-3 attempts), returning `false` once exhausted so the caller shows an **honest terminal failure state** — never leave a lazy-loaded item blank forever with a silently swallowed error. It unobserves before re-observing, because `observe()` on a target already observed is a no-op and the retry would otherwise wait for the card to scroll out and back. The re-observe waits 500ms × the retry number, so the retries are spread over seconds rather than spent in milliseconds against a rate-limited source.

What the failed state looks like, and where the click-to-retry goes, is the plugin's.

Note what this pattern does and does NOT fix: it protects against genuine transient issues (a real network blip, temporary rate limiting). It cannot and will not fix a deterministic CORS rejection — that needs the CDN switch above, not more retries.

## Perceived performance: pulsing skeleton placeholder
Cheap, additive, CSS-only — apply a pulse animation to the loading placeholder (never to a terminal failed state):
```css
@keyframes placeholder-pulse { 0%, 100% { opacity: .35; } 50% { opacity: .85; } }
.placeholder { animation: placeholder-pulse 1.4s ease-in-out infinite; }
.placeholder-failed { animation: none; } /* terminal state: not "still loading" */
```
