# Reel motion and type for the site (26 Sep 2026)

Brief: bring the showreel's animation and type (PR #1, `videos/prashant-showreel`)
to the site, so someone who watched the reel recognises the site as the same
piece of work. Work lands on local `main`; nothing is pushed.

## Decisions

Made while brainstorming on 25–26 Sep 2026.

- **Intensity: signature moments.** A hero intro plays once. Each section then
  plays one move from the reel as it scrolls in, and the page sits still.
- **Type: the reel's type system** on the site's four existing families.
- **Pages: all of them.** The set pieces (hero intro, odometers, language reel,
  wins, packet) live on home, where their content is.
- **Extras: all four.** Experience packet, language reel, typed contact, index
  playhead.
- **Build: a hand-rolled motion kit.** No new runtime dependencies.

This replaces the 13 Sep motion budget ("the banner, the donut, and the grid
traces are the only motion; no per-section reveals").

## Type

- `.label` in `globals.css`: JetBrains Mono, 11px (12px from `sm`), uppercase,
  `letter-spacing: 0.18em`, `font-variant-numeric: tabular-nums`, muted ink.
  It is the reel's on-screen label voice.
- Section labels sit above serif headings as `NN / NAME`. Home: 02 / GITHUB,
  03 / EXPERIENCE, 04 / PROJECTS, 05 / OPEN SOURCE, 06 / ACHIEVEMENTS,
  07 / SKILLS, 08 / CONTACT. The hero has no label; the typed greeting opens it.
- Page labels copy the reel's "PKY / SHOWREEL 2026": PKY / WORK, PKY / PROJECTS,
  PKY / CONTACT, PKY / PRIVACY, PKY / 404. The /experience sub-sections are
  01 / INTERNSHIPS, 02 / OPEN SOURCE, 03 / EDUCATION, 04 / ROLES AT COLLEGE.
- Serif headings go up a step. `SectionHeading` goes from 1.5rem / 1.6rem (`sm`)
  to 1.75rem / 2.1rem. Page titles go from 2.25rem / 3rem to 2.75rem / 3.75rem.
- The greeting "hi, prashant here" moves to JetBrains Mono at 2rem (2.5rem from
  `sm`). It wraps where it does today and keeps the 👋.
- `.label` also sets the date and place columns in `ExperienceLedger` and
  `Timeline` (MAY 2026 / TO JULY 2026 / BENTONVILLE), tech lists joined with
  " · ", the GitHub stat captions, the PR ages in `PullRequestTabs`, and the
  index rail.
- Big numbers stay in Young Serif, as the reel's odometer and ghost numerals do:
  the open-source count and the four GitHub stats.
- Unchanged: body copy (Instrument Sans), buttons, header, footer.

## Motion kit

### `src/lib/motion.ts`

Pure functions and constants with no DOM access, covered by unit tests.

- `BEAT = 60 / 128` seconds (0.46875), the reel's tempo.
- Eases: `clamp01`, `power3Out`, `power4Out`, `expoOut`, `backOut(s)`, matching
  GSAP's curves of the same names.
- `GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+/<>"` and
  `scramble(target, p, seed)`, the reel's chrome decoder. At progress `p`,
  character `i` has settled when `i < p × length × 1.15`. Spaces always pass
  through. Unsettled characters are drawn from `GLYPHS` with a hash of
  `(seed, i, floor(p × 20))`, so the flicker re-seeds 20 times per run and the
  same inputs give the same output.
- `typeTimes(text, { start, step, pause })` returns one reveal time per
  character. Each character after the first adds `step`, plus `pause` when the
  previous character is `,` `.` `!` `?` or `:`, plus a deterministic jitter of
  up to ±4ms. The output is strictly increasing. With `{ start: 0.3, step: 0.04,
  pause: 0.04 }` the greeting's last character lands between 0.95s and 1.05s,
  like the reel's (0.996s).
- `reelClicks(n)` returns `n` click times, `t_j = Σ_{k=0..j} 0.075 × 1.125^k`
  seconds, so the first click is at 0.075 and each gap is 12.5% longer than the
  last. For `n = 8` each time is within 30ms of the reel's
  `[0.075, 0.16, 0.25, 0.35, 0.465, 0.6, 0.76, 0.935]`.
- `reelPos(t, clicks)` returns the reel's fractional word index at time `t`.
  Step `j` eases with power3.out over `min(0.07, 0.7 × gap)`. The last step
  uses back.out(2.2) over 0.34s. The result ends exactly on `clicks.length`.
- `countCurve(p) = (1 − 66.7^−p) / (1 − 1/66.7)` is the reel's exponential count:
  fast off the mark, long settle. It maps 0 to 0 and 1 to 1.
- `digitPositions(v, places)` returns one strip offset per place, in `[0, 10)`,
  following a mechanical odometer. The ones place is `v mod 10` and turns
  continuously. Place `k ≥ 1` is `floor(v / 10^k) mod 10` plus a carry of
  `max(0, (v mod 10^k) − (10^k − 1))`, so it only turns while every place below
  it rolls from 9 to 0. When `v` is a whole number each offset equals that
  place's digit (145 gives 5, 4, 1).

### Components

All live in `src/components/motion/` and are client components.

- **`useReveal(ref, options)`** fires once when about a third of the element is
  on screen, or on mount when asked. It reports whether to animate or to show
  the final state (reduced motion, or scripts that started after the failsafe).
- **`TypeOn`** reveals a string one character at a time behind the blue block
  cursor, using `typeTimes`. The whole string is laid out from the first paint;
  hidden characters keep their width. Screen readers read an sr-only copy.
- **`Scramble`** decodes `.label` text over 0.45s when revealed: on view for
  section labels, on mount for page labels.
- **`Odometer`** gives each place a strip of Young Serif digits (0 to 9, then 0
  again) and rolls it with `digitPositions(countCurve(p) × value)` over 1.06s.
  Each strip gets a vertical blur proportional to its speed, at most 6px.
  Leading places fade in as the count reaches them. Group separators are
  static. An optional suffix ("+") springs in afterwards: scale 0 → 1 and
  −90° → 0, back.out(2.4) over 0.34s.
- **`LangReel`** sets "fluent in ___" in Young Serif. The words are the
  Languages group from `profile.json` in data order, with Go moved last and
  shown as "Go.". It steps through them on `reelClicks` and lands on "Go.". The
  window is one line tall and as wide as the widest word.
- **`Rule`** becomes a client component with the same API. On reveal a dot lands
  at the centre (80ms). A 2px signal line unzips from it to both viewport edges
  over 0.5s (power3.out), holds one beat, then fades over 0.4s. The rail ticks
  turn signal blue as the line reaches them and stay blue. Blue ticks are also
  the final and the static state.
- **`AchievementsList`** slams in the achievements that have a `mark`, one beat
  apart, with the reel's three entrances scaled to the column:
  1. scale 1.5 → 1 and blur 14px → 0, power4.out over 0.24s;
  2. x −40px → 0 and skewX −16° → 0, expo.out over 0.3s;
  3. y 28px → 0 and rotate 6° → 0, back.out(1.6) over 0.36s.

  A fourth marked item would reuse the first entrance. Each marked row shows its
  mark as a ghost numeral: Young Serif, transparent fill, a 1.5px stroke at 16%
  ink, right-aligned behind the text, `aria-hidden`. Unmarked rows fade up 8px
  after the last slam, 0.12s apart.
- **`PacketTrack`** wraps the home experience list. A hairline runs down the
  left of the list with a 5px node beside each job; the list gains left padding
  so the line clears the date column. On reveal a packet (a 5px
  signal square with a short fading trail) runs top to bottom, one beat per
  job. Each node turns blue with one ring ping as the packet passes. In the
  final state every node is blue.
- **`HeroGreeting`** runs the hero intro (see Page map).
- **`PageTitle`** is the page header. Its label scrambles. The serif title rises
  out of a mask (expo.out, 0.6s), and a 1px signal line unzips under it from
  the centre (0.4s) and then fades. It plays on mount.
- **`IndexRail`** (edited): entries become `.label` rows, 01 INTRO to
  08 CONTACT. A 2px × 14px signal playhead sits on a hairline left of the list
  and springs to the active row (back.out, 0.34s). Sections that share a row
  (Open source and Achievements) light up together.
- **`WorkbenchGrid`** (edited): on the first page load of a tab session the grid
  powers on from the viewport centre outwards over 1.1s (expo.out), as the
  reel's ground does.

### Rules every piece follows

1. **The server renders the finished page.** An inline script in `<head>` sets
   `data-motion` on `<html>` before the first paint, but only when scripts run
   and the visitor hasn't asked for reduced motion. "Before" states apply only
   under `html[data-motion]` inside
   `@media (prefers-reduced-motion: no-preference)`. With no JavaScript, or with
   reduced motion on, visitors get the finished page and nothing flashes.
2. **Failsafe.** If the kit's scripts haven't started 3s after load, CSS reveals
   everything still hidden. Those pieces then stay static for that page view.
3. **No layout shift.** Text reserves its final size while it types, decodes or
   rolls.
4. **Screen readers** get the plain text. Animated glyphs are `aria-hidden`.
5. **Plays once.** Each move plays once per page view. The hero intro and the
   grid power-on play once per tab session, under sessionStorage keys
   `pky:hello` and `pky:grid`. Reads and writes are wrapped in try/catch.
6. **Reduced motion is followed live,** as the donut already does. Turning it on
   mid-move jumps to the final state.
7. **Only transform, opacity, filter and canvas drawing animate.** Every loop
   stops when its move ends.

## Page map

### Home, on load

This is the hero intro. It plays on the first visit to home in a tab session,
with times from page load on the reel's clock:

| Time | What happens |
|---|---|
| 0.12–1.2s | The grid powers on from the centre. |
| 0.3–1.0s | "hi, prashant here" types in mono behind the blue block cursor. |
| 1.15s | The cursor snaps into a 10px signal dot on the baseline, like a full stop, and a ring expands from it and fades. |
| 1.875s | Four beats in, the dot springs into the 👋 (back.out(2.4), 0.34s). |

The first build also had the dot unzip a signal line under the greeting out to
the rails. The owner asked for it to be removed on 27 Sep 2026.

Only the greeting waits. The bio, bullets, buttons, socials, donut and banner
are there from the first paint. On later visits in the same tab session the
greeting is simply there.

The greeting's hidden state needs its own marker, because `data-motion` is set
on every load. The head script also sets `data-hello` on `<html>` when the page
is `/` and `pky:hello` is unset. The greeting's before state applies only under
`html[data-hello]`. If the first visit to home comes from a client-side
navigation, `HeroGreeting` sets the same marker in a layout effect, before the
browser paints. It removes the marker when the intro ends.

### Home, as you scroll

| # | Section | What moves |
|---|---|---|
| 02 | GitHub | Label decodes, rule draws. The four stats roll as odometers, each starting a quarter beat after the one before. This replaces `StatsCounter`. |
| 03 | Experience | Label decodes, rule draws. The packet runs down the list and lights each job. |
| 04 | Projects | Label decodes, rule draws. |
| 05 | Open source | Label decodes, rule draws. The merged count rolls in big serif and the "+" springs in. |
| 06 | Achievements | Label decodes. Marked wins slam in, then the rest fade up. |
| 07 | Skills | Label decodes, rule draws. "fluent in ___" spins above the chips and lands on "Go.". |
| 08 | Contact | Label decodes. The email moves out of the sentence onto its own line under the heading, in mono signal blue, as the `mailto:` link. It types in at the reel's URL pace (16ms per character). The cursor then blinks three times on the beat and goes away. The sentence becomes "Ask Dev Senpai anything about my work, or send a note and I will reply." |

The rule above the footer quote is the same `Rule`, so it draws too.

### Other pages

- /experience, /projects, /contact, /privacy and the 404 page open with
  `PageTitle` and their PKY label. On the 404 page, the label replaces the
  standalone "404" line.
- /experience sub-section labels decode on view. `Timeline` dates, places and
  tech lists use `.label`.
- The /projects filters and the contact form are unchanged.

## Data

- `profile.json`: achievements gain an optional `mark`. The values are "1st"
  (GenTech Thales), "11" (Walmart Sparkathon) and "1813" (CodeChef). The chatbot
  index reads only `title` and `detail`, so `npm run gen` should leave
  `embeddings.json` unchanged. Run it and confirm.
- The home `INDEX` gains `{ id: "achievements", label: "Achievements" }`, and
  the achievements column takes that id.

## Cost

- No new runtime dependencies. The budget is 10KB gzipped added to home's
  first-load JS, which is 136KB today in `next build`.
- `Odometer` replaces `StatsCounter`. Delete `StatsCounter` if nothing else
  imports it.

## Testing

- **Unit tests.** `npm test` runs `node --test` over `src/**/*.test.ts`. Node 26
  strips types natively, and `tsconfig.json` gains `allowImportingTsExtensions`
  so tests can import `./motion.ts`. The tests cover `motion.ts`:
  - the eases hit 0 and 1;
  - `scramble` settles fully at p = 1 and is deterministic;
  - `typeTimes` increases strictly and lands near 1.0s for the greeting;
  - `reelClicks(8)` matches the reel;
  - `reelPos` ends on the last word;
  - `countCurve` spans 0 to 1;
  - `digitPositions` lands on the digits.
- **Every task** runs `npm run lint && npm run build`.
- **Browser pass** on `next start -p 3111`:
  - every page in both themes, at 390px and desktop widths;
  - a headless Chrome pass with `prefers-reduced-motion: reduce` emulated, and
    one with JavaScript disabled, both showing the finished page;
  - a GIF of the hero intro.

  Never submit the contact form.

## Docs

- CLAUDE.md, design system section: the new motion rules, the type roles and
  the kit's files replace "the banner, the donut, and the grid traces are the
  only motion".
- The saved note on design preferences records the new motion budget
  (26 Sep 2026).

## Not changing

The banner, the donut (component and position), the palette, the fonts
loaded, the header, footer and chat dock, the contact form, the project
filters, and every data shape except the optional `mark`.
