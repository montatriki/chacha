#!/usr/bin/env bash
# Splice the ORIGINAL journey opening onto the new LEVEL UP clip at a frame-matched point,
# with a short crossfade so the switch is invisible.
#
#   scripts/splice-journey.sh desktop <orig_cut_s> <new_start_s>
#   scripts/splice-journey.sh mobile  <orig_cut_s> <new_start_s>
#
# desktop -> public/data/videos/levelup-journey.mp4           (1920x1082, H.264, 24 fps)
# mobile  -> public/data/videos/levelup-journey-portrait.mp4  (1080x1920, H.264, 24 fps)
#
# The new clips are HEVC 10-bit, which Chrome/Firefox do not play, so everything is re-encoded to H.264 8-bit.
set -euo pipefail
VARIANT="${1:?desktop|mobile}"; CUT="${2:?orig cut seconds}"; NEWSTART="${3:?new clip start seconds}"
FADE="${4:-0.5}"
ORIG="public/data/videos/aradi-journey.mp4"
FF="$(python3 -c 'import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())')"
case "$VARIANT" in
  desktop) NEW="public/data/videos/aradi-journeydesktop.mp4"; OUT="public/data/videos/levelup-journey.mp4";          A_VF="scale=1920:1082:flags=lanczos";                           B_VF="scale=1920:1082:flags=lanczos" ;;
  # mobile: the new clip's horizon sits mid-frame while the phone crop of the original has it near the top.
  # Open the new clip zoomed 1.6x on its lower part (horizon at ~20%, matching the original), then pull back
  # to full frame over 2 s so the switch reads as one continuous camera move.
  mobile)  NEW="public/data/videos/aradi-journeymobile.mp4";  OUT="public/data/videos/levelup-journey-portrait.mp4"; A_VF="crop=608:1082:656:0,scale=1080:1920:flags=lanczos";      B_VF="scale=w='iw*(1.6-0.6*min(t/2\,1))':h='ih*(1.6-0.6*min(t/2\,1))':eval=frame:flags=lanczos,crop=1080:1920:x='(iw-1080)/2':y='ih-1920'" ;;
  *) echo "variant must be desktop or mobile"; exit 2 ;;
esac
TMP="$(mktemp -d)"
# A: original opening up to the cut (+ fade length so the crossfade has material)
"$FF" -v error -y -i "$ORIG" -t "$(python3 -c "print($CUT+$FADE)")" -an -vf "$A_VF,fps=24,format=yuv420p" -c:v libx264 -preset medium -crf 17 "$TMP/a.mp4"
# B: new clip from the matched frame onward
"$FF" -v error -y -ss "$NEWSTART" -i "$NEW" -an -vf "$B_VF,fps=24,format=yuv420p" -c:v libx264 -preset medium -crf 17 "$TMP/b.mp4"
# Join with a crossfade centred on the cut
"$FF" -v error -y -i "$TMP/a.mp4" -i "$TMP/b.mp4" -filter_complex "[0:v][1:v]xfade=transition=fade:duration=$FADE:offset=$CUT[v]" -map "[v]" -c:v libx264 -preset medium -crf 17 -pix_fmt yuv420p -movflags +faststart "$OUT"
"$FF" -v error -y -i "$OUT" -frames:v 1 -q:v 2 "${OUT%.mp4}-poster.jpg"
rm -rf "$TMP"
"$FF" -hide_banner -i "$OUT" 2>&1 | grep -E "Duration|Video:" | sed 's/^ *//'
echo "wrote $OUT + poster"
