# Application and server security

What the server side of a web app does so that a stranger, or a signed-in person, cannot read, change or spend what is not theirs: a small threat model, a permission check on every object and action, the framework's entry points treated as public, queries and commands that keep data out of the instructions, sessions and sign-in, uploads and outbound requests, caches, limits, machine callers, logs, model features and testing. The first sections cover what the rankings in the first one put highest. It applies code-standard rule 36 (one implementation, so a fix reaches every caller), code-standard rule 49 (a check's verdict is its own) and code-standard rule 61 (a failure that says why, within what is safe to show).

What runs in the browser is [front-end security](security.md)'s. The database's, host's and supply chain's configuration are [platform security](security-platform.md)'s. People, their accounts and what to do after an attack are [security operations](security-operations.md)'s.

**Implements:** the server side of [authentication](../ui/patterns/authentication.md) and [upload](../ui/patterns/upload.md).

## Threat model and what attacks web apps most

**What good looks like**
- [moderate] Security work starts with known flaws in what is deployed, then credentials: 31% of breaches in the 2026 DBIR began with exploiting a vulnerability, which overtook stolen credentials as the first way in ([Verizon](https://www.verizon.com/about/news/breach-industry-wide-dbir-finds)).
- [strong] In the app's own code, access control comes first: it is A01 in the [OWASP Top 10:2025](https://top10.owasp.org/2025/0x00_2025-Introduction/), built on data from over 2.8 million applications, with server-side request forgery folded into it.
- [strong] The specific flaws to design out are ranked by a year of CVE records in the [2025 CWE Top 25](https://cwe.mitre.org/top25/archive/2025/2025_cwe_top25.html): for a server, SQL injection (2), cross-site request forgery (3), missing authorisation (4), path traversal (6), command injection (9), code injection (10), unrestricted upload (12), unsafe deserialisation (15), incorrect authorisation (17), missing authentication (21), request forgery from the server (22), authorisation by a caller's key (24) and no resource limits (25).

**How**
- [moderate] A written threat model answers four questions (what are we working on, what can go wrong, what will we do about it, did we do a good enough job) over a drawing of data flows and trust boundaries ([NCSC, *Threat modelling*](https://www.ncsc.gov.uk/collection/risk-management/threat-modelling), [OWASP, *Threat Modeling*](https://cheatsheetseries.owasp.org/cheatsheets/Threat_Modeling_Cheat_Sheet.html)).

Patching deadlines, advisories and supported versions are [platform security: patching exploited flaws](security-platform.md#patching-exploited-flaws)'s.

**Cases**
- A one-person app with sign-in, a payment webhook and an upload → three boundaries to write down: browser to server, provider to server, file to whoever opens it.

**Accessibility**
- [weak] None directly.

**Check**
- *Script:* could compare the deployed framework version with its published advisories and fail on a match.
- *Judgement:* For each boundary, who can send to it, and what is the worst request they can send?

**Sources:** Verizon, OWASP, MITRE and NCSC as linked. The DBIR counts breaches, the Top 10 tested applications and the Top 25 CVE records, so their orders differ.

## Access control on every object and action

**What good looks like**
- [strong] Against IDOR (insecure direct object references), every request that reads or changes an object checks that this person may do this to this object; being signed in is not enough ([CISA, NSA and ACSC, *IDOR advisory*](https://www.cisa.gov/news-events/cybersecurity-advisories/aa23-208a), [OWASP API1:2023](https://api-security.owasp.org/editions/2023/en/0xa1-broken-object-level-authorization/), [MDN, *IDOR*](https://developer.mozilla.org/en-US/docs/Web/Security/Attacks/IDOR)).
- [strong] Access is denied unless a rule grants it, for each function as well as each object, so an admin action refuses an ordinary account that calls it directly ([OWASP API5:2023](https://api-security.owasp.org/editions/2023/en/0xa5-broken-function-level-authorization/), [CISA](https://www.cisa.gov/news-events/cybersecurity-advisories/aa23-208a), [MITRE CWE-862](https://cwe.mitre.org/data/definitions/862.html)).
- [strong] An unguessable id lowers the odds of a guess and is never the permission ([MDN](https://developer.mozilla.org/en-US/docs/Web/Security/Attacks/IDOR), [CISA](https://www.cisa.gov/news-events/cybersecurity-advisories/aa23-208a), [OWASP, *IDOR Prevention*](https://cheatsheetseries.owasp.org/cheatsheets/Insecure_Direct_Object_Reference_Prevention_Cheat_Sheet.html)).

**How**
- [moderate] Put the checks in one server-only data layer that every caller uses ([Next.js, *Data security*](https://nextjs.org/docs/app/guides/data-security), [OWASP A01](https://top10.owasp.org/2025/A01_2025-Broken_Access_Control/)) (beyond code-standard rule 36).
- [weak] Scope the query to the caller, so another person's row is never loaded, and answer missing and forbidden alike where existence is sensitive ([OWASP, *IDOR Prevention*](https://cheatsheetseries.owasp.org/cheatsheets/Insecure_Direct_Object_Reference_Prevention_Cheat_Sheet.html)).

  ```ts
  const [doc] = await db.select().from(docs)
    .where(and(eq(docs.id, id), eq(docs.ownerId, session.userId)));
  if (!doc) notFound();
  ```

- [moderate] Files, exports and generated documents pass the same check as the record they belong to ([OWASP, *Authorization*](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html), [MDN](https://developer.mozilla.org/en-US/docs/Web/Security/Attacks/IDOR)).
- [moderate] A change to a balance or limited quantity is one transaction with a lock or atomic update, so parallel requests cannot spend it twice ([ASVS 5.0 V2.3.3, V2.3.4](https://raw.githubusercontent.com/OWASP/ASVS/v5.0.0/5.0/en/0x11-V2-Validation-and-Business-Logic.md), [MITRE CWE-362](https://cwe.mitre.org/data/definitions/362.html)).

**Cases**
- An invoice page loads by `id` after "is signed in", or takes `userId` from a hidden field → add the session's user to the query; [CISA](https://www.cisa.gov/news-events/cybersecurity-advisories/aa23-208a) counts a 2019 breach of more than 800 million financial files to this flaw.

**Accessibility**
- [weak] None directly.

**Check**
- *Script:* could call every route and action as nobody, as another user and as an ordinary user, expecting a refusal, and flag a query by id with no owner or tenant condition.
- *Judgement:* For each id the client sends, where is it proved to be this caller's?

**Sources:** CISA with NSA and ACSC, OWASP, MITRE, MDN and Next.js as linked; they agree.

## Framework entry points and the proxy

**What good looks like**
- [required] Every Server Action authenticates and authorises inside itself: it "is reachable via a direct POST request", and a page's check does not extend to it ([Next.js, *Data security*](https://nextjs.org/docs/app/guides/data-security)).
- [required] Every Route Handler is treated as a public API endpoint ([Next.js, *Authentication*](https://nextjs.org/docs/app/guides/authentication)).
- [required] The proxy (middleware until it was renamed) does quick first checks and is never the only boundary ([Next.js, *Proxy*](https://nextjs.org/docs/app/api-reference/file-conventions/proxy)).

**How**
- [required] Repeat the check beside the data ([Next.js, *Authentication*](https://nextjs.org/docs/app/guides/authentication)), because the proxy has been bypassed: by one request header in 2025 ([CVE-2025-29927](https://github.com/vercel/next.js/security/advisories/GHSA-f82v-jwr5-mffw)), by segment-prefetch URLs in May 2026 ([GHSA-267c-6grr-h53f](https://github.com/vercel/next.js/security/advisories/GHSA-267c-6grr-h53f)) and by a build configuration in July 2026 ([CVE-2026-64642](https://nextjs.org/blog/july-2026-security-release)).
- [required] A matcher is not coverage: a path it excludes also skips the Server Functions called there ([Next.js, *Proxy*](https://nextjs.org/docs/app/api-reference/file-conventions/proxy)).
- [required] A layout is no gate: it does not re-render on navigation, and hiding its children does not stop them running or reaching the payload ([Next.js, *Authentication*](https://nextjs.org/docs/app/guides/authentication)).
- [required] Arguments to a Server Function are the client's: validate and authorise them ([React, *use server*](https://react.dev/reference/rsc/use-server)).
- [required] Return and pass to Client Components only the fields the interface needs; both are sent to the browser ([Next.js, *Data security*](https://nextjs.org/docs/app/guides/data-security)).
- [required] The built-in origin check on actions is no authentication: "Requests without an Origin header bypass this comparison" ([Next.js, *serverActions*](https://nextjs.org/docs/app/api-reference/config/next-config-js/serverActions)); forged requests are [security: forms](security.md#forms-and-cross-site-request-forgery)'s.
- [moderate] A Route Handler that writes on a cookie session makes its own token or origin check, as the built-in one is for Server Actions ([Next.js, *serverActions*](https://nextjs.org/docs/app/api-reference/config/next-config-js/serverActions), [security: forms](security.md#forms-and-cross-site-request-forgery)).

**Cases**
- An admin page redirects non-admins and its action only deletes → the action makes the same check.

**Accessibility**
- [weak] None directly.

**Check**
- *Script:* could flag an exported action or route handler with no authorisation call, and run the permission tests with the proxy switched off.
- *Judgement:* If the proxy vanished, what would become public?

**Sources:** Next.js and React on their own documented behaviour, and their advisories, as linked.

## Validation and injection

**What good looks like**
- [strong] Data reaches the database as parameters, never as query text ([OWASP, *SQL Injection Prevention*](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html), [MITRE CWE-89](https://cwe.mitre.org/data/definitions/89.html), [NCSC](https://www.ncsc.gov.uk/blog-post/prompt-injection-is-not-sql-injection)).
- [moderate] The app calls a library before a program; where it must call one, arguments are separate, validated and preceded by `--` where supported, since separation alone does not stop argument injection ([OWASP, *OS Command Injection*](https://cheatsheetseries.owasp.org/cheatsheets/OS_Command_Injection_Defense_Cheat_Sheet.html), [MITRE CWE-88](https://cwe.mitre.org/data/definitions/88.html)).
- [moderate] A file path is built from names the server chose ([OWASP ASVS 5.0 V5.3.2](https://raw.githubusercontent.com/OWASP/ASVS/v5.0.0/5.0/en/0x14-V5-File-Handling.md), [MITRE CWE-434](https://cwe.mitre.org/data/definitions/434.html)).
- [strong] The server validates every input, whatever the browser checked: body, query, path, headers and cookies ([OWASP, *Input Validation*](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html), [CISA](https://www.cisa.gov/news-events/cybersecurity-advisories/aa23-208a), [React](https://react.dev/reference/rsc/use-server)).
- [moderate] A write takes only the fields that action may change; role, owner, price and verified status come from the server, and the rest is taken from the parsed result and never the raw body ([OWASP, *Mass Assignment*](https://cheatsheetseries.owasp.org/cheatsheets/Mass_Assignment_Cheat_Sheet.html), [MITRE CWE-915](https://cwe.mitre.org/data/definitions/915.html)).

**How**
- [required] In Drizzle, values go through the `sql` template; `sql.raw()` adds text "without any additional processing or escaping", so untrusted input never reaches it ([Drizzle, *sql*](https://orm.drizzle.team/docs/sql)).
- [required] In Prisma, untrusted input never reaches `$queryRawUnsafe`, `$executeRawUnsafe` or `Prisma.raw` as text ([Prisma, *Raw queries*](https://www.prisma.io/docs/orm/v7/prisma-client/using-raw-sql/raw-queries)).
- [moderate] A table, column or sort direction cannot be a parameter: map the request's choice to a fixed list ([OWASP](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html), [Prisma](https://www.prisma.io/docs/orm/v7/prisma-client/using-raw-sql/raw-queries)).
- [required] In Node, untrusted input never goes to `exec` or to any call with the `shell` option ([Node.js, *child_process*](https://nodejs.org/api/child_process.html)).
- [moderate] No request data becomes code through `eval` or its equivalents ([MITRE CWE-94](https://cwe.mitre.org/data/definitions/94.html), [OWASP, *Node.js Security*](https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html)).
- [weak] Untrusted data arrives in a plain format such as JSON, never as native serialised objects ([OWASP, *Deserialization*](https://cheatsheetseries.owasp.org/cheatsheets/Deserialization_Cheat_Sheet.html)).
- [moderate] A path that must come from input is decoded and canonicalised before it is checked against its folder ([MITRE CWE-22](https://cwe.mitre.org/data/definitions/22.html), [OWASP, *Path Traversal*](https://owasp.org/www-community/attacks/Path_Traversal)).
- [moderate] Validate shape (type, length, range) and sense (allowed values, related fields that agree) ([OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html), [CISA](https://www.cisa.gov/news-events/cybersecurity-advisories/aa23-208a)).
- [weak] In Zod, `z.object` strips unknown keys from its result and `z.strictObject` rejects them ([Zod](https://zod.dev/api)).
- [moderate] Pick response fields by name rather than serialising the row ([OWASP API3:2023](https://api-security.owasp.org/editions/2023/en/0xa3-broken-object-property-level-authorization/), [Next.js](https://nextjs.org/docs/app/guides/data-security)).

**Cases**
- A download route joins `?file=` to a folder → look the file up by id.
- A profile update spreads the request body into the update and someone adds `isAdmin` → parse a schema of the editable fields.

**Accessibility**
- [required] A rejected value is named and described in text (WCAG 2.2 3.3.1 Error Identification; [forms](../ui/patterns/forms.md)).

**Check**
- *Script:* could flag raw query helpers, `exec`, `shell: true`, `eval`, file calls with a variable path and writes that spread the request, and post each form with an extra privileged field.
- *Judgement:* Which of these inputs is read as an instruction, or written to a field this caller may not change?

**Sources:** OWASP, MITRE, CISA, NCSC, Node.js, React, Next.js, Drizzle, Prisma and Zod as linked; they agree that validation replaces neither parameters nor permission checks.

## Authentication and sessions

**What good looks like**
- [strong] Passwords are stored only as salted hashes from a slow password scheme ([NIST SP 800-63B-4](https://pages.nist.gov/800-63-4/sp800-63b.html), [OWASP, *Password Storage*](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html), [RFC 9106](https://www.rfc-editor.org/rfc/rfc9106.html)).
- [strong] Accounts are offered a second factor: without a mandatory one, reused passwords opened 23andMe to credential stuffing and a £2.31 million fine ([ICO](https://ico.org.uk/about-the-ico/media-centre/news-and-blogs/2025/06/23andme-fined-for-failing-to-protect-uk-users-genetic-data/), [NIST](https://pages.nist.gov/800-63-4/sp800-63b.html), [OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Credential_Stuffing_Prevention_Cheat_Sheet.html)); the interface is [authentication](../ui/patterns/authentication.md#two-factor-one-time-codes-and-passkeys)'s.
- [strong] Online guessing is throttled ([NIST](https://pages.nist.gov/800-63-4/sp800-63b.html), [NCSC](https://www.ncsc.gov.uk/collection/passwords/updating-your-approach), [OWASP ASVS V6.3.1](https://raw.githubusercontent.com/OWASP/ASVS/v5.0.0/5.0/en/0x15-V6-Authentication.md)); credential stuffing, which a per-account throttle misses, was a median 19% of daily attempts in the sign-in-provider logs Verizon studied ([Verizon](https://www.verizon.com/business/resources/articles/credential-stuffing-attacks-2025-dbir-research/)).
- [strong] Signing in issues a new session id and voids the old one, which defeats session fixation ([OWASP, *Session Management*](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html), [MDN, *Session management*](https://developer.mozilla.org/en-US/docs/Web/Security/Authentication/Session_management), [MITRE CWE-384](https://cwe.mitre.org/data/definitions/384.html)).
- [strong] The server enforces expiry ([NIST](https://pages.nist.gov/800-63-4/sp800-63b.html), [OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html), [MDN](https://developer.mozilla.org/en-US/docs/Web/Security/Authentication/Session_management)).
- [moderate] Signing out kills the session on the server; a self-contained token needs a revocation list or a short life ([OWASP ASVS 5.0 V7.4.1](https://raw.githubusercontent.com/OWASP/ASVS/v5.0.0/5.0/en/0x16-V7-Session-Management.md), [MDN](https://developer.mozilla.org/en-US/docs/Web/Security/Authentication/Session_management)).
- [required] A JWT is verified with the algorithms and keys the app sets, rejected if any check fails, and checked for audience where its issuer serves several ([RFC 8725](https://www.rfc-editor.org/rfc/rfc8725.html)).
- [required] A provider account is keyed on issuer plus `sub`; email and the other claims "MUST NOT be used as unique identifiers for the End-User" ([OpenID Connect Core](https://openid.net/specs/openid-connect-core-1_0.html)).

**How**
- [moderate] Use Argon2id ([OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html), [RFC 9106](https://www.rfc-editor.org/rfc/rfc9106.html)); Node has `crypto.argon2` from 24.7.0 ([Node.js](https://nodejs.org/api/crypto.html)).
- [contested] Argon2id's cost: OWASP's minimum is 19 MiB, 2 passes and 1 lane ([OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)); the RFC's option for limited memory is 64 MiB, 3 passes and 4 lanes ([RFC 9106](https://www.rfc-editor.org/rfc/rfc9106.html)).
- [contested] Minimum length: NIST sets 15 characters for a password used alone and 8 beside a second factor ([NIST](https://pages.nist.gov/800-63-4/sp800-63b.html)); ASVS accepts 8 and recommends 15 ([ASVS 5.0 V6.2.1](https://raw.githubusercontent.com/OWASP/ASVS/v5.0.0/5.0/en/0x15-V6-Authentication.md)).
- [strong] Refuse common or compromised passwords ([NIST](https://pages.nist.gov/800-63-4/sp800-63b.html), [OWASP ASVS](https://raw.githubusercontent.com/OWASP/ASVS/v5.0.0/5.0/en/0x15-V6-Authentication.md), [GOV.UK](https://design-system.service.gov.uk/patterns/passwords/)).
- [moderate] Slow repeated failures before any lockout, which attackers can use to lock people out ([NCSC](https://www.ncsc.gov.uk/collection/passwords/updating-your-approach), [OWASP ASVS V6.1.1](https://raw.githubusercontent.com/OWASP/ASVS/v5.0.0/5.0/en/0x15-V6-Authentication.md)); NIST still disables that authenticator by 100 consecutive failures at most, until it is bound again ([NIST](https://pages.nist.gov/800-63-4/sp800-63b.html)).
- [weak] Sign-in, sign-up and recovery answer alike, and as quickly, whether or not the account exists ([OWASP, *Forgot Password*](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html)).
- [moderate] Reset secrets come from a secure generator, work once where the channel allows and expire soon ([OWASP, *Forgot Password*](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html), [NIST](https://pages.nist.gov/800-63-4/sp800-63b.html)).
- [weak] Reset links are built from a configured origin, never the `Host` header, and a reset ends old sessions ([OWASP, *Forgot Password*](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html)).
- [required] A `__Host-` name makes the browser refuse the cookie unless it is `Secure`, has `Path=/` and no `Domain`, so a subdomain cannot plant it ([MDN, *Set-Cookie*](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie)).
- [weak] A stored session id comes from a cryptographic generator with at least 128 bits ([ASVS V7.2.3](https://raw.githubusercontent.com/OWASP/ASVS/v5.0.0/5.0/en/0x16-V7-Session-Management.md)).
- [weak] Take timeouts from NIST unless a reason is written down: at most 30 days overall on one factor; with two, at most 24 hours overall and 1 hour idle ([NIST](https://pages.nist.gov/800-63-4/sp800-63b.html), [ASVS V7.1.1](https://raw.githubusercontent.com/OWASP/ASVS/v5.0.0/5.0/en/0x16-V7-Session-Management.md)).
- [weak] Ask for sign-in again before a change of email, password or second factor, and end sessions when an account is disabled ([ASVS V7.4.2, V7.5.1](https://raw.githubusercontent.com/OWASP/ASVS/v5.0.0/5.0/en/0x16-V7-Session-Management.md)).
- [required] Use the authorisation code flow with a defence against code injection: a public client must use PKCE; for a confidential one PKCE is recommended, and a confidential OpenID Connect client may use `nonce` with §4.5.3.2's precautions instead. A one-time `state` bound to the browser only stops forged callbacks and replaces neither ([RFC 9700](https://www.rfc-editor.org/rfc/rfc9700.html)).
- [required] The authorisation server matches redirect URIs exactly, the app exposes no open redirector, and with several providers a mix-up defence is required: preferably a check of the response's issuer, or else a distinct redirect URI each ([RFC 9700](https://www.rfc-editor.org/rfc/rfc9700.html)).
- [required] Validate the ID token's `iss`, `aud`, `exp` and any `nonce` sent, and its signature, which only a token received straight from the token endpoint over validated TLS may skip ([OpenID Connect Core §3.1.3.7](https://openid.net/specs/openid-connect-core-1_0.html)).

The cookie's `HttpOnly`, `Secure` and `SameSite` are [front-end security: forms](security.md#forms-and-cross-site-request-forgery)'s.

**Cases**
- Passwords are hashed with SHA-256 → Argon2id; a fast hash makes every guess cheap.
- Sign-out only deletes the cookie → delete the row too; a copied cookie still works otherwise.
- A second provider's account joins an existing one because the email matches → link only after signing in to the existing account.

**Accessibility**
- [required] A step needing a memory or puzzle test has an alternative, a mechanism to help (password managers and paste count) or another of 3.3.8's exceptions, and a time limit can be turned off, adjusted or extended after a warning unless 2.2.1 exempts it (WCAG 2.2 3.3.8 and 2.2.1; [authentication](../ui/patterns/authentication.md#session-timeouts-and-signing-out)).

**Check**
- *Script:* could assert each hash's algorithm and cost, expect throttling after failures, reuse a reset link, compare the session id before and after sign-in, replay a cookie after sign-out, and replay a provider callback with a wrong `state`.
- *Judgement:* Is any way in weaker than the main one, and how is every session of one account ended now?

**Sources:** NIST, OWASP, IETF, OpenID Foundation, MDN, MITRE, NCSC, ICO, Verizon, GOV.UK, Next.js and Node.js as linked; they differ on length and hashing cost, as marked.

## File uploads and server-side requests

**What good looks like**
- [strong] An upload is hostile until checked; unrestricted upload is 12th in the [CWE Top 25](https://cwe.mitre.org/top25/archive/2025/2025_cwe_top25.html).
- [moderate] The server names the file and keeps it outside the web root, or better on another host ([OWASP, *File Upload*](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html), [MITRE CWE-434](https://cwe.mitre.org/data/definitions/434.html)).
- [strong] Where the server fetches for a caller, destinations come from an allowlist ([OWASP, *SSRF Prevention*](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html), [MDN, *SSRF*](https://developer.mozilla.org/en-US/docs/Web/Security/Attacks/SSRF), [MITRE CWE-918](https://cwe.mitre.org/data/definitions/918.html)).

**How**
- [moderate] Allow few extensions ([OWASP](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html), [MITRE](https://cwe.mitre.org/data/definitions/434.html)).
- [weak] Check that the content matches the extension, and re-encode images: the sent `Content-Type` can be spoofed ([OWASP](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html)).
- [weak] Limit size, and for archives the unpacked size and file count ([ASVS 5.0 V5.2.1, V5.2.3](https://raw.githubusercontent.com/OWASP/ASVS/v5.0.0/5.0/en/0x14-V5-File-Handling.md)).
- [required] Know the platform's ceiling: Vercel Functions take 4.5 MB request bodies by default ([Vercel, *Limits*](https://vercel.com/docs/functions/limitations)) and Server Actions 1 MB ([Next.js](https://nextjs.org/docs/app/api-reference/config/next-config-js/serverActions)).
- [weak] Serve downloads with a safe filename in `Content-Disposition` and `nosniff` ([ASVS V5.4.1](https://raw.githubusercontent.com/OWASP/ASVS/v5.0.0/5.0/en/0x14-V5-File-Handling.md), [MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/X-Content-Type-Options)).
- [required] Treat SVG as a document: leave `dangerouslyAllowSVG` false, or add `contentDispositionType: 'attachment'` and a CSP that blocks its scripts ([Next.js, *Image*](https://nextjs.org/docs/app/api-reference/components/image)).
- [required] Keep image optimisation patched, as Next.js asks (16.4.5 or 15.5.29 and later as of November 2026): crafted AVIF ([August](https://nextjs.org/blog/august-2026-security-release)) and SVG on glibc Linux ([October](https://nextjs.org/blog/nextjs-security-update-october-14-2026)) could give remote code execution, and until November's fix an SVG could pass `dangerouslyAllowSVG: false` ([November](https://nextjs.org/blog/november-2026-security-release)).
- [moderate] Allow `https:` only, do not follow redirects, and do not hand the raw response back ([MDN](https://developer.mozilla.org/en-US/docs/Web/Security/Attacks/SSRF), [OWASP API7:2023](https://api-security.owasp.org/editions/2023/en/0xa7-server-side-request-forgery/)).
- [weak] Where any public host must be allowed, refuse private, loopback and link-local addresses and connect to the address that was checked, or DNS rebinding gets round it ([OWASP, *SSRF Prevention*](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html)).
- [required] The image optimiser follows redirects without checking `remotePatterns` again: keep the patterns narrow and lower `maximumRedirects`, to `0` where possible ([Next.js, *Image*](https://nextjs.org/docs/app/api-reference/components/image)).
- [weak] Beyond patching, a custom server pins or validates `Host` and `X-Forwarded-Host` at its proxy ([GHSA-89xv-2m56-2m9x](https://github.com/vercel/next.js/security/advisories/GHSA-89xv-2m56-2m9x)), and a rewrite or redirect that builds its external host from input was open to abuse until 16.2.11 and 15.5.21 ([Next.js, July 2026](https://nextjs.org/blog/july-2026-security-release)).

**Cases**
- A link preview fetches any URL → resolve, refuse internal addresses, no redirects, return the title only.

**Accessibility**
- [required] A refusal says in text which file failed and why (WCAG 2.2 3.3.1; [upload](../ui/patterns/upload.md#progress-errors-and-retry)).

**Check**
- *Script:* could upload HTML renamed as PNG, an SVG with a script, an oversized file and a `../` name, and send loopback, link-local, IPv6 and redirect-to-internal URLs to each fetching route.
- *Judgement:* What opens this file later, and what can this server fetch that the caller cannot?

**Sources:** OWASP, MITRE, MDN, Next.js and Vercel as linked.

## Caching private responses

**What good looks like**
- [strong] A response made for one person never enters a shared cache ([RFC 9111](https://www.rfc-editor.org/rfc/rfc9111.html), [MDN, *Cache-Control*](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control), [ASVS 5.0 V14.2.2](https://raw.githubusercontent.com/OWASP/ASVS/v5.0.0/5.0/en/0x23-V14-Data-Protection.md)).

**How**
- [required] `private` forbids shared caches from storing a response and `no-store` forbids every cache ([RFC 9111](https://www.rfc-editor.org/rfc/rfc9111.html)).
- [moderate] Send `Cache-Control: no-store` on sensitive data, and state the policy everywhere, since an absent header allows heuristic caching ([ASVS V14.3.2](https://raw.githubusercontent.com/OWASP/ASVS/v5.0.0/5.0/en/0x23-V14-Data-Protection.md), [MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control)).
- [required] On Vercel's CDN `Vercel-CDN-Cache-Control`, then `CDN-Cache-Control`, override `Cache-Control`, wherever they are set, so `private` or `no-store` there protects a response only when neither is sent; `Set-Cookie` on the response and `Authorization` on the request also keep it uncached, and a session cookie on the request alone does not ([Vercel, *Cache-Control headers*](https://vercel.com/docs/caching/cache-control-headers), [Vercel, *CDN cache*](https://vercel.com/docs/caching/cdn-cache)).
- [required] `cookies()` and `headers()` are read outside a `use cache` scope and what varies is passed as arguments, which form the key ([Next.js, *use cache*](https://nextjs.org/docs/app/api-reference/directives/use-cache)).
- [required] Patch Next.js where `use cache` holds per-user or per-tenant data: three advisories in [November 2026](https://nextjs.org/blog/november-2026-security-release) and one in [September 2026](https://nextjs.org/blog/september-2026-security-release), each asking for an upgrade, served one key's cached data under another.

**Cases**
- `/api/me` is given `s-maxage` to save queries → `private, no-store`.

**Accessibility**
- [weak] None directly.

**Check**
- *Script:* could request each private URL as A, then as B and as nobody, asserting the header, that no CDN cache header overrides it, and that A's data never returns.
- *Judgement:* What is in this cache key, and who shares it?

**Sources:** IETF, MDN, OWASP, Vercel and Next.js as linked.

## Rate limits, bots and cost exhaustion

**What good looks like**
- [moderate] Every costly operation has a limit: sign-in, reset, email, SMS, search, export, model calls ([OWASP API4:2023](https://api-security.owasp.org/editions/2023/en/0xa4-unrestricted-resource-consumption/), [Next.js](https://nextjs.org/docs/app/guides/data-security), and [MITRE](https://cwe.mitre.org/top25/archive/2025/2025_cwe_top25.html) ranks missing limits 25th).

**How**
- [weak] Against denial of service, cap body size, string and array length and page size, and set timeouts ([OWASP API4](https://api-security.owasp.org/editions/2023/en/0xa4-unrestricted-resource-consumption/)).
- [moderate] Do not count on a limit per account or per address to stop credential stuffing, which tries each account once through proxies: add a second factor or, short of it, layered checks with their attack volume watched ([Verizon](https://www.verizon.com/business/resources/articles/credential-stuffing-attacks-2025-dbir-research/), [OWASP, *Credential Stuffing*](https://cheatsheetseries.owasp.org/cheatsheets/Credential_Stuffing_Prevention_Cheat_Sheet.html)).
- [weak] Limit reset and code requests per account, so nobody can flood one person's inbox or phone ([OWASP, *Forgot Password*](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html)).
- [required] An edge rule is not a quota: Vercel counts per region, so the total can pass the limit, and a dashboard rule on Hobby or ordinary Pro keys only on IP or TLS fingerprint; a key such as the user's id needs the Rate Limiting SDK ([Vercel, *Rate limiting*](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting), [*SDK*](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting-sdk)).

Spending limits are [platform security: denial of service and spend limits](security-platform.md#denial-of-service-and-spend-limits)'s.

**Cases**
- A "send me a code" button calls a paid SMS provider → a limit per number and account, and a cap at the provider.

**Accessibility**
- [required] A challenge at sign-in that is a cognitive function test has another route, a mechanism to help or one of the criterion's two other exceptions (WCAG 2.2 3.3.8).

**Check**
- *Script:* could call each costly route past its limit and expect 429, and send oversized bodies and page sizes.
- *Judgement:* What does one script running all night cost here?

**Sources:** OWASP, MITRE, Verizon, Next.js and Vercel as linked.

## Webhooks and cron endpoints

**What good looks like**
- [strong] A webhook is rejected unless its signature over the untouched body verifies ([Stripe](https://docs.stripe.com/webhooks), [GitHub](https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries), [Standard Webhooks](https://raw.githubusercontent.com/standard-webhooks/standard-webhooks/main/spec/standard-webhooks.md)).
- [strong] A replay of a processed event does nothing: delivery ids are recorded, and timestamps checked where the sender signs one ([Stripe](https://docs.stripe.com/webhooks), [GitHub](https://docs.github.com/en/webhooks/using-webhooks/best-practices-for-using-webhooks), [Standard Webhooks](https://raw.githubusercontent.com/standard-webhooks/standard-webhooks/main/spec/standard-webhooks.md)).

**How**
- [strong] Compare signatures and secrets in constant time with `crypto.timingSafeEqual` ([GitHub](https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries), [Standard Webhooks](https://raw.githubusercontent.com/standard-webhooks/standard-webhooks/main/spec/standard-webhooks.md), [Node.js](https://nodejs.org/api/crypto.html)).
- [required] It takes buffers, not strings, and throws on unequal byte lengths: `const a = Buffer.from(given), b = Buffer.from(expected)`, then `a.length === b.length && timingSafeEqual(a, b)` ([Node.js](https://nodejs.org/api/crypto.html)).
- [required] Stripe's verifier needs the raw body and allows 5 minutes of age by default; a tolerance of `0` switches the check off ([Stripe](https://docs.stripe.com/webhooks)).
- [weak] Each secret is long and random and stored on the server ([GitHub](https://docs.github.com/en/webhooks/using-webhooks/best-practices-for-using-webhooks)).
- [weak] It is rolled on a schedule or after a suspected leak ([Stripe](https://docs.stripe.com/webhooks)).
- [required] A Vercel cron receives `CRON_SECRET` (16 or more random characters recommended) as `Authorization: Bearer …` for the handler to check; changing it does nothing until a redeploy; refuse when it is unset, as Vercel's example does ([Vercel, *Cron jobs*](https://vercel.com/docs/schedules/cron-jobs/manage-cron-jobs)).

**Cases**
- A cron route compares with `Bearer ${process.env.CRON_SECRET}` and the variable is unset → fail when it is missing, or `Bearer undefined` gets in.

**Accessibility**
- [weak] None directly.

**Check**
- *Script:* could post with no signature, a wrong one, an old timestamp and a repeated id, and call each cron route without its secret.
- *Judgement:* Which routes have no person behind them, and what proves the caller?

**Sources:** Stripe, GitHub and Vercel on their own products, Standard Webhooks and Node.js, as linked.

## Errors, logging and alerts

**What good looks like**
- [moderate] Passwords, tokens, keys, connection strings and needless personal data are redacted before anything is logged ([OWASP, *Logging*](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html), [MITRE CWE-532](https://cwe.mitre.org/data/definitions/532.html), and storing passwords in plaintext on internal systems cost Meta [€91 million](https://www.dataprotection.ie/en/news-media/press-releases/DPC-announces-91-million-fine-of-Meta)).
- [moderate] The person gets a safe message and the server keeps the detail ([ASVS 5.0 V16.5.1](https://raw.githubusercontent.com/OWASP/ASVS/v5.0.0/5.0/en/0x25-V16-Security-Logging-and-Error-Handling.md), [MITRE CWE-209](https://cwe.mitre.org/data/definitions/209.html)).
- [moderate] An attack raises an alert someone sees ([OWASP A09](https://top10.owasp.org/2025/A09_2025-Security_Logging_and_Alerting_Failures/), and the [ICO](https://ico.org.uk/about-the-ico/media-centre/news-and-blogs/2025/06/23andme-fined-for-failing-to-protect-uk-users-genetic-data/) faulted 23andMe for lacking detection).

**How**
- [weak] Log sign-in successes and failures, refused permissions and failed validation, with who, what, when and where, encoded so input cannot forge a line ([OWASP, *Logging*](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html)).
- [moderate] Restrict who reads logs ([ASVS V16.4.2](https://raw.githubusercontent.com/OWASP/ASVS/v5.0.0/5.0/en/0x25-V16-Security-Logging-and-Error-Handling.md), [MITRE CWE-532](https://cwe.mitre.org/data/definitions/532.html)).
- [moderate] Fail closed: an error in a check refuses rather than falling back to a less safe state ([ASVS V16.5.3](https://raw.githubusercontent.com/OWASP/ASVS/v5.0.0/5.0/en/0x25-V16-Security-Logging-and-Error-Handling.md), [MITRE CWE-636](https://cwe.mitre.org/data/definitions/636.html)).
- [required] In production Next.js sends a generic message for server component errors; `error.digest` finds the detail in the server log ([Next.js, *error.js*](https://nextjs.org/docs/app/api-reference/file-conventions/error)).

Where logs are kept, for how long, and honeytokens are [platform security: monitoring](security-platform.md#monitoring)'s.

**Cases**
- An API returns the database's error text → a known reason (code-standard rule 61) and an id that finds the log line.
- A permission lookup throws and the catch continues → refuse.

**Accessibility**
- [required] An input error is still named and described in text, however little detail is safe to show (WCAG 2.2 3.3.1).

**Check**
- *Script:* could send marked fake secrets and search the logs for them, force an error and scan the response for stack, query and path strings.
- *Judgement:* Would last night's attack have told anyone?

**Sources:** OWASP, MITRE, the Irish DPC, the ICO and Next.js as linked.

## Features that call a language model

**What good looks like**
- [moderate] The design assumes prompt injection succeeds: models "do not enforce a security boundary between instructions and data" ([NCSC](https://www.ncsc.gov.uk/blog-post/prompt-injection-is-not-sql-injection)), and it is first in the [OWASP LLM Top 10 2026](https://raw.githubusercontent.com/GenAI-Security-Project/GenAI-LLM-Top10/main/2026/final/LLM01_PromptInjection.md).
- [strong] The model has least privilege, reaching only what the feature needs, so excessive agency, third on that list, has little to abuse ([OWASP LLM03](https://raw.githubusercontent.com/GenAI-Security-Project/GenAI-LLM-Top10/main/2026/final/LLM03_ExcessiveAgency.md), [NCSC](https://www.ncsc.gov.uk/blog-post/prompt-injection-is-not-sql-injection), [Anthropic](https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/mitigate-jailbreaks)).

**How**
- [moderate] Ordinary code authorises each tool call as the user, whose privileges drop to those of whoever wrote the content being read ([OWASP LLM03](https://raw.githubusercontent.com/GenAI-Security-Project/GenAI-LLM-Top10/main/2026/final/LLM03_ExcessiveAgency.md), [NCSC](https://www.ncsc.gov.uk/blog-post/prompt-injection-is-not-sql-injection)).
- [weak] Prefer narrow tools to open ones such as run a command, run SQL or fetch a URL ([OWASP LLM03](https://raw.githubusercontent.com/GenAI-Security-Project/GenAI-LLM-Top10/main/2026/final/LLM03_ExcessiveAgency.md)).
- [weak] A person approves high-impact actions such as sending, paying and deleting ([OWASP LLM03](https://raw.githubusercontent.com/GenAI-Security-Project/GenAI-LLM-Top10/main/2026/final/LLM03_ExcessiveAgency.md), [OWASP, *AI Agent Security*](https://cheatsheetseries.owasp.org/cheatsheets/AI_Agent_Security_Cheat_Sheet.html)).
- [moderate] Keep untrusted content out of system and developer messages, marked as data; this lowers the odds and is no boundary ([Anthropic](https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/mitigate-jailbreaks), [NCSC](https://www.ncsc.gov.uk/blog-post/prompt-injection-is-not-sql-injection)).
- [weak] Constrain output with a schema, then validate it as user input ([OWASP LLM01](https://raw.githubusercontent.com/GenAI-Security-Project/GenAI-LLM-Top10/main/2026/final/LLM01_PromptInjection.md)).
- [weak] Escape what is rendered and fetch no Markdown image or link preview from it automatically: either can carry data out ([OWASP LLM10](https://raw.githubusercontent.com/GenAI-Security-Project/GenAI-LLM-Top10/main/2026/final/LLM10_ImproperOutputHandling.md)).
- [weak] Cap tokens and cost per user, steps and time per run, and money per key ([OWASP LLM06](https://raw.githubusercontent.com/GenAI-Security-Project/GenAI-LLM-Top10/main/2026/final/LLM06_UnboundedConsumption.md)).
- [moderate] Log tool calls and failures, and do not count on blocking known bad phrases ([NCSC](https://www.ncsc.gov.uk/blog-post/prompt-injection-is-not-sql-injection), [OWASP LLM03](https://raw.githubusercontent.com/GenAI-Security-Project/GenAI-LLM-Top10/main/2026/final/LLM03_ExcessiveAgency.md)).

**Cases**
- An assistant summarises incoming email and can send → give it read only, and let the person send.

**Accessibility**
- [weak] None directly.

**Check**
- *Script:* could plant instructions in each content source and assert no tool call or outbound fetch follows, and call each tool with another user's ids.
- *Judgement:* If an attacker wrote the model's next reply, what would happen?

**Sources:** OWASP, NCSC, and Anthropic on its own models, as linked. OWASP's [2026 preface](https://raw.githubusercontent.com/GenAI-Security-Project/GenAI-LLM-Top10/main/2026/final/LLM00_Preface.md) says prompt injection leads by practitioners' vote and falls out of the top ten by incident count alone.

## Security headers and CORS

**What good looks like**
- [moderate] HTTPS responses send HSTS, reaching at least a year's `max-age` once the staged roll-out is done ([ASVS 5.0 V3.4.1](https://raw.githubusercontent.com/OWASP/ASVS/v5.0.0/5.0/en/0x12-V3-Web-Frontend-Security.md), [HSTS preload list](https://hstspreload.org/)).
- [moderate] Every response sends `X-Content-Type-Options: nosniff` and a referrer policy ([OWASP, *HTTP Headers*](https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html), [MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/X-Content-Type-Options), [MDN, *Referrer-Policy*](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Referrer-Policy)); CSP and framing are [front-end security](security.md#content-security-policy)'s.

**How**
- [moderate] Use these values: two years of HSTS, no sniffing, and the origin alone as referrer to other sites ([MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Referrer-Policy), [OWASP](https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html)).

  ```http
  Strict-Transport-Security: max-age=63072000
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  ```

- [moderate] Add `includeSubDomains` only once every subdomain, internal and future ones included, serves HTTPS, raising `max-age` in stages ([HSTS preload list](https://hstspreload.org/), [MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Strict-Transport-Security)).
- [contested] `preload`: OWASP's recommended header carries it ([OWASP, *HTTP Headers*](https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html)); the preload list's maintainers do not recommend preloading, as it gains little over HSTS and removal is slow and painful ([HSTS preload list](https://hstspreload.org/)).
- [required] On a custom domain Vercel's default HSTS has neither directive ([Vercel, *Encryption*](https://vercel.com/docs/cdn-security/encryption)).
- [required] A credentialed CORS response names one origin, since browsers refuse `*` with credentials ([MDN, *CORS*](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS)).
- [moderate] Add CORS only where another origin needs it: check it against an exact list, send `Vary: Origin`, never allow `null` ([ASVS V3.4.2](https://raw.githubusercontent.com/OWASP/ASVS/v5.0.0/5.0/en/0x12-V3-Web-Frontend-Security.md), [MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Access-Control-Allow-Origin)).

**Cases**
- A CORS error is fixed by echoing any `Origin` with credentials → every site can read as the signed-in person; list the origins.

**Accessibility**
- [weak] None directly.

**Check**
- *Script:* could request a page, an API route, an error and a file, assert the headers, and send a foreign and a `null` origin.
- *Judgement:* Who needs to call this from another origin?

**Sources:** OWASP, MDN, the HSTS preload list and Vercel as linked.

## Security testing before release

**What good looks like**
- [strong] Permissions and other security rules are tested as part of building and releasing ([NCSC, *Continually test*](https://www.ncsc.gov.uk/collection/developers-collection/principles/continually-test-your-security), [CISA](https://www.cisa.gov/news-events/cybersecurity-advisories/aa23-208a), [OWASP A01](https://top10.owasp.org/2025/A01_2025-Broken_Access_Control/)).

The legal duty to test is [security operations: personal and client data](security-operations.md#personal-and-client-data)'s.

**How**
- [weak] Work through [ASVS 5.0](https://raw.githubusercontent.com/OWASP/ASVS/v5.0.0/5.0/en/0x03-What-is-the-ASVS.md) Level 1 as the baseline, about 20% of its requirements, and go higher as the data's risk rises.
- [weak] Write the matrix of roles, features and data, and test every cell on each release with several accounts ([OWASP, *Authorization Testing*](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Testing_Automation_Cheat_Sheet.html)).
- [moderate] Run static analysis and a dynamic scan ([CISA](https://www.cisa.gov/news-events/cybersecurity-advisories/aa23-208a), [NCSC](https://www.ncsc.gov.uk/collection/developers-collection/principles/continually-test-your-security)).
- [weak] ZAP's baseline scan spiders for one minute by default and runs passive checks only, with no attacks ([ZAP](https://www.zaproxy.org/docs/docker/baseline-scan/)).
- [weak] A penetration test confirms the routine checks and is not how flaws are first found; it holds for the day it ran ([NCSC, *Penetration testing*](https://www.ncsc.gov.uk/guidance/penetration-testing)).

**Cases**
- An agent adds a route → its release needs the matrix row and the test as nobody and as another user.

**Accessibility**
- [weak] None directly.

**Check**
- *Script:* could fail a release when a route or action has no permission test, or when a scan's own exit status is red (code-standard rule 49).
- *Judgement:* Which threat in the model has no test?

**Sources:** NCSC, CISA, OWASP and ZAP as linked.
