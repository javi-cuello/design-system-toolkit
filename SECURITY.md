# Security

Report a vulnerability privately, through GitHub: open the repository's **Security** tab, choose **Report a vulnerability**, and describe what you found and how to reproduce it. Please do not open a public issue for it.

The report reaches the maintainer only, who answers in the report's thread; the fix lands on `main` once it is ready, and the advisory is published then.

## What counts

The toolkit runs on the maintainer's machine and on yours: local services (the snapshot router, the audit service and its dashboard), Figma plugins, Claude Code skills and hooks, and scripts under `bin/` and `tools/`. Anything that lets a web page, a Figma file, a document or another user on the machine run code, read a key, or write where it should not is in scope. So is a dependency or a vendored file with a known vulnerability.

## Supported versions

Only `main`. There are no releases to backport to.
