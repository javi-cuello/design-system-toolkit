# Reference scales — fixture data for `test-oklch.js`

Verified expected output for six validated sources, 72 solid values, every column asserted by `tests/test-oklch.js`. **These are test fixtures, not a second specification** — if a code change produces different numbers, the code is what changed and this file is regenerated from it, never the other way round.

Regenerate a block with `node scripts/generate.js '<hex>' --mode <mode> [--dark] --table` and copy the L, C, H and Hex columns across.

This table lived in `SKILL.md` until v1.8.0, where it was ~1,300 tokens loaded on every activation of a skill that only needs it when verifying the engine. It moved here for that reason, and the move immediately paid for itself: nothing had ever asserted the C column, and two of Yellow's chroma values had drifted from the engine — step 8 by 0.0001 and step 10 by 0.0015 — while their hexes still matched, which is why the hex-only suite never saw it. Both are corrected here from the engine's own output, and `test-oklch.js` now reads this file and asserts L, C, H and hex on all 72 values.


## Blue — `#1A6FBF` — free mode
Source: `oklch(0.5363 0.1467 251.94)`

| Step | L | OKLCH | Hex |
|------|------|------|------|
| 1 | 0.993 | oklch(0.993 0.0026 251.94) | #FBFDFE |
| 2 | 0.980 | oklch(0.980 0.0095 251.94) | #F4F9FF |
| 3 | 0.950 | oklch(0.950 0.0241 251.94) | #E3F0FF |
| 4 | 0.920 | oklch(0.920 0.0398 251.94) | #D2E7FF |
| 5 | 0.890 | oklch(0.890 0.0553 251.94) | #C1DEFF |
| 6 | 0.790 | oklch(0.790 0.0865 251.94) | #92BFF1 |
| 7 | 0.690 | oklch(0.690 0.1052 251.94) | #6A9FDB |
| 8 | 0.590 | oklch(0.590 0.1253 251.94) | #3F80C5 |
| 9 | 0.520 | oklch(0.520 0.1467 251.94) | #126ABA |
| 10 | 0.419 | oklch(0.419 0.1144 247.94) | #004F87 |
| 11 | 0.359 | oklch(0.359 0.0989 247.94) | #003F6D |
| 12 | 0.300 | oklch(0.300 0.0840 247.94) | #002F55 |

## Green — `#109858` — free mode
Source: `oklch(0.5986 0.1441 155.05)`

| Step | L | OKLCH | Hex |
|------|------|------|------|
| 1 | 0.993 | oklch(0.993 0.0102 155.05) | #F8FFFA |
| 2 | 0.980 | oklch(0.980 0.0280 155.05) | #EAFEF0 |
| 3 | 0.950 | oklch(0.950 0.0394 155.05) | #DBF7E3 |
| 4 | 0.920 | oklch(0.920 0.0528 155.05) | #CAF0D6 |
| 5 | 0.890 | oklch(0.890 0.0681 155.05) | #B8E9C7 |
| 6 | 0.790 | oklch(0.790 0.0850 155.05) | #8ECBA3 |
| 7 | 0.690 | oklch(0.690 0.1033 155.05) | #63AE7F |
| 8 | 0.590 | oklch(0.590 0.1231 155.05) | #31925C |
| 9 | 0.520 | oklch(0.520 0.1201 159.05) | #007D4F |
| 10 | 0.409 | oklch(0.409 0.0950 159.05) | #005937 |
| 11 | 0.350 | oklch(0.350 0.0816 159.05) | #00472A |
| 12 | 0.292 | oklch(0.292 0.0699 159.05) | #00361F |

## Red — `#B91C1C` — free mode
Source: `oklch(0.5054 0.1905 27.52)`

| Step | L | OKLCH | Hex |
|------|------|------|------|
| 1 | 0.993 | oklch(0.993 0.0034 27.52) | #FFFCFB |
| 2 | 0.980 | oklch(0.980 0.0090 27.52) | #FFF6F5 |
| 3 | 0.950 | oklch(0.950 0.0250 27.52) | #FFE9E5 |
| 4 | 0.920 | oklch(0.920 0.0408 27.52) | #FFDBD6 |
| 5 | 0.890 | oklch(0.890 0.0570 27.52) | #FFCDC6 |
| 6 | 0.790 | oklch(0.790 0.1124 23.52) | #FB9D98 |
| 7 | 0.690 | oklch(0.690 0.1366 23.52) | #E47672 |
| 8 | 0.590 | oklch(0.590 0.1627 23.52) | #CC4C4C |
| 9 | 0.520 | oklch(0.520 0.1905 27.52) | #BE2321 |
| 10 | 0.442 | oklch(0.442 0.1772 27.52) | #9E060E |
| 11 | 0.378 | oklch(0.378 0.1558 27.52) | #810006 |
| 12 | 0.315 | oklch(0.315 0.1312 27.52) | #640003 |

