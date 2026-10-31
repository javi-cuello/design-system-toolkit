# Data: numbers, dates, KPI tiles and provenance

How an interface shows figures so they can be read, compared and trusted: number formatting, units, precision and figures; dates, times and time zones; KPI tiles; and where each figure comes from and how fresh it is. It serves design-standard's principles *honest*, *clear words, clear hierarchy* and *for everyone, in any context*, and applies design-standard rule 1 (a page says where its figures come from and how fresh they are).

## Numbers

**What good looks like**
- Numerals for every number, formatted by locale-aware code, in the project's dialect (the context document's `language`).
- One precision per measure, chosen for the decision the number supports.
- The unit stated once where it is unambiguous: in the column header, the tile label or the axis title.
- Tabular figures wherever numbers are compared in a column or update in place.

**How**
- Format with the platform's formatter, never by concatenation: `Intl.NumberFormat` gives "language-sensitive number formatting", with currency, unit and significant-digit options ([MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat)). Store raw numbers; format at render.
- Dialect rules: GOV.UK uses numerals for everything including 2 to 9, "%" with a number, and no space between a numeral and an abbreviated unit ("3,500kg") ([GOV.UK A to Z style guide](https://guidance.publishing.service.gov.uk/writing-to-gov-uk-standards/style-guides/a-to-z-style-guide/)); Mailchimp spells a number out only at the start of a sentence ([Mailchimp grammar and mechanics](https://styleguide.mailchimp.com/grammar-and-mechanics/)). The project's dialect decides the spacing; the formatter applies it.
- Thousands separators on four digits and up in running text and tables, in the locale's form.
- Precision: as few decimals as the decision needs, the same down a column and across tiles of one measure (commentary; no source fixes a number). Percentages of small counts are shown with the count ("3 of 7, 43%"), since a percentage alone hides a small base.
- Compact notation ("1.2k") only where space forces it and the exact value is one step away; never in a table people sort or compare.
- Zero, missing and not applicable are three different values (this section owns the rule; other pages link here): "0", "Not measured" (a word, never a dash, which screen readers announce inconsistently: [tables: cell content and empty cells](tables.md#cell-content-and-empty-cells)), and blank for not applicable. A missing count beside a label (a tab, a filter option, a counter) is hidden, never shown as zero (Primer's [degraded experiences](https://primer.style/ui-patterns/degraded-experiences): "default to hiding the number").
- Signs: a change carries "+" or "−" and a direction word or icon; a negative value uses the true minus sign or the locale's form.
- Tabular figures: `font-variant-numeric: tabular-nums` ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/font-variant-numeric)) on tables, tiles that update and counters, so digits do not jitter.

**Cases**
- "12.3456%" on a tile → "12.3%", and every tile of that measure at one decimal.
- A count that failed to load shown as "0" → "Not measured" with the reason in the provenance caption: zero is a claim.
- "1,204 Kb" in one place and "1.2 MB" in another for the same size → one unit and precision per measure across the product.
- "75% passing" over 4 components → "3 of 4 passing".
- A live counter whose width jumps as digits change → tabular figures.

**Accessibility**
- 1.3.1: a dash meaning "not measured" has a text equivalent.
- 3.1.4 Abbreviations (AAA, advisory here): a unit abbreviation the reader may not know is spelt out at first use or in the header.
- Screen readers read numbers better when formatted by locale (separators in the right places); a number built by hand with spaces may be read as two numbers.

**Build**
- Format at render with one `Intl.NumberFormat` per locale and options set, created once and reused; the locale is the page's `lang` ([i18n: *Numbers, dates, plurals and lists*](../../code/i18n.md#numbers-dates-plurals-and-lists)). `style: "percent"`, `style: "unit"` and `signDisplay: "exceptZero"` cover percentages, units and the "+" on a change.
- Keep the raw value machine-readable: `<data value="1204.5">1,204.5</data>`, so a sort, a script or a check reads the number, not the formatted text.
- Missing is markup, not a digit: `<span aria-label="Not measured">—</span>` or the words themselves; the template branches on the model's missing value, never on `0` (code-standard rule 12, code-standard rule 29).
- Tabular figures on the numeric parts of a component (`font-variant-numeric: tabular-nums` on table cells, tile values and counters), written once in the component, not per page (code-standard rule 5).
- Precision is a formatter option (`maximumFractionDigits`) per measure, defined beside the measure, so every place that measure appears shares it.

**Check**
- *Script* could: flag numbers in one column or tile group with differing decimal counts; flag "0" where the data model says missing; flag a numeric element without `tabular-nums`; flag ordinals and spacing that break the project's dialect.
- *Judgement*: is this precision what the decision needs?

**Sources.** GOV.UK and Mailchimp differ only by dialect; both agree on numerals and machine formatting. The toolkit lets the project's dialect decide and the formatter enforce it.

## Dates and times

**What good looks like**
- Dates in one unambiguous format per project, with the month as a word or abbreviation, never a numeric short date.
- Relative times for recent events, with the exact timestamp always available.
- Time zone stated whenever people in different zones read the same time, or when the time is a deadline.

**How**
- Store ISO 8601; render through the locale formatter in the project's dialect. Never localise dates by hand: Atlassian says date and time strings "should never be localized manually by a designer, engineer, or translator" ([Atlassian date and time](https://atlassian.design/foundations/content/date-time)).
- Format: en-GB "9 Oct 2026" or "9 October 2026", no ordinals, no comma (GOV.UK); en-US "Oct 9, 2026" (Atlassian). No numeric short dates, because countries order day and month differently; ISO "YYYY-MM-DD" for data and exports (Atlassian).
- Ranges with "to", not a hyphen ("10am to 11am", "2014 to 2015"); screen readers read the hyphen aloud (Atlassian).
- Times: GOV.UK writes "5:30pm", "midday", "midnight"; Atlassian allows "noon" too; Mailchimp writes "5:30 pm" ([Mailchimp grammar and mechanics](https://styleguide.mailchimp.com/grammar-and-mechanics/)). The dialect decides.
- Relative or absolute: relative ("3 minutes ago", "yesterday") for activity in the last few days; absolute past a week, as Atlassian switches to a date stamp. Absolute always for deadlines, releases, audits and anything someone will cite.
- The exact timestamp is available on every relative time: Atlassian says to "always provide a way for people to see the actual timestamp, usually via a tooltip". A hover-only `title` is not reachable by keyboard or touch; use a tooltip that opens on focus, or show the absolute date in the record's detail.
- Mark up times with `<time datetime="…">`, the machine-readable value carrying a time-zone offset where it matters ([MDN time element](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/time)).
- Time zones: show times in the reader's zone by default and name it when the product is used across zones ("14:00 BST"); a deadline names its zone explicitly. Atlassian's long time format includes the zone initials; no source sets a fuller rule, so the rest is commentary.
- A cached, exported or printed page decays relative times; the provenance caption uses an absolute date.

**Cases**
- "03/04/2026" in a table read by UK and US teams → "3 Apr 2026": unambiguous in both.
- "Updated 2 days ago" with no way to see when → keep it and expose "9 Oct 2026, 14:02 BST" on focus and in the detail.
- A release scheduled for "17:00" in a product used in three zones → "17:00 UTC" with the reader's local time beside it.
- A PDF export of a dashboard showing "an hour ago" → absolute dates in exports.
- "2nd June" in a docs page → "2 June" (GOV.UK).

**Accessibility**
- 1.3.1: the `datetime` value gives assistive technology and scripts the exact time.
- 1.4.13: a timestamp tooltip is dismissible, hoverable and persistent.
- 2.1.1: the exact timestamp is reachable without a mouse.

**Build**
- Every date or time is `<time datetime="2026-10-09T14:02+01:00">9 Oct 2026, 14:02</time>`: the machine value carries the offset; the text comes from `Intl.DateTimeFormat` with `dateStyle`/`timeStyle` and, when zones matter, `timeZoneName: "short"` ([i18n: *Numbers, dates, plurals and lists*](../../code/i18n.md#numbers-dates-plurals-and-lists)).
- Relative times come from `Intl.RelativeTimeFormat` in the browser, from the `datetime` attribute, so a cached page does not freeze "2 minutes ago" in the server's zone; exports and printed pages render the absolute form.
- The exact timestamp on a relative time is reachable by keyboard and touch: visible in the record's detail, or a tooltip that opens on focus ([dialogs: tooltips](dialogs.md#tooltips)); never `title` alone.
- Ranges are two `time` elements joined by "to", not a hyphen.
- A check that compares formatted dates pins its locale and time zone (code-standard rule 35).

**Check**
- *Script* could: flag ordinals in dates, numeric short dates, hyphenated ranges and the wrong dialect's order with regular expressions; flag a relative time with no `time` element or no `datetime`; flag a `time` whose exact value is only in `title`.
- *Judgement*: does this time matter enough to be absolute?

**Sources.** GOV.UK and Atlassian differ by dialect; on relative time with an exact timestamp available, Atlassian is the source and the toolkit adds the keyboard requirement.

## KPI tiles

**Use when / don't use**
- Use a tile for a handful of headline figures someone checks at a glance: a health measure, a count of things needing action.
- Don't tile an inventory figure (715 variants) as if it were a health figure; tile what someone acts on.
- Don't use a tile when the figure needs its trend to mean anything; use a small chart with the value.

**How**
- Each tile: a label (what it counts), the value, the period or scope, and an optional comparison. The ONS asks a chart subtitle to name the measure, coverage and time period ([ONS chart text](https://service-manual.ons.gov.uk/data-visualisation/guidance/chart-text)); a tile carries the same, with the source in the page's provenance caption.
- Label above value, in sentence case; value largest; comparison smallest. The label names the measure without jargon ("Components with open accessibility failures").
- Comparison: against a target or a previous period, with the period named ("−3 since last audit"). A change carries a sign, an arrow or caret and a word; Carbon's differential indicators use a sign, caret or arrow ([Carbon status indicators](https://carbondesignsystem.com/patterns/status-indicator-pattern/)).
- Tone (good, bad, neutral) never by colour alone: an icon or word carries it (1.4.1). The tone comes from whether the change is good for this measure; fewer failures going down is good, so a red down arrow there is wrong.
- Rank tiles by importance: the most important figure gets the most contrast and space (Carbon [dashboards](https://carbondesignsystem.com/data-visualization/dashboards/)). Four to six tiles in a row at most (commentary).
- Each tile links to the list it counts, filtered to match; the count on the tile equals the count on that list (the same discipline as design-standard rule 11).
- Missing: a tile whose source failed says "Not measured", never "0".
- Equal tile heights in a row; a long label wraps without resizing its neighbours (design-standard rule 2's spirit; code-standard rule 57 for widths).
- Rows that fill: every row of tiles is full, so no tile sits alone on a last row and no empty cell is left in the grid. Choose the tiles per row from the number of tiles: 2, 3 or 4 in one row; 5 as one row of five where it fits; 6 as 3 + 3 (or one row on a wide screen); 7 or more is too many (move the rest to a table). Avoid 4 + 1 and 3 + 1.
- Derive the column count from the tile count, never fix it for today's tiles (code-standard rule 57): the same strip with one tile removed must still fill its rows.
- At each breakpoint, pick a count that divides the tiles evenly (six tiles: 3 then 2 then 1 per row; four: 4, then 2, then 1). A plain `repeat(auto-fill, minmax(…))` grid wraps by width alone and leaves orphans; `auto-fit` collapses empty tracks only when all tiles fit on one row ([MDN, repeat()](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/repeat): empty tracks "are collapsed"), so it does not fix a short last row. Setting the columns from the count, or letting a short last row's tiles span the width, does.
- Never pad a row with an empty or placeholder tile to make it full; remove a tile or move it to the table.
- Tiles belong in a table instead when they are one figure per member of a set (per component, per file, per library): those are rows of one column, compared down it, and grow with the set. Tiles are for a fixed handful of headline figures about the whole; when the reader compares tiles with each other rather than checking each against its target, it is a table or a bar chart ([data visualisation: choosing a chart by its job](data-visualisation.md#choosing-a-chart-by-its-job)). NN/g's cards guidance points the same way: cards are "a poor choice when users need to compare" ([NN/g, cards](https://www.nngroup.com/articles/cards-component/)).

**Cases**
- A tile reading "42" with the label "Total" → "42 components need review", with the period and a link to the filtered list.
- A green up arrow on "Open findings +5" → a warning tone with an icon: more findings is bad.
- Eight tiles of equal weight → pick the two the reader acts on, make them larger, move the rest into a table.
- A tile says 12, the linked list shows 14 → one counting function for both.
- Five tiles at four per row, one alone on the second row → one row of five on a wide screen, or cut to four (or six as 3 + 3); never a blank fifth slot beside it.
- A strip of nine tiles, one per guidance section, each "Missing in 37 of 40" → a table (or one row of a summary per attribute): it is one figure per member of a set, and tiles cannot be sorted or compared at a glance.
- A grid whose last row is filled with an empty grey tile → remove it; derive the columns from the count.

**Accessibility**
- 1.4.1: tone has a non-colour cue. 1.4.3: value and label meet contrast (figma-standard rule 32 in a component).
- 1.3.1: label and value are associated so the value is not read alone ("42" with no context); a description list or a heading with its value serves.
- A tile that is a link has one accessible name containing label and value.

**Build**
- A strip is a list of tiles; each tile is a heading or `dt` for the label and the value beside it, so label and value are read together:
  ```html
  <ul data-tiles role="list">
    <li><a href="/findings?status=open"><dl><dt>Open findings</dt>
      <dd><data value="42">42</data></dd><dd>−3 since the audit of 2 Oct</dd></dl></a></li>
  </ul>
  ```
- A tile that leads somewhere is one `a` whose name holds label and value; the link carries the filter in its `href`, and modified clicks go to the browser (code-standard rule 20, code-standard rule 21).
- Tone is an attribute (`data-tone="warning"`) styled from tokens, with an icon and a word in the markup; never a class or a colour alone (code-standard rule 6, code-standard rule 9, code-standard rule 22).
- The tile's count and the linked list's count come from one function in the model (code-standard rule 29).
- The grid takes its columns from the tile count, so rows fill at every width: [responsive: *Grids that fill their rows*](../../code/responsive.md#grids-that-fill-their-rows) (code-standard rule 57). List semantics under a styled list: [html-semantics: *Lists, description lists and figures*](../../code/html-semantics.md#lists-description-lists-and-figures).

**Check**
- *Script* could: assert each tile has a label, a value and a period; flag tone by colour with no icon or word; compare tile counts with the linked list's count; at each breakpoint, assert every row of tiles holds the same number of tiles (no short last row) and no tile is empty.
- *Judgement*: is each tile a figure someone acts on, and is the most important the most prominent? Is this a handful of headline figures, or one figure per member of a set that belongs in a table?

**Sources.** No system publishes a tile specification; this section combines ONS's subtitle rule, Carbon's ranking and status indicators, and is partly commentary. Carbon's dashboards guidance gives hierarchy but no tile grid; the full-row rule and tiles-to-table threshold are the toolkit's commentary, with MDN for the grid mechanics.

## Charts

**Use when**
- Choosing, drawing or making accessible a chart: owned by [data visualisation](data-visualisation.md), which this page's sections used to hold. Choosing is [*Choosing a chart by its job*](data-visualisation.md#choosing-a-chart-by-its-job), colour and drawing [*Colour by job*](data-visualisation.md#colour-by-job) and [*Axes, gridlines, labels and number formats*](data-visualisation.md#axes-gridlines-labels-and-number-formats), the table alternative [*Long descriptions and data tables*](data-visualisation.md#long-descriptions-and-data-tables).

**Build**
- The chart's numbers and dates use this page's formatters ([numbers](#numbers), [dates and times](#dates-and-times)); the rest is [data visualisation](data-visualisation.md).

## Provenance and freshness

**What good looks like**
- A page built from data names its source and the date of it in a caption under its title (design-standard rule 1).
- A chart or table whose source differs from the page's names its own source under it.
- Stale data looks stale.

**How**
- Apply design-standard rule 1 for the page caption; this section owns how it is written, for pages and their parts, and the profiles link here.
- Form: what produced the figures and when, in the reader's terms ("Updated by the snapshot of 9 Oct 2026"). The ONS form is "[source] from [organisation]" directly after a chart ([ONS chart text](https://service-manual.ons.gov.uk/data-visualisation/guidance/chart-text)); the Analysis Function asks for source text in the page body, linked where possible.
- Absolute dates in the dialect's format, exact timestamp available (see *Dates and times*). "Updated" reads clearer than "Last synced" or "Generated", which describe the tool.
- The date is computed from the record that wrote the figures, never typed into copy and never the page's build time; a typed date is a future lie.
- A missing source is named as missing ("no audit has run"), never left out of the caption.
- A hand-written page that summarises generated data still carries the caption, or links to the generated page that does.
- State provenance once per page or table, never at the start of every row or message; repeated provenance pushes the change out of the first words (design-standard rule 10).
- Two sources: name both with their dates, so a reader can see when one is older than the other, and say so when they are out of order (an audit older than the snapshot it judged); the out-of-order flag is the toolkit's judgement.
- Freshness: when a source is older than its expected cadence, a warning banner says so (see the feedback patterns); when a source is missing, the page shows what is missing and never mixes stale and fresh figures silently (Primer [degraded experiences](https://primer.style/ui-patterns/degraded-experiences)).
- The lede says what the page means; provenance stays out of it (design-standard rule 1).

**Cases**
- A page's lede begins "From the snapshot of…" → move the source to the caption; the lede says what the figures mean.
- The caption shows the site's build time → show the source's own timestamp.
- A dashboard with no date anywhere → the caption under the title with each source and its date.
- "Snapshot of 2026-10-09:" at the start of 300 rows → once in the caption; rows start with the change.
- A chart drawn from a different audit than the page → its own source line under it.
- An audit not run for a month shown beside a fresh snapshot → both dates in the caption and a warning that the audit is older than its usual cadence.

**Accessibility**
- 1.3.1: the caption is text in the page, near the title, so it is reached in reading order (code-standard rule 2).
- Dates in `time` elements with `datetime`.

**Build**
- The caption is a `p` directly after the `h1` (or under a chart inside its `figcaption`), holding each source's name and a `<time datetime>` (code-standard rule 2; [html-semantics: *Lists, description lists and figures*](../../code/html-semantics.md#lists-description-lists-and-figures)).
- Its dates are read from the record that wrote the figures, passed to the template as data; never the build time or a string in copy (code-standard rule 29).
- A stale or missing source sets an attribute on the caption (`data-state="stale"`) and renders the warning text; the state is computed from the source's date and its cadence in the model (code-standard rule 9).
- A live page updates the caption's `time` in the same function that patches the data, without announcing it ([javascript: *Polling and live data*](../../code/javascript.md#polling-and-live-data)).

**Check**
- *Script* could: assert a page that renders recorded figures has a provenance caption with a date in the dialect's format directly after its `h1`; flag rows whose text begins with a date or source reference; compare the caption's dates with the sources' and flag a source past its cadence.
- *Judgement*: is the named source one the reader recognises? (design-standard rule 1 is read at review: `tools/toolkit-check/closing.mjs` lists it.)

**Sources.** ONS and the Analysis Function give the clearest written rules for chart sources; design-standard rule 1 rests on the maintainer's ruling.
