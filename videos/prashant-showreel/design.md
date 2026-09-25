---
colors:
  ground: "#060709"   # hsl(220 22% 3%), the portfolio's dark background
  panel: "#111318"
  hair: "#31363f"
  ink: "#e6ebf0"      # hsl(210 25% 92%)
  muted: "#929caa"    # hsl(215 12% 62%)
  signal: "#4798f5"   # hsl(212 90% 62%), the one accent
  signal_deep: "#0f5abd"
typography:
  display: { family: "Young Serif", weight: 400 }
  body: { family: "Instrument Sans", weight: "400-700" }
  machine: { family: "JetBrains Mono", weight: "400, 700" }
  pixel: { family: "Silkscreen", weight: "400, 700" }
spacing:
  grid: 48px          # the WorkbenchGrid cell; content snaps to it
  margin: 192px       # four cells in from each edge
---

## Overview

The portfolio's "polyglot's workbench" moved to video: a black ground with a
faint 48px line grid and blue traces, cool off-white ink, and one blue signal
colour. Young Serif is the human voice, JetBrains Mono the machine's.

## Rules

- Blue is the only colour. Chromatic effects use two blues, never red/green.
- No gradient washes, glows or card shadows (owner preference). Depth comes
  from the grid, the traces, grain, ghost numerals and motion.
- The signal line is always 3px #4798f5 and is never cut: every scene starts
  from the previous scene's line geometry.
- Fonts are embedded from `assets/fonts/` with root-relative `@font-face` in
  each composition (sub-compositions need their own declarations).