## Yellow — `#CA8A04` — free mode
Source: `oklch(0.6806 0.1423 75.83)`

| Step | L | OKLCH | Hex |
|------|------|------|------|
| 1 | 0.993 | oklch(0.993 0.0130 97.70) | #FFFDF3 |
| 2 | 0.980 | oklch(0.980 0.0276 96.79) | #FDF9E4 |
| 3 | 0.950 | oklch(0.950 0.0389 94.69) | #F7EFD2 |
| 4 | 0.920 | oklch(0.920 0.0522 92.59) | #F1E4BE |
| 5 | 0.890 | oklch(0.890 0.0673 90.49) | #ECDAA8 |
| 6 | 0.790 | oklch(0.790 0.0839 83.49) | #D5B67B |
| 7 | 0.690 | oklch(0.690 0.1021 76.49) | #BF934E |
| 8 | 0.590 | oklch(0.590 0.1215 69.49) | #AB6E15 |
| 9 | 0.520 | oklch(0.520 0.1173 64.59) | #965800 |
| 10 | 0.428 | oklch(0.428 0.1033 58.15) | #783E00 |
| 11 | 0.368 | oklch(0.368 0.0941 53.94) | #642E00 |
| 12 | 0.309 | oklch(0.309 0.0854 49.81) | #501F00 |

## Grey — `#6A6A6A` — grey mode
Source: `oklch(0.5243 0.0000 89.88)`

| Step | L | OKLCH | Hex |
|------|------|------|------|
| 1 | 0.993 | oklch(0.993 0.0000 89.88) | #FDFDFD |
| 2 | 0.980 | oklch(0.980 0.0000 89.88) | #F8F8F8 |
| 3 | 0.950 | oklch(0.950 0.0000 89.88) | #EEEEEE |
| 4 | 0.920 | oklch(0.920 0.0000 89.88) | #E4E4E4 |
| 5 | 0.890 | oklch(0.890 0.0000 89.88) | #DBDBDB |
| 6 | 0.790 | oklch(0.790 0.0000 89.88) | #BABABA |
| 7 | 0.690 | oklch(0.690 0.0000 89.88) | #9B9B9B |
| 8 | 0.590 | oklch(0.590 0.0000 89.88) | #7D7D7D |
| 9 | 0.520 | oklch(0.520 0.0000 89.88) | #696969 |
| 10 | 0.420 | oklch(0.420 0.0000 89.88) | #4D4D4D |
| 11 | 0.330 | oklch(0.330 0.0000 89.88) | #353535 |
| 12 | 0.200 | oklch(0.200 0.0000 89.88) | #161616 |

## Blue dark — `#1A6FBF` — free mode dark
Source: `oklch(0.5363 0.1467 251.94)`

| Step | L | OKLCH | Hex |
|------|------|------|------|
| 1 | 0.180 | oklch(0.180 0.0166 251.94) | #0C1219 |
| 2 | 0.210 | oklch(0.210 0.0242 251.94) | #101923 |
| 3 | 0.240 | oklch(0.240 0.0341 251.94) | #13202F |
| 4 | 0.270 | oklch(0.270 0.0457 251.94) | #15283C |
| 5 | 0.300 | oklch(0.300 0.0589 251.94) | #162F4A |
| 6 | 0.400 | oklch(0.400 0.0735 251.94) | #284A6E |
| 7 | 0.500 | oklch(0.500 0.0894 251.94) | #3B6695 |
| 8 | 0.600 | oklch(0.600 0.1065 251.94) | #4E83BE |
| 9 | 0.700 | oklch(0.700 0.1247 251.94) | #61A2E9 |
| 10 | 0.777 | oklch(0.777 0.1159 247.94) | #78BDFD |
| 11 | 0.849 | oklch(0.849 0.0778 247.94) | #A5D3FF |
| 12 | 0.930 | oklch(0.930 0.0353 247.94) | #D6EBFF |
