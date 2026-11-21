# Network fetch from plugin UI — patterns and gotchas

Read this before scaffolding or auditing any plugin whose `ui.html` calls `fetch()` for external data: an icon set, a font list, any CDN-hosted asset. [SKILL.md](../SKILL.md) step 8 of the scaffold, and its diagnosis section, point here. The rule is [skill-standard §B 9](../../../standards/skill-standard.md); this page is how to apply it.

## The null-origin CORS wall (confirmed, not theoretical)

`ui.html` runs in a sandboxed `data:` URL iframe, whose origin is `'null'`. Some CDNs reject that outright.

| CDN | Result |
|---|---|
| unpkg.com | **Rejects**: a CORS block and `500 Internal Server Error`, on the DIRECT request, not just a redirect. Pinning the version to avoid the `@latest` redirect is NOT enough on its own. |
| cdn.jsdelivr.net | **Works**: it documents an unconditional `Access-Control-Allow-Origin: *` on every response. |

**Rule:** default to jsdelivr for npm-hosted assets, always with a pinned exact version. Add the domain to `manifest.json`'s `networkAccess.allowedDomains`.

```
https://cdn.jsdelivr.net/npm/{package}@{version}/{path}
```

## Diagnosing a "nothing loads" bug

In order, cheapest and most decisive first:

1. **Ask for the actual browser console.** Right-click the plugin UI → Inspect → Console → reproduce → copy the red error lines. This is the ONLY way to see a CORS rejection; no remote or API diagnostic can see it.
2. Only after that, check code correctness, retry and concurrency logic, and whether the re-import is fresh. A CORS wall looks identical to stale code or a flaky network from every angle except the console. So don't spend a long session on those before asking for it.

## The house pattern: bounded concurrency, retry, honest failure

A grid or list may lazy-load many external resources through `IntersectionObserver`, as an icon picker does. For it, copy the two functions in `assets/fetch-queue.js` into the plugin's UI script. Inline them, for the same reason ui-base is inlined. A relative script source does not resolve in a single-document UI. `tests/test-fetch-queue.mjs` executes them.

| Function | What it does |
|---|---|
| `createFetchQueue(6)` | Returns `queuedFetch(job)`: at most six jobs in flight, and each caller gets its own job's result or rejection. A job that throws synchronously rejects too, rather than leaking its slot. |
| `retryOrFail(card, observer, maxRetries)` | Goes in the observer callback's failure branch. It retries each item a bounded number of times (2–3), then returns `false` so the caller shows an **honest terminal failure state**. |

How `retryOrFail` retries:

- It unobserves before re-observing. `observe()` on a target already observed is a no-op. The retry would then wait for the card to scroll out and back.
- The re-observe waits 500 ms × the retry number. The retries spread over seconds, not milliseconds against a rate-limited source.
- Never leave a lazy-loaded item blank forever with a silently swallowed error.

What the failed state looks like, and where the click-to-retry goes, is the plugin's.

**What this pattern does NOT fix.** It protects against genuine transient issues: a real network blip, temporary rate limiting. It cannot fix a deterministic CORS rejection. That needs the CDN switch above, not more retries.

## Perceived performance: pulsing skeleton placeholder

Cheap, additive and CSS-only. Pulse the loading placeholder, never a terminal failed state:

```css
@keyframes placeholder-pulse { 0%, 100% { opacity: .35; } 50% { opacity: .85; } }
.placeholder { animation: placeholder-pulse 1.4s ease-in-out infinite; }
.placeholder-failed { animation: none; } /* terminal state: not "still loading" */
```
