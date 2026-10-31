# Tables

When to use a table and how to build one people can scan, sort, act on and read with assistive technology: table or not; columns, what earns one, their order and grouping; alignment and figures; cell content, empty cells, status and boolean cells, and when many boolean columns become a matrix or a summary; feature comparison tables; colour in cells; sorting; column-header filters; density; sticky headers; borders, stripes and hover; selection and bulk actions; pagination; empty and loading tables; small screens and wide tables; tables inside dialogs and dashboard cards; captions and header cells; truncation. A table people edit, navigate cell by cell or manage the columns of is a data grid, which is [data-grid](data-grid.md); filtering the rows is [filtering](filtering.md). It serves design-standard's principles *clear words, clear hierarchy*, *efficient for people who know it* and *for everyone, in any context*. It applies design-standard rule 8 (a fixed set of attributes is columns), design-standard rule 3 (one filter bar above the list it narrows), design-standard rule 2 (the layout holds still when sorting, paging or filtering) and design-standard rule 1 (a table of recorded figures says where they come from).

## Table, list or cards

**Use when / don't use**
- A table when people compare records across the same attributes, find a record by an attribute, or act on several at once. NN/g's [data tables](https://www.nngroup.com/articles/data-tables/) names four tasks: find, compare, view or edit one, act on several.
- A list when each item has one or two attributes and is read top to bottom: a feed, search results, navigation.
- Cards when each item is mostly image or free text, items are browsed rather than compared, and the attributes differ between items.
- Never a table for layout ([GOV.UK table](https://design-system.service.gov.uk/components/table/): "Never use the table component to layout content on a page").
- A list, not a table, "When there are columns where the cells will usually be empty", for "longform content such as paragraphs or long lists", or when the data reads better in sections and headings ([Primer DataTable guidelines](https://primer.style/product/components/data-table/guidelines/)).
- Cards suit browsing heterogeneous items; NN/g: "Cards are also a poor choice when users need to compare between multiple options" and are "not appropriate when users search for a specific item" ([NN/g, cards](https://www.nngroup.com/articles/cards-component/)).
- A summary with a drill-down, not a full table, when the reader's question is "what needs attention?" and most rows would answer "nothing" or "the same as every other row".
- A data grid, not a table, when the primary purpose is to "edit or otherwise interact with the cells (like a spreadsheet)" (Primer); see [data-grid](data-grid.md).

**How**
- Ask "will someone read down a column?" If yes, it is a table. If every row would show different attributes, it is a list or cards.
- Name the task the table serves in the design's notes; it decides the default sort, the identifier column and whether rows are selectable.
- A table of two columns where the first is a label and the second a value is a description list (`dl`), not a table.
- Then ask what a reader learns from each column at a glance. When the answer for most columns is "the same thing in every row", the table is reporting a state of the whole set, not differences between rows: say the state once (a sentence, a tile, a count), and show only the rows that differ, linking to the full table or the record pages. Polaris's index-table guidance calls such a list "a summary of these details pages" ([Polaris IndexTable source](https://github.com/Shopify/polaris/blob/main/polaris.shopify.com/content/components/tables/index-table.mdx)).
- Few rows and many columns: swap them. Primer: "Consider swapping columns and rows when it's unlikely that there will ever be more rows than columns"; Datawrapper: people skim "information that's vertically aligned" more easily than across ([Datawrapper, what to consider when creating tables](https://www.datawrapper.de/blog/guide-what-to-consider-when-creating-tables)).
- A table is not a dashboard. A table of figures with one row per category and one figure each is a bar chart's job when the shape is the message ([data visualisation: choosing a chart by its job](data-visualisation.md#choosing-a-chart-by-its-job)).

**Cases**
- A component inventory with status, owner, last change and open findings → a table: every row has the same attributes and people compare them.
- A gallery of illustrations with a title each → cards: nothing is compared down a column.
- Search results with title and excerpt → a list; a table would put the excerpt in a cramped cell.
- Settings shown as "Name: value" pairs → a description list.
- An audit table of forty components with nine columns of red ✕ marks, almost every cell crossed → the reader learns "nearly everything is missing nearly everything", which is one sentence. Lead with that sentence and the counts per attribute; list the few components that are complete or nearly so; keep the full table one click away, cut down as *What earns a column* and *Many boolean columns* describe.
- A three-row comparison of plans with fifteen attributes → transpose: plans as columns, attributes as rows.
- A table of thirty editable price cells → a data grid ([data-grid](data-grid.md)).

**Accessibility**
- 1.3.1 Info and Relationships: a table of data is a `table` with header cells, so the relationship between a cell and its headers is programmatic. A visual table built from `div`s fails unless every role is supplied.
- code-standard rule 1: the markup stands on its own, so the element chosen must mean what it shows.

**Build**
- A table is `table`, `caption`, `thead`, `tbody`, `th` and `td` ([HTML semantics: *Tables for data*](../../code/html-semantics.md#tables-for-data)); APG's [table pattern](https://www.w3.org/WAI/ARIA/apg/patterns/table/) is for a static table and asks for the native element.
- A list is `ul` or `ol`; label–value pairs are a `dl`; cards are a `ul` of `li`, each with a heading ([HTML semantics: *Lists, description lists and figures*](../../code/html-semantics.md#lists-description-lists-and-figures)).
- A table laid out with CSS grid on `div`s is a table without its semantics; use the element (code-standard rule 1).
- The summary above a uniform table is a paragraph or a `dl` of counts, in the page, never inside the `caption`'s visually hidden text alone.

**Check**
- *Script* could: flag a `table` with no `th` (likely layout), and a grid of `div`s with column alignment and no table roles.
- *Judgement*: will the reader compare down a column?

**Sources.** NN/g, GOV.UK and Primer agree on when a table fits; Primer adds the list and data-grid exits, Polaris the summary of details pages. The description-list call and the summary-first reading of a uniform table are the toolkit's commentary.

## Column choice and order

**What good looks like**
- The first column is a human-readable identifier, not a generated ID (NN/g).
- Columns ordered by importance, related columns adjacent (NN/g).
- Only the columns the task needs by default; the rest available on the record's page or behind a column setting.

**How**
- Start from the task: list the attributes the person decides with, in the order they decide. That is the column order.
- Put the identifier first, status near it, numbers to compare beside each other, actions last.
- Five to seven columns is a practical default for a desktop table (commentary; no source gives a number). Past that, ask which columns the task needs.
- Column headers are short nouns in sentence case, with the unit in the header ("Size (KB)"), never repeated in every cell.
- Fixed columns per table. A column that appears for some filters and not others moves everything beside it (design-standard rule 2); keep it and leave its cells blank (*Cell content and empty cells*).

**Cases**
- A table opens with an internal UUID column → move the human name first, put the ID on the record page or last.
- "Created", "Updated" and "Owner" separated by four columns → keep related columns adjacent.
- A per-row "Actions" column with five icons → one overflow menu at the end; a toolbar holds table-wide actions, up to five ([Carbon data table](https://carbondesignsystem.com/components/data-table/usage/)).
- A column that is empty in every row for this view → keep it if the reader would ask where it went, drop it from the design if it never applies here (design-standard rule 5's split, applied to columns).

**Accessibility**
- 1.3.2 Meaningful Sequence: DOM column order is visual order; a visual reorder is code-standard rule 2.
- 2.4.6 Headings and Labels: each header describes its column.

**Build**
- Column order is source order: `th` and `td` in the order they are read; no `order`, grid placement or `row-reverse` to rearrange them (code-standard rule 2).
- The identifier is the row header, `th scope="row"` (*Captions, header cells and scope*).
- The unit sits in the `th` text ("Size (KB)"); an abbreviated header carries its full form as visually hidden text, since a `title` is not reliably announced ([code accessibility: *Accessible names and descriptions*](../../code/accessibility.md#accessible-names-and-descriptions)).
- Row actions are the last cell: one `button` and a menu button ([HTML semantics: *Links and buttons*](../../code/html-semantics.md#links-and-buttons)).

**Check**
- *Script* could: flag a first column whose values match an ID pattern (UUID, long hex, sequential integer); flag a unit repeated in every cell of a column.
- *Judgement*: is the order the order the person decides in?

**Sources.** NN/g gives identifier first and importance order; Carbon gives the toolbar limit.

## What earns a column

**What good looks like**
- Every column tells rows apart or carries the figure the task decides on. A column with the same value in every row tells nothing apart and carries nothing.
- The default view holds the columns the task needs; the rest live on the record page, in a column setting, or in a second view.
- Each column holds one piece of data ([Primer DataTable guidelines](https://primer.style/product/components/data-table/guidelines/): "Don't use a single column to show multiple pieces of data").

**How**
- Primer: "Minimize the number of columns. It's easier to scan many rows than it is to scan many columns." Datawrapper: "the fewer columns your table has, the more readable it becomes"; ask "What's the essential information?" GOV.UK: "aim to have less data in your tables", and split a large set "into multiple tables or multiple pages".
- NN/g on comparison tables: "Don't just throw every piece of metadata you have into the table", and "let users hide the rows for which all offerings are similar, and only show the differences" ([NN/g, comparison tables](https://www.nngroup.com/articles/comparison-tables/)). The same holds for columns: a column uniform across the rows in view is a candidate to drop from the default view.
- Test each column: if every row had the same value, what would the reader lose? A column that loses nothing goes; its fact becomes one sentence in the caption or a summary above ("No component has usage notes yet").
- Where design-standard rule 8 meets crowding: the rule says a closed set of attributes is shown as columns, not a list in one cell. It governs how an attribute is shown once it has earned a place; it does not ask for every attribute to be shown. When nine attributes are each true for nearly every row, the columns obey it and still say almost nothing; reduce them as *Many boolean columns* describes, and keep the full set as columns on the record page or in a matrix view, where the rule still holds.
- Uniform today is not uniform by design. Drop a column from the default view when it is uniform for the data the table exists to show; keep it when the reader would ask where it went (design-standard rule 5's split, as *Column choice and order* applies it). The decision follows the data's meaning, not today's values (code-standard rule 57); a script can hide a column that is uniform in the current result, if it says so ("Hidden: Owner, the same in every row").
- Shorten before cutting: repeated words move into the header, units into the header, numbers into a shorter format ([Datawrapper](https://www.datawrapper.de/blog/guide-what-to-consider-when-creating-tables): "bring repeating words in the column header and use a shorter number format").

**Cases**
- Nine "missing guidance" columns, eight of them ✕ in every row → keep the one column that differs between rows; replace the eight with a sentence ("None of the 40 components has usage, code notes, … yet") and a count column; the per-attribute detail goes to the record page.
- A "Library" column reading "Web" in every row of a table already filtered to the web library → drop it from this view; the filter says it.
- A "Type" column that happens to read "Component" in every row today, in a table that can also hold styles → keep it; it is uniform by accident.
- A "Details" column holding "3 findings, owner Ana, updated 2 Oct" → three columns (Primer; design-standard rule 8).

**Accessibility**
- Fewer columns means fewer cells announced per row: a screen-reader user moving along a row hears every column header with every cell, so each column removed is time saved on every row.
- 1.3.1: a fact moved from a column to a caption or summary stays text in the page, near the table.

**Build**
- The column list comes from the data model, and a template renders what it is given; deciding which columns a view shows is model logic, not template logic (code-standard rule 29).
- A column hidden because it is uniform is left out of the markup, with the sentence that replaces it rendered above the table; not `display: none` on cells (code-standard rule 57 for deciding it from the data's meaning).
- One value per cell: a cell is one `td` with one value, so the column sorts and counts.

**Check**
- *Script* could: for each column, count distinct values across the rows rendered and flag a column with one distinct value (or one value in over 90% of rows) for review; flag a cell holding two or more separated values from a recurring vocabulary.
- *Judgement*: what does the reader lose if this column goes?

**Sources.** Primer, Datawrapper, GOV.UK and NN/g agree on fewer columns; NN/g's "only show the differences" is written for comparison rows and applied here to columns, which is the toolkit's reading. Primer's "one piece of data per column" is an outside statement of design-standard rule 8.

## Grouping and header hierarchy

**Use when / don't use**
- Group columns when several belong to one subject (three platform columns, four guidance sections) and the reader would otherwise lose which belong together.
- Group rows when the set falls into a few categories the reader thinks in (by status, by library).
- Don't build deep hierarchy into one table: Primer sends data that is "easier to understand with grouping and hierarchy (sections, headings, subheadings, etc.)" to something other than a table, and the W3C advises restructuring multi-level tables "to make them less complex for all readers" ([W3C, multi-level headers](https://www.w3.org/WAI/tutorials/tables/multi-level/)).

**How**
- Adjacent first: related columns sit together in a fixed order (*Column choice and order*). Often adjacency and a shared header word are enough.
- A group header row above the column headers, spanning its columns, for one level of grouping; two header rows is the limit (*Captions, header cells and scope*).
- Separate groups with space or a single vertical rule between groups, not a rule between every column; the group boundary is the only vertical line.
- Row groups: a full-width group header row ("Blocked (12)") or one table per group under a heading. One table per group when groups are compared separately or are long; group rows when the reader still sorts or scans across groups.
- A group header carries a count when the group can be collapsed or is long.

**Cases**
- Columns "Web", "iOS", "Android" scattered among others → adjacent, under a group header "Platforms".
- Three levels of merged headers (area, section, measure) → one table per area.
- Vertical rules between all twelve columns → remove them; one rule or a wider gap between the two groups.

**Accessibility**
- 1.3.1: a group header is a `th` with `colspan` and `scope="colgroup"`, its columns in a `colgroup`; a row group header is a `th` with `scope="rowgroup"` inside its own `tbody`. Screen readers then announce the group with the cell.
- Splitting into several tables gives each its own caption, which serves everyone.

**Build**
- Column groups: `colgroup` with `span`, and a group `th` with `colspan` and `scope="colgroup"` in the first header row ([W3C, multi-level headers](https://www.w3.org/WAI/tutorials/tables/multi-level/)).
  ```html
  <colgroup><col><col span="3"></colgroup>
  <thead><tr><td></td><th scope="colgroup" colspan="3">Platforms</th></tr>
    <tr><th scope="col">Component</th><th scope="col">Web</th><th scope="col">iOS</th><th scope="col">Android</th></tr></thead>
  ```
- Row groups: one `tbody` per group, its first row a `th scope="rowgroup" colspan="…"`.
- The group boundary is one border on the group's first `col` or cell, from a token (code-standard rule 22).
- Markup basics are [HTML semantics: *Tables for data*](../../code/html-semantics.md#tables-for-data).

**Check**
- *Script* could: flag a `thead` with more than two rows, and a spanning `th` without `scope="colgroup"`.
- *Judgement*: does the grouping match how the reader thinks about the columns?

**Sources.** The W3C tutorial and Primer agree that deep hierarchy belongs outside one table; the single group rule is the toolkit's commentary.

## Alignment and figures

**What good looks like**
- Numbers right-aligned so place values line up ([GOV.UK table](https://design-system.service.gov.uk/components/table/): "align the numbers to the right in table cells").
- Text left-aligned. Headers align with their column's content.
- Numeric columns set in tabular figures, so every digit takes the same width.

**How**
- Right-align numbers that are compared: counts, amounts, sizes, percentages, durations. Left-align identifiers that happen to be numeric (a version, a postcode, an ID): they are labels.
- Same precision down a column, so decimals line up ([data: numbers](data.md#numbers)).
- Tabular figures: `font-variant-numeric: tabular-nums` on numeric cells ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/font-variant-numeric): figures "all of the same size, allowing them to be easily aligned like in tables"). A font without tabular figures is a finding for the type choice.
- Status badges and icons left-aligned, with their header ([Polaris DataTable source](https://github.com/Shopify/polaris/blob/main/polaris.shopify.com/content/components/tables/data-table.mdx): "Align headers with their related data", "Don't center align"); centred only in a matrix of single marks (see *Many boolean columns*). Dates left-aligned in one fixed-width format, or right-aligned if compared as numbers; pick one per product.
- Units in the header; a currency symbol may stay in the cell when columns mix currencies.

**Cases**
- A "Findings" column of counts left-aligned → right-align it and its header.
- Amounts with 0, 1 or 2 decimals → fix two decimals for the column.
- A proportional font makes "111" narrower than "888" → set tabular figures on the column.
- Version numbers right-aligned → left-align: nobody adds versions.

**Accessibility**
- No criterion requires alignment; it is a readability decision. 1.4.12 Text Spacing: a fixed-width numeric column still survives increased spacing.

**Build**
- Numeric columns take `text-align: end` and `font-variant-numeric: tabular-nums`, set from a column attribute such as `data-type="number"` on header and cells ([HTML semantics: *Table behaviour*](../../code/html-semantics.md#table-behaviour); code-standard rule 6).
- `end`, not `right`, so a right-to-left table mirrors ([i18n: *Logical properties and mirroring*](../../code/i18n.md#logical-properties-and-mirroring)).
- Figures are formatted by `Intl.NumberFormat` or the server's equivalent with fixed fraction digits per column, never by string padding ([i18n: *Numbers, dates, plurals and lists*](../../code/i18n.md#numbers-dates-plurals-and-lists)).
- The header aligns with its column from the same attribute; no per-cell classes.

**Check**
- *Script* could: for each column whose cells parse as numbers, assert computed `text-align` is right or end and `font-variant-numeric` includes `tabular-nums`; assert the header matches.
- *Judgement*: is a numeric-looking column a quantity or a label?

**Sources.** GOV.UK, Primer, Polaris and Material ([data tables](https://m1.material.io/components/data-tables.html): "Right-aligned numeric columns", "Left-aligned text columns") agree on right-aligned numbers; NN/g's data-tables article does not cover alignment. Polaris forbids centring; the toolkit follows it except for a matrix of marks.

## Cell content and empty cells

**What good looks like**
- Each cell holds its value "in the shortest possible format" (Primer DataTable guidelines).
- One content type per column, aligned by type.
- An empty cell means one thing in a table, and the reader can tell it from zero, unknown and not applicable.

**How**
- By type: text left; quantities right in tabular figures ([data: numbers](data.md#numbers)); identifiers that look numeric left; dates in one format ([data: dates and times](data.md#dates-and-times)); status as a short label or badge, left ([feedback: status badges and pills](feedback.md#status-badges-and-pills)); a link only on the identifier; row actions last, one visible and the rest in a menu (Primer: "Do not pull out more than 1 action").
- Long text: Primer prefers wrapping to truncation; Polaris says "Wrap instead of truncate" because rows that start alike look the same when cut. Prose longer than a line or two belongs on the record page (*Truncation*).
- Empty cells: Primer says "By default, leave empty cells blank … Just don't use a character like "x" or "-". It creates a weird experience for assistive technologies like screen readers." The toolkit follows it: blank for "no value", and a word where the reason matters to the reader ("None", "Not measured", "Not applicable"), so a screen reader announces a meaning rather than "dash".
- Zero, missing and not applicable are three values, owned by [data: numbers](data.md#numbers): a count column shows "0", never blank; missing data is "Not measured", never "0".
- Repeated values: a value repeated down many rows (the same owner, the same date) can be shown once per group when the rows are sorted by it, if the table is never re-sorted; in a sortable table, repeat it.

**Cases**
- "—" in cells meaning "no findings" in one column and "not audited" in another → "0" for no findings, "Not audited" for the other.
- "N/A" in grey on half the rows of a column → if the column does not apply to half the rows, ask whether it belongs in this table or in a group of its own (Primer: columns "usually empty" mean a list).
- A description cell holding a paragraph → one line and the full text on the record page.

**Accessibility**
- 1.3.1: a blank `td` is announced as blank, which is honest; a glyph such as "–" or "✕" is announced by name, or skipped, depending on the screen reader. A word is the only form announced the same everywhere.
- An icon in a cell needs a text equivalent (code-standard rule 18).

**Build**
- A blank cell is an empty `td`; a reason is a word in the cell ("Not measured"); zero is "0" (code-standard rule 12: a fallback renders only when the value is missing).
- Dates in a `time` element with a machine `datetime`; numbers formatted by the locale ([i18n: *Numbers, dates, plurals and lists*](../../code/i18n.md#numbers-dates-plurals-and-lists)).
- An icon in a cell is `aria-hidden` with visible or visually hidden text beside it (code-standard rule 18; [code accessibility: *Hidden content*](../../code/accessibility.md#hidden-content)).
- The only link in a row is on the identifier; the whole row as a target is a stretched link from that one `a`, not a click handler on `tr` (code-standard rule 21).

**Check**
- *Script* could: flag cells whose whole text is "-", "–", "—", "x" or "✕" with no accessible text; flag a numeric column with blank cells and no zeros; flag more than one content type in a column.
- *Judgement*: does each blank mean one thing?

**Sources.** Primer and Polaris. Primer's "leave it blank" disagrees with the common dash convention; the toolkit takes Primer's reason, the screen-reader experience, and adds words for reasons.

## Status and boolean cells

**Use when / don't use**
- A mark (✓ or blank) when the question is yes or no for one attribute and the reader scans down the column.
- A count when the question is how many: "7 of 9", right-aligned.
- Text when there are more than two states, or the state needs words ("Partial", "Not measured", "Blocked").
- Never marks for three or more states, and never two different marks (✓ and ✕) where one mark and a blank would do.

**How**
- Mark the exception, not the norm. In a column where most rows are "missing", a red ✕ in every row is noise; mark the rows that have it (✓), leave the others blank, and say the norm in the header or caption ("Usage written: 3 of 40"). When most rows have it, mark the few that do not.
- Status vocabulary: one short label per state, in a fixed list ([feedback: status badges and pills](feedback.md#status-badges-and-pills)). A long status label repeated on every row moves its repeated words into the header: "Code generation" as the header, "Ready" or "Blocked" in the cells, not "Not ready for code generation" forty times (Datawrapper: "bring repeating words in the column header").
- A status the same in every row is the state of the set, not of a row: say it once above the table and drop the column (*What earns a column*), or group rows by status so each status is said once in a group header (*Grouping and header hierarchy*).
- A status needing attention gets the colour and icon; neutral and good states stay quiet (*Colour in cells*).
- Pair a status with what to do about it on the record page or in a described-by text; a cell is a label, not a message (design-standard rule 10 for the message).

**Cases**
- Nine columns of red ✕ marks, true in nearly every row → blanks for missing, a quiet ✓ for present, a count column "Present: 1 of 9" sorted ascending, and a sentence above stating that nearly every component lacks nearly every section. The red goes; nothing in the table needs more attention than anything else.
- A "Status" column repeating "Not ready: missing guidance" on 38 of 40 rows → header "Ready", cells "No" (or blank) and "Yes"; better, a sentence "2 of 40 are ready" and the two named.
- A "Supported" column with ✓, ✕ and "~" → text: "Yes", "No", "Partial".

**Accessibility**
- 1.4.1: a state shown by colour also has a word or shape. 1.3.1: a ✓ has a text equivalent ("Yes" or the attribute's name) through visually hidden text, not a `title`.
- A mark column's header names the attribute, so "✓" announced with its header reads "Usage, yes".

**Build**
- A mark is an `svg` with `aria-hidden="true"` plus visually hidden text ("Yes", "Present"), never a `title` alone ([code accessibility: *Hidden content*](../../code/accessibility.md#hidden-content); code-standard rule 18).
  ```html
  <td><svg aria-hidden="true">…</svg><span class="visually-hidden">Yes</span></td>
  ```
- A status is a badge component with the state as an attribute (`data-status="blocked"`), its colour and icon from the attribute, its text always present (code-standard rule 9).
- The status vocabulary comes from one list in the model, so cells and filters share it (code-standard rule 29).

**Check**
- *Script* could: flag a column whose cells are all one of two glyphs and where one glyph covers over 80% of rows (marking the norm); flag a status cell over about 25 characters repeated in more than half the rows; flag a column of ✓/✕ glyphs with no text alternative.
- *Judgement*: is the mark on the rows that need the reader's eye?

**Sources.** NN/g warns that checkmarks "can't stand alone" and asks for short text ([comparison tables](https://www.nngroup.com/articles/comparison-tables/)); Datawrapper gives repeating words into the header. Marking the exception is the toolkit's commentary.

## Many boolean columns: matrix, heatmap or summary

**Use when / don't use**
- When more than about five boolean columns sit side by side, decide what the reader asks of them (commentary; no source gives a number):
  - "Which rows are complete, and how far off are the rest?" → a count column and a summary; the detail on the record page.
  - "Where are the gaps across the set, and which attributes are missing everywhere?" → a matrix view, read as a heatmap.
  - "What stops this row from moving on?" → a "Blocked by" summary column.
- Don't keep nine mark columns in a table whose task is one of these; they answer all three badly.

**How**
- Count and summary: one right-aligned count ("7 of 9 present" or "2 missing"), sortable, with the attributes' names on the record page or in an expandable row ([Carbon expandable rows](https://carbondesignsystem.com/components/data-table/usage/): to "present large amounts of data in a small space"). Totals per attribute in a footer row or a short list above.
- Matrix: rows by attributes, cells filled or empty, one hue. Sort rows by completeness and columns by how often the attribute is present, so the pattern reads as a block and the outliers stand out. Datawrapper: a heatmap lets readers "quickly skim the table for outliers and patterns" ([Datawrapper, heatmaps for tables](https://www.datawrapper.de/blog/heatmaps-for-tables/)). Shape, not colour, carries the state: a filled square or ✓ for present, empty for absent, so it survives greyscale. The matrix is a second view of the same data, not the default table, unless the pattern is the message.
- "Blocked by": one value per row, the first blocker in a fixed priority order of the attributes, plus a count of the rest ("Usage, +3"). One value keeps the column sortable and groupable; a comma list of every blocker is the list in a cell that design-standard rule 8 forbids. The full set stays as columns in the matrix or on the record page.
- Whichever form, the per-attribute totals are said once ("Usage: 3 of 40"), so the reader can see which attribute is the common gap without reading forty rows.

**Cases**
- An audit table with nine red ✕ columns, mostly true in every row → default view: identifier, status, "Missing: 8 of 9", "Blocked by: Usage, +7", owner; above it, "Missing across 40 components: usage 37, code notes 40, …"; a "Matrix" view shows the 40 × 9 grid sorted so the two near-complete components sit at the top.
- A platform-support table, three columns → keep the three mark columns: three is few, and each differs between rows.
- A "Blocked by" cell listing "Usage, Code notes, Tokens, Do and don't" → "Usage, +3" with the full list on the record page.

**Accessibility**
- A matrix is a real `table` with row and column headers; each cell has a text value ("Present" visually hidden) so the matrix reads cell by cell. A heatmap drawn as a canvas or SVG needs the table as its alternative ([data visualisation: long descriptions and data tables](data-visualisation.md#long-descriptions-and-data-tables)).
- 1.4.1 and 1.4.11: filled versus empty is shape; a filled cell's colour meets 3:1 against its background.

**Build**
- The matrix is a real `table`: attributes as `th scope="col"`, rows with `th scope="row"`, each cell's state as visually hidden text ([HTML semantics: *Tables for data*](../../code/html-semantics.md#tables-for-data)).
- Fill comes from the cell's state attribute (`td[data-present]`), shape from the mark, colour from one token (code-standard rule 6, code-standard rule 22).
- A count cell is a number cell (*Alignment and figures*); the per-attribute totals go in a `tfoot` row of `th scope="row"` and figures.
- An expandable row for the attribute names is [disclosure: expandable table rows](disclosure.md#expandable-table-rows).
- A heatmap drawn as SVG or canvas keeps this table as its alternative ([data visualisation: long descriptions and data tables](data-visualisation.md#long-descriptions-and-data-tables)).

**Check**
- *Script* could: count adjacent boolean-mark columns and flag more than five; flag a "Blocked by"-style column whose cells hold separated lists.
- *Judgement*: which of the three questions does the reader ask?

**Sources.** Datawrapper on heatmaps, Carbon on expandable rows, NN/g on showing only differences; the three-question split and the single-value "Blocked by" are the toolkit's commentary.

## Feature comparison tables

**Use when / don't use**
- A comparison table when people choose between a few offerings (plans, products, versions) by reading the same attributes across them. NN/g suggests a static comparison "if you have 5 offerings or fewer", and notes that "Most dynamic comparison tables accept 3–4 items only" ([NN/g, comparison tables](https://www.nngroup.com/articles/comparison-tables/)).
- Not for a set people browse or filter: past about five offerings it is a list with facets ([filtering](filtering.md)), with a compare action on the few chosen.
- Not when the attributes are incomplete: NN/g, "if the information isn't complete for all compared products, it might as well not be in a comparison table at all".

**How**
- Offerings as columns, attributes as rows: there are more attributes than offerings (*Table, list or cards* on transposing). The offering's name, price and main action sit in the header row.
- Freeze the header row so each column keeps its name while scrolling: NN/g, "keep column headers fixed as users scroll", because people "will easily forget which column is for which product"; Baymard's comparison testing found the same for sticky product headings ([Baymard, comparison tools](https://baymard.com/blog/user-friendly-comparison-tools)). Freeze the attribute column too when the offerings overflow sideways (*Sticky header and first column*).
- Group the attributes under category headings (pricing, limits, support) rather than one long list; Baymard found categorised specs easiest to scan. One level of grouping, as *Grouping and header hierarchy* says.
- Differences first: an "Only show differences" switch hides the rows that are the same for every offering. NN/g: "let users hide the rows for which all offerings are similar, and only show the differences". Baymard ranks hiding above shading the differing rows, and accepts shading only where hiding cannot be offered. The toolkit offers the switch, off by default, and says how many rows it hides ("12 identical rows hidden").
- A check or blank for yes or no; a short word or figure where the answer has a size ("10 GB", "Email only"). NN/g warns against "symbols like checkmarks that can't stand alone" and asks to keep text short. Never a cross for "no" beside a check for "yes" where a blank does the job (*Status and boolean cells*).
- Row separators carry the eye across: light rules or stripes, one system (*Zebra stripes and hover*).

**Cases**
- Four plans and forty features in one long ungrouped list → group under five category headings, sticky plan header, and an "Only show differences" switch.
- A cross in every cell of the cheapest plan → blanks for "not included"; the few features it has get a check.
- "Storage ✓" for every plan → the figure in each cell: "5 GB", "50 GB", "Unlimited".
- A shopper adds a ninth product to compare → cap the compare set at four and say so where products are added.

**Accessibility**
- 1.3.1: offering names are `th scope="col"`, attribute names `th scope="row"`, category headings `th scope="rowgroup"`; a check has visually hidden text ("Included") so the cell reads "Priority support, Pro, included".
- 4.1.3: switching "Only show differences" announces the change ("12 identical rows hidden").
- 2.4.11: the sticky header does not cover the focused row.

**Build**
- One `table`, one `tbody` per category with a `th scope="rowgroup"` row ([HTML semantics: *Tables for data*](../../code/html-semantics.md#tables-for-data)); stickiness as in *Sticky header and first column* ([HTML semantics: *Table behaviour*](../../code/html-semantics.md#table-behaviour)).
- Which rows are identical is computed in the model from the offerings' values, never from a hand-kept list (code-standard rule 29, code-standard rule 57); identical rows carry an attribute (`data-same`), and the switch hides them with `hidden`, so the markup works without script as the full table (code-standard rule 20).
- A mark is an `aria-hidden` icon with visually hidden text (code-standard rule 18; [code accessibility: *Hidden content*](../../code/accessibility.md#hidden-content)); the hidden-rows count goes to a status region ([code accessibility: *Live regions and status messages*](../../code/accessibility.md#live-regions-and-status-messages)).

**Check**
- *Script* could: flag a comparison table with more than five offering columns, a mark with no text alternative, and rows marked `data-same` whose cell texts differ.
- *Judgement*: does the default view lead with the attributes that tell the offerings apart?

**Sources.** NN/g and Baymard agree on sticky headers and on hiding identical rows; Baymard treats highlighting as a fallback, which the toolkit follows. The default-off switch and the hidden-row count are the toolkit's commentary.

## Colour in cells

**What good looks like**
- Most cells carry no colour. Colour marks the few cells that need action, and the reader finds them at once.
- Status colours mean status; categories use neutral or accent colours.
- Colour never alone: a word, an icon or a shape says the same.

**How**
- Spend colour from the attention budget ([visual: emphasis and the attention budget](../design/visual.md#emphasis-and-the-attention-budget)). A colour applied to most rows has no attention left to give.
- Text colour versus fill: Datawrapper: "The less space colors fill in, the brighter & more different they should be"; bright for coloured text, pastel for whole-cell fills.
- Magnitude: a sequential single-hue scale (a heatmap), never red to green; NN/g: "color should not be used to communicate information about quantitative values or magnitude" on its own ([NN/g, dashboards](https://www.nngroup.com/articles/dashboards-preattentive/)). Where colour does encode a quantity, the number is in the cell too.
- The error role is for an error the reader can act on. "Missing" as the normal state of most rows is neutral; the one row that broke since the last run is the error.
- Never stripe or hover with a status colour (*Zebra stripes and hover*).

**Cases**
- Red ✕ in 300 of 360 cells → neutral blanks and quiet ticks; colour on the one row whose status worsened.
- Whole rows tinted red, amber and green by status → a status badge in one column; the rows stay neutral.
- A "Coverage %" column coloured red to green → plain numbers, right-aligned, with a single-hue bar or a heatmap only if the pattern is the point.

**Accessibility**
- 1.4.1 Use of Color; 1.4.3 for coloured text, 1.4.11 for a fill that carries state. Atlassian: "Never rely on highlighted rows to convey important meaning, selection, or focus" ([Atlassian dynamic table](https://atlassian.design/components/dynamic-table/usage)).

**Build**
- Colour comes from the state attribute on the cell or badge (`[data-status="error"]`) mapped to semantic colour tokens, never a hex in the cell's style (code-standard rule 6, code-standard rule 22, code-standard rule 53).
- No inline `style` per cell for status; a heatmap's magnitude may set a custom property per cell (`--level: 0.4`) that one rule reads (code-standard rule 38).
- Forced colours: a fill that carries state keeps its mark or text, which survive `forced-colors: active` ([code accessibility: *Reduced motion and colour scheme in code*](../../code/accessibility.md#reduced-motion-and-colour-scheme-in-code)).

**Check**
- *Script* could: count cells with a status-role colour per table and flag over a project threshold share (say a quarter); flag a cell whose colour carries state with no text or icon; measure coloured text contrast.
- *Judgement*: does the colour point at what needs action?

**Sources.** Datawrapper, NN/g and Atlassian; the share threshold is commentary.

## Headers and sorting

**Use when / don't use**
- Make a column sortable when people look for the top or bottom of it, or for a value within it.
- Don't make every column sortable by reflex; a long free-text column rarely needs it.

**How**
- Sorting lives in the header: the header text is a button. No separate "Sort by" menu for a table that has headers (from Carbon).
- Three states: unsorted, ascending, descending ([Carbon](https://carbondesignsystem.com/components/data-table/usage/): "A sorted data table has three states"). A click cycles ascending, descending, back to the default order.
- One column sorted at a time. Only that column shows a direction icon; other sortable headers show one subdued neutral icon. Carbon shows the neutral icon on hover only; the toolkit shows it always, because touch has no hover and the principle is *discoverable*.
- One sort icon per header: an up or down arrow for the sorted direction, a neutral two-way icon otherwise. The shape changes with the direction, not only the colour ([Roselli, sortable table columns](https://adrianroselli.com/2021/04/sortable-table-columns.html)).
- A default sort that matches the task (most recent first for activity, most severe first for findings), stated in the design.
- Sorting re-renders the rows only. The header, toolbar and pagination stay put (design-standard rule 2), and focus stays on the header button.
- Sort direction words follow the data: "Newest first", "A to Z", "Largest first" in any visible sort summary.

**Cases**
- A sort control as a dropdown above a table with headers → move it into the headers.
- Two columns showing arrows after two clicks → only the last-clicked column is sorted; reset the other.
- An arrow that only changes colour between states → change the shape as well: 1.4.1.
- A sort click re-renders the whole region and focus falls to the body → keep focus on the button (code-standard rule 14).

**Accessibility**
- 4.1.2 Name, Role, Value: the sorted header carries `aria-sort="ascending"` or `"descending"`; Roselli says not to put `aria-sort` on more than one header and to remove it from unsorted ones.
- 4.1.3: some screen readers do not announce the change; a short live-region message ("Sorted by size, largest first") covers it (Roselli).
- 2.1.1: the header control is a real `button`.

**Build**
- A `button` inside the `th`; `aria-sort` on the sorted header only; the sort instruction in the caption; the order announced in a status region ([HTML semantics: *Table behaviour*](../../code/html-semantics.md#table-behaviour); [APG sortable table](https://www.w3.org/WAI/ARIA/apg/patterns/table/examples/sortable-table/)).
- Without script the header is a link to `?sort=…&dir=…`, sorted on the server (code-standard rule 20); with script, the address still changes ([javascript: *State in the address and history*](../../code/javascript.md#state-in-the-address-and-history)).
- Re-sort replaces the `tbody` rows only; focus stays on the header button (code-standard rule 14).
- The direction icon swaps shape by `aria-sort` value (`th[aria-sort="ascending"] svg`), so state is styled from the attribute, not a class (code-standard rule 9).
- Sorting text uses `Intl.Collator` for the page's language ([i18n: *Locale-aware sorting*](../../code/i18n.md#locale-aware-sorting)).

**Check**
- *Script* could: assert each sortable header contains a `button`; at most one `th` has `aria-sort`; after a click, the toolbar's position is unchanged (the shape of design-standard rule 2's check) and focus is on the same button.
- *Judgement*: does the default sort serve the table's task?

**Sources.** Carbon and Roselli agree on three states and one sorted column; they differ on icon visibility, and the toolkit follows touch over hover.

## Column-header filters

**Use when / don't use**
- The filter bar above the table is the default: one bar narrows one list (design-standard rule 3), and its forms are [filtering: filter bar, sidebar or filter dialog](filtering.md#filter-bar-sidebar-or-filter-dialog). This section covers filtering from the header and how it fits that rule.
- A "Filter by this column" entry in a column's menu when people think "show me only these values of this column" while looking at it; the entry sets the bar's facet, so the bar stays the one place filters live.
- A filter row under the headers (one input per column) only in a data grid for expert, spreadsheet-like work, where most columns are filtered by typed values and a bar of that many facets would not fit ([data-grid](data-grid.md)). There the row replaces the bar; never both.
- Never a filter icon or input in every header of an ordinary table: Atlassian says "Never put additional controls like links or buttons in table headings" ([Atlassian dynamic table](https://atlassian.design/components/dynamic-table/usage)), and the header already holds the sort button.

**How**
- Column menu: one menu button per header beside the sort control ([data-grid: anatomy](data-grid.md#anatomy)); "Filter by Owner…" opens the same control the bar uses for that facet, and the applied value shows in the bar's applied filters ([filtering: applied filters and clear all](filtering.md#applied-filters-and-clear-all)).
- A filtered column says so in its header: a filled filter mark beside the label, so the reader knows why rows are missing. NN/g asks for "a clear visual indication that filters are active" and says "Filter syntax should be transparent to users" ([NN/g, data tables](https://www.nngroup.com/articles/data-tables/)).
- Filter row: each input fits its column's type (text, a menu of the column's values, a date range), carries a clear button, and the columns keep a minimum width so inputs stay usable. Shestopalov describes these three filter types, a reset control on each box and minimum column widths ([Smashing, complex web tables](https://www.smashingmagazine.com/2019/02/complex-web-tables/)).
- Carbon puts "complex filters" in the table's toolbar, not the headers ([Carbon data table](https://carbondesignsystem.com/components/data-table/usage/)); Primer's table filter is "An input used to filter table data", in the table header area above the columns, not inside them ([Primer DataTable guidelines](https://primer.style/product/components/data-table/guidelines/)).
- Every route writes the same address parameters ([filtering: filters in the address](filtering.md#filters-in-the-address)).

**Cases**
- A table with a filter bar and a funnel icon in each header doing the same job → keep the bar; the header icon becomes a column-menu entry that sets the bar's facet.
- Rows vanish after a header filter and nothing outside the column says why → show the filter in the bar's applied list and mark the header.
- A thirty-column grid where analysts filter by typed values in most columns → a filter row under the headers, and no bar.

**Accessibility**
- 1.3.1 and 4.1.2: each filter input is labelled with its column's name ("Filter Owner"); a header menu button is named "Column menu: Owner" (code-standard rule 18).
- 4.1.3: the new row count is announced after a filter applies.
- 2.4.3: a filter row's inputs sit in reading order with their columns; tabbing through it does not enter the body.

**Build**
- One GET `form` for the list whichever control sets it; a column-menu entry focuses or opens the bar's field rather than holding a second copy ([HTML semantics: *Search and filter forms*](../../code/html-semantics.md#search-and-filter-forms); code-standard rule 20).
- A filter row is a second `tr` in `thead` of `td` cells holding labelled inputs (the row is not headers); the inputs belong to the list's form through the `form` attribute.
- The filtered-header mark comes from the address state, styled from an attribute on the `th` (`data-filtered`) (code-standard rule 9); the count goes to a status region ([code accessibility: *Live regions and status messages*](../../code/accessibility.md#live-regions-and-status-messages)).

**Check**
- *Script* could: flag a table with both a filter bar and filter controls in its headers; flag header filter inputs without a label; assert the address changes when a header filter applies.
- *Judgement*: do people filter while looking at a column, or before they look at the table?

**Sources.** Smashing describes filter boxes in headers; Atlassian forbids extra controls in headings, and Carbon and Primer put filters above the table. The toolkit sides with the bar (design-standard rule 3) and allows a header filter row only in an expert data grid, where it replaces the bar.

## Density and row height

**What good looks like**
- One row height per table, matched by the header row (Carbon: the header "should always match the row size of the table").
- Two densities at most per product: a default and a compact.
- Every interactive element in a row meets its target size.

**How**
- Carbon's five heights are a reference: 24, 32, 40 (default), 48 and 64px for two-line rows ([Carbon data table](https://carbondesignsystem.com/components/data-table/usage/)). Choose 40 as the default and 32 as compact for data tools; 48 when rows hold controls used by touch.
- Rows hold one line by default. A second line (a description under the name) means the 64px class of row for the whole table, never mixed heights.
- Padding comes from the spacing scale (*Spacing scale* in [visual](../design/visual.md#spacing-scale-and-proximity); code-standard rule 22 for the code half).
- A density setting is a feature someone must ask for; offering five sizes is not.
- Match row height to the number of rows: a short table reads better roomy, a long one compact. Datawrapper: "If you show only a few rows, a wide layout is more pleasant to the eye. If your table has a lot of rows, consider a compact layout".
- Density is spacing, never type size ([visual: density modes](../design/visual.md#density-modes)). Shrinking the text to fit more columns is a sign the columns need cutting (*What earns a column*), not a denser table.
- Systems name three densities: Primer's condensed, normal and spacious ([Primer DataTable](https://primer.style/product/components/data-table/)); MUI X's compact, standard and comfortable ([MUI X accessibility](https://mui.com/x/react-data-grid/accessibility/)). The toolkit keeps two settings; a short table of rich rows gets a roomier default rather than a third setting.

**Cases**
- Rows that grow when one cell wraps → set a column width or truncation (see *Truncation*); the row height is fixed.
- A 24px row holding checkboxes and icon buttons → 24px is the floor for a target (figma-standard rule 26; 2.5.8), and it leaves no spacing; use 32 or more.
- A compact table for experts and a roomy one for occasional users → one product default, with compact as an explicit setting remembered per person.
- A crowded audit table set in 12px text at 24px rows to fit eleven columns → cut the columns first; then the default density fits.

**Accessibility**
- 2.5.8 Target Size (Minimum): row actions at least 24 by 24px or spaced; figma-standard rule 26 in a component.
- 1.4.4 and 1.4.12: rows grow with text resize rather than clipping; a fixed height in rem, never in px that clips.

**Build**
- Row height and cell padding come from density tokens; compact is a mode attribute on the table or an ancestor (`data-density="compact"`) that switches the token set ([tokens: *Density*](../../code/tokens.md#density); code-standard rule 9).
- Heights are a minimum in `rem` (`min-block-size`) so rows grow with text resize instead of clipping ([responsive: *Zoom and reflow*](../../code/responsive.md#zoom-and-reflow)).
- Controls in rows keep their target size at the compact density ([responsive: *Touch targets*](../../code/responsive.md#touch-targets)).
- The person's density choice persists and is applied before first render (code-standard rule 14).

**Check**
- *Script* could: assert all body rows in a table share one rendered height (within a pixel) and the header matches; measure targets inside rows.
- *Judgement*: does the density fit how often and on what device the table is used?

**Sources.** Carbon publishes five sizes, Primer and MUI X three densities, and Datawrapper ties row height to row count; the research behind the design standard found most products need two settings. The toolkit uses two.

## Sticky header and first column

**Use when / don't use**
- Freeze the header row when the table is taller than the viewport; freeze the identifier column when it is wider (NN/g data tables).
- Don't freeze anything in a short table; a sticky header that sticks for three rows wastes space.

**How**
- `position: sticky` on the header cells inside the table's scroll container, with an opaque background and a bottom border so rows do not show through.
- Freeze the first column only when horizontal scrolling exists; give it a right border or shadow so the frozen edge reads.
- One sticky layer per direction. A sticky page header plus a sticky table header plus a sticky toolbar stack until the rows have no room; on small screens, unstick the page header first.
- The sticky offset accounts for any sticky page header above it.

**Cases**
- A 200-row findings table → sticky header.
- A wide comparison table scrolled sideways loses the component name → freeze the first column.
- A sticky header covers the focused row when tabbing upward → add `scroll-padding-top` equal to the sticky height so focus scrolls clear of it.

**Accessibility**
- 2.4.11 Focus Not Obscured (Minimum): sticky headers and columns are the usual culprits; a focused cell is never entirely hidden beneath them. code-standard lists 2.4.11 among its candidates.
- 1.4.10 Reflow: the table scrolls inside its container, not the page (see *Responsive tables*).

**Build**
- `position: sticky` with `inset-block-start: 0` on `thead th`, and `inset-inline-start: 0` on the row header, inside the table's scroll container; opaque background and border from tokens ([HTML semantics: *Table behaviour*](../../code/html-semantics.md#table-behaviour)).
- Any ancestor with `overflow` other than `visible` becomes what the header sticks to; check the wrapper before adding the rule.
- `scroll-padding-block-start` and `scroll-padding-inline-start` on the scroller equal the sticky sizes, from the same custom properties ([code accessibility: *Visible focus*](../../code/accessibility.md#visible-focus)).
- The page header's sticky height is one custom property both offsets read (code-standard rule 46).

**Check**
- *Script* could: tab through a long table and assert each focused element's box is not fully covered by a sticky element.
- *Judgement*: is the table long or wide enough to need it?

**Sources.** NN/g recommends freezing; the focus-obscured detail is W3C's.

## Zebra stripes and hover

**What good looks like**
- A row hover state on every data table, so the eye can follow a row (Carbon: "The data table's row hover state should always be enabled").
- Zebra stripes only where rows are wide and dense enough that the eye loses the line.
- One row separator system: stripes, horizontal rules or whitespace alone, never two at once.
- No vertical rules between columns; alignment makes the columns, and the only vertical line marks a group boundary (*Grouping and header hierarchy*).

**How**
- Hover: a subtle background from the colour roles, distinct from the selected state, which is stronger and also carries a checkbox.
- Zebra: when the table has many columns or is read across a wide screen; skip it for narrow tables, where horizontal rules are enough. Carbon offers stripes as an optional modifier.
- Never stripe with a status colour.
- Choosing: whitespace alone for a few columns and few rows, where alignment already holds the line; light horizontal rules for most data tables; stripes for long tables with many columns. Datawrapper: stripe "If you can't avoid many columns", and stripes are "likely unnecessary or even confusing when your table shows data in only a few columns". NN/g lists "light borders, and zebra striping" as aids to scanning without choosing between them ([NN/g, data tables](https://www.nngroup.com/articles/data-tables/)).
- The evidence for stripes is thin: a study of striped and plain tables found "no evidence that zebra striping consistently improves the accuracy or speed of tasks" and none that it hurts; most participants preferred stripes ([Enders, A List Apart](https://alistapart.com/article/zebrastripingdoesithelp/)). Stripes are a preference that costs little, not a fix for a table that is hard to read.
- Hover is never the only way to reveal row actions: touch has no hover (Carbon keeps overflow menus visible on touch).

**Cases**
- Striped rows plus borders plus a hover tint → keep hover and either stripes or borders.
- Row actions that appear only on hover → show them always, subdued, or in an overflow menu that is always visible.
- A selected row that looks like a hovered row → a stronger fill and the checked box.

**Accessibility**
- 1.4.11 Non-text Contrast: a stripe or hover need not meet 3:1 (it is not needed to understand content); a selected-row indicator that carries state does, or the checkbox carries it.
- 1.4.1: selection is not colour alone.

**Build**
- Hover is `tbody tr:hover`; stripes are `tbody tr:nth-child(even)`, switched on by a table attribute (`data-striped`), both from colour tokens (code-standard rule 9, code-standard rule 22).
- Selected is `tr:has(:checked)` (or `[aria-selected="true"]` in a grid), a stronger token than hover ([HTML semantics: *Table behaviour*](../../code/html-semantics.md#table-behaviour)).
- Row actions are always rendered and visible; never `opacity: 0` or `visibility: hidden` until `:hover` ([code accessibility: *Hidden content*](../../code/accessibility.md#hidden-content)).
- Separators are one system: `border-block-end` on cells, or stripes, not both; no `border-inline` between columns.

**Check**
- *Script* could: hover a row and assert a computed background change; flag row actions with `opacity: 0` or `visibility: hidden` until hover.
- *Judgement*: does striping help this table or only decorate it?

**Sources.** Carbon, Datawrapper, NN/g and Enders's study. Datawrapper and Carbon offer stripes for wide tables; Enders found no measured gain. The toolkit allows stripes only where columns are many, and the one-separator and no-vertical-rules rules are commentary.

## Selection and bulk actions

**Use when / don't use**
- Add selection only when there are actions that apply to several rows at once.
- Don't add checkboxes to a table with no bulk actions; a row link opens one record.

**How**
- A checkbox column first; a header checkbox selects all on the page. Row checkboxes have two states; the header has three (none, some, all).
- Selecting shows a bulk action bar in place of the toolbar, with the count ("3 selected") and Cancel; while it is active, per-row actions are disabled ([Carbon](https://carbondesignsystem.com/components/data-table/usage/)).
- Across pages: after "select all on this page", offer "Select all 1,204 results"; say which is in force.
- The bar replaces the toolbar at the same height so the table does not move (design-standard rule 2).
- Destructive bulk actions name the count: "Delete 3 components". Confirm or offer undo by consequence ([interaction: undo or confirmation](../design/interaction.md#undo-or-confirmation)). This section owns bulk selection; other pages link here.
- Clicking a row's checkbox selects; clicking the row's name opens it. One target, one job.

**Cases**
- Selection that survives a filter change silently → clear it on filter change, or keep it and show "3 selected, 1 hidden by filters".
- A bulk bar that pushes the table down by 48px → overlay the toolbar's slot.
- Row actions still active during selection → disable them (Carbon), so it is clear which set an action applies to.

**Accessibility**
- 1.3.1 and 4.1.2: each checkbox is labelled by its row's identifier ("Select Button"), and the header checkbox "Select all rows"; `aria-checked="mixed"` or the native indeterminate state for some.
- 4.1.3: the selected count is announced as it changes.

**Build**
- Native checkboxes in the first column, each labelled by its row header; the header checkbox's mixed state set with the `indeterminate` property ([HTML semantics: *Table behaviour*](../../code/html-semantics.md#table-behaviour)).
- Selected rows are styled from `tr:has(:checked)`; the count ("3 selected") is computed from the checked boxes and written to a status region ([code accessibility: *Live regions and status messages*](../../code/accessibility.md#live-regions-and-status-messages)).
- The bulk bar replaces the toolbar in the same slot: both exist, one `hidden` at a time, so the table does not move (code-standard rule 17; [performance: *Layout stability in code*](../../code/performance.md#layout-stability-in-code)).
- The checkboxes sit in a `form` whose bulk action buttons submit their values, so it works without script (code-standard rule 20).
- Per-row actions during selection take `disabled` or `aria-disabled` on the control itself (code-standard rule 62).

**Check**
- *Script* could: assert each row checkbox has a name containing the row identifier; select a row and assert the table's top does not move.
- *Judgement*: are the bulk actions ones people do?

**Sources.** Carbon's batch-action model; the cross-page select is common practice, labelled commentary.

## Pagination or load more

**Use when / don't use**
- Pagination for tables where people find a specific record, compare, return to a position, or share a link to a page.
- Load more for browsing a homogeneous list without a target; never infinite scroll in a data table.
- Neither for a table that fits: a few hundred rows render fine with a sticky header and a filter.

**How**
- Pagination sits at the bottom of the table ([Carbon](https://carbondesignsystem.com/components/data-table/usage/)), with the range and total ("101 to 150 of 1,204") and the page size.
- Which of pagination, load more and infinite scroll, in general, is [pagination: choosing pagination, load more or infinite scroll](pagination.md#choosing-pagination-load-more-or-infinite-scroll).
- The page and page size live in the address with filters and sort ([ux: state persistence and restore](../design/ux.md#state-persistence-and-restore)).
- Paging does not move the controls; the table keeps its height or grows below (design-standard rule 2).
- Sort and filter apply to the whole data set, never only to the visible page.

**Cases**
- A findings table with infinite scroll → pagination: people return to a position and compare.
- Sorting that sorts only the current 50 rows → sort server-side across all rows.
- A "Load more" in a table people act on in bulk → pagination with cross-page select.

**Accessibility**
- 2.4.3 Focus Order: after "Load more", focus moves to the first new row; after a page change, to the table's caption or first row (code-standard rule 14 for keeping the place).
- 4.1.3: announce "Showing 101 to 150 of 1,204".
- Pagination is a `nav` with a label and `aria-current="page"` on the current page (code-standard rule 64).

**Build**
- Pagination is a `nav` with `aria-label`, a list of links, `aria-current="page"` on the current one (code-standard rule 64); page and page size in the address ([javascript: *State in the address and history*](../../code/javascript.md#state-in-the-address-and-history)).
- "Load more" is a `button` that appends rows and moves focus to the first new row; without script it is a link to the next page (code-standard rule 20; [code accessibility: *Focus management*](../../code/accessibility.md#focus-management)).
- "Showing 101 to 150 of 1,204" lives in a persistent status region (code-standard rule 14).
- The table region keeps a minimum block size while the next page loads ([performance: *Layout stability in code*](../../code/performance.md#layout-stability-in-code)).

**Check**
- *Script* could: change page and assert the address changed and the controls did not move; assert pagination is a labelled `nav` with `aria-current`.
- *Judgement*: does the person look for something specific in this table?

**Sources.** NN/g and Carbon agree.

## Empty and loading tables

**Use when / don't use**
- Every table has a loading state, an empty state of each kind it can meet, and an error state; the kinds and their copy are [feedback: empty states](feedback.md#empty-states), the indicators [feedback: loading](feedback.md#loading). This section adds what is particular to a table.

**How**
- Loading: a skeleton of rows at the table's row height, with the real header, for waits over about a second (Carbon data table: "use skeleton states instead of spinners"). The skeleton's row count fills the space the data will take.
- Empty: replace the table, headers and all; keep the toolbar and filter bar so the person can clear the filter that caused it ([filtering: empty result](filtering.md#empty-result)).
- Hold the table region's height through loading and empty so the page below does not jump (design-standard rule 2).

**Cases**
- An empty grid of headers with no rows → replace it with the empty state.
- "0 results" while the request is pending → the skeleton until the response arrives.
- A filtered-to-nothing table that hides the filter bar → the bar stays; the person needs it to undo.

**Accessibility**
- 4.1.3: "No components match" after filtering is a status message.
- The skeleton is `aria-hidden` and the region carries one loading announcement (Primer [loading](https://primer.style/ui-patterns/loading)).

**Build**
- The skeleton is rows inside the real `table` (or a stand-in block) with `aria-hidden="true"`; the region announces loading once through a status message ([code accessibility: *Live regions and status messages*](../../code/accessibility.md#live-regions-and-status-messages)).
- `aria-busy="true"` on the table region while it loads, removed when rows arrive.
- Empty replaces the `table` with the empty-state component in the same container; the toolbar and filter bar stay outside that container (code-standard rule 12).
- The container's minimum block size holds through loading and empty ([performance: *Layout stability in code*](../../code/performance.md#layout-stability-in-code)).

**Check**
- *Script* could: render the table with zero rows and assert no `thead` without `tbody` rows remains and an action exists; render with a failed fetch and assert no "no results" text.
- *Judgement*: does each empty kind offer the action that fills it?

**Sources.** Carbon.

## Responsive tables

**What good looks like**
- On a narrow screen the table scrolls sideways inside its own container; the page does not.
- The columns that matter most stay visible without scrolling, either by order or by hiding low-priority columns behind a setting.
- A table whose rows are records with few attributes may become stacked rows on a phone.

**How**
- Default: wrap the table in a container with `overflow: auto`, made keyboard-scrollable and named by the caption ([Roselli, under-engineered responsive tables](https://adrianroselli.com/2020/11/under-engineered-responsive-tables.html): `tabindex="0"`, a role and `aria-labelledby`, for 2.1.1, 4.1.2 and 1.4.10). Show that more columns exist: a fade or shadow at the cut edge.
- Priority columns: order columns so the identifier and the decision columns come first; freeze the identifier when scrolling (see *Sticky header*).
- Hiding columns at a breakpoint loses information; do it only where the record's page shows the rest, and say how many columns are hidden.
- Stacked rows (each row becomes a card of label and value) suit tables with few columns read one record at a time. Changing `display` on table elements once stripped table semantics; [Roselli](https://adrianroselli.com/2018/02/tables-css-display-properties-and-aria.html) records that Chrome 80 and Safari 17 fixed most of it, and still advises screen-reader testing. Prefer rendering a list for the stacked form over restyling the table.
- A breakpoint only where the layout changes (code-standard rule 54; the responsive reference).

**Cases**
- A ten-column findings table on a phone → scroll container with the component name frozen; no stacking, because people compare down columns.
- A three-column contact table → stacked rows on a phone.
- A table that widens the page and scrolls the body sideways at 320px → put it in the scroll container: 1.4.10.

**Accessibility**
- 1.4.10 Reflow: a data table is an exception for two-dimensional scrolling, but the scroll belongs to the table's container, not the page.
- 2.1.1: the scroll container is reachable by keyboard.

**Build**
- The scroll container: `<div role="region" aria-labelledby="caption-id" tabindex="0">` around the table, with the overflow rule keyed on those attributes ([responsive: *Tables on small screens*](../../code/responsive.md#tables-on-small-screens)).
- Never change `display` on table elements to stack them; render a list for the narrow form ([HTML semantics: *Tables for data*](../../code/html-semantics.md#tables-for-data)).
- The narrow form switches with a container query on the table's container, not a viewport query, where the table sits in a column ([responsive: *Container queries*](../../code/responsive.md#container-queries)); a breakpoint follows code-standard rule 54.
- The overflow cue is a shadow drawn in CSS on the scroll container (gradients with `background-attachment: local`), never a script measuring widths.

**Check**
- *Script* could: at 320px width, assert the document does not scroll horizontally and each overflowing table's container is focusable and named. tools/ui-check/check.mjs does not measure this yet; code-standard lists reflow as a candidate.
- *Judgement*: will people compare down columns on a phone, or read one record?

**Sources.** Roselli's technique is the default; stacking is commentary where it fits.

## Wide tables and column priority

**What good looks like**
- The columns ranked: identifier first, the columns the task decides on next, detail last; the ranking is in the design's notes.
- A table wider than its container shows the top-ranked columns without scrolling and says that more exist.
- Hidden columns are visible as hidden ([NN/g, data tables](https://www.nngroup.com/articles/data-tables/): "clear visual state indicators should signal to users that some columns are hidden").

**How**
- In order, cheapest first: cut columns (*What earns a column*); shorten them (repeated words to the header, shorter numbers, abbreviations with the full form in the header's accessible name, per [Datawrapper](https://www.datawrapper.de/blog/guide-what-to-consider-when-creating-tables)); transpose when rows are few (Primer); split into several tables (GOV.UK: "organise it into multiple tables or multiple pages"); only then scroll horizontally with the identifier frozen (*Sticky header and first column*). Primer lists the same moves for narrow viewports: width options, "Remove less important columns", "Scroll horizontally".
- Freeze the identifier, not a block of columns: Polaris fixes the first column "because the product names are important to reference", and warns that fixing several must leave the rest visible on small screens ([Polaris DataTable source](https://github.com/Shopify/polaris/blob/main/polaris.shopify.com/content/components/tables/data-table.mdx)).
- Column settings (show, hide, reorder) when people's tasks differ and the default cannot serve all of them; NN/g: "Hiding and reordering columns must be easy to accomplish". The setting belongs to the toolbar and persists per person; past that, it is a data grid's column management ([data-grid: column management](data-grid.md#column-management)).
- Column widths from the content's role: Primer's "Grow" columns take spare room with the widest cell as the minimum; a fixed width only where content is predictable. Widths never come from today's longest value (code-standard rule 57).
- The narrow-screen form is *Responsive tables*.

**Cases**
- An eleven-column audit table scrolled sideways on a laptop, the component name scrolled away → cut the uniform columns to reach six, then freeze the name if it still overflows.
- Two columns headed "Accessibility: contrast" and "Accessibility: focus" → a group header "Accessibility" over "Contrast" and "Focus" (*Grouping and header hierarchy*).
- A column setting with eight columns hidden and no trace in the table → "8 columns hidden" beside the settings button.

**Accessibility**
- 1.4.10: horizontal scrolling stays inside the table's container, which is focusable and named (*Responsive tables*).
- 2.4.11: a frozen column must not cover the focused cell when scrolling sideways by keyboard; `scroll-padding-left` equal to its width.

**Build**
- Column widths are content-based (`table-layout: auto`, `min-inline-size` in `ch` for the identifier), never today's longest value in `px` (code-standard rule 57).
- The frozen identifier is the sticky row header ([HTML semantics: *Table behaviour*](../../code/html-semantics.md#table-behaviour)); `scroll-padding-inline-start` keeps focused cells clear of it.
- A column setting and its "8 columns hidden" indicator are [data-grid: column management](data-grid.md#column-management)'s build.
- Abbreviated headers keep the full form as their accessible name (*Column choice and order*).
- Beyond these, the scroll container is [responsive: *Tables on small screens*](../../code/responsive.md#tables-on-small-screens).

**Check**
- *Script* could: at the design's main width, assert the table does not overflow its container, or that it has a frozen identifier and a visible overflow cue; assert a hidden-columns indicator exists when a column setting hides any.
- *Judgement*: is the scroll the last resort, after cutting, shortening, transposing and splitting?

**Sources.** Primer, Polaris, Datawrapper, GOV.UK and NN/g; the order of the moves is the toolkit's commentary.

## A variant matrix in a tool layout

**Use when / don't use**
- Use when a tool shows every combination of two or more properties at once: a component's variants (one property down, one or more across), states by sizes, themes by modes. Figma suggests organising variants "in rows, columns, or grids" to "communicate their multi-dimensional nature" ([Figma, create and use variants](https://help.figma.com/hc/en-us/articles/360056440594-Create-and-use-variants)); Storybook addons do the same in code ("Show all variants of a component in a grid", [storybook-addon-variants](https://github.com/itaditya/storybook-addon-variants)).
- Don't draw combinations the system cannot produce; an empty cell for an impossible combination says so in text ("Not available"), and an axis with one value is not an axis.
- Past two axes, nest: one axis per header row, or split the matrix into one per value of the outer axis, rather than a single flat header of every combination.

**How**
- **The matrix gets the width; the layout gives way first.** In a tool with panels, the tab that shows the matrix is a full-width tab ([sidebars: object header over a tool layout](sidebars.md#object-header-over-a-tool-layout)); then cut, shorten and split as [wide tables](#wide-tables-and-column-priority) says; scrolling comes last. Atlassian: "we recommend finding ways to simplify the table before opting for a horizontal scroll solution" ([Atlassian dynamic table](https://atlassian.design/components/dynamic-table/examples)).
- **Scroll inside the matrix, never the page.** The matrix scrolls in its own container under a fixed header bar; WCAG's reflow exception covers only "parts of the content which require two-dimensional layout", and "applies to that section" alone ([Understanding 1.4.10](https://www.w3.org/WAI/WCAG21/Understanding/reflow.html)). Atlassian warns horizontal scroll fails "if there isn't enough visual affordance", so show a shadow at the scrolled edge.
- **Both headers sticky.** NN/g: "Freeze header rows and header columns (if the table is larger than the screen)" ([NN/g data tables](https://www.nngroup.com/articles/data-tables/)), since readers "easily forget which column is for which product" ([NN/g comparison tables](https://www.nngroup.com/articles/comparison-tables/)). The pinned column carries a border and a shadow "that appears when there is scroll" ([MUI X column pinning](https://mui.com/x/react-data-grid/column-pinning/)); when it would leave no room, unpin it, as AG Grid does automatically "to make the centre viewport visible again" ([AG Grid column pinning](https://www.ag-grid.com/javascript-data-grid/column-pinning/)).
- **Cells one size, from the tool's scale.** Unlike a data table, where Carbon lets "Column widths… vary by content" ([Carbon data table style](https://carbondesignsystem.com/components/data-table/style/)), a matrix compares like with like: every cell in a column takes one width, every row one height, sized to the largest specimen at its true size, padded by one spacing step, and labelled in the tool's text styles ([visual: one size scale per screen](../design/visual.md#one-size-scale-per-screen)). Never scale specimens down to fit; scroll instead, since the specimen's size is the information.
- **Header labels are the property values,** the property name once in the corner cell or a group header ([grouping and header hierarchy](#grouping-and-header-hierarchy)).

**Cases**
- A variants tab shows 4 sizes by 6 states inside a column squeezed by the inspector → full-width tab; the size names frozen at the start, the state names sticky at the top.
- Cells grow to each specimen, so a column of small buttons sits in a 40px column beside a 120px one → one cell size per column, or for the whole matrix when the specimens are comparable.
- A 3-axis matrix flattens to 24 column headers "Primary / Hover / Small…" → group headers per axis, or one matrix per value of the outer axis.
- Specimens shrunk to 60% so the matrix fits → true size, scroll inside the container.

**Accessibility**
- 1.4.10 Reflow (the scroll stays inside the matrix's region), 2.4.11 Focus Not Obscured (sticky headers never cover the focused cell), 2.1.1 Keyboard (the scroll container is focusable when it holds nothing focusable), 1.3.1 (row and column headers in markup, so each specimen is announced with its two values).

**Build**
- A `table` with `th scope="col"` and `th scope="row"` (axis group headers with `colspan` and `scope="colgroup"`), inside a `div` with `role="region"`, an `aria-label` naming the matrix, `tabindex="0"` and `overflow: auto` ([HTML semantics: *Table behaviour*](../../code/html-semantics.md#table-behaviour); [responsive: *Tables on small screens*](../../code/responsive.md#tables-on-small-screens)).
- Sticky headers as [sticky header and first column](#sticky-header-and-first-column) builds them, with `scroll-padding` on the container equal to both sticky sizes.
- Cell size from tokens (`--matrix-cell-inline`, `--matrix-cell-block`, set per matrix from its largest specimen) with `table-layout: fixed`; specimens at their real size, never `transform: scale` (code-standard rule 22, code-standard rule 38).

**Check**
- *Script* could: assert the page has no horizontal scroll while the matrix container does, the header row and first column stay in view when the container is scrolled to its far corner, every cell in a column has one width, and no specimen carries a scale transform.
- *Judgement*: does the matrix need every axis at once, or would one matrix per value read better?

**Sources.** Figma and storybook-addon-variants for the matrix itself; NN/g, MUI X, AG Grid, Atlassian, Carbon and WCAG for scroll, pinning and cell size. No variant-matrix source speaks to sticky headers or cell size; those come from data-table sources, and the one-size cell is the toolkit's commentary, since a matrix compares specimens rather than values.

## Tables in dialogs and dashboard cards

**Use when / don't use**
- A table belongs in the page's main content. Carbon: "Data tables should be placed in a page’s main content area and given plenty of space to display data without truncation", and "Avoid placing data tables inside data tables or smaller containers where the information can feel cramped or needs truncation" ([Carbon data table](https://carbondesignsystem.com/components/data-table/usage/)).
- In a dialog, a short table that supports one decision (the five items a bulk action will change); a table people sort, page or act on is a page ([dialogs: size and scrolling](dialogs.md#size-and-scrolling)).
- In a dashboard card, a preview of a few rows that answers "what needs attention?", with the full table one link away ([dashboards: summary before detail](../profiles/dashboards.md#summary-before-detail-layout-and-hierarchy)).

**How**
- Dialog: the default or large size; Carbon's modal guidance says "for complex components, like a data table, the default or large modal is more suitable", and lets the table run to the dialog's full width ([Carbon modal](https://carbondesignsystem.com/components/modal/usage/)). The dialog body scrolls with the table's header sticky inside it; never two scrolling regions nested, and never sideways (cut columns instead, *What earns a column*).
- Card: a fixed row count (five is a practical default; commentary), the columns cut to the identifier, the deciding figure and status, no selection, no pagination, no column settings. The card's heading says what the rows are and how they are chosen ("Five oldest open findings").
- "View all" at the card's foot, naming the whole: "View all 42 open findings". It opens the full table already filtered and sorted the way the preview was, so the first rows match ([dashboards: drill-down](../profiles/dashboards.md#drill-down)).
- The preview sorts by the card's purpose and is not re-sortable; sorting a five-row slice of 42 would mislead.
- Width: the table takes the card's width; columns that do not fit are cut, not scrolled. Truncate only text that does not tell rows apart (*Truncation*), and switch to a list when the card is narrow ([responsive: *Container queries*](../../code/responsive.md#container-queries)).
- Fewer rows than the count: show what there is; none: the card's empty state ("No open findings"), not an empty grid of headers (*Empty and loading tables*).

**Cases**
- A dashboard card holding a 40-row, eight-column table with its own scroll → five rows, three columns, "View all 40 open findings".
- A dialog with a paginated, sortable table and bulk actions → a page.
- "View all" that opens the unfiltered list → carry the card's filter and sort in the link.
- A card table scrolling sideways at tablet width → drop to the two deciding columns, or a list, by container query.

**Accessibility**
- 1.3.1: a preview is still a `table` with a caption or `aria-labelledby` to the card heading.
- 2.4.4 Link Purpose: "View all 42 open findings", never "View all" alone when several cards repeat it.
- 2.1.1 and 2.4.11 in a dialog: the scrolling body is reachable by keyboard and the sticky header does not cover the focused row.

**Build**
- The card's table is the same table component with a row limit and no controls as attribute variants (`data-preview`), not a second component (code-standard rule 9); the rows and the total come from the model (code-standard rule 29).
- "View all" is an `a href` carrying the card's filter and sort ([javascript: *State in the address and history*](../../code/javascript.md#state-in-the-address-and-history); code-standard rule 20).
- In a dialog, the body is the scroll container and the header sticks within it ([HTML semantics: *Table behaviour*](../../code/html-semantics.md#table-behaviour)); the narrow form switches on the card's container ([responsive: *Tables on small screens*](../../code/responsive.md#tables-on-small-screens)).

**Check**
- *Script* could: flag a table inside a card or dialog that scrolls horizontally, has pagination, or nests a scroll container inside another; flag a "View all" link without a count or a filter in its address.
- *Judgement*: does the preview answer the card's question in its first rows?

**Sources.** Carbon on placement and modal size; the row count, the non-sortable preview and the "View all" wording are the toolkit's commentary.

## A fixed set of attributes as columns

**Use when / don't use**
- When every row can have the same few attributes from a known, closed set, give each its own column (design-standard rule 8).
- A list in one cell is right only for an open-ended set, such as free tags.

**How**
- One column per attribute, with a mark in each cell: a check for present, a blank for absent (*Cell content and empty cells*), and a word such as "Missing" in the warning role only where absence needs action. The mark carries text or an accessible name; which state to mark is *Status and boolean cells*.
- The column order is fixed by the attribute set, never by which values a row happens to have.
- Each column is sortable and countable; a total in the header or footer when it helps ("Missing in 12").
- When the set grows past what fits, or most columns read the same in every row, the columns obey this rule and still say little: reduce them as *What earns a column* and *Many boolean columns* describe, and keep the full set as columns on the record page or in a matrix view.

**Cases**
- "Usage, Code notes" in one "Missing" cell, sometimes in the other order → two columns, "Usage" and "Code notes", each marked (the evidence behind design-standard rule 8).
- Platform support written as "Web, iOS" → three columns, Web, iOS, Android, with a check or dash.
- User-defined labels → keep a tag list in one cell: the set is open.

**Accessibility**
- 1.3.1: a check icon in a cell has a text equivalent ("Present", "Missing"); an icon alone is code-standard rule 18.
- 1.4.1: "Missing" in warning colour also says "Missing".

**Build**
- The attribute set is a list in the model; the template renders one `th` and one `td` per entry in that order, whatever a row holds (code-standard rule 29).
- Each mark cell is the status cell of *Status and boolean cells*: an `aria-hidden` icon with visually hidden text (code-standard rule 18).
- Totals go in a `tfoot` row, computed in the model.
- An open set, such as tags, is a `ul` inside one cell ([HTML semantics: *Lists, description lists and figures*](../../code/html-semantics.md#lists-description-lists-and-figures)).

**Check**
- *Script* could: flag cells whose text is a comma- or slash-joined list drawn from a small vocabulary that recurs down the column.
- *Judgement*: is the set closed?

**Sources.** design-standard rule 8 rests on the maintainer's ruling; Primer states the same principle: "Don't use a single column to show multiple pieces of data" ([Primer DataTable guidelines](https://primer.style/product/components/data-table/guidelines/)).

## Captions, header cells and scope

**What good looks like**
- Every data table has a caption naming what it shows, used the way a heading is (GOV.UK; [W3C tables tutorial](https://www.w3.org/WAI/tutorials/tables/): a caption "identifies the overall topic of a table").
- Header cells are `th`, data cells `td`; `scope="col"` or `scope="row"` where the direction is not obvious.
- Irregular tables use `colgroup` and `rowgroup` scope, or are simplified.

**How**
- The caption may be visually the table's heading; if the page has a visible heading for it, the caption can repeat it or carry the table's provenance and sort hint (Roselli puts the sort instruction in the caption).
- A row header (`th scope="row"`) for the identifier column, so each cell is announced with its row's name.
- Avoid merged header cells; two header rows are the limit, and a third means splitting the table.
- Provenance for a table of recorded figures: source and date in the caption or directly under it (design-standard rule 1).

**Cases**
- A table under an `h2` "Open findings" with no caption → add `<caption>` (it may be visually hidden if it repeats the heading).
- First-column names in `td` → make them `th scope="row"`.
- A table with three levels of merged headers → split into one table per top-level group.

**Accessibility**
- 1.3.1: header association. 2.4.6: the caption and headers describe their content.
- code-standard rule 1 for the markup.

**Build**
- `caption` as the table's first child; visually hidden only when a visible heading already says the same ([HTML semantics: *Tables for data*](../../code/html-semantics.md#tables-for-data); [code accessibility: *Hidden content*](../../code/accessibility.md#hidden-content)).
- Or `aria-labelledby` on the `table` pointing at the visible heading, when the table has no caption.
- `th scope="col"` in the header row, `th scope="row"` for the identifier; `scope="colgroup"` and `scope="rowgroup"` for groups (*Grouping and header hierarchy*).
- Provenance under the table is a `p` with a `time` element, rendered from the snapshot's date (code-standard rule 29).
- code-standard rule 1: the table reads correctly with no CSS.

**Check**
- *Script* could: assert every `table` has a non-empty `caption` or an `aria-labelledby`, at least one `th`, and `scope` on header cells in tables with both row and column headers.
- *Judgement*: does the caption say what the table is for?

**Sources.** GOV.UK and the W3C tutorial agree.

## Truncation

**Use when / don't use**
- Truncate long text in a cell when the column's width is fixed by the layout and the full value is rarely needed at a glance.
- Never truncate numbers, identifiers people must tell apart, or anything the person compares.

**How**
- Truncate at the end with an ellipsis, one line; or wrap to two lines then truncate (Carbon does this for long column titles).
- The full value is always available, by keyboard as well as pointer ([disclosure: show more and truncation](disclosure.md#show-more-and-truncation)): in the record's page, a tooltip that opens on focus, or a wider column.
- Truncate in CSS (`text-overflow: ellipsis`), so the full text stays in the DOM for search, copy and screen readers. Server-side truncation of the text is logic in the model (code-standard rule 29) and loses the value.
- Truncate the middle for paths and file names where the end is the distinguishing part.
- The width that triggers truncation comes from the column's role, not from today's longest value (code-standard rule 57).

**Cases**
- Component names cut to "Button / Prim…" so three rows look alike → widen the column or truncate in the middle: the distinguishing part is at the end.
- A description column cut with no way to read it → add the tooltip on focus or link to the record.
- A number column showing "1,20…" → never truncate numbers; widen the column or use compact notation with the exact value available.

**Accessibility**
- 1.4.13 Content on Hover or Focus: a tooltip with the full value is dismissible, hoverable and persistent.
- 2.1.1: the full value is reachable by keyboard, so a hover-only `title` attribute is not enough.

**Build**
- `overflow: hidden; text-overflow: ellipsis; white-space: nowrap` on the cell content with a width from the column's role, so the full text stays in the DOM ([HTML semantics: *Table behaviour*](../../code/html-semantics.md#table-behaviour); code-standard rule 29, code-standard rule 57).
- The full value is reachable by keyboard: the identifier links to the record, or a focusable tooltip trigger shows it ([disclosure: show more and truncation](disclosure.md#show-more-and-truncation)); a `title` attribute alone is not enough.
- Middle truncation for paths is two spans, the start truncating and the end kept, with the full text as the accessible name.
- Never on number cells: their columns take `white-space: nowrap` and the width they need.

**Check**
- *Script* could: find cells where `scrollWidth > clientWidth` with ellipsis and assert the full text is in the DOM and reachable by focus or a link; flag truncated numeric cells.
- *Judgement*: does truncation hide what distinguishes rows?

**Sources.** Carbon gives wrap-then-truncate with a tooltip; the focus requirement is W3C's.
