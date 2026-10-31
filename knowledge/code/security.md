# Front-end security

What a front end does so that the page cannot be turned against the person reading it: escaping by context, a Content Security Policy, third-party scripts held to a hash, sanitising user HTML, forms that resist cross-site requests, framing refused, local servers that check who is calling, no secrets in shipped code, and dependencies kept on a lockfile. It serves the design-standard principles *honest* and *people in control, mistakes forgiven*, and applies code-standard rule 20 (a real form, and a render that never writes), code-standard rule 36 (one implementation of a behaviour, so a fix reaches every copy) and code-standard rule 61 (a failure that says why). No code-standard rule is admitted for security yet; two lessons from real runs wait in [candidates](candidates.md). Behaviour and enhancement are [javascript](javascript.md)'s.

**Implements:** the server side of [forms](../ui/patterns/forms.md), [authentication](../ui/patterns/authentication.md), [upload](../ui/patterns/upload.md) and [consent](../ui/patterns/consent.md).

## Escaping by context (XSS)

**What good looks like**
- Untrusted data reaches the page only through the template engine's escaping or a DOM API that treats it as text.
- The escape matches where the value lands: element text, a quoted attribute, a URL, a script or a style are five different contexts.
- Every attribute value is quoted, and the escape used inside it escapes both quote characters.
- `innerHTML` with anything that is not a constant is a review stop.

