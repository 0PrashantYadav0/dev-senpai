---
format: 1920x1080
duration: 15s
message: "Prashant builds voice AI and the Go services that keep it on the line, from Zomato to Walmart to stdlib."
arc: Hello → Voice → Line → Observability → Open source → Stack → Wins → Contact
audience: recruiters and engineers
mode: autonomous
music: original score, 128 BPM F minor, 8 bars = 15.000 s (audio/score.mjs)
---

SIGNAL: one blue line, fifteen seconds, no cuts. Every scene is exactly one
bar and hands the line to the next at the same position. Ground (grid +
traces + camera) and chrome (timecode, scene index, rails, grain) run under
and over all eight scenes.

## Frame 1 — Hello

- status: animated
- src: compositions/s1-hello.html
- duration: 1.875s
- transition_in: cold open
- blueprint: typewriter-reveal (Hook, adapted)
- rules: context-sensitive-cursor, discrete-text-sequence, cursor-click-ripple, svg-path-draw
- scene: A cursor types "hi, prashant here"; the cursor pops into a dot that unzips the line; the letters fall into it.
- poster: 1.1

## Frame 2 — Voice AI

- status: animated
- src: compositions/s2-voice.html
- duration: 1.875s
- transition_in: match (flat line erupts on the drop)
- rules: gsap-effects (visualizer), waterfall-entry, spring-pop-entrance, svg-path-draw
- scene: The line becomes a speech waveform; a packet lights VAD, STT, NLU, TTS on the bells. Eternal (Zomato), Nugget by Zomato.
- poster: 1.2

## Frame 3 — On the line

- status: animated
- src: compositions/s3-line.html
- duration: 1.875s
- transition_in: match (flat line)
- blueprint: spatial-pan-stations (adapted)
- rules: svg-path-draw, kinetic-beat-slam, cursor-click-ripple
- scene: "the Go services that keep it on the line." sits on the line; the call routes dialer, SIP, Go, LLM bot, human agent.
- poster: 1.45

## Frame 4 — Observability

- status: animated
- src: compositions/s4-observe.html
- duration: 1.875s
- transition_in: match (line splits into three lanes)
- rules: chart-scrub-readout, ai-tracking-box, stat-bars-and-fills, motion-blur-streak
- scene: OpenObserve logs, Grafana latency, Prometheus metrics; a scanline sweeps and the agent locks the root cause. Walmart Global Tech.
- poster: 1.2

## Frame 5 — Open source

- status: animated
- src: compositions/s5-stdlib.html
- duration: 1.875s
- transition_in: whip pan (matched velocity, directional blur)
- blueprint: dataviz-countup (adapted)
- rules: counting-dynamic-scale, vertical-spring-ticker, svg-path-draw, motion-blur-streak
- scene: stdlib main branch on the grid; branches merge on the ticks while an odometer rolls to 145+.
- poster: 1.4

## Frame 6 — Stack

- status: animated
- src: compositions/s6-stack.html
- duration: 1.875s
- transition_in: 90-degree camera roll (main line becomes the rail)
- rules: vertical-spring-ticker, hacker-flip-3d (flat), motion-blur-streak
- scene: "fluent in" / reel of languages landing on "Go."; the tool wall decodes and a scan lights it; shipped projects.
- poster: 1.35

## Frame 7 — Wins

- status: animated
- src: compositions/s7-wins.html
- duration: 1.875s
- transition_in: match (rail curls into a ring)
- rules: kinetic-beat-slam, chromatic-glitch (brand-blue ghosts)
- scene: The ASCII donut spins up in the ring; three wins slam in on the beats; the donut implodes to a dot in the silence.
- poster: 1.1

## Frame 8 — Contact

- status: animated
- src: compositions/s8-contact.html
- duration: 1.875s
- transition_in: match (the dot throws the final line)
- blueprint: logo-assemble-lockup (Brand_Outro, morph chain)
- rules: svg-path-draw, waterfall-entry, context-sensitive-cursor, gsap-effects (typewriter)
- scene: Name rises out of the line, URL types under it, the cursor from frame 1 blinks over the hold.
- poster: 1.8
