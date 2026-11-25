# Service

The toolkit's one login item. `supervisor.mjs` runs the snapshot router and the figma-audit service as its children, and starts a child again when it exits. A child that keeps dying waits longer each time, up to a minute. When the review is installed, it also runs `bin/review --if-owed` daily at 03:00; a Mac asleep then runs it on waking.

## Run it

```sh
node tools/service/supervisor.mjs              # the router and the audit service, until stopped
node tools/service/supervisor.mjs --review     # and the daily review
launchctl kickstart -k gui/$(id -u)/com.toolkit   # restart the login agent
```

## As a login agent

`install.sh` writes `com.toolkit.plist` (this folder's template, with this checkout's paths) to `~/Library/LaunchAgents/` and loads it. It runs node through a `toolkit` link beside this file, so Login Items says "toolkit". `REVIEW=on ./install.sh` adds `--review`, and a later run keeps it. The install also stops and deletes the three agents this one replaced: `com.toolkit.figma-snapshot`, `com.toolkit.figma-audit` and `com.toolkit.review`.

Each child's output goes to `~/Library/Logs/toolkit/<name>.log` and `.err` (`figma-snapshot`, `figma-audit`, `review`). The supervisor logs each exit and restart to `toolkit.log`.

A child restarts itself onto changed files by exiting once idle ([`stale-self.mjs`](../shared/stale-self.mjs)), and the supervisor brings it back. The supervisor does the same for its own file, and launchd brings it back.

`test-supervisor.mjs` runs it with fake children: a crashing child's growing wait, a long-lived child's reset, and the review timer.