**How**
- In HTML text, escape `&`, `<` and `>`; inside an attribute, escape `"` and `'` as well, and always quote the attribute. OWASP: "Always surround attribute values with double ( " ) or single ( ' ) quotation marks" ([OWASP, *XSS Prevention Cheat Sheet*](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)). An escape helper written for text and reused in attributes is the classic hole.

  ```js
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  ```

- In the DOM, prefer `textContent`, `setAttribute` and `createElement` over string assembly; building rows from a `<template>` is [javascript: escaping and templating safely](javascript.md#escaping-and-templating-safely). MDN: use `textContent` "when you know that the user-provided content should be plain text. This prevents it being parsed as HTML" ([MDN `innerHTML`](https://developer.mozilla.org/en-US/docs/Web/API/Element/innerHTML)).
- A URL from data in `href` or `src` is checked for its scheme (`https:`, `mailto:`, relative) before use; escaping does not stop `javascript:`.
- Never build event handler attributes or `<script>` bodies from data; pass data as `data-*` attributes or JSON in `<script type="application/json">` and read it ([OWASP, *DOM based XSS Prevention*](https://cheatsheetseries.owasp.org/cheatsheets/DOM_based_XSS_Prevention_Cheat_Sheet.html)).
- **Trusted Types** make the dangerous sinks (`innerHTML`, `eval`, script `src`) refuse plain strings once a CSP asks for them: `require-trusted-types-for 'script'`. Baseline newly available since February 2026 ([MDN, *Trusted Types API*](https://developer.mozilla.org/en-US/docs/Web/API/Trusted_Types_API)), so ship it in report-only first.

**Cases**
- An escape helper replaces `<`, `>` and `&` and is used in `title="${esc(name)}"` → add both quotes to the helper; a name containing `"` closes the attribute and opens a new one, `onfocus` included.
- A list re-render builds rows with `innerHTML` from fetched JSON → build nodes with `textContent`, or escape every interpolated field in one shared function (code-standard rule 36: one implementation, so the fix lands once).
- A profile link takes `href` from a user field → allow `https:` and relative URLs only; anything else renders as text.
- A template uses the framework's "raw" output to keep line breaks in a description → escape, then convert newlines to `<br>`, or render with `white-space: pre-line`.

**Accessibility**
- No WCAG criterion bears directly. A fix that escapes `aria-label` and `alt` values must leave them readable: double-escaped text ("&amp;amp;") reaches screen readers as written.

**Check**
- *Script:* could flag `innerHTML`, `outerHTML`, `insertAdjacentHTML` and `document.write` with a non-literal argument, unquoted attribute values in templates, an escape function that omits `"` or `'`, and raw-output helpers in templates. A test can feed every escape helper `"><img src=x onerror=alert(1)>` and assert the output parses to text.
- *Judgement:* For each value this page prints, which context does it land in, and which escape covers that context?

**Sources:** OWASP and MDN as linked; they agree. The toolkit follows OWASP's context list.

## Content Security Policy

**What good looks like**
- Every page is served with a CSP that allows only the scripts the page means to run.
- The policy is strict (nonces or hashes), not a list of hosts.
- A new policy runs in report-only mode before it enforces.

**How**
- web.dev's strict policy, sent as a header ([web.dev, *Mitigate XSS with a strict CSP*](https://web.dev/articles/strict-csp)):

  ```http
  Content-Security-Policy: script-src 'nonce-{RANDOM}' 'strict-dynamic';
    object-src 'none'; base-uri 'none';
  ```

- The nonce is fresh per response and set on each `<script nonce>`; a static site uses hashes of its inline scripts instead. web.dev's reason for avoiding host allowlists: they "can be bypassed in most configurations".
- Inline `onclick=` and `style=` attributes are blocked by a strict policy; that is one more reason for code-standard rule 6's data-attribute hooks and a listener in the script.
- Add `frame-ancestors` (below) and `form-action 'self'` to the same header; MDN lists every directive ([MDN, *CSP*](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP)).
- Use `Content-Security-Policy-Report-Only` with a `report-to` endpoint to see what would break; then enforce.

**Cases**
- A page loads analytics from three hosts and the policy lists them → move to nonce plus `'strict-dynamic'`; a listed CDN that serves any user's files is a bypass.
- A static docs site has a few inline scripts → hash each at build time and list the hashes; regenerate them in the build, never by hand (code-standard rule 23).
- A component library relies on inline `style` attributes for positions → set positions through custom properties from a stylesheet, or add `'unsafe-hashes'` for the exact styles; `'unsafe-inline'` gives the protection away.

**Accessibility**
- None directly. A policy that blocks a font or a script must not leave the page unusable: code-standard rule 20's no-script path is also the blocked-script path.

**Check**
- *Script:* could request each page and assert a `Content-Security-Policy` header with a nonce or hash in `script-src`, `object-src 'none'`, `base-uri`, and no `'unsafe-inline'` or `'unsafe-eval'`.
- *Judgement:* Is each source in the policy there for a script the page needs today?

**Sources:** web.dev and MDN as linked; [OWASP, *CSP Cheat Sheet*](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html) agrees on strict policies.

## Third-party scripts and Subresource Integrity

**What good looks like**
- Third-party code is the exception, each script with an owner and a reason.
- A script or stylesheet from another origin carries an `integrity` hash and `crossorigin`, pinned to an exact version.
- Where a vendor will not offer a fixed file, the script is self-hosted.

**How**
- `<script src="https://cdn.example/lib@1.4.2/lib.min.js" integrity="sha384-…" crossorigin="anonymous">`: the browser refuses the file if its hash differs ([MDN, *Subresource Integrity*](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Subresource_Integrity)).
- SRI only works on a URL whose content never changes; a "latest" URL or a script that serves per-browser content cannot carry a hash, and is a reason to self-host.
- In June 2024 the domain of a popular polyfill service changed hands and served malware to more than 100,000 sites that loaded it by URL ([Sansec](https://sansec.io/research/polyfill-supply-chain-attack)). A hash would have refused the changed file; self-hosting would not have fetched it. See [browser support](browser-support.md) on whether the polyfill was needed at all.
- A third-party embed (a map, a video) goes in an `<iframe>` with `sandbox` and only the permissions it needs; `rel="noopener"` is the default for `target="_blank"` links in current browsers, and stating it costs nothing ([MDN `<a>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/a)).

**Cases**
- A tag manager injects scripts nobody reviewed → each tag has an owner in the repo and passes the CSP; a tag that needs `'unsafe-eval'` is refused.
- A web font loads from a CDN by version range → pin the version and add `integrity`, or self-host the files.
- A vendor's widget script changes daily → load it in a sandboxed iframe on its own origin, so a compromise reaches the frame and not the page.

**Accessibility**
- An embedded iframe has a `title` naming its content (WCAG 2.2 4.1.2 Name, Role, Value).

**Check**
- *Script:* could flag every `<script src>` and `<link rel="stylesheet">` to another origin without `integrity`, any URL with a version range or `latest`, and an `iframe` without `sandbox` or `title`.
- *Judgement:* Would the page still work, and still be safe, if this vendor's domain changed hands tomorrow?

**Sources:** MDN and Sansec as linked.

## Sanitising user HTML

**What good looks like**
- HTML that users write (rich text, Markdown output, imported content) passes through a sanitiser with an allowlist before it reaches the page.
- Sanitising happens at output, or at both input and output, never at input alone.

**How**
- A maintained sanitiser, never a regex: [DOMPurify](https://github.com/cure53/DOMPurify) in the browser or on a server with a DOM.
- The platform's own `Element.setHTML()` sanitises as it inserts, with `setHTMLUnsafe()` as the explicit opposite ([MDN, *HTML Sanitizer API*](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Sanitizer_API)). It is limited availability today, so use it behind a feature test with DOMPurify as the fallback.
- Allow the elements prose needs (`p`, `a`, `ul`, `ol`, `li`, `em`, `strong`, `code`, `pre`, headings) and drop `style`, event attributes and `javascript:` URLs; the sanitiser's defaults already do most of it.
- Markdown renderers that allow raw HTML need the same treatment; disable raw HTML where nobody needs it.

**Cases**
- A comment field accepts Markdown → render with raw HTML off, then sanitise the output; a Markdown link can still carry `javascript:`.
- Content imported from a CMS is trusted because editors wrote it → sanitise anyway; an editor account is a target, and the code-standard rule 7 prose scale styles the allowed elements.
- A sanitiser runs once on save and the stored HTML is printed raw for years → sanitise on output as well; sanitiser rules improve, stored data does not.

**Accessibility**
- Keep the semantic elements (headings, lists, `alt` on images) in the allowlist: stripping them breaks 1.3.1 Info and Relationships for the content that survives.

**Check**
- *Script:* could flag a raw-output helper or `innerHTML` whose source is user content without a sanitiser call on the path, and feed the sanitiser a fixture of known payloads.
- *Judgement:* Where can a user's markup reach this page, and does each path pass the sanitiser?

**Sources:** MDN and DOMPurify as linked; OWASP's XSS cheat sheet recommends DOMPurify for HTML sanitisation.

## Forms and cross-site request forgery

**What good looks like**
- Every request that changes state is a POST (or another non-GET method) that proves it came from the site's own page.
- Session cookies carry `SameSite`, `Secure` and `HttpOnly`.
- A GET never writes (code-standard rule 20's render that never writes is the same principle).

**How**
- A synchroniser or signed double-submit token in a hidden field, checked on the server; OWASP lists these as the primary defence and `SameSite` cookies as defence in depth ([OWASP, *CSRF Prevention Cheat Sheet*](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)).
- `SameSite=Lax` sends the cookie on same-site requests and top-level cross-site navigations only, so a cross-site POST arrives without it ([MDN `Set-Cookie`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie)). `Strict` for sessions that need no inbound links.
- Check `Origin` (or `Sec-Fetch-Site`) on state-changing requests; browsers send `Origin` on cross-origin requests and on same-origin POSTs ([MDN `Origin`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Origin)).
- `form-action 'self'` in the CSP stops an injected form posting elsewhere.

**Cases**
- A delete link is `<a href="/items/4/delete">` → a POST form with a token; a crawler, a prefetch or an `<img>` on another site follows GETs.
- A JSON API trusts that `Content-Type: application/json` cannot be sent cross-site → it can be sent as `text/plain`, a CORS simple request with no preflight ([MDN, *CORS*](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS)); check the token or `Origin`.
- A form's script removes the submit button and posts with `fetch` → the no-script form keeps its token too, so both paths are protected (code-standard rule 20).

**Accessibility**
- A token expiry shows an error that says what happened and keeps what was typed (WCAG 2.2 3.3.1 Error Identification; [forms](../ui/patterns/forms.md)).

**Check**
- *Script:* could submit each POST form from another origin and expect a refusal; flag forms with `method="post"` and no token field, and GET routes that write.
- *Judgement:* Which requests change state, and what stops another site sending them?

**Sources:** OWASP and MDN as linked; they agree that tokens are primary and `SameSite` is a second layer, and so does the toolkit.

## Clickjacking

**What good looks like**
- Pages refuse to be framed by other origins, unless being embedded is their purpose.
- The refusal is a header, not a script.

**How**
- `Content-Security-Policy: frame-ancestors 'self'` (or `'none'`), sent as a header; it is ignored in a `<meta>` tag ([MDN `frame-ancestors`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/frame-ancestors)).
- `X-Frame-Options: DENY` or `SAMEORIGIN` beside it for old browsers; its `ALLOW-FROM` option is obsolete ([OWASP, *Clickjacking Defense*](https://cheatsheetseries.owasp.org/cheatsheets/Clickjacking_Defense_Cheat_Sheet.html)).
- Frame-busting scripts (`if (top !== self)`) are defeated by `sandbox`; do not rely on them.

**Cases**
- An admin page with a one-click "Publish" button → `frame-ancestors 'none'`; a framed, transparent copy can trick a click.
- An embeddable widget must load inside partners' pages → serve only the widget route with `frame-ancestors` listing the partners, and keep the rest of the site at `'self'`.

**Accessibility**
- None directly.

**Check**
- *Script:* could request each page and assert `frame-ancestors` in the CSP header.
- *Judgement:* Which routes are meant to be framed, and by whom?

**Sources:** MDN and OWASP as linked.

## Local development servers

**What good looks like**
- A server on `localhost` (a dev server, a dashboard, a tool bridge) assumes every page the developer visits can send it requests.
- It checks `Origin` on every write route and on WebSocket upgrades, and refuses what is not its own.

**How**
- A page on any site can POST to `http://localhost:port/` from the developer's browser: a `text/plain` body is a CORS simple request, so there is no preflight, and the attacker does not need to read the reply when the request itself does the harm ([MDN, *CORS*](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS)). Binding to `127.0.0.1` does not help; the request comes from the developer's own browser.
- Compare `Origin` against the server's own origin on every non-GET request and on the socket upgrade; require a JSON content type, which forces a preflight; a random token in the page the server itself serves is a second layer.
- The lesson came from a real run and waits in [candidates](candidates.md) ("A localhost service is reachable by every page the user visits"), with the related path-walking write through `__proto__` beside it.

**Cases**
- A local tool exposes `POST /exec` that runs code → refuse any request whose `Origin` is not the tool's own page; without it, any site the developer opens can run code on the machine.
- A dev server's WebSocket accepts any connection → check `Origin` on the upgrade; browsers send it, and the WebSocket protocol has no CORS.
- A local API merges `{path, value}` into an object → reject `__proto__`, `constructor` and `prototype` segments (the second lesson in [candidates](candidates.md)).

**Accessibility**
- None directly.

**Check**
- *Script:* could start the server and send a write request with `Origin: https://example.com` and `Content-Type: text/plain`, expecting a refusal; the same for a WebSocket upgrade.
- *Judgement:* What could a page on another site make this server do?

**Sources:** MDN as linked; the lesson is the toolkit's own, recorded in [candidates](candidates.md).

## Secrets never in front-end code

**What good looks like**
- Nothing shipped to the browser holds a secret: every byte of a bundle, a source map and an inlined environment variable is public.
- Keys the browser must hold are publishable keys, scoped and restricted by origin; anything else sits behind a server.
- Client-side checks are for the person's convenience, never the boundary.

**How**
- Build tools inline environment variables with a public prefix only; review that list, and keep server-only variables out of client modules.
- Restrict browser keys at the provider (allowed origins, allowed APIs, quotas).
- Ship source maps to error tracking privately, or accept that the source is public.
- Enforce permissions on the server; a read-only mode done with `pointer-events: none` or `disabled` stops a mouse, not a request.
- Keep `.env` files out of version control and published packages ([OWASP, *NPM Security Cheat Sheet*](https://cheatsheetseries.owasp.org/cheatsheets/NPM_Security_Cheat_Sheet.html), "Avoid publishing secrets to the npm registry").

**Cases**
- An API key for a paid service sits in a client bundle "because the page needs it" → proxy the call through a server route that holds the key and rate-limits.
- A read-only view disables editing with `pointer-events: none` → the server refuses the write for that role; the keyboard and devtools both bypass CSS.
- A feature flag hides an unreleased admin screen in the client → the route also checks the role on the server; the hidden code is readable in the bundle.

**Accessibility**
- A control a person may not use is `disabled` or not rendered, so it is announced as such; `pointer-events: none` alone leaves it focusable and operable by keyboard (WCAG 2.2 4.1.2 Name, Role, Value; code-standard rule 9).

**Check**
- *Script:* could scan built bundles and source maps for key-shaped strings (a secret scanner in CI), flag non-public environment variables referenced in client modules, and flag `pointer-events: none` used as a permission.
- *Judgement:* If someone read every file this page downloads, what could they do?

**Sources:** OWASP as linked.

## Dependency hygiene

**What good looks like**
- Dependencies are few, each one earning its place over a platform feature.
- Installs come from a committed lockfile, in CI exactly as locally.
- Known vulnerabilities are reported on every build and triaged, not ignored.

**How**
- Commit the lockfile and install with `npm ci` (or the package manager's frozen mode), which fails if the lockfile and `package.json` disagree ([npm `ci`](https://docs.npmjs.com/cli/commands/npm-ci), [OWASP NPM](https://cheatsheetseries.owasp.org/cheatsheets/NPM_Security_Cheat_Sheet.html), "Enforce the lockfile").
- Run `npm audit` (or the equivalent) in CI and gate on high and critical findings ([npm `audit`](https://docs.npmjs.com/cli/commands/npm-audit)); an advisory that does not apply is recorded with its reason, not silenced.
- Install scripts run arbitrary code; OWASP advises `--ignore-scripts` where a package does not need them.
- Prefer a platform feature to a package: `Intl` over a date library ([i18n](i18n.md)), `<dialog>` and popover over a modal package, native form validation over a validator.

**Cases**
- A package is added for one function → write the function, or use the platform; every dependency is a supply chain.
- CI runs `npm install` and a transitive dependency updates between runs → `npm ci`; a build that differs from the last without a commit cannot be reasoned about.
- `npm audit` reports forty findings nobody reads → gate on high and critical, triage the rest once, and keep the list empty; a warning nobody drains is the queue [candidates](candidates.md) describes for lint.

**Accessibility**
- None directly.

**Check**
- *Script:* could assert a lockfile is committed, that CI installs with the frozen command, and that the audit step's exit status is the one the job reports (code-standard rule 49).
- *Judgement:* For each dependency, what would it take to remove it?

**Sources:** npm and OWASP as linked.
