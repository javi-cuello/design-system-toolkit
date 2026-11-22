# Platform, database and supply-chain security

What a small web product does below its own code so that a flaw, a stolen key or a bad package does not become a breach: patching, packages, backups, secrets, the repository and its pipeline, the database, the host and the records that show an attack. The order draws on the 2026 [Verizon DBIR](https://www.verizon.com/business/resources/executivebriefs/dbir-2026-executive-summary.pdf) (exploited vulnerabilities began 31% of breaches not from error or misuse and credential abuse 13%, a third party was involved in 48% and ransomware in 48%; these measures overlap) and the [OWASP Top 10:2025](https://top10.owasp.org/2025/), which ranks misconfiguration second, supply-chain failures third and logging and alerting failures ninth; neither ranks these sections one by one. The backup, scan and check scripts named here follow code-standard rule 30 (a check that fires on nothing is a finding), code-standard rule 49 (a check's verdict is its own) and code-standard rule 61 (a failure says why). What the browser receives is [security](security.md)'s, application and server code [security-server](security-server.md)'s, and people, accounts, devices and incident response [security-operations](security-operations.md)'s. Plans, prices, versions and defaults are as their sources stated on 22 November 2026.

## Patching exploited flaws

**What good looks like**
- [strong] Known flaws in internet-facing software are fixed first: exploitation began 31% of breaches, and 26% of those in small and medium businesses ([Verizon, *2026 DBIR*](https://www.verizon.com/business/resources/executivebriefs/dbir-2026-executive-summary.pdf)).
- [moderate] Updates land as soon as possible rather than in a monthly round, exploited flaws ahead of the rest ([OWASP A03](https://top10.owasp.org/2025/A03_2025-Software_Supply_Chain_Failures/), [NCSC](https://www.ncsc.gov.uk/collection/vulnerability-management/guidance/policy-update-by-default)); only 26% of known-exploited flaws were fully fixed in 2025, at a median of 43 days ([DBIR](https://www.verizon.com/business/resources/executivebriefs/dbir-2026-executive-summary.pdf)).

**How**
- [strong] Subscribe to advisories for the framework, runtime, database and host, and to the [CISA KEV catalogue](https://www.cisa.gov/known-exploited-vulnerabilities-catalog) of flaws exploited in the wild ([OWASP A03](https://top10.owasp.org/2025/A03_2025-Software_Supply_Chain_Failures/), [NCSC](https://www.ncsc.gov.uk/collection/vulnerability-management/guidance/responding-to-active-exploitation)).
- [weak] Set time limits: internet-facing updates done within 5 days; a KEV flaw in a business-critical system that is exposed, automatable and gives total control, in under 24 hours with an investigation ([NCSC timescales](https://www.ncsc.gov.uk/collection/vulnerability-management/guidance/policy-update-by-default), [NCSC active exploitation](https://www.ncsc.gov.uk/collection/vulnerability-management/guidance/responding-to-active-exploitation)).
- [moderate] When a flaw in something exposed is being exploited in the wild, isolate it where possible, and check for compromise while the update is applied, however short the exposure, rebuilding where that cannot be investigated: an update does not remove an intruder ([NCSC](https://www.ncsc.gov.uk/collection/vulnerability-management/guidance/responding-to-active-exploitation), [CISA BOD 26-04](https://www.cisa.gov/news-events/directives/bod-26-04-prioritizing-security-updates-based-risk), binding on US federal agencies only).
- [moderate] After remote code execution in a server framework, upgrade, redeploy, then rotate every secret the app uses ([Next.js advisory](https://nextjs.org/blog/CVE-2025-66478), [security operations: incident response](security-operations.md#incident-response)): React's CVE-2025-55182 scored 10.0 and had no workaround ([React](https://react.dev/blog/2025/12/03/critical-security-vulnerability-in-react-server-components)).
- [weak] Older deployments still run the flawed code once production is patched, so put them behind protection or remove them ([Vercel, *React2Shell*](https://vercel.com/kb/bulletin/react2shell)).
- [required] Serve production from a major version still patched: Next.js maintains one for two years after its first release, and 15.x until 31 January 2027 ([Next.js, *Support policy*](https://nextjs.org/support-policy)).

**Cases**
- The app has no server actions and a Server Components advisory arrives → still upgrade; React says supporting Server Components can be enough to be vulnerable.
- An install cooldown holds back a security fix → let that fix through rather than turn the cooldown off: in pnpm add `name@version` to `minimumReleaseAgeExclude`; npm's `min-release-age-exclude` takes names only, so add the name, install the fixed version and remove the entry.

**Accessibility**
- [weak] None directly.

**Check**
- *Script:* could match the lockfile's resolved versions against advisories and the KEV feed, fail past the time limit, and fail when it read no packages.
- *Judgement:* If a critical advisory landed tonight, who would see it, and how long would the deploy take?

**Sources:** Verizon, OWASP, NCSC, CISA, React, Next.js and Vercel as linked; they agree on speed, and only NCSC and CISA give time limits; for an exposed KEV flaw CISA allows 3 days where NCSC allows under 24 hours.

## npm supply chain

**What good looks like**
- [strong] Every supplier, package and action is treated as a way in: third parties were involved in 48% of breaches, 55% in small and medium businesses ([DBIR](https://www.verizon.com/business/resources/executivebriefs/dbir-2026-executive-summary.pdf), [OWASP A03](https://top10.owasp.org/2025/A03_2025-Software_Supply_Chain_Failures/)).
- [strong] An install runs no dependency script that nobody allowed ([CISA](https://www.cisa.gov/news-events/alerts/2026/04/20/supply-chain-compromise-impacts-axios-node-package-manager), [OWASP, *NPM Security*](https://cheatsheetseries.owasp.org/cheatsheets/NPM_Security_Cheat_Sheet.html), [pnpm](https://pnpm.io/supply-chain-security)).
- [strong] A new version waits out a release age before it is installed: malicious axios versions were live about 3 hours, and TanStack's were spotted within 26 minutes ([pnpm](https://pnpm.io/supply-chain-security), [OWASP, *GitHub Actions Security*](https://cheatsheetseries.owasp.org/cheatsheets/GitHub_Actions_Security_Cheat_Sheet.html), [axios post-mortem](https://github.com/axios/axios/issues/10636), [TanStack post-mortem](https://tanstack.com/blog/npm-supply-chain-compromise-postmortem), [CISA](https://www.cisa.gov/news-events/alerts/2026/04/20/supply-chain-compromise-impacts-axios-node-package-manager)).

**How**
- [required] pnpm 11 and later block unapproved builds and transitive git or tarball dependencies, and prefer versions a day old but fall back to younger ones; writing `minimumReleaseAge` in `pnpm-workspace.yaml` makes the wait strict. Allow builds by name in `allowBuilds` there, as the `pnpm` field of `package.json` is not read ([pnpm 11](https://pnpm.io/blog/releases/11.0), [release-age settings](https://pnpm.io/settings/dependency-resolution#minimumreleaseage), [supply-chain security](https://pnpm.io/supply-chain-security), [settings files](https://pnpm.io/configuring)).
- [required] npm 12 blocks dependency scripts and git and remote dependencies by default; approve with `npm install-scripts approve`, and fail on anything unapproved with `strict-allow-scripts=true` ([npm 12 changelog](https://docs.npmjs.com/cli/v12/using-npm/changelog/), [npm config](https://docs.npmjs.com/cli/v12/using-npm/config/)).
- [required] npm has no release age unless one is set: `min-release-age=7` in `.npmrc` is seven days, and it also holds back a younger security fix ([npm config](https://docs.npmjs.com/cli/v12/using-npm/config/)).
- [moderate] Give automated updates a wait too: Dependabot's `cooldown` is 3 days for version updates unless `default-days` says otherwise, and none for security updates; `minimumReleaseAge: 10080` is a week in pnpm ([GitHub, *Dependabot options*](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference), [pnpm](https://pnpm.io/supply-chain-security), [OWASP, *GitHub Actions Security*](https://cheatsheetseries.owasp.org/cheatsheets/GitHub_Actions_Security_Cheat_Sheet.html)).
- [weak] `trustPolicy: no-downgrade` makes pnpm refuse a version published with less trust evidence than the ones before it ([pnpm](https://pnpm.io/supply-chain-security)).
- [moderate] Provenance says where a package was built, not that it is safe, so run `npm audit signatures` and keep the cooldown: TanStack's 84 malicious versions went out through its own trusted publisher ([npm provenance](https://docs.npmjs.com/generating-provenance-statements/), [npm audit](https://docs.npmjs.com/cli/v12/commands/npm-audit/), [TanStack post-mortem](https://tanstack.com/blog/npm-supply-chain-compromise-postmortem)).
- [moderate] When publishing, use trusted publishing and no stored token; npm removes direct publishing by granular token in January 2027 ([npm trusted publishers](https://docs.npmjs.com/trusted-publishers/), [npm tokens](https://docs.npmjs.com/about-access-tokens/), [OWASP, *NPM Security*](https://cheatsheetseries.owasp.org/cheatsheets/NPM_Security_Cheat_Sheet.html)).
- [strong] If a bad version was installed, treat that machine or CI job as compromised and rotate what it could read: the 2025 npm worm took over 500 packages and hunted credentials, as did Nx's and TanStack's malware ([CISA, September 2025](https://www.cisa.gov/news-events/alerts/2025/09/23/widespread-supply-chain-compromise-impacting-npm-ecosystem), [Nx advisory](https://github.com/nrwl/nx/security/advisories/GHSA-cxm3-wv7p-598c), [TanStack post-mortem](https://tanstack.com/blog/npm-supply-chain-compromise-postmortem)).

Lockfiles, clean installs and audits are in [security: dependency hygiene](security.md#dependency-hygiene).

**Cases**
- An install asks to approve a build for a package nobody recognises → deny it, find what brought it in, and approve only what is needed.
- An urgent patch is younger than the cooldown → exempt that version (pnpm), or that name for one install (npm), leaving the rest waiting.

**Accessibility**
- [weak] None directly.

**Check**
- *Script:* could read `pnpm-workspace.yaml` or `.npmrc` and the package manager's version, and fail on no release age written out, all scripts allowed or a cooldown switched off.
- *Judgement:* Why does each allowed build script need to run?

**Sources:** CISA, OWASP, npm, pnpm, GitHub and the axios, Nx and TanStack post-mortems as linked; they agree on scripts and waiting and differ on its length (1, 3 or 7 days).

## Backups and restore tests

**What good looks like**
- [moderate] Three copies on two kinds of storage with one off-site, the 3-2-1 rule: ransomware was in 48% of breaches and hits small organisations disproportionately ([CISA, *Back up business data*](https://www.cisa.gov/audiences/small-and-medium-businesses/secure-your-business/back-up-business-data), [NCSC, *Offline backups*](https://www.ncsc.gov.uk/blog-post/offline-backups-in-an-online-world), [DBIR](https://www.verizon.com/business/resources/executivebriefs/dbir-2026-executive-summary.pdf)).
- [moderate] One encrypted copy is offline or out of reach of production's credentials, because ransomware looks for backups to delete ([CISA, *#StopRansomware guide*](https://www.cisa.gov/stopransomware/ransomware-guide), [NCSC](https://www.ncsc.gov.uk/blog-post/offline-backups-in-an-online-world)).
- [strong] A restore is rehearsed, whole and in part, on a schedule ([CISA](https://www.cisa.gov/audiences/small-and-medium-businesses/secure-your-business/back-up-business-data), [NCSC](https://www.ncsc.gov.uk/blog-post/offline-backups-in-an-online-world), [GitLab post-mortem](https://about.gitlab.com/blog/postmortem-of-database-outage-of-january-31/)).

**How**
- [moderate] Alert when the newest backup is missing, empty or old, not only when the job errors: GitLab found an empty bucket after its failure emails had been rejected unseen ([GitLab](https://about.gitlab.com/blog/postmortem-of-database-outage-of-january-31/), [NCSC, *Ransomware-resistant cloud backups*](https://www.ncsc.gov.uk/collection/ransomware-resistant-backups/principles-for-ransomware-resistant-cloud-backups), [CISA](https://www.cisa.gov/stopransomware/ransomware-guide)).
- [moderate] Make deletion need more than the writer's key: out-of-band approval, or immutable storage such as S3 Object Lock in compliance mode ([NCSC](https://www.ncsc.gov.uk/collection/ransomware-resistant-backups/principles-for-ransomware-resistant-cloud-backups), [AWS, *Object Lock*](https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lock.html)).
- [required] Dump with a `pg_dump` no older than the server, as a role allowed past row-level security; otherwise it refuses or errors ([PostgreSQL, *pg_dump*](https://www.postgresql.org/docs/current/app-pgdump.html)).
- [required] Supabase Free has no backup to download, so take one yourself in three dumps with CLI 3, since plain `supabase db dump` reads the local database and holds no data: in a linked project, with the password in `SUPABASE_DB_PASSWORD`, `supabase db dump --remote -f roles.sql --role-only`, `supabase db dump --remote -f schema.sql` and `supabase db dump --remote -f data.sql --use-copy --data-only -x "storage.buckets_vectors" -x "storage.vector_indexes"`; Pro keeps 7 daily backups, Team 14, and point-in-time recovery is an add-on that replaces the dailies; none of these holds the files in Storage, only their metadata, so copy those separately ([CLI, *db dump*](https://supabase.com/docs/reference/cli/supabase-db-dump), [Backup and restore](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore), [Supabase, *Backups*](https://supabase.com/docs/guides/platform/backups), [production checklist](https://supabase.com/docs/guides/deployment/going-into-prod)).
- [required] Supabase's backups leave out stored files and custom-role passwords and are deleted with the project, so copy those and keep one copy elsewhere ([Supabase, *Backups*](https://supabase.com/docs/guides/platform/backups)).
- [required] Neon's restore window is at most 6 hours or 1 GB of history on Free, 7 days on Launch and 30 on Scale, and one day by default on both paid plans ([Neon, *History window*](https://neon.com/docs/postgres/backup-restore/history-window)).

**Cases**
- The host's dashboard says backed up and the only administrator account is phished → the copy under separate credentials is the one to count on.
- The backup job is green and the file is 0 bytes → assert size, table count and age, and fail on none.

**Accessibility**
- [weak] None directly.

**Check**
- *Script:* could list the newest backup, fail on none, old or undersized, restore it into an empty database and compare row counts, keeping the dump's own exit status.
- *Judgement:* If the host account were gone tomorrow, what could be restored, from where, and how old would it be?

**Sources:** CISA, NCSC, GitLab, PostgreSQL, AWS, Supabase and Neon as linked; they agree.

## Secrets and tokens

**What good looks like**
- [moderate] Each secret lives in a store that injects it, never in git or a build artefact ([OWASP ASVS 13.3.1](https://github.com/OWASP/ASVS/blob/v5.0.0/5.0/en/0x22-V13-Configuration.md), [NCSC, *Protect your code repository*](https://www.ncsc.gov.uk/collection/developers-collection/principles/protect-your-code-repository)).
- [strong] Each credential has the least privilege its job needs ([OWASP ASVS 13.3.2](https://github.com/OWASP/ASVS/blob/v5.0.0/5.0/en/0x22-V13-Configuration.md), [AWS, *IAM best practices*](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html), [NCSC](https://www.ncsc.gov.uk/collection/developers-collection/principles/protect-your-code-repository)).
- [moderate] Tokens expire, and workloads use temporary credentials where the platform offers them ([OWASP, *Secrets Management*](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html), [AWS](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)).

**How**
- [moderate] Never pass a secret as a command argument, which other processes can read in `ps`; use stdin or a file, as in `vercel env add NAME --environment production < file` (CLI 64.6 or later), or libpq's password file, `.pgpass` in the home folder, at mode 0600 ([GitHub, *Use secrets*](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets), [proc_pid_cmdline(5)](https://man7.org/linux/man-pages/man5/proc_pid_cmdline.5.html), [Vercel CLI](https://vercel.com/docs/cli/env), [PostgreSQL, *Password file*](https://www.postgresql.org/docs/current/libpq-pgpass.html)).
- [moderate] Keep secrets out of logs and URLs and do not trust masking: a secret printed to a log means delete the log and rotate ([GitHub, *Secure use*](https://docs.github.com/en/actions/reference/security/secure-use), [OWASP, *Logging*](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html), [ASVS 14.2.1](https://github.com/OWASP/ASVS/blob/v5.0.0/5.0/en/0x23-V14-Data-Protection.md)).
- [strong] Scan history and block secrets before they are pushed ([CISA](https://www.cisa.gov/news-events/alerts/2025/09/23/widespread-supply-chain-compromise-impacting-npm-ecosystem), [NCSC](https://www.ncsc.gov.uk/collection/developers-collection/principles/protect-your-code-repository), [OWASP, *Secrets Management*](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)).
- [required] GitHub's free scanning and personal push protection cover public repositories; a private one needs Secret Protection on Team or Enterprise, or a scanner of its own, and user-owned private ones cannot buy it outside managed-user Enterprise ([secret scanning](https://docs.github.com/en/code-security/concepts/secret-security/secret-scanning), [push protection](https://docs.github.com/en/code-security/concepts/secret-security/push-protection)).
- [strong] After a leak, revoke: deleting the commit or repository does not help, and scanners find a public secret in minutes ([GitHub, *Remediating a leaked secret*](https://docs.github.com/en/code-security/tutorials/remediate-leaked-secrets/remediating-a-leaked-secret), [OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html), [CISA](https://www.cisa.gov/news-events/alerts/2026/04/20/supply-chain-compromise-impacts-axios-node-package-manager)).
- [moderate] Act in this order: revoke at once a live secret that is public, opens production or is in use by someone else, making the replacement first only where an outage would be worse; close the leak before the new secret goes where the old one leaked; for a lower risk create, deploy, verify, then revoke; read the access logs; clean history last ([GitHub](https://docs.github.com/en/code-security/tutorials/remediate-leaked-secrets/remediating-a-leaked-secret), [Supabase, *Rotate leaked keys*](https://supabase.com/docs/guides/security/rotate-leaked-api-keys), [Vercel, *Rotating secrets*](https://vercel.com/docs/environment-variables/rotating-secrets)).
- [required] A changed Vercel variable reaches only new deployments, and making new Supabase keys does not revoke the legacy ones: redeploy, move every client to the new keys, then deactivate the legacy ones (at once if abused), and after a `service_role` leak revoke the legacy JWT secret too ([Vercel, *Environment variables*](https://vercel.com/docs/environment-variables), [Supabase, *API keys*](https://supabase.com/docs/guides/getting-started/api-keys), [*Rotate leaked keys*](https://supabase.com/docs/guides/security/rotate-leaked-api-keys)).

What must never reach front-end code is in [security: secrets](security.md#secrets-never-in-front-end-code).

**Cases**
- A connection string is pushed to a private repository → rotate it; every clone and integration holds a copy.
- A supplier reports a breach that may have read environment variables → rotate all it could read, first those stored readable, as Vercel advised in April 2026; deleting the project is not enough.

**Accessibility**
- [weak] None directly.

**Check**
- *Script:* could scan the full history and the working tree, fail on a finding or on no commits read, and flag secret-like values in commands and workflow files.
- *Judgement:* For each secret, where is it, what can it do, and how is it revoked?

**Sources:** OWASP, NCSC, CISA, AWS, GitHub, Vercel and Supabase as linked; they agree that history rewriting does not replace rotation; GitHub revokes by risk, Supabase on active use.

## GitHub and CI

**What good looks like**
- [strong] The branch that deploys is protected from direct change ([CISA](https://www.cisa.gov/news-events/alerts/2025/09/23/widespread-supply-chain-compromise-impacting-npm-ecosystem), [OWASP, *CI/CD Security*](https://cheatsheetseries.owasp.org/cheatsheets/CI_CD_Security_Cheat_Sheet.html), [NCSC, *Secure the pipeline*](https://www.ncsc.gov.uk/collection/developers-collection/principles/secure-the-build-and-deployment-pipeline)).
- [strong] Code from an untrusted pull request never meets secrets, a write token or a cache that a release restores ([GitHub](https://docs.github.com/en/actions/reference/security/securely-using-pull_request_target), [TanStack post-mortem](https://tanstack.com/blog/npm-supply-chain-compromise-postmortem), [NCSC](https://www.ncsc.gov.uk/collection/developers-collection/principles/secure-the-build-and-deployment-pipeline)).

**How**
- [required] Protected branches and rulesets work on private repositories only from Pro or Team, and administrators pass branch protection unless "Do not allow bypassing the above settings" is on ([protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches), [rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets)).
- [moderate] Lock every action to a commit: a `.github/workflows/actions.lock` made by `gh actions-lock` covers transitive actions but not reusable workflows; without one, and for those workflows, pin a full commit SHA ([GitHub, *Secure use*](https://docs.github.com/en/actions/reference/security/secure-use), [lockfiles](https://docs.github.com/en/actions/concepts/security/workflow-dependency-lockfiles), [OWASP, *GitHub Actions Security*](https://cheatsheetseries.owasp.org/cheatsheets/GitHub_Actions_Security_Cheat_Sheet.html)).
- [moderate] Start each workflow at `permissions: {}`, grant per job, and make the repository's default token read-only ([OWASP](https://cheatsheetseries.owasp.org/cheatsheets/GitHub_Actions_Security_Cheat_Sheet.html), [GitHub](https://docs.github.com/en/actions/reference/security/secure-use)).
- [strong] Avoid `pull_request_target`, and never check out the pull request's code in it: it carries the base repository's token and secrets and opened both the Nx and TanStack compromises ([GitHub](https://docs.github.com/en/actions/reference/security/securely-using-pull_request_target), [OWASP](https://cheatsheetseries.owasp.org/cheatsheets/GitHub_Actions_Security_Cheat_Sheet.html), [Nx advisory](https://github.com/nrwl/nx/security/advisories/GHSA-cxm3-wv7p-598c), [TanStack](https://tanstack.com/blog/npm-supply-chain-compromise-postmortem)).
- [required] From 2 December 2026 GitHub blocks `pull_request_target` by default in public repositories without an event policy; private ones get no such default. Leave `allow-unsafe-pr-checkout` and a write `cache-mode` unset on it ([GitHub](https://docs.github.com/en/actions/reference/security/securely-using-pull_request_target)).
- [moderate] Deploy with OIDC instead of stored cloud keys, its trust conditions naming the repository and branch in the repository's own `sub` format, which carries IDs in repositories made after 15 July 2026, and grant `id-token: write` only to the job that deploys ([GitHub, *OpenID Connect*](https://docs.github.com/en/actions/concepts/security/openid-connect), [OWASP, *Secrets Management*](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html), [AWS](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html), [TanStack](https://tanstack.com/blog/npm-supply-chain-compromise-postmortem)).
- [moderate] Put untrusted text such as a pull request title into an environment variable, never straight into `run:` ([GitHub](https://docs.github.com/en/actions/reference/security/secure-use), [OWASP](https://cheatsheetseries.owasp.org/cheatsheets/GitHub_Actions_Security_Cheat_Sheet.html)).
- [required] Every collaborator with write access can read every repository Actions secret ([GitHub](https://docs.github.com/en/actions/reference/security/secure-use)).

Personal access tokens are [security operations: sessions, tokens and access](security-operations.md#sessions-tokens-and-access)'s.

**Cases**
- A bot labels pull requests from forks → it needs an event policy allowing `pull_request_target`, then only that permission, no checkout, install or cache write, and no pull request text inside `run:`.
- An agent can push to the branch that deploys → it can deploy; give it a branch and a token that cannot merge.

**Accessibility**
- [weak] None directly.

**Check**
- *Script:* could flag `uses:` neither in the lockfile nor at a 40-character SHA, a workflow without `permissions`, `pull_request_target` beside a checkout or cache, `${{ github.event` inside `run:`, and an unprotected deploy branch.
- *Judgement:* What is the shortest path from a stranger's pull request to production?

**Sources:** GitHub, OWASP, NCSC, CISA, AWS and the Nx and TanStack post-mortems as linked; they agree.

## Database roles and row-level security

**What good looks like**
- [moderate] The app connects as its own least-privilege role, not the owner, a superuser or the role that migrates ([OWASP, *Database Security*](https://cheatsheetseries.owasp.org/cheatsheets/Database_Security_Cheat_Sheet.html), [ASVS 13.2.2](https://github.com/OWASP/ASVS/blob/v5.0.0/5.0/en/0x22-V13-Configuration.md)).
- [weak] Development, preview and production have separate databases and credentials ([OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Database_Security_Cheat_Sheet.html)).

**How**
- [required] Never count on row-level security against a superuser, a `BYPASSRLS` role or the table's owner; `FORCE ROW LEVEL SECURITY` binds the owner only ([PostgreSQL](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)).
- [required] Row security does not cover `TRUNCATE` or `REFERENCES`, and uniqueness and foreign-key checks bypass it, so revoke those grants and expect such checks to reveal that a row exists ([PostgreSQL](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)).
- [required] A managed host's ready-made role may bypass it: Supabase's secret keys always do, and so, by default, do Neon roles made in the console, API or CLI, so create the app's role in SQL or with `neon roles create --name app --access read_write` ([Supabase, *API keys*](https://supabase.com/docs/guides/getting-started/api-keys), [Neon, *Roles*](https://neon.com/docs/manage/roles)).
- [required] Views run as their creator unless made `security_invoker = true` (PostgreSQL 15 and later), and `security definer` functions need `set search_path = ''` ([Supabase, *Row-level security*](https://supabase.com/docs/guides/database/postgres/row-level-security)).
- [required] Policies never decide on Supabase `user_metadata`, which the signed-in user can edit ([Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security)).
- [required] `ALTER DEFAULT PRIVILEGES` changes only objects created later and cannot revoke per schema what was granted globally, so fix existing grants too ([PostgreSQL](https://www.postgresql.org/docs/current/sql-alterdefaultprivileges.html)).

**Cases**
- Policies pass every test run as `postgres` → run them again as the app's role, with a row that must be refused.
- An app talks to Postgres only from its server as the owner → its policies protect nothing; move it to a role of its own.

**Accessibility**
- [weak] None directly.

**Check**
- *Script:* could query `pg_roles` for the app role's `rolsuper` and `rolbypassrls`, `pg_class` for its ownership and `relrowsecurity`, and fail when it finds no tables.
- *Judgement:* If this connection string leaked, what could its holder read, change and drop?

**Sources:** PostgreSQL, OWASP, Supabase and Neon as linked; they agree.

## Generated database APIs

**What good looks like**
- [moderate] An API that the app does not use is off ([OWASP A02](https://top10.owasp.org/2025/A02_2025-Security_Misconfiguration/), [Supabase, *Securing your API*](https://supabase.com/docs/guides/api/securing-your-api)): with Supabase's Data API disabled no generated REST endpoint responds, whatever the grants.
- [moderate] Every object that stays exposed has both narrow grants and row-level security ([Supabase](https://supabase.com/docs/guides/api/securing-your-api), [Neon, *Data API*](https://neon.com/docs/data-api/get-started)).

**How**
- [required] A table in an exposed schema without row-level security is open to every role with a grant, and adding policies later takes no grant back ([Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security)).
- [required] Enable row-level security in every migration that creates an exposed table: the Supabase dashboard does it, SQL does not unless an event trigger or the project's setting does ([Supabase](https://supabase.com/docs/guides/api/securing-your-api), [changelog](https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically)).
- [moderate] Storage buckets are private unless every file is meant for everyone: a public Supabase bucket skips access control on reads ([Supabase, *Buckets*](https://supabase.com/docs/guides/storage/buckets/fundamentals), [OWASP A02](https://top10.owasp.org/2025/A02_2025-Security_Misconfiguration/)).
- [required] Supabase's change of 30 October 2026 stops exposing new tables and leaves existing ones reachable with their old grants ([Supabase changelog](https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically)).
- [required] New functions are callable by every role and row-level security does not apply to them, so revoke by default, fix the functions that already exist, and grant one by one, helper functions that policies call included ([Supabase](https://supabase.com/docs/guides/api/securing-your-api)):

  ```sql
  alter default privileges for role postgres in schema public
    revoke all on tables from anon, authenticated, service_role;
  alter default privileges for role postgres in schema public
    revoke all on sequences from anon, authenticated, service_role;
  alter default privileges for role postgres in schema public
    revoke all on functions from anon, authenticated, service_role;
  alter default privileges for role postgres
    revoke execute on functions from public;
  ```

- [required] Neon's Data API has no permission layer of its own, and its "Grant public schema access" option lets every signed-in user read and write every table, so grant table by table ([Neon](https://neon.com/docs/data-api/get-started)).
- [required] Network restrictions filter Postgres and its pooler, not the HTTPS APIs, and until applied every address can connect; list IPv4 and IPv6 ranges; with restrictions on, Edge Functions lose direct database access ([Supabase, *Network restrictions*](https://supabase.com/docs/guides/platform/network-restrictions)).
- [moderate] Allow database connections only from the addresses that need them ([OWASP, *Database Security*](https://cheatsheetseries.owasp.org/cheatsheets/Database_Security_Cheat_Sheet.html), [Supabase, *Production checklist*](https://supabase.com/docs/guides/security/production-checklist)).

**Cases**
- The app uses an ORM from the server and the project came with a REST API → switch the API off.
- A host without fixed outgoing addresses cannot be allow-listed → verified TLS, a narrow role and a rotated password carry more of the load; record the gap.

**Accessibility**
- [weak] None directly.

**Check**
- *Script:* could request each table with the publishable key and fail on rows not declared public, and on no tables tested, run Supabase's security advisor, and list grants to `anon`, `authenticated` and `public`.
- *Judgement:* Which of these endpoints does the product call?

**Sources:** Supabase and Neon on their own products, and OWASP, as linked; they agree that grants and policies are both needed.

## Hosting and preview deployments

**What good looks like**
- [moderate] A preview cannot reach production data or production secrets ([OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Database_Security_Cheat_Sheet.html), [Netlify](https://docs.netlify.com/build/environment-variables/get-started/)).
- [required] Protection reaches only its stated scope: on Vercel, Standard Protection leaves production domains public and All Deployments covers them too, both on every plan; password protection is not on Hobby ([Vercel, *Deployment Protection*](https://vercel.com/docs/deployment-protection)).

**How**
- [required] Five ways past protection are open to every plan: Trusted Sources, the automation secret, shareable links, the `OPTIONS` allowlist (path prefixes) and Exceptions, which make a preview domain public ([Vercel, *Bypass methods*](https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection), [Exceptions](https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/deployment-protection-exceptions)).
- [required] An automation bypass secret opens every deployment in the project until revoked and skips system firewall blocks and bot challenges, though not active attack mitigations ([Vercel, *Protection Bypass for Automation*](https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation)).
- [required] `vercel curl` creates such a bypass secret when none exists, and that secret lasts until it is revoked ([Vercel CLI, *curl*](https://vercel.com/docs/cli/curl), [automation bypass](https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation)).
- [required] Turning Vercel Authentication off unprotects every existing deployment, not only the next one ([Vercel Authentication](https://vercel.com/docs/deployment-protection/methods-to-protect-deployments/vercel-authentication)).
- [required] A Preview variable reaches every non-production branch; Git fork protection is what makes a fork's deployment wait for approval before it sees them ([environment variables](https://vercel.com/docs/environment-variables), [security settings](https://vercel.com/docs/project-configuration/security-settings)).
- [moderate] Store secrets as the write-only type and require different production values: in April 2026 an attacker who entered through an employee's AI tool read variables not marked sensitive ([Vercel, *Secret variables*](https://vercel.com/docs/environment-variables/sensitive-environment-variables), [incident bulletin](https://vercel.com/kb/bulletin/vercel-april-2026-security-incident), [Netlify](https://docs.netlify.com/build/environment-variables/get-started/)).
- [required] Merge rights are production rights: a Vercel Developer cannot edit production variables but deploys to production by merging ([Vercel, *Access roles*](https://vercel.com/docs/rbac/access-roles)).
- [required] A test address can share production's resources: Cloudflare's version URLs are public when enabled and use the version's live resources; use Cloudflare Previews for isolated ones ([Cloudflare, *Version URLs*](https://developers.cloudflare.com/workers/versions-and-deployments/version-urls/)).

**Cases**
- An agent used a bypass to test a protected page → revoke the secret at the end of the task, then load the page signed out.
- A domain was excepted for a webhook → remove the exception and give the sender a narrower route; the whole domain was public.

**Accessibility**
- [weak] None directly.

**Check**
- *Script:* could request each preview, generated and protected address signed out, fail on a 200 or on no addresses, and fail on any public address or bypass not on a recorded list.
- *Judgement:* Who and what can open a preview today, and whose data would they see?

**Sources:** Vercel, Cloudflare and Netlify on their own platforms, and OWASP, as linked; preview defaults differ by host.

## Database connections and poolers

**What good looks like**
- [strong] Every connection is encrypted and checks both certificate and host name, `sslmode=verify-full` ([PostgreSQL, *SSL support*](https://www.postgresql.org/docs/current/libpq-ssl.html), [Neon](https://neon.com/docs/connect/connect-securely), [OWASP ASVS 12.3.2](https://github.com/OWASP/ASVS/blob/v5.0.0/5.0/en/0x21-V12-Secure-Communication.md)).
- [moderate] The server refuses plain connections ([OWASP ASVS 12.3.1](https://github.com/OWASP/ASVS/blob/v5.0.0/5.0/en/0x21-V12-Secure-Communication.md), [Supabase, *SSL enforcement*](https://supabase.com/docs/guides/platform/ssl-enforcement)).
- [moderate] Nothing behind a transaction pooler relies on session state ([PgBouncer](https://www.pgbouncer.org/features.html), [Supabase](https://supabase.com/docs/guides/database/connecting-to-postgres), [Neon](https://neon.com/docs/connect/connection-pooling)).

**How**
- [required] libpq, and so `psql` and `pg_dump`, defaults to `prefer` and does not verify; `require` encrypts and checks the certificate only if a root CA file is present, and then not the host name ([PostgreSQL](https://www.postgresql.org/docs/current/libpq-ssl.html)).
- [required] node-postgres 8 uses no TLS by default; today it reads `prefer`, `require` and `verify-ca` as `verify-full` and version 9 will not, so write `verify-full` ([defaults](https://unpkg.com/pg@8.23.1/lib/defaults.js), [connection-string source](https://github.com/brianc/node-postgres/blob/master/packages/pg-connection-string/index.js)).
- [required] `verify-full` needs a root certificate: libpq 16 and later takes `sslrootcert=system` for a public CA, and Supabase needs its own CA downloaded and named in `sslrootcert`; never answer the error with `no-verify` ([PostgreSQL](https://www.postgresql.org/docs/current/libpq-connect.html), [its 16 edition](https://www.postgresql.org/docs/16/libpq-connect.html), [Supabase, *SSL enforcement*](https://supabase.com/docs/guides/platform/ssl-enforcement)).
- [required] In node-postgres, TLS options in the connection string replace the `ssl` object, so set them in one place ([node-postgres, *SSL*](https://node-postgres.com/features/ssl)).
- [required] Postgres.js uses no TLS by default and its `require` does not check the certificate; use `ssl: 'verify-full'` or `sslrootcert=system` ([Postgres.js 4.1.1](https://unpkg.com/postgres@4.1.1/README.md), [source](https://unpkg.com/postgres@4.1.1/src/index.js)).
- [moderate] Turn on Supabase's SSL enforcement, which restarts the database, and still verify in the client ([Supabase](https://supabase.com/docs/guides/platform/ssl-enforcement), [connecting](https://supabase.com/docs/guides/database/connecting-to-postgres), [OWASP ASVS 12.3.2](https://github.com/OWASP/ASVS/blob/v5.0.0/5.0/en/0x21-V12-Secure-Communication.md)).
- [required] In transaction mode, avoid session `SET`, `LISTEN`, session advisory locks and SQL `PREPARE`; protocol-level prepared statements work only where the pooler has enabled them ([PgBouncer](https://www.pgbouncer.org/features.html)).
- [required] Set tenant or role context with `SET LOCAL` inside the transaction, or use a direct connection, since another client can inherit a plain `SET` ([Neon, *Connection pooling*](https://neon.com/docs/connect/connection-pooling)).
- [required] On Supabase's shared transaction pooler switch prepared statements off (`prepare: false` in Postgres.js and Drizzle, `pgbouncer=true` in Prisma) and migrate over a direct connection. That does not stop Postgres.js pipelining, which transaction mode does not support ([connecting](https://supabase.com/docs/guides/database/connecting-to-postgres), [Postgres.js guide](https://supabase.com/docs/guides/database/postgres-js)).
- [contested] Whether Postgres.js can be used there, or needs a direct or session-pooler connection as pipelining can hang or return mismatched rows: Supabase says there is no working switch, as `max_pipeline: 0` breaks transactions ([guide](https://supabase.com/docs/guides/database/postgres-js), a [bug reported against 3.4.9](https://github.com/porsager/postgres/issues/1189)); Postgres.js says of its own 4.1.1 that `max_pipeline: 1` avoids the hang on Supavisor before 2.10, which later versions do not need ([README](https://unpkg.com/postgres@4.1.1/README.md)).

**Cases**
- The same `sslmode=require` URL serves pg and Postgres.js → only one verifies today; write `verify-full` and test both against a wrong host name.
- A row-level policy reads a setting made with `SET` through the pooler → make it `SET LOCAL` before one user's rows reach another.

**Accessibility**
- [weak] None directly.

**Check**
- *Script:* could connect with a wrong CA, a wrong host name and no TLS and require three failures, each saying why, and flag session `SET` on a pooled connection.
- *Judgement:* Which driver opens each connection, scripts and backups included, and what does that one verify?

**Sources:** PostgreSQL, both drivers' source, PgBouncer, OWASP, Supabase and Neon as linked; the drivers disagree on what `require` means, and Supabase and Postgres.js on pipelining, as marked.

## Monitoring

**What good looks like**
- [moderate] Sign-ins and refusals are logged somewhere an intruder in the app cannot edit ([OWASP ASVS 16.4.3](https://github.com/OWASP/ASVS/blob/v5.0.0/5.0/en/0x25-V16-Security-Logging-and-Error-Handling.md), [NCSC, *Logging for security*](https://www.ncsc.gov.uk/guidance/introduction-logging-security-purposes)).
- [moderate] An alert reaches a person when behaviour is suspicious or logs stop arriving ([OWASP A09](https://top10.owasp.org/2025/A09_2025-Security_Logging_and_Alerting_Failures/), [NCSC](https://www.ncsc.gov.uk/guidance/introduction-logging-security-purposes)).

**How**
- [weak] Keep the logs that matter for at least 6 months ([NCSC](https://www.ncsc.gov.uk/guidance/introduction-logging-security-purposes)).
- [required] The host drops logs early, so longer keeping means copying them out: Vercel keeps runtime logs 1 hour on Hobby and 1 day on Pro, 30 days with Observability Plus, and drains need Pro ([runtime logs](https://vercel.com/docs/logs/runtime), [drains](https://vercel.com/docs/drains)).
- [required] Supabase keeps API and database logs 1 day on Free, 7 on Pro and 28 on Team ([Supabase, *Logs*](https://supabase.com/docs/guides/observability/logs)).
- [weak] Review the host's activity log after any supplier incident; Vercel's is on every plan ([Vercel, *Activity log*](https://vercel.com/docs/activity-log), [incident bulletin](https://vercel.com/kb/bulletin/vercel-april-2026-security-incident)).
- [weak] Plant a honeytoken, a credential nothing uses, and alert when it is used ([OWASP A09](https://top10.owasp.org/2025/A09_2025-Security_Logging_and_Alerting_Failures/)).

What the application writes is in [security-server](security-server.md).

**Cases**
- A breach is found a fortnight later on a free tier → the host's logs are gone; the exported copy is the only timeline.
- The alert goes to a mailbox nobody reads → send a test on a schedule and confirm that someone saw it.

**Accessibility**
- [weak] None directly.

**Check**
- *Script:* could send a marked event, find it in the external store within minutes, and fail when none arrives.
- *Judgement:* Which three events would wake someone, and when did each last fire?

**Sources:** OWASP, NCSC, Vercel and Supabase as linked; only NCSC gives a retention period.

## Data minimisation and encryption at rest

**What good looks like**
- [required] Personal data is limited to what its purpose needs and kept no longer than that ([GDPR, Article 5(1)(c) and (e)](https://publications.europa.eu/resource/cellar/3e485e15-11bd-11e6-ba9a-01aa75ed71a1.0006.03/DOC_1)).

What the law asks of security is [security operations: personal and client data](security-operations.md#personal-and-client-data)'s.

**How**
- [moderate] Do not store what is not needed, and delete on a schedule ([OWASP, *Cryptographic Storage*](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html), [GDPR](https://publications.europa.eu/resource/cellar/3e485e15-11bd-11e6-ba9a-01aa75ed71a1.0006.03/DOC_1), [ASVS 14.2.7](https://github.com/OWASP/ASVS/blob/v5.0.0/5.0/en/0x23-V14-Data-Protection.md)).
- [weak] Do not count disk encryption as protection from a break-in: it covers a stolen disk, not a compromised server or credential ([OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)).
- [weak] Encrypt the few most sensitive fields in the application, with the key held apart from the data ([OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)).
- [moderate] Encrypt the backups you take yourself ([CISA](https://www.cisa.gov/stopransomware/ransomware-guide), [OWASP, *Database Security*](https://cheatsheetseries.owasp.org/cheatsheets/Database_Security_Cheat_Sheet.html)).
- [weak] Give tests and previews synthetic or masked data, never a plain production copy ([Neon, *Anonymised branches*](https://neon.com/docs/workflows/data-anonymization)).

**Cases**
- A stored third-party token would give access to a user's account elsewhere → encrypt that field, or do not keep it.
- A debugging export holds every user → export the columns and rows the bug needs, then delete it.

**Accessibility**
- [weak] None directly.

**Check**
- *Script:* could list columns holding personal data against a written retention period and fail on one without, and confirm a fresh backup is unreadable without its key.
- *Judgement:* If this table leaked whole, which columns would we wish we had never collected?

**Sources:** GDPR, OWASP, CISA and Neon as linked; they agree.

## Denial of service and spend limits

**What good looks like**
- [weak] Each metered service has a spending limit, or an alert where no limit exists ([OWASP API4:2023](https://api-security.owasp.org/editions/2023/en/0xa4-unrestricted-resource-consumption/)).
- [weak] A short written plan says how an attack is noticed and what is switched on first ([NCSC, *Preparing for denial of service*](https://www.ncsc.gov.uk/collection/denial-service-dos-guidance-collection/preparing-denial-service-dos-attacks1)).

**How**
- [moderate] The host includes the first defence: Vercel and Cloudflare mitigate DDoS on every plan, and Vercel does not charge for what that blocks ([Vercel, *DDoS mitigation*](https://vercel.com/docs/vercel-firewall/ddos-mitigation), [Cloudflare](https://developers.cloudflare.com/ddos-protection/)).
- [required] On Vercel, Attack Mode is on every plan and switches itself off after the 1, 6 or 24 hours chosen, while Hobby has 3 custom firewall rules, one of them rate limiting, and 10 IP blocks ([Attack Mode](https://vercel.com/docs/vercel-firewall/attack-mode), [rate limiting](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting), [Hobby](https://vercel.com/docs/plans/hobby)).
- [required] A Vercel budget stops nothing unless "Pause production deployments" is on; on Hobby there is none, and a pause acts some minutes late, is undone by hand, and leaves AI Gateway, v0 and storage charges running ([Spend Management](https://vercel.com/docs/spend-management)).
- [required] Hobby has no spend management and stops serving the capped feature for up to 30 days; Supabase's cap is Pro-only and leaves some items uncovered ([Vercel Hobby](https://vercel.com/docs/plans/hobby), [Supabase](https://supabase.com/docs/guides/platform/cost-control)).
- [weak] Behind a proxy, hide the origin's address and accept traffic only from the proxy ([Cloudflare, *Protect your origin*](https://developers.cloudflare.com/fundamentals/security/protect-your-origin-server/)).

Limits per user and per route are in [security-server](security-server.md).

**Cases**
- A public endpoint calls a paid AI model → cap it at the provider as well as in the app.
- The bill alert fires at night and nobody is awake → decide beforehand whether the site pauses or the spend continues.

**Accessibility**
- [weak] None directly.

**Check**
- *Script:* could read each provider's budget and its pause setting and fail on a metered provider with neither.
- *Judgement:* What is the most a bad night could cost, and who finds out?

**Sources:** OWASP, NCSC, Vercel, Cloudflare and Supabase as linked; plans differ, so reread them before launch.
