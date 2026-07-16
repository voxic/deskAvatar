#!/usr/bin/env bash
# Capture looping GIFs of each DeskAvatar animation from the live overlay.
# Prerequisites: DeskAvatar running on DISPLAY=:1 (DISPLAY=:1 npm start)
set -euo pipefail

export DISPLAY="${DISPLAY:-:1}"
OUT_DIR="${1:-$(cd "$(dirname "$0")/.." && pwd)/docs/animations}"
STATUS_FILE="${HOME}/.deskavatar/status.txt"
FPS=12
CROP_H=150

mkdir -p "$OUT_DIR" /tmp/deskavatar-capture

find_overlay() {
  local wid
  wid=$(xdotool search --name 'DeskAvatar' 2>/dev/null | head -1)
  if [[ -z "$wid" ]]; then
    echo "DeskAvatar window not found on $DISPLAY" >&2
    exit 1
  fi
  eval "$(xdotool getwindowgeometry --shell "$wid")"
  OX=$X
  OY=$Y
  WIDTH=$WIDTH
  HEIGHT=$HEIGHT
}

duration_for() {
  case "$1" in
    idle|sleeping|sad|gone-fishing) echo 3.5 ;;
    dead) echo 4 ;;
    *) echo 2.5 ;;
  esac
}

ANIMATIONS=(
  idle
  thinking
  celebrate
  talking
  alert
  sleeping
  loading
  waiting
  frustrated
  happy
  sad
  angry
  dead
  gone-fishing
)

find_overlay
echo "Overlay at ${OX},${OY} size ${WIDTH}x${HEIGHT}"

for name in "${ANIMATIONS[@]}"; do
  dur=$(duration_for "$name")
  echo "[$name] → writing status, recording ${dur}s…"
  printf '[%s]\n' "$name" > "$STATUS_FILE"
  sleep 0.4

  find_overlay
  raw="/tmp/deskavatar-capture/${name}.mkv"
  gif="${OUT_DIR}/${name}.gif"
  crop_h=$CROP_H
  if (( crop_h > HEIGHT )); then crop_h=$HEIGHT; fi

  # Lossless intermediate (odd heights break yuv420p/h264)
  ffmpeg -y -hide_banner -loglevel error \
    -video_size "${WIDTH}x${HEIGHT}" -framerate 20 \
    -f x11grab -i "${DISPLAY}.0+${OX},${OY}" \
    -t "$dur" -c:v ffv1 "$raw"

  ffmpeg -y -hide_banner -loglevel error -i "$raw" \
    -vf "fps=${FPS},crop=${WIDTH}:${crop_h}:0:0,scale=${WIDTH}:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=96:stats_mode=diff[p];[s1][p]paletteuse=dither=bayer:bayer_scale=3" \
    -loop 0 "$gif"

  ls -la "$gif"
done

echo "Done. GIFs in $OUT_DIR"
ls -la "$OUT_DIR"
