// fetch-queue — the house pattern for a plugin UI that lazy-loads many external
// resources (references/network-fetch-patterns.md). Copy this file's two
// functions into the plugin's ui.html <script> (ui.html is one document, so a
// relative <script src> does not resolve — same reason ui-base is inlined).
// ES5 on purpose: it runs in the plugin's UI iframe with no build step.
// Tested by tests/test-fetch-queue.mjs.

// Bounded concurrency: a large grid can have dozens of cards enter the viewport
// near-simultaneously; firing that many fetch() calls at once risks connection
// and rate limits. 6 is the conventional safe per-host concurrent-connection
// count. Returns queuedFetch(job), where job is a function returning a promise;
// queuedFetch resolves or rejects with the job's own outcome. A job that throws
// synchronously rejects like any other — it must not leak its slot, or the
// queue stalls for good once `max` of them have thrown.
function createFetchQueue(max) {
  var active = 0;
  var queue = [];
  function next() {
    while (active < max && queue.length > 0) {
      var item = queue.shift();
      active++;
      Promise.resolve().then(item.job).then(
        function (item) { return function (v) { active--; item.resolve(v); next(); }; }(item),
        function (item) { return function (e) { active--; item.reject(e); next(); }; }(item)
      );
    }
  }
  return function queuedFetch(job) {
    return new Promise(function (resolve, reject) {
      queue.push({ job: job, resolve: resolve, reject: reject });
      next();
    });
  };
}

// Bounded retry with an honest terminal state, for an IntersectionObserver
// callback's failure branch. Returns true when a retry was scheduled, false when
// retries are exhausted — the caller then shows a distinguishable "failed, click
// to retry" state (no pulse), never a blank box. The card is unobserved before
// it is observed again: observe() on a target already being observed is a no-op
// per the IntersectionObserver spec, so without the unobserve a still-visible
// card would not retry until it was scrolled out of view and back. The
// re-observe waits 500ms per retry so far (500, 1000, ...): re-observing at
// once spends every retry within milliseconds against a rate-limited source.
// Bounded by maxRetries, so the longest wait is 500ms x maxRetries.
function retryOrFail(card, observer, maxRetries) {
  var retries = Number(card.dataset.retries || '0') + 1;
  card.dataset.retries = String(retries);
  observer.unobserve(card);
  if (retries > maxRetries) return false;
  card.dataset.loaded = '';
  setTimeout(function () { observer.observe(card); }, 500 * retries);
  return true;
}
