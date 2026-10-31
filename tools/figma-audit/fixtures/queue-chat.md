**Re-run:** 12 sets scanned · **3 new** · **2 fixed** · everything below is still open.

**Key:** 🔴 error · 🟡 warning · 🔵 needs ruling · ◽ preference · ⚠️ = user-visible impact, leads the queue

### 1 · Approve & I fix (one approval applies all)
| # | Sev | Where | Fix |
|---|---|---|---|
| 1.1 | 🔴⚠️ | `Badge › Fill` | Bind it to `color/bg/accent` |
| 1.2 | 🟡 | `Button › Container` | Bind it to `space/300` |
| 1.3 | 🟡 | `Tooltip` | Add a description |
| 1.4 | ◽ | `Avatar › Frame 12` | Rename it **Image** |

### 2 · Quick manual fixes
| # | Sev | Where | Fix |
|---|---|---|---|
| 2.1 | 🟡 | `Tabs — properties panel` | Drag Small above Large in the Size property |

### 3 · Decide
| # | Sev | Where | Question | Rec |
|---|---|---|---|---|
| 3.1 | 🔴⚠️ | `Card` | Card was removed on 2026-10-19; every instance in a designer's file detaches | Intended: say it in the release note, with what consumers must change. · Not intended: revert it in Figma before the next publish. |
| 3.2 | 🔵 | `Page list` | In INPUTS, Chip should come before Combobox, because the category is sorted alphabetically everywhere else in the file and this one page breaks it | Move it |
| 3.3 | 🔵 | `Text input — properties panel` | State offers Rest · Hover and no Focus (keyboard users get no ring) | Add Focus |

*Held back: naming hygiene on 3 layers. Not scanned: contrast, focus rendering.*

Answer any row by its number or name + choice (e.g. "3.2: accept" or "tooltip: accept") and I'll action it.

Coverage: 91% (full, 200 bindings)
Scope: In-page audit of 12 components.
Date: 2026-10-20
