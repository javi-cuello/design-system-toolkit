# Service

The toolkit's one login item. `supervisor.mjs` runs the snapshot router and the figma-audit service as its children, and starts a child again when it exits. A child that keeps dying waits longer each time, up to a minute. When the review is installed, it also runs `bin/review --if-owed` daily at 03:00; a Mac asleep then runs it on waking.

## Run it

```sh
node tools/service/supervisor.mjs              # the router and the audit service, until stopped
node tools/service/supervisor.mjs --review     # and the daily review
launchctl kickstart -k gui/$(id -u)/com.toolkit   # restart the login agent
```

## As a login agent

`install.sh` writes this folder's plist template, with this checkout's paths, to the user's launch agents and loads it. Node runs through a link named `toolkit` beside this file, so Login Items says "toolkit". The install also stops and deletes the three agents this one replaced.

| To | Do |
| --- | --- |
| add the daily review | `REVIEW=on ./install.sh` (a later run keeps it) |
| read a child's output | `~/Library/Logs/toolkit/<child>.log` and `.err` |
| read the exits and restarts | `~/Library/Logs/toolkit/toolkit.log` |

The children are `figma-snapshot`, `figma-audit` and `review`.

A child restarts itself onto changed files by exiting once idle ([`stale-self.mjs`](../shared/stale-self.mjs)), and the supervisor brings it back. The supervisor does the same for its own file, and launchd brings it back.

`test-supervisor.mjs` runs it with fake children: a crashing child's growing wait, a long-lived child's reset, and the review timer.
