# Fitting an existing type scale to a ratio

How to move a hand-grown scale onto a predictable ratio: which base and ratio, how far a size may shift, what to keep, and what the largest sizes do in shipping systems.

A product library has a desktop scale of 86, 60, 41, 29, 24, 20, 17, 14 and 12 pixels, and a phone scale of 45, 37, 31, 26, 22, 18, 17, 14 and 12. Nobody remembers choosing most of them. A new heading needs a size, and the options are "between 29 and 41" or "whatever looks right". Someone proposes a modular scale, and a second person asks how many existing screens it would change.

---

## What this answers

- [A scale near a ratio](#a-scale-near-a-ratio): what the existing sizes already say about their ratio
- [Choosing base and ratio](#choosing-base-and-ratio): which base and ratio fit with the least change
- [Tolerance](#tolerance): how far a size may move, in percent and in pixels
- [Exceptions worth keeping](#exceptions-worth-keeping): which off-ratio sizes stay, named
- [Mapping old sizes to new](#mapping-old-sizes-to-new): the per-size table and the order of the migration
- [The display end](#the-display-end): which ratios shipping systems use for their largest sizes, and why they differ
- [What the fit costs](#what-the-fit-costs): restyled components and the review

For a lookup, use the [cheat sheet](#cheat-sheet); [the short version](#the-short-version) is the whole guide in four paragraphs. How a shared scale is built from scratch, and why content walks it at a wider stride, is in [one type scale for an interface and its articles](one-type-scale-for-ui-and-content.md#building-a-shared-scale). What a phone mode does to a scale is in [type on a phone](type-on-a-phone.md#the-scale-on-a-phone), and the style names are in [naming text styles](naming-text-styles.md).

---

## A scale near a ratio

Divide each size by the next one down before choosing anything: a hand-grown scale usually has a ratio in it, and finding it shows how much a fit must change.

Take the desktop sizes. Reading up from 12, the steps are 1.17, 1.21, 1.18, 1.20 and 1.21, then 1.41, 1.46 and 1.43 (the last is 86 ÷ 60). Two regimes show up. Up to 29 the scale climbs by about 1.2. Above 29 it climbs by about 1.44, and 1.2 × 1.2 is 1.44. So the top four sizes are every second step of a 1.2 ladder, the same two-strides idea [one type scale](one-type-scale-for-ui-and-content.md#building-a-shared-scale) uses for content.

The phone sizes are steadier. Reading up from 12 they climb 1.17, 1.21, 1.06 (17 to 18), 1.22, 1.18, 1.19, 1.19 and 1.22. That is one 1.2 ladder walked one step at a time, with a near-duplicate at the body size.

The sizes also match a particular way of building the ladder. Start at 12, multiply by 1.2, round, and multiply the rounded number again:

```
12 → 14.4 → 14
14 × 1.2 = 16.8 → 17
17 × 1.2 = 20.4 → 20
20 × 1.2 = 24
24 × 1.2 = 28.8 → 29
29 × 1.2 = 34.8 → 35
35 × 1.2 = 42
42 × 1.2 = 50.4 → 50
50 × 1.2 = 60
60 × 1.2 = 72
72 × 1.2 = 86.4 → 86
```

Eight of the nine desktop sizes (12, 14, 17, 20, 24, 29, 60, 86) fall out of that chain, and the ninth, 41, is one pixel under the chain's 42. So the scale is a 1.2 ladder from 12 whose rounding errors were carried forward. By the eleventh step the chain is at 86 where the exact value is 89.16, 3 pixels short.

Here is the same ladder with each rounding done once, from the exact product, drawn against both of the library's scales.

<svg role="img" viewBox="0 0 720 270" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0" font-family="system-ui, sans-serif">
<title>A log-scaled size ruler from 10 to 95 pixels. Top row: the desktop sizes 12, 14, 17, 20, 24, 29, 41, 60 and 86. Middle row: the twelve rounded steps of a 1.2 ladder from 12, which are 12, 14, 17, 21, 25, 30, 36, 43, 52, 62, 74 and 89. Bottom row: the phone sizes 12, 14, 17, 18, 22, 26, 31, 37 and 45. Thin lines join each old size to the step it moves to.</title>
<rect width="720" height="270" fill="#f7f6f2"/>
<text x="40" y="26" font-size="13" font-weight="600" fill="#1f5fbf">Desktop today</text>
<text x="40" y="136" font-size="13" font-weight="600" fill="#222">1.2 from 12, rounded once</text>
<text x="40" y="250" font-size="13" font-weight="600" fill="#b5440f">Phone today</text>
<line x1="651.7" y1="72" x2="662.0" y2="148" stroke="#1f5fbf" stroke-opacity=".35"/>
<line x1="549.4" y1="72" x2="558.3" y2="148" stroke="#1f5fbf" stroke-opacity=".35"/>
<line x1="441.1" y1="72" x2="454.6" y2="148" stroke="#1f5fbf" stroke-opacity=".35"/>
<line x1="342.7" y1="72" x2="351.0" y2="148" stroke="#1f5fbf" stroke-opacity=".35"/>
<line x1="288.9" y1="72" x2="299.2" y2="148" stroke="#1f5fbf" stroke-opacity=".35"/>
<line x1="237.0" y1="72" x2="247.3" y2="148" stroke="#1f5fbf" stroke-opacity=".35"/>
<line x1="190.8" y1="72" x2="195.5" y2="148" stroke="#1f5fbf" stroke-opacity=".35"/>
<line x1="135.7" y1="72" x2="143.7" y2="148" stroke="#1f5fbf" stroke-opacity=".35"/>
<line x1="91.8" y1="72" x2="91.8" y2="148" stroke="#1f5fbf" stroke-opacity=".35"/>
<line x1="467.6" y1="212" x2="454.6" y2="160" stroke="#b5440f" stroke-opacity=".35"/>
<line x1="411.9" y1="212" x2="402.8" y2="160" stroke="#b5440f" stroke-opacity=".35"/>
<line x1="361.6" y1="212" x2="351.0" y2="160" stroke="#b5440f" stroke-opacity=".35"/>
<line x1="311.6" y1="212" x2="299.2" y2="160" stroke="#b5440f" stroke-opacity=".35"/>
<line x1="264.1" y1="212" x2="247.3" y2="160" stroke="#b5440f" stroke-opacity=".35"/>
<line x1="207.1" y1="212" x2="195.5" y2="160" stroke="#b5440f" stroke-opacity=".35"/>
<line x1="190.8" y1="212" x2="195.5" y2="160" stroke="#b5440f" stroke-opacity=".35"/>
<line x1="135.7" y1="212" x2="143.7" y2="160" stroke="#b5440f" stroke-opacity=".35"/>
<line x1="91.8" y1="212" x2="91.8" y2="160" stroke="#b5440f" stroke-opacity=".35"/>
<line x1="40" y1="154" x2="680" y2="154" stroke="#999"/>
<circle cx="651.7" cy="72" r="5" fill="#1f5fbf"/><text x="651.7" y="60" font-size="12" text-anchor="middle" fill="#222">86</text>
<circle cx="549.4" cy="72" r="5" fill="#1f5fbf"/><text x="549.4" y="60" font-size="12" text-anchor="middle" fill="#222">60</text>
<circle cx="441.1" cy="72" r="5" fill="#1f5fbf"/><text x="441.1" y="60" font-size="12" text-anchor="middle" fill="#222">41</text>
<circle cx="342.7" cy="72" r="5" fill="#1f5fbf"/><text x="342.7" y="60" font-size="12" text-anchor="middle" fill="#222">29</text>
<circle cx="288.9" cy="72" r="5" fill="#1f5fbf"/><text x="288.9" y="60" font-size="12" text-anchor="middle" fill="#222">24</text>
<circle cx="237.0" cy="72" r="5" fill="#1f5fbf"/><text x="237.0" y="60" font-size="12" text-anchor="middle" fill="#222">20</text>
<circle cx="190.8" cy="72" r="5" fill="#1f5fbf"/><text x="190.8" y="60" font-size="12" text-anchor="middle" fill="#222">17</text>
<circle cx="135.7" cy="72" r="5" fill="#1f5fbf"/><text x="135.7" y="60" font-size="12" text-anchor="middle" fill="#222">14</text>
<circle cx="91.8" cy="72" r="5" fill="#1f5fbf"/><text x="91.8" y="60" font-size="12" text-anchor="middle" fill="#222">12</text>
<line x1="91.8" y1="148" x2="91.8" y2="160" stroke="#222" stroke-width="2"/><text x="91.8" y="176" font-size="11" text-anchor="middle" fill="#222">12</text>
<line x1="143.7" y1="148" x2="143.7" y2="160" stroke="#222" stroke-width="2"/><text x="143.7" y="176" font-size="11" text-anchor="middle" fill="#222">14</text>
<line x1="195.5" y1="148" x2="195.5" y2="160" stroke="#222" stroke-width="2"/><text x="195.5" y="176" font-size="11" text-anchor="middle" fill="#222">17</text>
<line x1="247.3" y1="148" x2="247.3" y2="160" stroke="#222" stroke-width="2"/><text x="247.3" y="176" font-size="11" text-anchor="middle" fill="#222">21</text>
<line x1="299.2" y1="148" x2="299.2" y2="160" stroke="#222" stroke-width="2"/><text x="299.2" y="176" font-size="11" text-anchor="middle" fill="#222">25</text>
<line x1="351.0" y1="148" x2="351.0" y2="160" stroke="#222" stroke-width="2"/><text x="351.0" y="176" font-size="11" text-anchor="middle" fill="#222">30</text>
<line x1="402.8" y1="148" x2="402.8" y2="160" stroke="#222" stroke-width="2"/><text x="402.8" y="176" font-size="11" text-anchor="middle" fill="#222">36</text>
<line x1="454.6" y1="148" x2="454.6" y2="160" stroke="#222" stroke-width="2"/><text x="454.6" y="176" font-size="11" text-anchor="middle" fill="#222">43</text>
<line x1="506.5" y1="148" x2="506.5" y2="160" stroke="#222" stroke-width="2"/><text x="506.5" y="176" font-size="11" text-anchor="middle" fill="#222">52</text>
<line x1="558.3" y1="148" x2="558.3" y2="160" stroke="#222" stroke-width="2"/><text x="558.3" y="176" font-size="11" text-anchor="middle" fill="#222">62</text>
<line x1="610.1" y1="148" x2="610.1" y2="160" stroke="#222" stroke-width="2"/><text x="610.1" y="176" font-size="11" text-anchor="middle" fill="#222">74</text>
<line x1="662.0" y1="148" x2="662.0" y2="160" stroke="#222" stroke-width="2"/><text x="662.0" y="176" font-size="11" text-anchor="middle" fill="#222">89</text>
<circle cx="467.6" cy="212" r="5" fill="#b5440f"/><text x="467.6" y="236" font-size="12" text-anchor="middle" fill="#222">45</text>
<circle cx="411.9" cy="212" r="5" fill="#b5440f"/><text x="411.9" y="236" font-size="12" text-anchor="middle" fill="#222">37</text>
<circle cx="361.6" cy="212" r="5" fill="#b5440f"/><text x="361.6" y="236" font-size="12" text-anchor="middle" fill="#222">31</text>
<circle cx="311.6" cy="212" r="5" fill="#b5440f"/><text x="311.6" y="236" font-size="12" text-anchor="middle" fill="#222">26</text>
<circle cx="264.1" cy="212" r="5" fill="#b5440f"/><text x="264.1" y="236" font-size="12" text-anchor="middle" fill="#222">22</text>
<circle cx="207.1" cy="212" r="5" fill="#b5440f"/><text x="207.1" y="236" font-size="12" text-anchor="middle" fill="#222">18</text>
<circle cx="190.8" cy="212" r="5" fill="#b5440f"/><text x="190.8" y="236" font-size="12" text-anchor="middle" fill="#222">17</text>
<circle cx="135.7" cy="212" r="5" fill="#b5440f"/><text x="135.7" y="236" font-size="12" text-anchor="middle" fill="#222">14</text>
<circle cx="91.8" cy="212" r="5" fill="#b5440f"/><text x="91.8" y="236" font-size="12" text-anchor="middle" fill="#222">12</text>
</svg>

The ladder's 12 steps are 12, 14, 17, 21, 25, 30, 36, 43, 52, 62, 74 and 89, from 12 × 1.2ⁿ (14.4, 17.28, 20.74, 24.88, 29.86, 35.83, 43.0, 51.6, 61.9, 74.3, 89.16). Desktop uses 12, 14, 17, then the next three adjacent steps, then every second step above 30: 43, 62, 89. Phone uses adjacent steps throughout. Every old size sits within a few percent of a step, which is why the fit is cheap.

**Look for the ratio in the sizes before picking one.** A scale that grew by hand and still has steps near 1.2 needs a fit, not a redesign.

---

## Choosing base and ratio

Take the ratio the existing sizes already imply, and choose the base that keeps the worst shift across both modes smallest, not the one that suits a single mode.

Here is a worked case for a base. The desktop sizes sit closest to a 1.2 ladder from 14, the dense body size. Rounded once, that ladder is 14, 17, 20, 24, 29, 35, 42, 50, 60, 72, 87, with 12 one step below (11.67). Against the desktop scale, only two sizes move: 41 to 42 and 86 to 87. That looks like the answer.

The phone breaks it. The phone sizes 45, 37, 31, 26 and 22 are 18 × 1.2ⁿ (21.6, 25.9, 31.1, 37.3, 44.8), a ladder anchored on 18 and half a step away from the 14 ladder, since 18 ÷ 14 is 1.29. On the 14 ladder those phone sizes land on 42, 35, 29, 24 and 20: 6.7, 5.4, 6.5, 7.7 and 9.1 percent off. A base of 12 sits between the two phases. Against it, the desktop moves 0 to 5.0 percent and the phone 0 to 5.6 percent. Searching bases from 11.0 to 14.9 in steps of 0.1 for the smallest worst case across both modes gives 5.6 percent, reached at 11.9, 12.0, 14.3 and 14.4, so 12 is as good as any, and it is a whole pixel.

Two modes with different phases cost something whichever base is chosen. The fit below puts the cost where it is smallest, a pixel or two on each side.

The alternatives, with their arithmetic. Each ratio is walked from 12, rounded once, and each old size goes to the nearest step on a log scale.

| Fit | Steps | Largest shift | Mean shift | Desktop sizes moved |
|---|---|---|---|---|
| 1.2 from 12 | 12, 14, 17, 21, 25, 30, 36, 43, 52, 62, 74, 89 | 5.0% (20 to 21) | 2.7% | 6 of 9 |
| 1.2 from 14 | 12, 14, 17, 20, 24, 29, 35, 42, 50, 60, 72, 87 | 2.4% (41 to 42) | 0.4% | 2 of 9 |
| 1.25 from 12 | 12, 15, 19, 23, 29, 37, 46, 57, 72, 89 | 12.2% (41 to 46) | 5.4% | 8 of 9 |
| 1.333 from 12 | 12, 16, 21, 28, 38, 51, 67, 90 | 14.3% (14 to 16) | 7.2% | 8 of 9 |
| 1.2, then 1.414 above 30 | 12, 14, 17, 21, 25, 30, 42, 60, 84 | 5.0% (20 to 21) | 1.9% | 5 of 9 |

The 1.25 fit sends 17 and 20 to the same step, 19. The 1.333 fit sends 14 and 17 to 16, and 20 and 24 to 21. A ratio the old sizes were never near collapses levels that were distinct, so the larger ratios are out.

<svg role="img" viewBox="0 0 720 300" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0" font-family="system-ui, sans-serif">
<title>On a log-scaled ruler, the nine desktop sizes as grey dots on the top row and four candidate lists below: 1.2 from 12, 1.25 from 12, 1.333 from 12, and 1.2 up to 30 then 1.414. The 1.2 and the two-ratio rows sit under the grey dots almost everywhere; the 1.25 and 1.333 rows drift away from them.</title>
<rect width="720" height="300" fill="#f7f6f2"/>
<text x="40" y="26" font-size="13" font-weight="600" fill="#444">Desktop today</text>
<circle cx="651.7" cy="50" r="5" fill="#666"/><text x="651.7" y="40" font-size="12" text-anchor="middle" fill="#222">86</text>
<circle cx="549.4" cy="50" r="5" fill="#666"/><text x="549.4" y="40" font-size="12" text-anchor="middle" fill="#222">60</text>
<circle cx="441.1" cy="50" r="5" fill="#666"/><text x="441.1" y="40" font-size="12" text-anchor="middle" fill="#222">41</text>
<circle cx="342.7" cy="50" r="5" fill="#666"/><text x="342.7" y="40" font-size="12" text-anchor="middle" fill="#222">29</text>
<circle cx="288.9" cy="50" r="5" fill="#666"/><text x="288.9" y="40" font-size="12" text-anchor="middle" fill="#222">24</text>
<circle cx="237.0" cy="50" r="5" fill="#666"/><text x="237.0" y="40" font-size="12" text-anchor="middle" fill="#222">20</text>
<circle cx="190.8" cy="50" r="5" fill="#666"/><text x="190.8" y="40" font-size="12" text-anchor="middle" fill="#222">17</text>
<circle cx="135.7" cy="50" r="5" fill="#666"/><text x="135.7" y="40" font-size="12" text-anchor="middle" fill="#222">14</text>
<circle cx="91.8" cy="50" r="5" fill="#666"/><text x="91.8" y="40" font-size="12" text-anchor="middle" fill="#222">12</text>
<text x="40" y="86" font-size="12" font-weight="600" fill="#1f5fbf">1.2 from 12</text><line x1="40" y1="100" x2="680" y2="100" stroke="#ccc"/>
<line x1="91.8" y1="93" x2="91.8" y2="107" stroke="#1f5fbf" stroke-width="2.5"/>
<line x1="135.7" y1="93" x2="135.7" y2="107" stroke="#1f5fbf" stroke-width="2.5"/>
<line x1="190.8" y1="93" x2="190.8" y2="107" stroke="#1f5fbf" stroke-width="2.5"/>
<line x1="250.9" y1="93" x2="250.9" y2="107" stroke="#1f5fbf" stroke-width="2.5"/>
<line x1="300.5" y1="93" x2="300.5" y2="107" stroke="#1f5fbf" stroke-width="2.5"/>
<line x1="352.3" y1="93" x2="352.3" y2="107" stroke="#1f5fbf" stroke-width="2.5"/>
<line x1="404.1" y1="93" x2="404.1" y2="107" stroke="#1f5fbf" stroke-width="2.5"/>
<line x1="454.7" y1="93" x2="454.7" y2="107" stroke="#1f5fbf" stroke-width="2.5"/>
<line x1="508.7" y1="93" x2="508.7" y2="107" stroke="#1f5fbf" stroke-width="2.5"/>
<line x1="558.7" y1="93" x2="558.7" y2="107" stroke="#1f5fbf" stroke-width="2.5"/>
<line x1="609.0" y1="93" x2="609.0" y2="107" stroke="#1f5fbf" stroke-width="2.5"/>
<line x1="661.5" y1="93" x2="661.5" y2="107" stroke="#1f5fbf" stroke-width="2.5"/>
<text x="40" y="138" font-size="12" font-weight="600" fill="#6a4c93">1.25 from 12</text><line x1="40" y1="152" x2="680" y2="152" stroke="#ccc"/>
<line x1="91.8" y1="145" x2="91.8" y2="159" stroke="#6a4c93" stroke-width="2.5"/>
<line x1="155.3" y1="145" x2="155.3" y2="159" stroke="#6a4c93" stroke-width="2.5"/>
<line x1="222.5" y1="145" x2="222.5" y2="159" stroke="#6a4c93" stroke-width="2.5"/>
<line x1="276.8" y1="145" x2="276.8" y2="159" stroke="#6a4c93" stroke-width="2.5"/>
<line x1="342.7" y1="145" x2="342.7" y2="159" stroke="#6a4c93" stroke-width="2.5"/>
<line x1="411.9" y1="145" x2="411.9" y2="159" stroke="#6a4c93" stroke-width="2.5"/>
<line x1="473.8" y1="145" x2="473.8" y2="159" stroke="#6a4c93" stroke-width="2.5"/>
<line x1="534.8" y1="145" x2="534.8" y2="159" stroke="#6a4c93" stroke-width="2.5"/>
<line x1="601.2" y1="145" x2="601.2" y2="159" stroke="#6a4c93" stroke-width="2.5"/>
<line x1="661.5" y1="145" x2="661.5" y2="159" stroke="#6a4c93" stroke-width="2.5"/>
<text x="40" y="190" font-size="12" font-weight="600" fill="#b5440f">1.333 from 12</text><line x1="40" y1="204" x2="680" y2="204" stroke="#ccc"/>
<line x1="91.8" y1="197" x2="91.8" y2="211" stroke="#b5440f" stroke-width="2.5"/>
<line x1="173.6" y1="197" x2="173.6" y2="211" stroke="#b5440f" stroke-width="2.5"/>
<line x1="250.9" y1="197" x2="250.9" y2="211" stroke="#b5440f" stroke-width="2.5"/>
<line x1="332.7" y1="197" x2="332.7" y2="211" stroke="#b5440f" stroke-width="2.5"/>
<line x1="419.5" y1="197" x2="419.5" y2="211" stroke="#b5440f" stroke-width="2.5"/>
<line x1="503.2" y1="197" x2="503.2" y2="211" stroke="#b5440f" stroke-width="2.5"/>
<line x1="580.7" y1="197" x2="580.7" y2="211" stroke="#b5440f" stroke-width="2.5"/>
<line x1="664.6" y1="197" x2="664.6" y2="211" stroke="#b5440f" stroke-width="2.5"/>
<text x="40" y="242" font-size="12" font-weight="600" fill="#2a7f62">1.2, then 1.414</text><line x1="40" y1="256" x2="680" y2="256" stroke="#ccc"/>
<line x1="91.8" y1="249" x2="91.8" y2="263" stroke="#2a7f62" stroke-width="2.5"/>
<line x1="135.7" y1="249" x2="135.7" y2="263" stroke="#2a7f62" stroke-width="2.5"/>
<line x1="190.8" y1="249" x2="190.8" y2="263" stroke="#2a7f62" stroke-width="2.5"/>
<line x1="250.9" y1="249" x2="250.9" y2="263" stroke="#2a7f62" stroke-width="2.5"/>
<line x1="300.5" y1="249" x2="300.5" y2="263" stroke="#2a7f62" stroke-width="2.5"/>
<line x1="352.3" y1="249" x2="352.3" y2="263" stroke="#2a7f62" stroke-width="2.5"/>
<line x1="448.0" y1="249" x2="448.0" y2="263" stroke="#2a7f62" stroke-width="2.5"/>
<line x1="549.4" y1="249" x2="549.4" y2="263" stroke="#2a7f62" stroke-width="2.5"/>
<line x1="645.0" y1="249" x2="645.0" y2="263" stroke="#2a7f62" stroke-width="2.5"/>
<line x1="651.7" y1="58" x2="651.7" y2="292" stroke="#666" stroke-opacity=".18"/>
<line x1="549.4" y1="58" x2="549.4" y2="292" stroke="#666" stroke-opacity=".18"/>
<line x1="441.1" y1="58" x2="441.1" y2="292" stroke="#666" stroke-opacity=".18"/>
<line x1="342.7" y1="58" x2="342.7" y2="292" stroke="#666" stroke-opacity=".18"/>
<line x1="288.9" y1="58" x2="288.9" y2="292" stroke="#666" stroke-opacity=".18"/>
<line x1="237.0" y1="58" x2="237.0" y2="292" stroke="#666" stroke-opacity=".18"/>
<line x1="190.8" y1="58" x2="190.8" y2="292" stroke="#666" stroke-opacity=".18"/>
<line x1="135.7" y1="58" x2="135.7" y2="292" stroke="#666" stroke-opacity=".18"/>
<line x1="91.8" y1="58" x2="91.8" y2="292" stroke="#666" stroke-opacity=".18"/>
</svg>

The last row is the two-ratio scale: 1.2 up to 30, then 1.414 (the square root of 2) for 42, 60 and 84. It is closest at the top, where 86 moves to 84, and it fits the desktop as well as the 1.2 ladder. Its cost is the phone. The phone sizes 45 and 37 both land on 42, and 37 is 13 percent from it. A single 1.2 ladder keeps the 36 that the phone needs and the desktop skips.

Pick the ratio the sizes already show, a base that the most-used size or both modes share, and one ladder for both modes. For this library that is 1.2 from 12. **Publish one 1.2 ladder, and let the desktop's display sizes skip every second step.** A second ratio saves three entries in the list and costs the phone mode its in-between size.

---

## Tolerance

Set the tolerance as a fraction of the ratio's own step, and test the whole list against it: a size should move to its nearest step, and if the nearest step is more than a few percent away the size is an exception, not a fit.

Rounding to the nearest step on a log scale caps any shift at the square root of the ratio, minus one: 9.5 percent at 1.2, 11.8 at 1.25 and 15.5 at 1.333. That is the most any size can move when it takes its nearest step. The case above moves nothing more than 5.0 percent, about half that cap, because the sizes were near the ladder already. Two measurements, then, one fixed by the maths and one by the case: the cap says how far a fit could push a size, and the actual maximum says how well the ratio suits the list.

Systems that moved to a ratio show the size of the move. Atlassian's typography team, in [its write-up](https://www.atlassian.com/blog/design/implementing-typography-at-scale-the-journey-behind-the-screens), says it built a scale "based on the minor third scale", which is 1.2, and moved the smallest heading and body sizes from 11 to 12 pixels for accessibility. Its published sizes are 12, 14, 16, 20, 24, 28 and 32 in [the typography docs](https://atlassian.design/foundations/typography/). Against a 1.2 ladder from 12 (14.4, 17.3, 20.7, 24.9, 29.9, 35.8), that is 14 within 0.4 pixels, 16 where the ladder has 17.3, and 28 and 32 where it has 29.9 and 35.8. The arithmetic is the toolkit's, and the reading it supports is that "based on" meant a shape, with sizes kept on a 4 pixel grid where the ladder missed it. A published scale can be near a ratio without being generated by one.

A forced move is a different kind. Atlassian's 11 to 12 was a floor, a 9 percent move accepted because 11 was too small. Moves like that are decided by the size's job, and only afterwards counted against the fit.

For the library, a rule that follows:

- Under 5 percent: take the step.
- 5 to 10 percent: take the step only if the size is not carrying a decision, such as a body size set for reading.
- Over 10 percent, or two levels landing on one step: keep the old size as a named exception, or choose another ratio.

*These cut-offs are the toolkit's reading of the cases above; no system read publishes a tolerance.*

Here is every shift in the library's fit against those lines.

<svg role="img" viewBox="0 0 720 360" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0" font-family="system-ui, sans-serif">
<title>Bars of the percentage each size moves under the 1.2 ladder from 12. Desktop sizes move up by 3.3 to 5.0 percent. Phone sizes move down by 2.7 to 5.6 percent. Dashed lines mark 5 and 10 percent each way.</title>
<rect width="720" height="360" fill="#f7f6f2"/>
<line x1="120" y1="36" x2="120" y2="336" stroke="#bbb" stroke-dasharray="4 3"/><text x="120" y="28" font-size="11" text-anchor="middle" fill="#555">-10%</text>
<line x1="250" y1="36" x2="250" y2="336" stroke="#bbb" stroke-dasharray="4 3"/><text x="250" y="28" font-size="11" text-anchor="middle" fill="#555">-5%</text>
<line x1="380" y1="36" x2="380" y2="336" stroke="#444"/><text x="380" y="28" font-size="11" text-anchor="middle" fill="#555">0</text>
<line x1="510" y1="36" x2="510" y2="336" stroke="#bbb" stroke-dasharray="4 3"/><text x="510" y="28" font-size="11" text-anchor="middle" fill="#555">+5%</text>
<line x1="640" y1="36" x2="640" y2="336" stroke="#bbb" stroke-dasharray="4 3"/><text x="640" y="28" font-size="11" text-anchor="middle" fill="#555">+10%</text>
<text x="150" y="56" font-size="12" text-anchor="end" fill="#222">Desktop 86 to 89</text><rect x="380.0" y="44" width="91.0" height="16" fill="#1f5fbf"/><text x="479.0" y="56" font-size="11" text-anchor="start" fill="#444">+3.5%</text>
<text x="150" y="80" font-size="12" text-anchor="end" fill="#222">60 to 62</text><rect x="380.0" y="68" width="85.8" height="16" fill="#1f5fbf"/><text x="473.8" y="80" font-size="11" text-anchor="start" fill="#444">+3.3%</text>
<text x="150" y="104" font-size="12" text-anchor="end" fill="#222">41 to 43</text><rect x="380.0" y="92" width="127.4" height="16" fill="#1f5fbf"/><text x="515.4" y="104" font-size="11" text-anchor="start" fill="#444">+4.9%</text>
<text x="150" y="128" font-size="12" text-anchor="end" fill="#222">29 to 30</text><rect x="380.0" y="116" width="88.4" height="16" fill="#1f5fbf"/><text x="476.4" y="128" font-size="11" text-anchor="start" fill="#444">+3.4%</text>
<text x="150" y="152" font-size="12" text-anchor="end" fill="#222">24 to 25</text><rect x="380.0" y="140" width="109.2" height="16" fill="#1f5fbf"/><text x="497.2" y="152" font-size="11" text-anchor="start" fill="#444">+4.2%</text>
<text x="150" y="176" font-size="12" text-anchor="end" fill="#222">20 to 21</text><rect x="380.0" y="164" width="130.0" height="16" fill="#1f5fbf"/><text x="518.0" y="176" font-size="11" text-anchor="start" fill="#444">+5.0%</text>
<text x="150" y="200" font-size="12" text-anchor="end" fill="#222">Phone 45 to 43</text><rect x="265.6" y="188" width="114.4" height="16" fill="#b5440f"/><text x="257.6" y="200" font-size="11" text-anchor="end" fill="#444">-4.4%</text>
<text x="150" y="224" font-size="12" text-anchor="end" fill="#222">37 to 36</text><rect x="309.8" y="212" width="70.2" height="16" fill="#b5440f"/><text x="301.8" y="224" font-size="11" text-anchor="end" fill="#444">-2.7%</text>
<text x="150" y="248" font-size="12" text-anchor="end" fill="#222">31 to 30</text><rect x="296.8" y="236" width="83.2" height="16" fill="#b5440f"/><text x="288.8" y="248" font-size="11" text-anchor="end" fill="#444">-3.2%</text>
<text x="150" y="272" font-size="12" text-anchor="end" fill="#222">26 to 25</text><rect x="281.2" y="260" width="98.8" height="16" fill="#b5440f"/><text x="273.2" y="272" font-size="11" text-anchor="end" fill="#444">-3.8%</text>
<text x="150" y="296" font-size="12" text-anchor="end" fill="#222">22 to 21</text><rect x="263.0" y="284" width="117.0" height="16" fill="#b5440f"/><text x="255.0" y="296" font-size="11" text-anchor="end" fill="#444">-4.5%</text>
<text x="150" y="320" font-size="12" text-anchor="end" fill="#222">18 to 17</text><rect x="234.4" y="308" width="145.6" height="16" fill="#b5440f"/><text x="226.4" y="320" font-size="11" text-anchor="end" fill="#444">-5.6%</text>
</svg>

No bar crosses 10, and two sit at 5.0 and 5.6 percent, a pixel each at 20 and 18. Only one of those is a decision: the phone's 18, which carries the reading text.

---

## Exceptions worth keeping

Keep a size off the ratio when it carries a decision the ratio does not, name it in the published list, and keep the count under a third of the list.

Which sizes carry decisions? Three kinds. A size set for reading: the phone's 18 is the one that stands out here, since 17 is on the ladder and 18 is not. A size set by a floor, as Atlassian's 12 minimum. And a size set to a number people remember, which [one type scale](one-type-scale-for-ui-and-content.md#building-a-shared-scale) covers for 48 and 72 on a 1.125 scale.

Shipping systems carry their exceptions in plain sight. [Radix's nine sizes](https://cdn.jsdelivr.net/npm/@radix-ui/themes/tokens.css) run 12, 14, 16, 18, 20, 24, 28, then 35 and 60. The last two are well off any ladder, and the list still states them as steps 8 and 9. [Spectrum](https://github.com/adobe/spectrum-design-data/blob/main/packages/tokens/src/typography.json) goes the other way. Its desktop sizes from 14 are 14, 16, 18, 20, 22, 25, 28, 32, 36, 40, 45, 51, 58, 65 and 73, which are 14 × 1.125ⁿ rounded once (15.75, 17.7, 19.9, 22.4, 25.2 and on to 72.8), with no exceptions to name.

How many exceptions a scale can carry is a judgement. The chained ladder above shows the limit. Keeping the library's old sizes would make 86, 60, 41, 29, 24 and 20 exceptions to the exact 1.2 formula, six of the nine desktop sizes, and the next person extending the list computes 89 and ships both. With one exception the formula still describes the list. With six it describes a neighbour of it.

Here, keep one, and decide it. The phone's 18 can stay as a named exception if it is the reading size and was set on purpose, or merge into 17 and lose 1 pixel on every paragraph. Which one holds depends on why 18 is there, and the sizes alone cannot say. Name any kept exception in the style's description, with the step it replaces ("body, phone: 18, replaces 17").

*The count limit is the toolkit's judgement, not a system's rule.*

---

## Mapping old sizes to new

Map every old size to its nearest step in one table, check that no two old levels share a step, and ship in two releases: new names on old values first, then the new values.

For the library, rounded once from 12 × 1.2ⁿ:

| Desktop | New | Shift | Phone | New | Shift |
|---|---|---|---|---|---|
| 86 | 89 | +3 (+3.5%) | 45 | 43 | -2 (-4.4%) |
| 60 | 62 | +2 (+3.3%) | 37 | 36 | -1 (-2.7%) |
| 41 | 43 | +2 (+4.9%) | 31 | 30 | -1 (-3.2%) |
| 29 | 30 | +1 (+3.4%) | 26 | 25 | -1 (-3.8%) |
| 24 | 25 | +1 (+4.2%) | 22 | 21 | -1 (-4.5%) |
| 20 | 21 | +1 (+5.0%) | 18 | 17 | -1 (-5.6%) |
| 17, 14, 12 | same | 0 | 17, 14, 12 | same | 0 |

Desktop moves 6 of 9 sizes up by 1 to 3 pixels. Phone moves 6 of 9 down by 1 to 2 and merges 18 into 17, leaving 8 distinct sizes. The two modes now share one list: 43, 30, 25, 21, 17, 14 and 12 serve both, 36 is phone only, and 62 and 89 are desktop only.

Check the table for collisions before any component is touched. The old desktop has 29 and 24, one step apart, and they land on 30 and 25, still one step apart. The check fails when two old levels were closer than the new ladder's step, as 18 and 17 are, and the answer then is a merge or a named exception, never two styles on one size.

The order of the migration matters more than the table. When Atlassian rebuilt its typography, it [built tokens and components to mimic the old system](https://www.atlassian.com/blog/design/implementing-typography-at-scale-the-journey-behind-the-screens), so the first release changed nothing visible, and the new scale arrived afterwards as a value change. Take the same two steps:

1. Introduce the new text-style names, and point each at the old size it replaces. In Figma, rename the text styles and leave the sizes. In code, rename the tokens and leave the values.
2. Change the values in one release, with the table above as the change list.

Step 1 turns "which style" into a settled question before "what size" is argued, and step 2 becomes a diff of nine numbers per mode, not a sweep through components.

---

## The display end

Shipping systems split three ways at the large sizes: a constant ratio, a ratio that falls, and a ratio that rises, and the rising group is the largest.

The knowledge base gives a ratio for the small steps and none for the large ones. Here is each system's median ratio between neighbours up to 24 pixels against neighbours from 32 up, worked out from the published lists in the table below.

<svg role="img" viewBox="0 0 720 360" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0" font-family="system-ui, sans-serif">
<title>For ten systems, two dots on a ratio axis from 1.0 to 1.8: the median ratio between neighbouring sizes up to 24 pixels (blue) and between neighbouring sizes from 32 pixels up (orange). Spectrum is level at about 1.12, Carbon falls from 1.14 to 1.11, and the rest rise, with Radix, GOV.UK and Fluent 2 rising most, to 1.71, 1.5 and 1.48.</title>
<rect width="720" height="360" fill="#f7f6f2"/>
<line x1="150" y1="40" x2="150" y2="330" stroke="#ddd"/><text x="150" y="350" font-size="11" text-anchor="middle" fill="#555">1.0</text>
<line x1="280" y1="40" x2="280" y2="330" stroke="#ddd"/><text x="280" y="350" font-size="11" text-anchor="middle" fill="#555">1.2</text>
<line x1="410" y1="40" x2="410" y2="330" stroke="#ddd"/><text x="410" y="350" font-size="11" text-anchor="middle" fill="#555">1.4</text>
<line x1="540" y1="40" x2="540" y2="330" stroke="#ddd"/><text x="540" y="350" font-size="11" text-anchor="middle" fill="#555">1.6</text>
<line x1="670" y1="40" x2="670" y2="330" stroke="#ddd"/><text x="670" y="350" font-size="11" text-anchor="middle" fill="#555">1.8</text>
<circle cx="160" cy="18" r="5" fill="#1f5fbf"/><text x="170" y="22" font-size="12" fill="#222">sizes up to 24</text><circle cx="290" cy="18" r="5" fill="#b5440f"/><text x="300" y="22" font-size="12" fill="#222">sizes from 32 up</text>
<text x="140" y="66" font-size="12" text-anchor="end" fill="#222">Spectrum</text><line x1="222.1" y1="62" x2="231.2" y2="62" stroke="#999"/><circle cx="222.1" cy="62" r="5" fill="#1f5fbf"/><circle cx="231.2" cy="62" r="5" fill="#b5440f"/><text x="241.2" y="66" font-size="11" fill="#444">1.12</text>
<text x="140" y="94" font-size="12" text-anchor="end" fill="#222">Carbon</text><line x1="243.0" y1="90" x2="220.8" y2="90" stroke="#999"/><circle cx="243.0" cy="90" r="5" fill="#1f5fbf"/><circle cx="220.8" cy="90" r="5" fill="#b5440f"/><text x="253.0" y="94" font-size="11" fill="#444">1.11</text>
<text x="140" y="122" font-size="12" text-anchor="end" fill="#222">Material 3</text><line x1="243.0" y1="118" x2="312.5" y2="118" stroke="#999"/><circle cx="243.0" cy="118" r="5" fill="#1f5fbf"/><circle cx="312.5" cy="118" r="5" fill="#b5440f"/><text x="322.5" y="122" font-size="11" fill="#444">1.25</text>
<text x="140" y="150" font-size="12" text-anchor="end" fill="#222">Primer</text><line x1="258.6" y1="146" x2="312.5" y2="146" stroke="#999"/><circle cx="258.6" cy="146" r="5" fill="#1f5fbf"/><circle cx="312.5" cy="146" r="5" fill="#b5440f"/><text x="322.5" y="150" font-size="11" fill="#444">1.25</text>
<text x="140" y="178" font-size="12" text-anchor="end" fill="#222">Red Hat</text><line x1="231.2" y1="174" x2="280.0" y2="174" stroke="#999"/><circle cx="231.2" cy="174" r="5" fill="#1f5fbf"/><circle cx="280.0" cy="174" r="5" fill="#b5440f"/><text x="290.0" y="178" font-size="11" fill="#444">1.20</text>
<text x="140" y="206" font-size="12" text-anchor="end" fill="#222">USWDS</text><line x1="200.0" y1="202" x2="258.6" y2="202" stroke="#999"/><circle cx="200.0" cy="202" r="5" fill="#1f5fbf"/><circle cx="258.6" cy="202" r="5" fill="#b5440f"/><text x="268.6" y="206" font-size="11" fill="#444">1.17</text>
<text x="140" y="234" font-size="12" text-anchor="end" fill="#222">Tailwind</text><line x1="243.0" y1="230" x2="366.4" y2="230" stroke="#999"/><circle cx="243.0" cy="230" r="5" fill="#1f5fbf"/><circle cx="366.4" cy="230" r="5" fill="#b5440f"/><text x="376.4" y="234" font-size="11" fill="#444">1.33</text>
<text x="140" y="262" font-size="12" text-anchor="end" fill="#222">Fluent 2</text><line x1="280.0" y1="258" x2="458.8" y2="258" stroke="#999"/><circle cx="280.0" cy="258" r="5" fill="#1f5fbf"/><circle cx="458.8" cy="258" r="5" fill="#b5440f"/><text x="468.8" y="262" font-size="11" fill="#444">1.48</text>
<text x="140" y="290" font-size="12" text-anchor="end" fill="#222">GOV.UK</text><line x1="296.3" y1="286" x2="475.0" y2="286" stroke="#999"/><circle cx="296.3" cy="286" r="5" fill="#1f5fbf"/><circle cx="475.0" cy="286" r="5" fill="#b5440f"/><text x="485.0" y="290" font-size="11" fill="#444">1.50</text>
<text x="140" y="318" font-size="12" text-anchor="end" fill="#222">Radix</text><line x1="243.0" y1="314" x2="614.1" y2="314" stroke="#999"/><circle cx="243.0" cy="314" r="5" fill="#1f5fbf"/><circle cx="614.1" cy="314" r="5" fill="#b5440f"/><text x="624.1" y="318" font-size="11" fill="#444">1.71</text>
</svg>

Spectrum sits level and Carbon falls; every other system rises, and three rise a lot. Each system's sizes were read from its tokens or docs, and the ratios between neighbours are the toolkit's arithmetic.

| System | Largest sizes in the list | Last three ratios |
|---|---|---|
| [Spectrum](https://github.com/adobe/spectrum-design-data/blob/main/packages/tokens/src/typography.json) | 51, 58, 65, 73 | 1.14, 1.12, 1.12 |
| [Carbon](https://github.com/carbon-design-system/carbon/blob/main/packages/type/src/scale.ts) | 122, 132, 144, 156 | 1.08, 1.09, 1.08 |
| [Material 3](https://github.com/material-components/material-web/blob/main/tokens/versions/latest/sass/_md-sys-typescale.scss) | 32, 36, 45, 57 | 1.12, 1.25, 1.27 |
| [Red Hat](https://ux.redhat.com/foundations/typography/scale-and-rhythm/) | 48, 64, 80, 96 | 1.33, 1.25, 1.20 |
| [Tailwind](https://github.com/tailwindlabs/tailwindcss/blob/main/packages/tailwindcss/theme.css) | 60, 72, 96, 128 | 1.2, 1.33, 1.33 |
| [Primer](https://cdn.jsdelivr.net/npm/@primer/primitives/dist/css/base/typography/typography.css) | 16, 20, 32, 40 | 1.25, 1.6, 1.25 |
| [Fluent 2](https://cdn.jsdelivr.net/npm/@fluentui/tokens/lib/global/fonts.js) | 28, 32, 40, 68 | 1.14, 1.25, 1.70 |
| [GOV.UK](https://design-system.service.gov.uk/styles/type-scale/) | 27, 36, 48, 80 | 1.33, 1.33, 1.67 |
| [Radix Themes](https://cdn.jsdelivr.net/npm/@radix-ui/themes/tokens.css) | 24, 28, 35, 60 | 1.17, 1.25, 1.71 |

Spectrum is the constant case: 1.125 from 14 up to 73, display included. Carbon is the falling case. Its [scale function](https://github.com/carbon-design-system/carbon/blob/main/packages/type/src/scale.ts) adds an increment that grows by 2 every fourth step ("Yn = Yn-1 + {FLOOR[(n - 2) / 4] + 1} * 2" in its comment), so the ratio slides from 1.17 at 12 to 1.08 at 156. USWDS does the same with a literal map that climbs 12 to 140 in growing jumps. In both, a display size is the same kind of step as a body size, only larger.

Material 3 rises modestly, from a median of 1.14 to 1.25. GOV.UK, Fluent 2 and Radix Themes rise most, and all three through one jump to the top size: 48 to 80, 40 to 68 and 35 to 60, between 1.67 and 1.71. Three systems land within 0.04 of each other.

Why would a display step be larger than a body step? No system read says. GOV.UK says only that 80 is ["only used in exceptional circumstances"](https://design-system.service.gov.uk/styles/type-scale/) and gives no rule for how the sizes were chosen. Two reasons fit what the lists show, offered as the toolkit's inference and not as a finding:

- A display size stands alone. It rarely sits beside the next size down, so the jump has to make a new role, not a new rung.
- A display size is a pick, not a ladder step. A system that publishes 80 and 120 is publishing two uses, and the numbers between them have none.

Two designs make this precise: the scale with a second ratio, and the scale with a skipped step. Tim Brown's [modular-scale article](https://alistapart.com/article/more-meaningful-typography/) describes combining two bases, 10 and 20 on one ratio, as "double-stranded scales", to give more measurement options, and treats the numbers as adjustable. Utopia, a [fluid type calculator](https://utopia.fyi/type/), takes a ratio for the small viewport and a separate one for the large one, with defaults of 1.2 and 1.25, and [its guide](https://utopia.fyi/blog/designing-with-fluid-type-scales/) gives an example of 1.2 at 320 pixels and 1.333 at 1500. That varies the ratio across widths, not across sizes, but it shows the same idea: ratios are inputs a team can set twice.

The library has already chosen between them. Its display steps of 1.41, 1.46 and 1.43 are 1.2 twice, so one ladder with skipped steps, 43, 62 and 89, gives the display end a ratio of 1.44 without a second ratio, and keeps 36 for the phone. A second ratio of 1.414 gives 42, 60 and 84, and no 36. **Where the display end needs bigger jumps, walk one ladder at two steps, before adding a second ratio.** A second ratio is for a product that needs a jump the ladder's double step does not give, such as the 1.7 that GOV.UK, Fluent and Radix make at the top.

---

## What the fit costs

The cost is the number of styles that change, the layouts where text width matters, and one review pass per mode; it is smaller than the cost of the next ten untracked sizes.

Count by styles first. For the library, 6 desktop sizes and 6 phone sizes move, and one phone size merges. Each moved size is one style edit in the design file and one token edit in code, if the styles are named by role and size as [naming text styles](naming-text-styles.md) recommends. Every component using the style follows. Without that, the count is the number of text layers using the size.

Then the layouts where a pixel matters. A shift of 5 percent is invisible on a heading and shows on a label that hugs its content. Take an illustrative button whose label is 120 pixels wide at 20 pixels. At 21 it is 126, 6 pixels more, which wraps a label in a fixed-width cell and truncates one in a table column. The shifts here are all upward on the desktop (up to 3 pixels at 89) and downward on the phone, so the desktop review is for wrapping and the phone review is for room.

Review in three passes:

1. Components with a fixed width or `text-overflow` set, at the sizes that moved up.
2. Headings that wrap, at their longest real text, at the desktop sizes that moved.
3. The phone's reading text, where 18 became 17, at 375 pixels.

Take screenshots before step 2 of the migration and compare after. Atlassian's pilot teams ran workshops and cross-browser bug-bashes for the same reason. Each pass works from the list of moved sizes, which the table above is.

The benefit, against that: a new size now has a place. The next heading takes a step of the list, or it is a named exception, and the list stays as long as it is.

---

## Cheat sheet

| Decision | Do | Do not |
|---|---|---|
| Find the ratio | divide neighbouring sizes; look for 1.2 and 1.44 | choose a ratio first |
| Base | the most-used size, or the one both modes sit nearest | a base that fits one mode and moves the other 9% |
| Ratio | the one the sizes show (1.2 here) | 1.25 or 1.333 when old levels would collide |
| Rounding | round once, from the exact product | multiply rounded numbers (86 for 89) |
| Tolerance | under 5% take the step; 5 to 10% only if no decision rides on it | move a size more than 10% or onto a shared step |
| Exceptions | keep the ones that carry a decision; name them; under a third | an exception nobody can explain |
| Display end | one ladder, skipping every second step | a second ratio before the double step fails |
| Mapping | one table, old to new, collisions checked first | editing components one by one |
| Migration | new names on old values, then new values | renaming and resizing in one release |
| Review | fixed widths, wrapped headings, phone reading text | a full visual sweep with no list |

---

## The short version

A scale that grew by hand usually has a ratio in it. Divide each size by its neighbour: the library's steps are about 1.2 up to 29 and about 1.44, which is 1.2 twice, above it, and its sizes are a 1.2 ladder from 12 with the rounding carried forward. The fit is a correction, not a redesign.

Build the ladder by multiplying 12 by 1.2 and rounding each product once: 12, 14, 17, 21, 25, 30, 36, 43, 52, 62, 74, 89. Desktop moves six sizes by 1 to 3 pixels, the largest shift being 5 percent. Phone moves six by 1 to 2 and merges 18 into 17, unless 18 is the reading size, when it stays as one named exception. A ratio of 1.25 or 1.333 moves sizes 12 to 14 percent and merges levels that were distinct. A base of 14 fits the desktop better and the phone worse.

At the display end, systems do three things: Spectrum keeps one ratio, Carbon and USWDS let it fall, and Material, Red Hat, Tailwind, GOV.UK, Fluent and Radix let it rise, three of them by a jump of about 1.7 at the top. None says why. Where the product needs bigger display jumps, skip steps on the one ladder; a second ratio is for a jump the double step does not reach.

Migrate in two releases: new style names on old sizes, then new sizes, with the mapping table as the change list. Write down the ladder, the base, the ratio, the tolerance and each named exception with the step it replaces. The cut-offs for tolerance and exception count are the toolkit's judgements. Everything else is arithmetic from published sizes.

---

## What to re-check later

Researched 2026-11-24.

- **How the numbers were read.** Sizes from Spectrum tokens (the `adobe/spectrum-design-data` repository's `typography.json`; `@adobe/spectrum-tokens` 15.9.1 on npm points to it), Carbon `scale.ts` and `styles.ts`, Material Web tokens, GOV.UK's type scale page, Fluent's tokens file, Radix Themes' tokens CSS, Primer's base typography CSS, Tailwind's `theme.css` and USWDS's `type-scale.scss`, each from the main branch on 2026-11-24. Ratios between them are the toolkit's arithmetic.
- **Red Hat's sizes** were read from its documentation page through a summariser and not from source; recheck before quoting.
- **GOV.UK's "exceptional circumstances" wording** was read through a summariser; check it on the page.
- **Utopia's step count** and its defaults come from the calculator page, and its guide's 1.2 and 1.333 example from the article; neither states why a team would set two ratios.
- **Atlassian** says "based on the minor third scale" and gives no base or ratio, no old size list and no codemod. The comparison with a 1.2 ladder is the toolkit's.
- **The library's chained rounding** is a match of numbers, not a record of how the scale was built; eight of nine sizes agree and 41 does not.
- **Why display steps rise** has no source. The two reasons are inference. A system's own design notes, if published, would settle it.
- **The tolerance bands** (5 and 10 percent) and the exception limit (a third of the list) are judgements. No system read publishes a tolerance or an exception count.
- **Not rendered.** The three figures were drawn from computed positions and not checked in a browser.

---

## Sources

**Primary: system source, tokens and documentation**

- [Spectrum tokens, `typography.json`](https://github.com/adobe/spectrum-design-data/blob/main/packages/tokens/src/typography.json). Desktop and mobile `font-size-*` values.
- [Carbon, `scale.ts`](https://github.com/carbon-design-system/carbon/blob/main/packages/type/src/scale.ts) and [`styles.ts`](https://github.com/carbon-design-system/carbon/blob/main/packages/type/src/styles.ts). The generated scale and the display breakpoints.
- [Material Web, `_md-sys-typescale.scss`](https://github.com/material-components/material-web/blob/main/tokens/versions/latest/sass/_md-sys-typescale.scss). Display, headline, title, body and label sizes.
- [GOV.UK, type scale](https://design-system.service.gov.uk/styles/type-scale/). The scale points and the use of 80.
- [Fluent 2 tokens, `fonts.js`](https://cdn.jsdelivr.net/npm/@fluentui/tokens/lib/global/fonts.js). Base and hero sizes.
- [Radix Themes, `tokens.css`](https://cdn.jsdelivr.net/npm/@radix-ui/themes/tokens.css). The nine font sizes.
- [Primer primitives, base typography CSS](https://cdn.jsdelivr.net/npm/@primer/primitives/dist/css/base/typography/typography.css). The text sizes.
- [Tailwind CSS, `theme.css`](https://github.com/tailwindlabs/tailwindcss/blob/main/packages/tailwindcss/theme.css). The text size variables.
- [USWDS, `type-scale.scss`](https://github.com/uswds/uswds/blob/develop/packages/uswds-core/src/styles/tokens/font/type-scale.scss). The system type scale.
- [Red Hat Design System, scale and rhythm](https://ux.redhat.com/foundations/typography/scale-and-rhythm/). Heading, expressive and body sizes.
- [Atlassian, typography](https://atlassian.design/foundations/typography/). The size and line-height table.
- [Atlassian, implementing typography at scale](https://www.atlassian.com/blog/design/implementing-typography-at-scale-the-journey-behind-the-screens). The minor third scale, 11 to 12 and the mimic-first migration.
- [Utopia, type calculator](https://utopia.fyi/type/) and [designing with fluid type scales](https://utopia.fyi/blog/designing-with-fluid-type-scales/). Ratios per viewport.

**Commentary**

- [Tim Brown, More Meaningful Typography](https://alistapart.com/article/more-meaningful-typography/), A List Apart. Double-stranded scales and rounding values.

**Toolkit sister pieces**

- [One type scale for an interface and its articles](one-type-scale-for-ui-and-content.md), [type on a phone](type-on-a-phone.md) and [naming text styles](naming-text-styles.md).
