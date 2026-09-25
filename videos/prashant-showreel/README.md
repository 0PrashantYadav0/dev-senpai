# prashant-showreel

A 15-second motion-graphics showreel built from `public/resume.pdf` with
[HyperFrames](https://hyperframes.heygen.com) (HTML to video). One blue line
runs through eight one-bar scenes at 128 BPM without a cut. It's separate from
the Next.js site: nothing here is imported by the app or built by Vercel.

- `BRIEF.md` and `STORYBOARD.md` hold the message and the eight scenes.
- `design.md` holds the palette and type, taken from the site's tokens.
- `index.html` is the root timeline. Each scene is in `compositions/`.
- `audio/score.mjs` synthesizes the score into `assets/audio/score.wav`.

## Commands

Run these from this folder.

```bash
npx hyperframes preview --background               # studio preview
npx hyperframes check                              # lint, layout and contrast audit
npx hyperframes render --fps 60 --quality delivery # writes renders/*.mp4 (~200MB)
./web-encode.sh                                    # two-pass 14 Mbps copy (~27MB) to share
node audio/score.mjs                               # rebuild the score after moving any cue
```

`renders/` and `.hyperframes/` are gitignored. The score uses a few Pixabay
one-shots from the HyperFrames media-use skill
(`~/.claude/skills/media-use/audio/assets/sfx`). They aren't committed here, so
you only need that folder to rebuild the score. The rendered `score.wav` is
committed.
