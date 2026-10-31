# Data visualisation: choosing, drawing and reading charts

How an interface turns figures into a chart that says one thing clearly, to everyone: choosing the form by the data's job, or no chart at all; keeping it simple; colour by job; stacked bars, line charts with few points, calendar heatmaps, sparklines and small multiples; axes and labels; hover and focus; narrow screens; accessibility in depth (Chartability, long descriptions and tables, colour-vision deficiency, contrast, keyboard and screen-reader access, touch targets, reduced motion, zoom and reflow, cognitive load); and empty or sparse data. It serves design-standard's principles *honest*, *clear words, clear hierarchy* and *for everyone, in any context*. Formatting the numbers a chart shows, KPI tiles and provenance captions are [data](data.md); how a dashboard composes several charts is [dashboards](../profiles/dashboards.md).

## Choosing a chart by its job

**Use when / don't use**
- Chart when the shape of the data is the message: a trend, a ranking, a distribution, a part of a whole. Use a table when people need exact values or act on rows ([dashboards: tables or charts](../profiles/dashboards.md#tables-or-charts)).
- Write the message first. The Analysis Function: "If you cannot write down the message your chart is giving in a few sentences, you should think again about the chart you have chosen" ([Government Analysis Function, charts](https://analysisfunction.civilservice.gov.uk/policy-store/data-visualisation-charts/)).
- Don't chart a single number. One value, or one value and its change, is a number with its comparison ([data: KPI tiles](data.md#kpi-tiles)); one share of one total is a sentence: Datawrapper says that when "you only need to communicate one share of one total", text may do better than a chart ([Datawrapper, stacked column charts](https://www.datawrapper.de/academy/what-to-consider-when-creating-stacked-column-charts)).

**How**
- Choose by the job the reader must do. The FT's Visual Vocabulary sorts forms by job: magnitude ("Show size comparisons"), change over time, part-to-whole, distribution ("Show values in a dataset and how often they occur"), ranking, deviation, correlation, flow and spatial ([FT Visual Vocabulary](https://github.com/Financial-Times/chart-doctor/tree/main/visual-vocabulary)).

| Job | Chart | Avoid |
|---|---|---|
| Comparison across categories | bar, horizontal when labels are long, sorted | pie, radar |
| Change over time | line, with markers where points are few; bars for a few periods of a count ([line charts and small data](#line-charts-and-small-data)) | bars for many periods |
| Part-to-whole | one bar or a short stacked bar; a pie only with five or fewer categories and one dominant | 3D, donuts of many slices, stacks of many series ([stacked bars](#stacked-bars-and-when-not-to-stack)) |
| Distribution | histogram, box plot | averages alone |
| Relationship | scatter | dual-axis lines |
| A single value | the number and its comparison | a one-bar chart, a gauge |

- NN/g: bar charts "work well" for most comparisons, and "If you want to show a data trend over time, a line chart will work better than a bar chart" ([NN/g, choosing chart types](https://www.nngroup.com/articles/choosing-chart-types/)). Length and position encode quantity best; area and angle poorly ([NN/g, dashboards](https://www.nngroup.com/articles/dashboards-preattentive/)).
- Pies: the Analysis Function allows them only when "there are five categories or fewer" and one dominates; Primer advises "no more than five slices" ([Primer data visualisation](https://primer.style/product/ui-patterns/data-visualization/)); NN/g lists them among types to avoid. The toolkit follows the narrow allowance and prefers a bar.
- Gauges: NN/g says gauges "consume a lot of precious space" and are harder to read than linear graphs. A ratio against a limit is a single bar against 100%, or the number.
- Declare whether the screen is operational or analytical ([dashboards: operational or analytical](../profiles/dashboards.md#operational-or-analytical)): it decides how much each chart shows and how interactive it is.

**Cases**
- A pie of twelve component categories → a sorted horizontal bar chart.
- Monthly findings over two years as bars → a line.
- Two measures with different units on one chart with two y-axes → two charts sharing the x-axis ([simplicity](#simplicity)).
- A gauge for "68% coverage" → a single bar against 100%, or a number with its comparison: a gauge encodes by angle.
- A chart with one bar for "Open findings: 48" → the number, with its change since the last audit.

**Accessibility**
- 1.1.1 Non-text Content: every chart has a text alternative stating its message, and its data in a table ([long descriptions and data tables](#long-descriptions-and-data-tables)).
- A number in text needs no alternative at all: choosing no chart is often the most accessible choice.

**Build**
- The chart type is a property of the chart's data and message, chosen in the model or the page's configuration, not in the template (code-standard rule 29).
- Two measures with different units are two `figure`s sharing an x-axis scale, never one SVG with two value axes.
- Whatever the type, the markup is the same: a `figure` with a summary sentence naming the message, the graphic and its table ([html-semantics: *Charts in markup*](../../code/html-semantics.md#charts-in-markup)).
- A chart library loads only on pages that draw a chart ([performance: *JavaScript delivery*](../../code/performance.md#javascript-delivery)); a bar chart of a few values is often a few `rect`s in server-rendered SVG, or a styled table, with no library at all.

**Check**
- *Script* could: flag pie or donut charts with more than five segments, any 3D chart, any chart with two value axes, and a chart drawn from fewer than two values.
- *Judgement*: can the message be written in a sentence, and does the chart type serve it? Would a number or a table say it better?

**Sources.** NN/g, the Analysis Function and the FT agree on bars for comparison and lines for time; they differ on pies, and the toolkit takes the stricter reading with Primer's five-slice cap as the ceiling.

## Simplicity

**What good looks like**
- One message per chart, stated in its title or summary.
- The fewest marks that carry the message: one colour by default, grey for context, colour only for what the message is about.
- Direct labels in place of a legend; one value axis; no 3D, shadows, shaded backgrounds or decoration.

**How**
- Keep it simple. The Analysis Function: "We advise to keep charts as simple as possible", avoiding shaded backgrounds, unnecessary borders, patterns, shadows, thick or dark gridlines and "3D shapes". Carbon asks that anything that could distract from reading the data come out ([Carbon dashboards](https://carbondesignsystem.com/data-visualization/dashboards/)).
- One colour by default. Atlassian: "Use a single color as the default for data visualizations. Only add more colors when needing to differentiate between data categories" ([Atlassian data visualisation colour](https://atlassian.design/foundations/color/data-visualization-color)). Storytelling with Data: "A good way to start is with shades of grey and then use color only where you want your audience to focus" ([SWD, apply colour thoughtfully](https://www.storytellingwithdata.com/blog/apply-color-thoughtfully-in-your-graphs)).
- One message per chart. Two questions are two charts, or one chart and a sentence. A chart that needs a paragraph to read is doing two jobs.
- Direct labels over legends. Carbon: "When possible, avoid using a legend and label data representations directly"; "Only use a legend if you can't safely assume there will be enough space to apply labels directly" ([Carbon legends](https://carbondesignsystem.com/data-visualization/legends/)). The Analysis Function says legends should be avoided "unless necessary", since they rely on colour to match label to data. Datawrapper: "Place the words that explain your chart elements as close to those elements as possible" ([Datawrapper, text in data visualisations](https://www.datawrapper.de/blog/text-in-data-visualizations)).
- No dual axes. The Analysis Function: "we do not recommend using dual axis charts"; Datawrapper: their scales "are arbitrary and can therefore (deliberately) mislead readers", and it offers side-by-side charts, an indexed chart, or showing one series and annotating the other ([Datawrapper, dual-axis charts](https://www.datawrapper.de/blog/dualaxis)).
- No 3D: it makes a chart "much more difficult to interpret quickly and accurately" (NN/g, dashboards).
- Lead with the point: Datawrapper's "Give the main statement first and the precise data explanation later" applies to a chart's title and summary.
- Label selectively: the endpoint, the extreme, the one series the message is about; a value on every point goes unread.
- Tufte's data-ink argument is the usual authority here, but it lives in his books; no page of his opened for this section states it, so it is not cited.

**Cases**
- A bar chart in six colours, one per bar, for one measure → one colour for every bar; the axis already names the categories.
- Two lines on two y-axes that seem to cross at a meaningful moment → two charts on a shared x-axis, or both indexed to 100 at the start.
- A chart with a legend box naming its only series → drop the box; the title says what is plotted.
- A findings card with an open-count line and, beside it, a separate filed-and-closed bar chart, read as too complex → choose the question. If it is "is the backlog shrinking?", keep the open-count line, lead with the number and its change, and put filed and closed per period in the hover detail and the table ([line charts and small data](#line-charts-and-small-data)). If filed against closed is the question, it gets the chart and the open count becomes the number above it.

**Accessibility**
- Fewer marks and direct labels help everyone, and help most the readers with low vision, cognitive disabilities or colour-vision deficiency; direct labels also meet 1.4.1 and relieve 1.4.11 (see [long descriptions and data tables](#long-descriptions-and-data-tables)).
- Chartability's critical heuristic "No explanation for purpose or for how to read": "Chart should explain its purpose and how to read, use, and interpret it" ([Chartability heuristics](https://chartability.github.io/POUR-CAF/)).

**Build**
- Defaults are the simple form: one series colour, grey context, no legend component unless labels cannot fit; a chart adds colour or a legend by an attribute, never by a fresh style (code-standard rule 9, code-standard rule 22).
- Decoration does not exist to remove: no `filter` shadows, gradients or background fills on the plot in the chart component (code-standard rule 5).
- Direct labels are SVG `text` positioned from the data in the scale function, so they follow the data (code-standard rule 57).

**Check**
- *Script* could: count colours, series and value axes per chart; flag a legend on a single-series chart; flag shadows, gradients and 3D transforms inside a chart.
- *Judgement*: what is this chart's one message, and is every mark serving it?

**Sources.** The Analysis Function, Carbon, Atlassian, Datawrapper and SWD agree on simplicity, grey context and direct labels. Carbon keeps a legend where labels will not fit; the toolkit does the same.

## Colour by job

**What good looks like**
- Each colour does one job: identity (categorical), order (ordinal), magnitude (sequential), polarity (diverging), or state (status).
- Categorical colours in their palette's published order, pinned to a series on every chart of a screen.
- A palette validated for contrast and colour-vision deficiency, in each theme, with dark mode as its own palette.

**How**
- **Categorical** for unrelated categories, applied "in sequence strictly"; the order maximises contrast between neighbours ([Carbon colour palettes](https://carbondesignsystem.com/data-visualization/color-palettes/)). Atlassian says to follow its numbered sequence so each colour "is visually distinct from its neighbors across all color deficiencies". Pin each series to its colour so a filter does not reshuffle colours, and keep the same series in the same colour on every chart of a dashboard (Carbon dashboards: "Always use consistent colors for each data set within a dashboard"; [dashboards: colour and legends across charts](../profiles/dashboards.md#colour-and-legends-across-charts)).
- **How many**: the Analysis Function recommends "a limit of four categories" ([Analysis Function, colours in charts](https://analysisfunction.civilservice.gov.uk/policy-store/data-visualisation-colours-in-charts/)); ONS "five colours or fewer" and "Never use more than nine" ([ONS, using colours in charts](https://service-manual.ons.gov.uk/data-visualisation/colours/using-colours-in-charts)); Atlassian 5–6; Datawrapper "If you need more than seven colors in a chart, consider using another chart type" ([Datawrapper, choosing colours](https://www.datawrapper.de/academy/what-to-consider-when-choosing-colors-for-data-visualization)). The toolkit aims at four and stops at six: past it, group the tail into "Other", facet into small multiples, or use a table. Never generate more hues.
- **Ordinal** for categories with an order (severity, size tiers, stages): ONS asks for "colours on a scale" for categories with an order. A one-hue ramp shows the order; Datawrapper warns the reverse too: "Don't use a gradient color palette for categories and the other way round", since shades of one hue imply a ranking.
- **Sequential** for magnitude, one hue, darkest for the largest in a light theme; Carbon: "In dark themes, the lightest color denotes the largest values". **Diverging** only when the data has a meaningful midpoint, two hues read as opposite with a neutral middle.
- **Emphasis**: one series in the accent, the rest grey. Atlassian uses its neutral chart colour "for the less important data when you want other data to stand out"; Datawrapper: grey for less important elements, highlight colours "reserved for your most important data points".
- **Status** colours (error, warning, success) colour a series only when the series is that status. Atlassian warns status colours "may be hard for users with color deficiencies to tell apart" and asks for other visual indicators; Carbon reserves red for danger and green for success.
- **Contrast and colour-vision deficiency**: marks reach 3:1 against the surface; the Analysis Function's categorical palette has every colour, and every adjacent pair in order, at 3:1 against white, and its sequential palette has only its three darkest blues at 3:1. Validate any palette by computation in each theme, never by eye.
- **Dark mode is its own palette**, redefined per theme from the colour roles and validated separately; Carbon ships light and dark variants. The Analysis Function's palettes are "designed to be used with a white background", so they do not carry over to a dark theme.

**Cases**
- An activity card stacks five snapshot days of Breaking, Minor and Patch in three orange shades, and reads as one muddy colour → the ramp is right for ordinal data but fails at that size: run through the dataviz validator, an illustrative orange ramp (`#c2410c`, `#ea580c`, `#fb923c`) passes its ordinal checks yet its closest neighbours sit at ΔE 9.5 under normal vision, under the categorical floor of 15, and its light end is 2.2:1 on white. When the message is "were there breaking changes?", Breaking takes the one accent and Minor and Patch one grey, with the counts as text; otherwise the counts per day are a short table ([stacked bars](#stacked-bars-and-when-not-to-stack)).
- A filter removes the second series and every remaining line changes colour → pin colours to series, not positions.
- Red and green bars for "this year" and "last year" → categorical colours; red and green carry status meaning and fail for colour-blind readers.
- A heatmap uses the categorical palette for magnitudes → a sequential palette.
- The light theme's palette reused on the dark surface, where its darkest step vanishes → a dark palette, validated on the dark surface.

**Accessibility**
- 1.4.11 Non-text Contrast: parts of graphics required to understand the content need 3:1 against adjacent colours; W3C: "The lines should have 3:1 contrast against their background", unless the same information is in labels or "a table that follows the graph" ([W3C Understanding 1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)). Primer: "All chart marks ... must meet a 3:1 contrast ratio against the background".
- 1.4.1 Use of Color: series are told apart by label, position, line style or marker as well as colour. Chartability: "Color must not be the only channel for conveying meaningful or essential information".
- Text never wears a light data colour; labels use text tokens at 4.5:1 (Primer: "Axis labels must have a 4.5:1 contrast against the background").

**Build**
- Colour pinned to a series by attribute: `data-series="errors"` mapped once to the categorical palette's custom properties, so a filter cannot reshuffle colours (code-standard rule 6, code-standard rule 22; [html-semantics: *Charts in markup*](../../code/html-semantics.md#charts-in-markup)).
- The palette is a token set redefined per theme; marks read `var(--series)`, axes `currentColor` (code-standard rule 53, [tokens: *Themes and modes*](../../code/tokens.md#themes-and-modes)). A data-visualisation collection bound directly is a project's stated exception ([tokens: *Three tiers*](../../code/tokens.md#three-tiers)).
- Ordinal and sequential steps are `data-level` values set from the model's thresholds, mapped to a ramp of tokens; emphasis is `data-emphasis` on the one series, everything else the neutral token (code-standard rule 9).
- Series are told apart by more than colour: `stroke-dasharray` or a marker shape per series, set by the same `data-series` rule; texture only on request, print or `forced-colors` ([accessibility: *Reduced motion and colour scheme in code*](../../code/accessibility.md#reduced-motion-and-colour-scheme-in-code)).

**Check**
- *Script*: validate each palette per theme with the `dataviz` skill's `scripts/validate_palette.js` ([colour-vision deficiency](#colour-vision-deficiency) gives its checks and flags). A script could also read series colours on a page and assert they follow the palette order and stay pinned across charts, and count colours per chart.
- *Judgement*: which job is each colour doing, and does colour point at the message with everything else grey?

**Sources.** Carbon, Atlassian, the Analysis Function, ONS and Datawrapper agree on fixed order, few colours, grey for context and status reserved; they differ on the count (four to seven), and the toolkit takes four as the aim and six as the stop. The Analysis Function's palette is white-background only; Carbon's light and dark variants are the model for dark mode.

## Stacked bars and when not to stack

**Use when / don't use**
- Stack when the total matters and the reader compares one part across bars: the part on the baseline.
- Don't stack to compare every part across bars: NN/g says "stacked bar charts are in fact very hard to understand", since only segments on the same baseline compare easily, and offers a series of separate bar charts instead (NN/g, choosing chart types).

**How**
- Few series. The Analysis Function: "Aim for a maximum of four categories within each stack"; the FT's stacked column is "difficult to read with more than a few components" (FT Visual Vocabulary). Two or three is better.
- The series that matters on the baseline. Datawrapper: "Bring the most important value to the bottom of the chart" ([Datawrapper, stacked column charts](https://www.datawrapper.de/academy/what-to-consider-when-creating-stacked-column-charts)); SWD: "it's hard to compare the subcomponents across categories that aren't aligned to the same baseline" ([SWD, what is a bar chart](https://www.storytellingwithdata.com/blog/2020/2/19/what-is-a-bar-chart)), and its readers recommend "putting the piece of most interest at the baseline" ([SWD, use cases for stacked bars](https://www.storytellingwithdata.com/blog/2017/11/22/use-cases-for-stacked-bars)).
- Or highlight one series against grey: SWD's example keeps one part "in blue and the rest of the bar coloured grey".
- Alternatives (Datawrapper): to compare the same parts across totals, split bars or small multiples; if the total does not matter over time, a line chart; if only one total's parts matter, a bar chart; for one share of one total, text.
- Segments separated by a thin gap in the surface colour, not an outline; labels inside a segment only when they fit with padding.

**Cases**
- The activity card of five snapshot days in three orange shades → five days do not need a stacked chart: the counts per day as a short table or a line of text ("2 breaking, 5 minor, 11 patch on 9 Oct"), or Breaking alone in the accent on the baseline with Minor and Patch grey above it.
- Six release types stacked per month → the two the reader acts on, the rest as "Other", or small multiples.
- A stack where the series that matters sits third → move it to the baseline.

**Accessibility**
- Adjacent segments need 3:1 against each other or direct labels or the table (1.4.11); a gap between segments helps the eye but is not a substitute.
- Values are in the table; a segment too small to label carries its value in the hover detail and the table, never only in the tooltip.

**Build**
- Segment order comes from the series' declared order in the model, the important series first (on the baseline), not from the data's order (code-standard rule 29).
- The gap is a stroke in the surface token, the same width for every segment (code-standard rule 22).
- A segment label is drawn only when the measured text fits the segment; no `overflow: hidden` crop (code-standard rule 57).

**Check**
- *Script* could: count series per stack (flag over four); flag adjacent segments under 3:1 with no direct labels; check the emphasised series is the first in the stack.
- *Judgement*: does the reader compare the totals or one part? If neither, why stack?

**Sources.** NN/g, the FT, the Analysis Function, Datawrapper and SWD agree: few series, the important one on the baseline, or another form. NN/g would rarely stack at all; the toolkit stacks only for a total with one part that matters.

## Line charts and small data

**Use when / don't use**
- A line for a trend over many regular periods, or several series compared over time.
- Bars for a few periods of a count, and numbers for fewer still: ONS says "Column charts may be more suitable than line charts when you want to highlight individual data points or when you have only a few data points" ([ONS, column chart](https://service-manual.ons.gov.uk/data-visualisation/chart-types/column-chart)).

**How**
- Stock or flow. A level at a moment (open findings) is a line; a count within each period (findings filed this week) is flow: ONS, "Consider using a column chart instead of a line chart when displaying flow data".
- Few points. With five to ten points, prefer bars for a count, or a line with a marker on every point: ONS says to avoid markers "unless" there is "a small number of data points" ([ONS, line chart](https://service-manual.ons.gov.uk/data-visualisation/chart-types/line-chart)); NN/g asks for markers to show when data was collected. Under five points, the numbers themselves, or the latest number and its change, usually say more than a chart (the five-point threshold is the toolkit's commentary).
- Irregular intervals: a line, spaced by real time, not evenly spaced bars (ONS).
- Number of lines: the Analysis Function finds more than four "often results in the chart becoming too cluttered"; ONS suggests a small multiple line chart for an overcrowded chart.
- The Analysis Function adds that bars "can be useful for showing time series when there is one series of data"; more than one series is a line.
- A gap in the data is a break in the line, never a drop to zero ([empty and sparse data](#empty-and-sparse-data)).

**Cases**
- Five weekly snapshots drawn as a smooth line implying values between them → bars per snapshot, or a line with markers and the dates on the axis.
- Three audits shown as a line → "48 open, down from 60 and 72"; a chart of three points is a sentence.
- The findings card with an open-count line beside a filed-and-closed bar chart → the open count (stock) as one line with markers, filed and closed (flow) in the hover detail and the table, unless filed against closed is the message ([simplicity](#simplicity)).

**Accessibility**
- Markers help low-vision readers find the data points, and give the keyboard something to land on when points are focusable ([hover and focus detail](#hover-and-focus-detail)).
- 1.4.11: the line reaches 3:1 against the surface; markers do too.

**Build**
- The x scale is a time scale from the data's dates, so uneven intervals are spaced truly; never an index scale for dates (code-standard rule 57).
- Markers are drawn when the point count is under a threshold set beside the chart's configuration, not per chart by hand.
- Missing values are `null` in the series and the path is split at them (`d` with a new `M`), never coerced to `0` (code-standard rule 12).

**Check**
- *Script* could: flag a line chart with fewer than five points and no markers; flag a line drawn over a count per period; flag a path that drops to zero where the series is missing.
- *Judgement*: stock or flow? Would the numbers alone say it?

**Sources.** ONS, NN/g and the Analysis Function agree; the five-point floor for a chart is the toolkit's commentary.

## Calendar heatmaps

**Use when / don't use**
- Use when the question is when work happens and where the gaps are, over many days: the FT calls it "A great way of showing temporal patterns (daily, weekly, monthly) – at the expense of showing precision in quantity" (FT Visual Vocabulary).
- Don't use for a trend (a line), for exact counts (a table), or for sparse data: a year grid with a handful of active days is mostly empty cells.

**How**
- The anatomy, the sequential scale and the feed beside it are [dashboards: timelines and activity](../profiles/dashboards.md#timelines-and-activity); this section adds when the form works.
- Dense enough to show a pattern: if most days have an event, the grid shows rhythm; if a few dozen days in a year do, a list of those days with their counts says more (the threshold is the toolkit's commentary).
- Sparse data: show only the period with data (the last eight weeks, not the year), or a strip of dates, or a list.
- A sequential single-hue scale of four or five steps, boundaries from the data's spread; an empty day distinct from a day with no data ([data: numbers](data.md#numbers)).

**Cases**
- A year heatmap with five active days → a list of the five days, each with its counts and a link.
- A heatmap's darkest step is "5+" and half the year is dark → derive the steps from the year's spread.
- A day with no snapshot looks like a quiet day → "not recorded", outlined differently.

**Accessibility**
- Colour carries magnitude, which NN/g warns against ("color should not be used to communicate information about quantitative values or magnitude"); the count is in each cell's text and in the table, so no figure depends on a shade.
- Cells are not 365 tab stops ([dashboards: timelines and activity](../profiles/dashboards.md#timelines-and-activity)).

**Build**
- As in [dashboards: timelines and activity](../profiles/dashboards.md#timelines-and-activity): an `svg role="img"` named by its summary, `data-level` per cell from the model's thresholds, a table of the days; the range shown is computed from the data's first and last day (code-standard rule 29, code-standard rule 57).

**Check**
- *Script* could: compute the share of days with data and flag a heatmap under a density threshold; check each cell has a count in text.
- *Judgement*: is the pattern of gaps the question, or would a list or a line answer it?

**Sources.** The FT for when it works; Carbon and NN/g on its colour, as in the dashboards page. The density threshold is the toolkit's commentary.

## Axes, gridlines, labels and number formats

**What good looks like**
- One value axis, starting at zero for bars, with clean round ticks.
- Light, few gridlines; axis titles carry units; category labels horizontal.
- Numbers on labels and ticks formatted like the rest of the page.

**How**
- Zero. Carbon: "Always start numerical axes at zero for part-to-whole and comparisons charts, such as bar and area chart"; "Line charts and scatter plots are less sensitive to this distortion" ([Carbon axes and labels](https://carbondesignsystem.com/data-visualization/axes-and-labels/)). The Analysis Function: breaking the numerical axis on a bar chart distorts its proportions; a line may start above zero when the change is the message, clearly marked.
- Ticks. Carbon: "Never change axis ticks increments to accommodate data availability". Round to clean numbers in the locale's format (0, 1,000, 2,000).
- Gridlines. The Analysis Function: "generally, we advise a maximum of ten", light grey, not dark or thick. Solid hairlines; dashed lines read as thresholds.
- Labels. Carbon: "Use clear, easy-to-understand descriptors and metrics to label charts and axes"; in time series the x-axis labels "reflect the time increment in the data". Primer: "By default you should label all axes of a chart". Units in the axis title; values on bars where they fit; no rotated category labels (switch to horizontal bars).
- Number formats are [data: numbers](data.md#numbers): the same formatter, precision and unit as the table beside the chart; compact notation ("1.2k") on ticks only where space forces it.
- Dates on the axis follow [data: dates and times](data.md#dates-and-times).

**Cases**
- A bar chart whose y-axis starts at 80 → start at zero.
- Ticks at 0, 13, 26, 39 → 0, 10, 20, 30, 40.
- Category labels rotated 45° → horizontal bars.
- An axis with no unit and a table beside it in "k" → one unit and format in both.

**Accessibility**
- 1.4.3: axis and label text at 4.5:1; Chartability's "Small text size": "Text (any) must not be smaller than 9pt/12px in size".
- Gridlines are context and need no 3:1; a reference line that carries meaning does.

**Build**
- Bars start at zero in the scale function, not by hand per chart (code-standard rule 57); ticks come from the scale's nice-rounding, formatted by the page's `Intl.NumberFormat` ([i18n: *Numbers, dates, plurals and lists*](../../code/i18n.md#numbers-dates-plurals-and-lists)).
- Axes and ticks are SVG `text` sized in rem so they zoom; colour `currentColor` from a text token; gridlines a border token (code-standard rule 22, code-standard rule 54).

**Check**
- *Script* could: flag a bar chart whose value axis does not include zero; count gridlines; flag rotated text in an axis; compare tick formatting with the table's.
- *Judgement*: does a reader know the unit and the period without hunting?

**Sources.** Carbon, the Analysis Function and Primer agree; Chartability supplies the minimum text size.

## Hover and focus detail

**What good looks like**
- Detail on hover and on focus, the same content: the values at that point on both axes, every series at that x.
- A thin guide line at the point, and the tooltip beside it, inside the plot area; nothing laid over the chart's data, title or legend.
- Nothing only in the tooltip: every value is also in a label or the table.

**How**
- Content. Carbon: "A tooltip should repeat the corresponding values of the data point on both axes and any other relevant details" ([Carbon chart anatomy](https://carbondesignsystem.com/data-visualization/chart-anatomy/)). A shared tooltip "displays information for all series at a specific x-axis value" ([Highcharts tooltip](https://www.highcharts.com/docs/chart-concepts/tooltip)); Primer allows one category or all.
- A guide line, never a band. Highcharts' crosshair draws "a line connecting the points with their corresponding axis". A hairline at the hovered x marks the point; a filled column over the plot hides the data the reader is looking at.
- Beside the point. NN/g: "Test your tooltip positioning to ensure that the content does not block other information pertinent to the user's goal" ([NN/g, tooltip guidelines](https://www.nngroup.com/articles/tooltip-guidelines/)). Place it next to the point, flipped to the other side near an edge, kept inside the plot so it never covers the title, the legend or the summary.
- Keyboard. Chartability: "If chart is interactive with a mouse ... it must also be made interactive for use with a keyboard", and "Focusing should mirror hovering, selecting (enter or spacebar) should mirror clicks". One tab stop into the chart, arrow keys between points.
- Touch. NN/g: hover tooltips "can be used only on devices with a mouse or keyboard". Tap a point to show its detail, tap elsewhere to dismiss; the hit area is larger than the mark ([responsive: *Touch targets*](../../code/responsive.md#touch-targets)).
- Tooltips enhance, never gate: the values are in direct labels or the table.
- Legend hover may dim other series (Carbon lowers them "to 30 percent"); it is an aid, never the only way to isolate a series.

**Cases**
- A hover drew a grey band over the line, hiding the stretch of line being read, and the tooltip covered the chart's title → a hairline guide line at the point, a marker on the line, the tooltip beside the point and kept inside the plot.
- Detail only on mouse hover → the same detail on focus, with arrow keys between points, and on tap.
- A value readable only by hovering a tiny segment → the value in the table, the tooltip as a shortcut.

**Accessibility**
- 1.4.13 Content on Hover or Focus: dismissible ("without moving pointer hover or keyboard focus", Escape), hoverable ("the pointer can be moved over the additional content without the additional content disappearing") and persistent ([W3C Understanding 1.4.13](https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html)). A tooltip that does not obscure other content is exempt from dismissal, which is one more reason to place it beside the point.
- 2.1.1 Keyboard and 2.4.7 Focus Visible: the focused point is visibly marked at 3:1.
- Tooltip text at 4.5:1; announced through the focused point's name, not a live region on every move.

**Build**
- The tooltip and guide line are one component, positioned from the point's coordinates and clamped to the plot's box; detail on hover and focus comes from one handler (code-standard rule 36; [accessibility: *Tooltips and toggletips*](../../code/accessibility.md#tooltips-and-toggletips), [dialogs: tooltips](dialogs.md#tooltips)).
- Focusable points use a roving tabindex: one tab stop, arrow keys move, each point's accessible name holds its values ([accessibility: *Composite widgets and roving tabindex*](../../code/accessibility.md#composite-widgets-and-roving-tabindex)); the focus ring is the shared one ([accessibility: *Visible focus*](../../code/accessibility.md#visible-focus)).
- Escape dismisses; the tooltip is `pointer-events` reachable so the pointer can enter it.
- Labels inserted with `textContent`, never `innerHTML` ([javascript: *Escaping and templating safely*](../../code/javascript.md#escaping-and-templating-safely)).
- Without script, no tooltip and the table carries the values (code-standard rule 20).

**Check**
- *Script* could: hover and focus each point and assert the tooltip's box lies inside the plot and does not intersect the title, legend or summary; assert focus produces the same content as hover; assert Escape dismisses; flag a guide element wider than a hairline.
- *Judgement*: while hovering, can the reader still see the line they are reading?

**Sources.** Carbon, Highcharts and Primer on content; NN/g and W3C on placement and dismissal; Chartability on keyboard parity. None of them names the band-over-the-chart failure; the guide-line rule is the toolkit's reading of NN/g's "does not block".

## Responsive charts

**What good looks like**
- A chart that stays legible at every width: text at reading size, fewer ticks, labels that still fit, or the table instead.
- Height that holds the plot and the axis band, with no nested scroll.

**How**
- Text does not shrink with the chart: an SVG scaled by `viewBox` scales its text too, so ticks and labels are drawn at a fixed rem size and the chart re-lays them at each width. Chartability's 12px floor applies at the narrowest width.
- Fewer ticks and labels as width falls; long category labels mean horizontal bars, which suit narrow screens.
- Direct labels may give way to a legend when there is no room: Datawrapper's line charts "switch from direct labeling to legend-based labeling" on mobile ([Datawrapper, mobile-first](https://www.datawrapper.de/blog/datawrapper-becomes-mobile-first-charting-tool/)).
- A chart that cannot be read at the width switches to its table ([dashboards: tables or charts](../profiles/dashboards.md#tables-or-charts)).
- Size by the container, not the viewport: a chart in a card responds to the card.
- Zoom and text size: [zoom and reflow of charts](#zoom-and-reflow-of-charts).

**Cases**
- Tick labels at 7px on a phone because the SVG scaled down → fixed-size text, fewer ticks.
- A chart's card at a fixed height that cuts off the x-axis labels and scrolls inside → size it to the plot and the axis band.
- Twelve end labels colliding on a narrow screen → a legend, or the table.

**Accessibility**
- 1.4.4 Resize Text and 1.4.10 Reflow: chart text scales with the reader's settings; the page reflows around the chart.
- Touch targets for points and legend toggles: [touch targets for points](#touch-targets-for-points).

**Build**
- The chart re-renders from its container's width (`ResizeObserver`) or switches form by a container query ([responsive: *Container queries*](../../code/responsive.md#container-queries)); breakpoints from the shared set (code-standard rule 54).
- Text in rem, never scaled by the `viewBox`; tick count derived from the available width, not fixed (code-standard rule 57).
- The container's height includes the axis band; no fixed height that clips ([responsive: *Zoom and reflow*](../../code/responsive.md#zoom-and-reflow)).

**Check**
- *Script* could: render at 320px and the widest breakpoint, measure the smallest chart text (flag under 12px), detect label overlap, and flag a scroll container inside a chart card.
- *Judgement*: at the narrowest width, would the table serve better?

**Sources.** Chartability, Datawrapper and W3C. Datawrapper is a vendor describing its own defaults, labelled as such.

## Chartability's principles and heuristics

**What good looks like**
- Every chart is audited against Chartability before it ships, starting with its critical heuristics.
- A failure is fixed in the chart's component, so every chart that uses it passes.

**How**
- Chartability is "a set of heuristics (testable questions) for ensuring that data visualizations, systems, and interfaces are accessible", organised as "Perceivable, Operable, Understandable, and Robust (POUR)" plus "Compromising, Assistive, Flexible (CAF)" ([Chartability](https://chartability.fizz.studio/)). It has 50 heuristics and a quick-start set of 14.
- The critical heuristics most charts fail, as written in the heuristics list ([Chartability heuristics](https://chartability.github.io/POUR-CAF/)):
  - "Low contrast": "Geometries and large text must have >3:1 contrast against background, Regular text must have >4.5:1" ([contrast of marks and text](#contrast-of-marks-and-text)).
  - "Small text size": "Text (any) must not be smaller than 9pt/12px in size".
  - "Interaction modality only has one input type": "If chart is interactive with a mouse ... it must also be made interactive for use with a keyboard" ([keyboard and screen-reader access to points](#keyboard-and-screen-reader-access-to-points)).
  - "No table": "A table must be provided that contains a human-readable version of the data the chart is based on" ([long descriptions and data tables](#long-descriptions-and-data-tables)).
  - "No title, summary, or caption" and "No explanation for purpose or for how to read" ([cognitive load](#cognitive-load)).
- Others that bite in product charts: "Color is used alone to communicate meaning" ([colour-vision deficiency](#colour-vision-deficiency)); "Inappropriate tab stops"; "Zoom and reflow are not supported" ([zoom and reflow of charts](#zoom-and-reflow-of-charts)); "Changes are not easy to follow" ([reduced motion in charts](#reduced-motion-in-charts)).
- Chartability goes past WCAG (its CAF principles ask, for example, whether a reader can explain the chart); the toolkit treats WCAG failures as defects and the rest as review questions.

**Cases**
- A dashboard ships six charts with 10px tick labels → one change to the chart component's text size fixes all six.
- A chart passes WCAG contrast but has no summary and no table → two critical Chartability failures; add both.

**Accessibility**
- Chartability maps onto WCAG 2.2: 1.1.1 (summary, table), 1.4.1 (colour alone), 1.4.3 and 1.4.11 (contrast), 2.1.1 (keyboard), 1.4.10 (reflow), 2.3.3 (motion).

**Build**
- Each critical heuristic is satisfied once in the shared chart component: text sizes from type tokens at 12px or more, a required `summary` and `table` input, keyboard handling with hover parity (code-standard rule 36, code-standard rule 22).
- A chart without a summary or data does not render, rather than rendering inaccessibly (code-standard rule 12).

**Check**
- *Script* could: run the measurable heuristics on every chart (text size, mark and text contrast, a table present, a non-generic name, keyboard reachability of interactive points).
- *Judgement*: walk Chartability's critical heuristics with a keyboard and a screen reader on each new chart form.

**Sources.** Chartability's site and heuristics list, both opened; Chartability is a community framework, not a standard, and the toolkit reads it as a checklist over WCAG.

## Long descriptions and data tables

**Use when / don't use**
- Every chart. A chart whose values someone might need has its data available as a table.
- A sparkline beside a number may rely on the number and its comparison as its alternative.

**How**
- Two-part alternative. W3C: for complex images "a two-part text alternative is required": a short description "to identify the image", and a long description, "a textual representation of the essential information conveyed by the image", which for a chart can be "presented as headings, text, and a table" ([W3C complex images](https://www.w3.org/WAI/tutorials/images/complex/)).
- The short alternative states the message ("Open findings fell from 120 to 48 between June and October"), not "Chart of findings".
- The long description is in the page, not in an attribute: through `aria-describedby` the W3C notes "this approach only works for long descriptions that are text-only", so a table never lives there.
- The table. The Analysis Function: "If you expect a non-disabled user to read the data from the chart, give a table"; the text alternative can be "a table of the data presented in the chart" ([Government Analysis Function, charts](https://analysisfunction.civilservice.gov.uk/policy-store/data-visualisation-charts/)). Place it beside the chart in a disclosure ("Show data"), or as a tab of the same region; never only as a download.
- The table follows the table patterns: caption, header cells, right-aligned numbers, the same precision and units as the chart.
- Source text sits in body text under the chart, not inside the image: the ONS asks for the source "directly after the chart" ([ONS chart text](https://service-manual.ons.gov.uk/data-visualisation/guidance/chart-text)) and the Analysis Function for source text in the page, not the image.
- `figure` and `figcaption` group the chart, its description and its source, as the W3C tutorial shows.

**Cases**
- A canvas chart with no alternative → a "Show data" disclosure with the table and a one-sentence summary as the accessible name.
- A chart whose source is printed inside the image → move it to text under the chart.
- An alternative offered only as a CSV download → an inline table as well.
- `aria-label="Chart"` → the message as the name.
- A long description with a table inside an element referenced by `aria-describedby` → the table in the page, in the `figure`.

**Accessibility**
- 1.1.1 Non-text Content: the short description; 1.3.1 Info and Relationships: the table's structure.
- A disclosure is `details` or a button with `aria-expanded`; code-standard rule 19 covers what `details` does not give.

**Build**
- Inline SVG with `role="img"` and a name from the visible summary via `aria-labelledby` ([html-semantics: *Charts in markup*](../../code/html-semantics.md#charts-in-markup)).
- The table sits inside the chart's `figure`, in `<details><summary>Show data</summary>…</details>` or always shown; never only in `aria-describedby`, which drops its structure.
- It is a real `table` with a `caption`, `th scope` and numbers formatted by the same formatter as the chart ([html-semantics: *Tables for data*](../../code/html-semantics.md#tables-for-data)).
- The chart and the table are rendered from one data array, so they cannot disagree (code-standard rule 29).
- `details` gives open state and keyboard and nothing else (code-standard rule 19); a CSV link is an addition, a link with `download` ([html-semantics: *Links and buttons*](../../code/html-semantics.md#links-and-buttons)).
- Without script the table is present and the chart may be absent; the reverse is never true (code-standard rule 20).

**Check**
- *Script* could: for each `svg` or `canvas` chart, assert an accessible name that is not generic and an associated table or disclosure containing one; flag a `table` referenced only by `aria-describedby`.
- *Judgement*: does the summary state the chart's message, and does the table hold every value the chart shows?

**Sources.** The W3C tutorial, the Analysis Function and ONS agree on a stated message and a table in the page.

## Colour-vision deficiency

**What good looks like**
- Nothing in a chart depends on telling two colours apart: direct labels, position, line style, marker shape or texture carry identity too.
- The palette is validated by computation for colour-vision deficiency, in each theme.

**How**
- Never colour alone. WCAG 1.4.1: "Color is not used as the only visual means of conveying information, indicating an action, prompting a response, or distinguishing a visual element"; "Mary's sales are in red, Tom's are in blue" needs another cue, "regardless of the contrast ratio between those colors" ([W3C Understanding 1.4.1](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html)). Its technique G111 is "Using color and pattern".
- Direct labels first: a label beside the line or bar makes colour redundant (Carbon legends; the Analysis Function).
- Then line style and marker shape per series; texture or pattern where marks touch (stacks, maps) and the reader asked for it, prints, or uses forced colours. Carbon: texture "can be used instead of, or in addition to, color" for readers with visual impairment ([Carbon legends](https://carbondesignsystem.com/data-visualization/legends/)).
- Validated palettes. Carbon's categorical order and Atlassian's numbered sequence are chosen so neighbours stay distinct "across all color deficiencies" ([Atlassian data visualisation colour](https://atlassian.design/foundations/color/data-visualization-color)); the Analysis Function's palettes "have passed our checks for colour blindness" and it suggests simulators for one's own ([Analysis Function, colours in charts](https://analysisfunction.civilservice.gov.uk/policy-store/data-visualisation-colours-in-charts/)). Validate any change by computation; varying lightness as well as hue helps, as Datawrapper notes ([Datawrapper, choosing colours](https://www.datawrapper.de/academy/what-to-consider-when-choosing-colors-for-data-visualization)).
- Red against green for good against bad is the classic failure; status colours always come with an icon and a word (Atlassian: status colours "may be hard for users with color deficiencies to tell apart").
- Adjacent pairs are what a stack, bar or line chart must separate; scatter, maps and small multiples need every pair separated, which caps them at fewer series.

**Cases**
- Red and green lines for "passed" and "failed" with a legend → direct labels, a dashed line for one, and the status icon at each end.
- A palette edited by eye to match a brand → run the validator; re-step the colour whose neighbour falls under the floor.
- The three-orange Breaking/Minor/Patch stack → near-indistinguishable even to full colour vision (validator ΔE 9.5); see [colour by job](#colour-by-job).

**Accessibility**
- 1.4.1 Use of Color; 1.4.11 Non-text Contrast where colour is the only separation; forced colours (Windows High Contrast) remove chart colours, so the non-colour cues are what remain.

**Build**
- Per-series `stroke-dasharray`, marker shape and an optional pattern fill are set by the same `data-series` rule as the colour, so they cannot drift apart (code-standard rule 6, code-standard rule 22; [html-semantics: *Charts in markup*](../../code/html-semantics.md#charts-in-markup)).
- Under `@media (forced-colors: active)`, marks use system colours and the patterns turn on ([accessibility: *Reduced motion and colour scheme in code*](../../code/accessibility.md#reduced-motion-and-colour-scheme-in-code)).
- The palette lives in tokens per theme, and its validation runs whenever the tokens are regenerated (code-standard rule 23, code-standard rule 53).

**Check**
- *Script*: validate each palette per theme with the `dataviz` skill's `scripts/validate_palette.js` (lightness band, chroma floor, protanopia and deuteranopia separation, normal-vision floor, contrast against the surface; `--ordinal` for a ramp, `--pairs all` for scatter and small multiples; exit 1 on a hard fail). A script could also render the chart through a colour-vision simulation and in greyscale and flag series with no label, dash or marker difference.
- *Judgement*: in greyscale, can every series still be named?

**Sources.** W3C, Carbon, Atlassian, the Analysis Function and Datawrapper agree; the validator is the toolkit's measuring instrument, not a source.

## Contrast of marks and text

**What good looks like**
- Every mark a reader needs (lines, bars, slices, points, reference lines) at 3:1 against the surface and against touching marks, or labelled so the colour is not needed.
- Every piece of chart text at 4.5:1, or 3:1 when large.

**How**
- Marks: WCAG 1.4.11 asks 3:1 for graphical objects required to understand the content; for a graph, "The lines should have 3:1 contrast against their background", lines that rarely overlap need not contrast with each other, and pie slices need 3:1 between them unless "visible labels and values ... convey equivalent information" ([W3C Understanding 1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)). Labels or "a table that follows the graph" are the exception's way out.
- Primer: "All chart marks (lines, bars, charts, areas, slices) must meet a 3:1 contrast ratio against the background", and muted data colours only with an outline ([Primer data visualisation](https://primer.style/product/ui-patterns/data-visualization/)).
- The Analysis Function's categorical palette is at 3:1 against white and between adjacent colours in order; of its sequential blues only the three darkest reach 3:1, and its pale "focus" grey does not.
- Grey for context is still a mark: if the reader needs it, it reaches 3:1; if it is only context, labels carry it.
- Text: WCAG 1.4.3, "at least 4.5:1", large text 3:1, and it applies to images of text ([W3C Understanding 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)). Primer: "Axis labels must have a 4.5:1 contrast against the background". Text never takes a light series colour; a label inside a filled segment picks dark or light text by the fill.
- Gridlines are context and need no 3:1; a threshold line that carries meaning does.
- Each theme is measured separately.

**Cases**
- A pale yellow series at 1.6:1 on white with no labels → a darker step, or direct labels and the table.
- Tick labels in a light grey at 2.8:1 → the secondary text token at 4.5:1.
- A target line in the gridline colour → a mark colour at 3:1 and a label.
- A palette that passes on white and fails on the dark surface → the dark palette, validated there.

**Accessibility**
- 1.4.11 Non-text Contrast; 1.4.3 Contrast (Minimum); 2.4.7 Focus Visible and 1.4.11 again for the focus ring on a point.

**Build**
- Marks read series tokens, text reads text tokens, gridlines a border token: the token pairs are chosen once to meet the ratios in each theme (code-standard rule 22, code-standard rule 53; [tokens: *Themes and modes*](../../code/tokens.md#themes-and-modes)).
- Label colour inside a fill comes from the fill token's paired on-colour, not computed per chart.

**Check**
- *Script* could: compute every mark's contrast against the surface and against touching marks, and every chart text's contrast, in each theme; `validate_palette.js` reports mark contrast against a given `--surface`.
- *Judgement*: where a mark is under 3:1, do labels or the table carry the same information?

**Sources.** W3C, Primer, the Analysis Function and Chartability agree on 3:1 for marks and 4.5:1 for text.

## Keyboard and screen-reader access to points

**Use when / don't use**
- Use focusable points when the chart is interactive (hover detail, drill-down, selection): Chartability requires keyboard parity for anything a mouse can do.
- Don't make a static chart navigable: a named `role="img"` and its table serve better than a tab stop per mark.

**How**
- Static chart: `role="img"` with one name from the visible summary. `role="img"` hides the chart's children from assistive technology, so the table carries the values ([html-semantics: *Charts in markup*](../../code/html-semantics.md#charts-in-markup)).
- Navigable chart: not `role="img"`. WAI-ARIA Graphics gives `graphics-document`, "A type of [document] in which the visual appearance or layout of content conveys meaning", and `graphics-symbol` for an atomic mark ([Graphics-ARIA 1.0](https://www.w3.org/TR/graphics-aria-1.0/), a W3C Recommendation); a simpler, well-supported form is a `group` named by the summary with each point a focusable element whose name holds its values.
- Focus order: one tab stop into the chart, then arrow keys. The APG: "The tab sequence should include only one focusable element of a composite UI component", with a roving tabindex (one element `tabindex="0"`, the rest "-1") ([APG keyboard interface](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/)). Left and right move along x; up and down between series; Home and End to the first and last point.
- Announcing values: the focused point's accessible name reads category or date, series and value, formatted as the table formats them ("9 Oct 2026, open findings, 48"); no live region chatter on pointer moves.
- Focus mirrors hover: the same detail appears ([hover and focus detail](#hover-and-focus-detail)); Enter or Space mirrors a click (Chartability).
- Reference implementation: Highcharts' accessibility module offers "text description of the chart, keyboard navigation" and "viewing the chart as a data table" ([Highcharts accessibility module](https://www.highcharts.com/docs/accessibility/accessibility-module)); its behaviour is a useful model even where no library is used.

**Cases**
- An SVG with `role="img"` and focusable points inside → the points are hidden from assistive technology; drop `role="img"` for a named group or `graphics-document` with named points, or keep it static and put the interaction in the table.
- Every bar a tab stop, forty in a row → one tab stop and arrow keys.
- A focused point announced as "circle" → its date, series and value.

**Accessibility**
- 2.1.1 Keyboard; 2.4.3 Focus Order; 2.4.7 Focus Visible; 4.1.2 Name, Role, Value for each focusable point; 1.3.1 for the table.

**Build**
- Roving tabindex on the points, one handler for keys ([accessibility: *Composite widgets and roving tabindex*](../../code/accessibility.md#composite-widgets-and-roving-tabindex)); the name of each point built with the page's formatters ([i18n: *Numbers, dates, plurals and lists*](../../code/i18n.md#numbers-dates-plurals-and-lists)).
- The focus ring is the shared one, drawn on the mark ([accessibility: *Visible focus*](../../code/accessibility.md#visible-focus)).
- Drill targets are also links in the table (code-standard rule 20, code-standard rule 21).

**Check**
- *Script* could: flag `role="img"` with focusable descendants; tab into each interactive chart and assert one tab stop, arrow keys moving focus, and a name with a value on each point.
- *Judgement*: with a screen reader, can a reader find the highest value and the latest one without the table?

**Sources.** Chartability, the APG, Graphics-ARIA and Highcharts. Graphics-ARIA support in screen readers varies; the toolkit prefers the static image plus table, and a named group for interactive charts.

## Touch targets for points

**What good looks like**
- Every interactive point, bar or legend toggle has a hit area of at least 24 by 24 CSS pixels, larger than its drawn mark.
- On touch, a tap shows a point's detail and a tap elsewhere dismisses it.

**How**
- WCAG 2.5.8: "The size of the target for pointer inputs is at least 24 by 24 CSS pixels", unless spaced so the 24px circles do not intersect; an essential exception applies "If the size and spacing of the targets is fundamental to the information being conveyed" ([W3C Understanding 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)), as with map pins.
- Dense points (a line of 90 days) cannot each have 24px; the hit target becomes the x position (a column of the plot, nearest point to the pointer), so the reader aims at a date, not a 4px dot.
- Hover does not exist on touch (NN/g, [tooltip guidelines](https://www.nngroup.com/articles/tooltip-guidelines/)); tap to show, tap away or a close control to dismiss.
- Legend toggles and drill links are ordinary controls at the product's touch size ([responsive: *Touch targets*](../../code/responsive.md#touch-targets)).

**Cases**
- Scatter dots of 6px that only fire when hit dead-centre → a transparent 24px hit area per point, or nearest-point selection.
- A tooltip that needs hover on a phone → tap to show, tap away to dismiss.

**Accessibility**
- 2.5.8 Target Size (Minimum); 2.5.5 Target Size (Enhanced, AAA, advisory) asks 44px; 1.4.13 for the detail that opens.

**Build**
- Hit areas are transparent shapes or one overlay that maps the pointer to the nearest point, sized from a token, not the mark size (code-standard rule 22, code-standard rule 57).
- Pointer events, not separate mouse and touch handlers, so one code path serves both (code-standard rule 36).

**Check**
- *Script* could: measure each interactive mark's hit area and flag under 24px with intersecting neighbours.
- *Judgement*: on a phone, can a reader get the value of any point with one tap?

**Sources.** W3C and NN/g; the nearest-point technique is common practice, not taken from a source opened here.

## Reduced motion in charts

**What good looks like**
- Charts appear and update without movement for readers who ask for less motion, and with brief, purposeful movement for others.
- Changes stay easy to follow either way.

**How**
- WCAG 2.3.3 (AAA): "Motion animation triggered by interaction can be disabled, unless the animation is essential to the functionality or the information being conveyed"; "Non-essential movement can trigger vestibular disorder reactions", and the W3C points to the `prefers-reduced-motion` setting ([W3C Understanding 2.3.3](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html)).
- Entry animations (bars growing, lines drawing) are decoration: off under reduced motion, short otherwise.
- Transitions between states (a filter applied) help follow the change; under reduced motion, a cross-fade or an instant change with the changed series marked. Chartability: "Chart changes must be easy to follow".
- Longer, explanatory animation has controls: Chartability, "Longer, video-style or explanatory animations must have pause, stop, and start controls".
- Live data does not animate every tick.

**Cases**
- Bars that bounce in on every filter change → instant under reduced motion, a short ease otherwise.
- A line that redraws from the left on each poll → update in place.

**Accessibility**
- 2.3.3 Animation from Interactions (AAA, advisory here); 2.2.2 Pause, Stop, Hide for motion over five seconds.

**Build**
- Transitions run only under `@media (prefers-reduced-motion: no-preference)`; script checks `matchMedia` before animating ([accessibility: *Reduced motion and colour scheme in code*](../../code/accessibility.md#reduced-motion-and-colour-scheme-in-code)).
- Durations come from motion tokens ([tokens: *Motion tokens*](../../code/tokens.md#motion-tokens)).

**Check**
- *Script* could: with reduced motion emulated, assert no chart element animates; flag chart animations longer than the motion tokens allow.
- *Judgement*: does each animation help follow a change, or only decorate?

**Sources.** W3C and Chartability.

## Zoom and reflow of charts

**What good looks like**
- At 200% text size and 400% zoom, chart text stays legible and the page reflows around the chart.
- A chart that needs its two dimensions keeps them and scrolls within its own region, or offers its table.

**How**
- WCAG 1.4.10 exempts "parts of the content which require two-dimensional layout for usage or meaning", and the W3C notes that "Slicing up a graphic (photograph, drawing, graph, etc.) and stacking the blocks would make the graphic difficult to understand" ([W3C Understanding 1.4.10](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html)). The chart may keep its shape; the page around it may not scroll in two directions.
- Chartability: "Chart space must be able to be zoomed using assistive technology or equivalent".
- Text in rem so it follows the reader's text size (1.4.4); an SVG whose `viewBox` scales its text down is the common failure ([responsive charts](#responsive-charts)).
- At high zoom the table is often the better form; offer it beside the chart.

**Cases**
- At 400% zoom the chart forces the whole page to scroll sideways → the chart's region scrolls by itself, the page reflows.
- Browser text size raised, chart labels unchanged → labels in rem.

**Accessibility**
- 1.4.10 Reflow; 1.4.4 Resize Text; 1.4.12 Text Spacing for labels that wrap.

**Build**
- The chart's container sets `overflow-x: auto` with a name and `tabindex="0"` when it scrolls, so keyboard users can scroll it; text sizes in rem (code-standard rule 54; [responsive: *Zoom and reflow*](../../code/responsive.md#zoom-and-reflow)).
- The chart re-lays at its container's width rather than scaling ([responsive: *Container queries*](../../code/responsive.md#container-queries)).

**Check**
- *Script* could: render at 320 CSS px width and at 200% text, flag page-level horizontal scroll and chart text that did not grow.
- *Judgement*: at 400% zoom, is the table easier than the chart?

**Sources.** W3C and Chartability.

## Cognitive load

**What good looks like**
- A text summary first, stating the one message; the chart supports it.
- One message per chart, the fewest marks, plain labels, and a reading order of title, summary, chart, source, table.

**How**
- Summary first: the message in a sentence above the chart, which is also its accessible name. Datawrapper: "Give the main statement first and the precise data explanation later" ([Datawrapper, text in data visualisations](https://www.datawrapper.de/blog/text-in-data-visualizations)).
- One message per chart, and the message written before the chart is chosen (the Analysis Function; [choosing a chart by its job](#choosing-a-chart-by-its-job)).
- Explain how to read anything unusual: Chartability's "Chart should explain its purpose and how to read, use, and interpret it" ([Chartability heuristics](https://chartability.github.io/POUR-CAF/)).
- Annotate the point that matters rather than asking the reader to find it: Datawrapper calls annotations "an extremely powerful tool".
- Fewer series, direct labels and grey context reduce matching work ([simplicity](#simplicity)); NN/g asks that dashboards be consumed "with a minimum of interaction or cognitive processing" ([NN/g, dashboards](https://www.nngroup.com/articles/dashboards-preattentive/)).
- Consistency across a screen (same colours, same legend place) means a reader learns the code once (Carbon dashboards).

**Cases**
- A chart titled "Findings" with no summary → "Open findings fell by 12 since the last audit" above it.
- A findings card with a line and a separate bar chart, read as too complex → one chart, one message, the rest in the table ([simplicity](#simplicity)).
- A scatter with no hint what the axes mean → axis titles in plain words and a sentence on how to read it.

**Accessibility**
- 1.1.1 (the summary as the name); 2.4.6 Headings and Labels; 3.1.5 Reading Level (AAA, advisory) for the summary's words.

**Build**
- The summary is a required input of the chart component, rendered as the first child of the `figure` and referenced by `aria-labelledby` ([html-semantics: *Charts in markup*](../../code/html-semantics.md#charts-in-markup)); DOM order is title, summary, chart, source, table (code-standard rule 2).
- The summary's figures come from the same data as the chart (code-standard rule 29).

**Check**
- *Script* could: assert each chart `figure` begins with a summary sentence containing a number, and that the chart's name references it.
- *Judgement*: read only the summary: is the message there? Then the chart: does it show that and nothing else?

**Sources.** Datawrapper, the Analysis Function, Chartability, NN/g and Carbon agree; the summary-first order is the toolkit's reading of them.

## Empty and sparse data

**What good looks like**
- No data says so, with the reason and what to do; never an empty pair of axes.
- Missing is never zero: a gap in a line, "not recorded" in a cell, "Not measured" on a number.
- Too little data for a chart becomes numbers or a list.

**How**
- Empty: the chart's region shows an empty state ([feedback: empty states](feedback.md#empty-states)) saying why there is no data (none yet, filtered out, source failed) and what changes it; a stale or failed source is [dashboards: empty, degraded and stale data](../profiles/dashboards.md#empty-degraded-and-stale-data).
- Missing is not zero: [data: numbers](data.md#numbers) owns the rule. A line breaks at a missing value; a bar for a missing period is absent and labelled, not a zero-height bar.
- Axis scales do not bend to the data: Carbon's "Never change axis ticks increments to accommodate data availability".
- Sparse: one value is a number; two or three are a sentence or a short list; a handful of events in a long period is a list of the events ([calendar heatmaps](#calendar-heatmaps), [line charts and small data](#line-charts-and-small-data)).
- A tiny slice or segment that cannot be drawn still exists in the table: Carbon notes a pie slice under one degree is not keyboard accessible "or available in a tooltip either".

**Cases**
- A chart with axes and no line because the first audit has not run → "No audit has run yet" with how to run one.
- A missing week drawn as a drop to zero → a break in the line, "not recorded" in the table.
- A filter that leaves one category → the number, not a one-bar chart.
- Five snapshot days in a year drawn as a full-year grid → a list of the five days.

**Accessibility**
- The empty state is text in the chart's region, announced in reading order; the summary sentence says "no data" rather than describing an empty chart.
- 1.3.1: "not recorded" is text, not only a hatch pattern.

**Build**
- The template branches on the model's empty and missing states, never on `0` or an empty array alone (code-standard rule 12, code-standard rule 29).
- The form (chart, sentence, list) is chosen in the model from the count of data points, so a filter that thins the data changes the form (code-standard rule 57).
- Missing values are `null` and split the path; the table renders them as words.

**Check**
- *Script* could: render each chart with no data and with one point and assert an empty state or a non-chart form; flag zero drawn where the series is `null`.
- *Judgement*: does the empty state say why, and what to do?

**Sources.** Carbon on axes and tiny slices; the empty and missing rules are owned by the feedback, data and dashboards pages, linked above.

## Sparklines and small multiples

**Use when / don't use**
- A sparkline beside a number when its recent shape adds to the number: Tufte, "Sparklines are datawords: data-intense, design-simple, word-sized graphics" ([Tufte, sparkline theory and practice](https://www.edwardtufte.com/notebook/sparkline-theory-and-practice-edward-tufte/)).
- Small multiples when several series overlap or the trend in each matters: Datawrapper, "Use small multiple line charts to untangle overlapping lines" ([Datawrapper, small multiple line charts](https://www.datawrapper.de/blog/what-to-consider-when-creating-small-multiple-line-charts)); ONS suggests one when a line chart is overcrowded.
- Don't use small multiples when the reader compares series at one moment: Datawrapper calls them "not great for comparing data points at certain points of time".

**How**
- Sparkline: no axes or gridlines, the line in a neutral colour, the latest point marked in the accent; the number beside it carries the value and its comparison. A few dozen points, a fixed period stated once for the set. Primer does not currently support new sparklines, so a project following Primer builds none.
- A row of sparklines shares one period and, where they measure the same thing, one scale.
- Small multiples: the Analysis Function says that "it is essential for all the y-axes to have the same scale to avoid misunderstandings". Datawrapper allows independent scales for very different ranges but recommends avoiding them, and stating it when used. The toolkit shares the scale and states any exception in the summary.
- Panels in a meaningful order (largest first, or a natural order), axis labels only on the outer panels, one colour; a reference line (an average) may repeat in every panel.

**Cases**
- Six overlapping lines with a legend → six small panels on one scale, each titled directly.
- A sparkline with axes, gridlines and a legend → a word-sized line beside the number, latest point marked.
- Small multiples each with their own y-scale, read as equal → one shared scale, or "scales differ" in the summary.

**Accessibility**
- A sparkline's alternative is the number and its comparison beside it; the SVG is decorative (`aria-hidden="true"`) when the text says everything it shows, otherwise named by a sentence ("Down from 72 to 48 over eight weeks").
- Small multiples: each panel has a title; one table covers all panels.

**Build**
- A sparkline is a small inline SVG in the tile or row, drawn server-side from the same series as the number, `aria-hidden` when redundant; no chart library (code-standard rule 29; [performance: *JavaScript delivery*](../../code/performance.md#javascript-delivery)).
- Small multiples are a list of `figure`s inside one parent `figure` with one summary and one table; the shared scale is computed once from all panels' data and passed to each (code-standard rule 57); the grid fills its rows ([responsive: *Grids that fill their rows*](../../code/responsive.md#grids-that-fill-their-rows)).

**Check**
- *Script* could: assert small-multiple panels share one y-domain unless the summary says otherwise; flag a sparkline with axes or a legend; flag a non-hidden sparkline with no name.
- *Judgement*: is the reader comparing trends (multiples) or values at a moment (one chart)?

**Sources.** Tufte (opened) for sparklines; the Analysis Function, ONS and Datawrapper for small multiples. They differ on independent scales: the Analysis Function forbids, Datawrapper discourages; the toolkit shares the scale and names any exception.
