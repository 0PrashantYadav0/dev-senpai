#!/bin/sh
# Two-pass 14 Mbps H.264 encode of the delivery render, for sharing.
# The animated grain makes the delivery master ~200MB; this is ~27MB and
# looks the same at 1:1.
set -e
cd "$(dirname "$0")/renders"
IN=prashant-showreel.mp4
OUT=prashant-showreel-web.mp4
LOG=../.hyperframes/x264
ffmpeg -v error -y -i "$IN" -c:v libx264 -preset slow -b:v 14M -maxrate 20M -bufsize 28M \
  -pix_fmt yuv420p -profile:v high -level 4.2 -pass 1 -passlogfile "$LOG" -an -f mp4 /dev/null
ffmpeg -v error -y -i "$IN" -c:v libx264 -preset slow -b:v 14M -maxrate 20M -bufsize 28M \
  -pix_fmt yuv420p -profile:v high -level 4.2 -pass 2 -passlogfile "$LOG" \
  -movflags +faststart -c:a aac -b:a 256k "$OUT"
rm -f "$LOG"*
ls -lh "$OUT"
