#!/usr/bin/env bash
# Splice a generated Level Up segment onto the first 8 s of the original journey film.
#   scripts/assemble-journey.sh desktop   -> public/data/videos/levelup-journey.mp4            (1920x1082)
#   scripts/assemble-journey.sh mobile    -> public/data/videos/levelup-journey-portrait.mp4   (608x1082, 9:16)
set -euo pipefail
VARIANT="${1:-desktop}"
CUT="${2:-8}"
ORIG="public/data/videos/aradi-journey.mp4"
FF="$(python3 -c 'import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())')"
case "$VARIANT" in
  desktop) GEN="public/data/videos/generated/journey-levelup-segment.mp4";          OUT="public/data/videos/levelup-journey.mp4";          SIZE="scale=1920:1082:flags=lanczos" ;;
  mobile)  GEN="public/data/videos/generated/journey-levelup-segment-portrait.mp4"; OUT="public/data/videos/levelup-journey-portrait.mp4"; SIZE="crop=608:1082:656:0,scale=608:1082:flags=lanczos" ;;
  *) echo "variant must be desktop or mobile"; exit 2 ;;
esac
[ -f "$GEN" ] || { echo "missing generated segment: $GEN (run: npm run video:journey -- $VARIANT)"; exit 1; }
TMP="$(mktemp -d)"
# 1. original opening (centre-cropped to 9:16 for mobile), re-encoded so both parts share codec/timebase
"$FF" -v error -y -i "$ORIG" -t "$CUT" -an -vf "$SIZE,fps=24,format=yuv420p" -c:v libx264 -preset medium -crf 18 "$TMP/a.mp4"
# 2. generated 720p segment, resized to the same frame
GEN_SIZE="$( [ "$VARIANT" = mobile ] && echo 'scale=608:1082:flags=lanczos' || echo 'scale=1920:1082:flags=lanczos' )"
"$FF" -v error -y -i "$GEN" -an -vf "$GEN_SIZE,fps=24,format=yuv420p" -c:v libx264 -preset medium -crf 18 "$TMP/b.mp4"
# 3. join with a short crossfade so the cut at 00:08 is not a hard jump
OFF="$(python3 -c "print(max(0,$CUT-0.4))")"
"$FF" -v error -y -i "$TMP/a.mp4" -i "$TMP/b.mp4" -filter_complex "[0:v][1:v]xfade=transition=fade:duration=0.4:offset=$OFF[v]" -map "[v]" -c:v libx264 -preset medium -crf 18 -movflags +faststart "$OUT"
# 4. poster = first frame
"$FF" -v error -y -i "$OUT" -frames:v 1 "${OUT%.mp4}-poster.jpg"
rm -rf "$TMP"
echo "wrote $OUT and ${OUT%.mp4}-poster.jpg"
