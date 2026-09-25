---
workflow: general-video
flow: automation
storyboard: no
message: "Prashant builds voice AI and the Go services that keep it on the line, from Zomato to Walmart to stdlib."
destination: website-and-social
aspect: 1920x1080
language: en
audience: recruiters and engineers
length: 15s
angle: showreel
narration: no
---

## Intent

A 15-second motion-graphics showreel built from Prashant's résumé
(`public/resume.pdf`). User's words: "a dynamic 15-second motion graphics
video about me using my resume that shows what an incredible motion designer
you are, like it's your showreel for a résumé. go all out."

Chosen concept (autonomous pitch round): **SIGNAL, one blue line and no cuts
in 15 seconds.** The blue signal colour from his portfolio is a single line
that never breaks. It types his hello, turns into a voice waveform, routes a
phone call, splits into three metric lanes, becomes the stdlib main branch,
rotates into a type rail, curls into his ASCII donut, and finally underlines
his name. Every scene hands the line to the next one, so the transitions are
shape matches instead of cuts. Each scene shows a different technique:
typewriter, procedural oscilloscope, path routing, data viz, generative git
graph with count-up, slot ticker, hand-rolled 3D ASCII, and a logo lockup.

Most typical direction left behind: the animated résumé slideshow (logo grid,
bullet fades, matrix code rain).

## Assets

- ../../public/resume.pdf: source of every claim in the video.
- ../../src/data/profile.json: headline ("…the Go services that keep it on the line").
- ../../src/components/home/AsciiDonut.tsx: donut.c renderer, ported frame-exact.
- ../../src/components/layout/WorkbenchGrid.tsx: 48px grid with blue traces, ported deterministically.

## Customizations

- Original score written to the edit: 128 BPM, 8 bars = exactly 15.0 s,
  synthesized from code (no licensed music) plus bundled SFX where they fit.
- Brand system from the portfolio: black ground, cool off-white ink, one blue
  signal colour; Young Serif display, Instrument Sans, JetBrains Mono,
  Silkscreen.

## Notes

- Every fact comes from the résumé. The PR count is "145+" as printed there
  (the site's profile says 160+; flag this to the user).
- Owner dislikes AI-looking design: no gradient washes, glow, or neon. Blue is
  the only colour.
- Casual lowercase first-person voice for the hello ("hi, prashant here").
