# ARADI local mirror

A Next.js 15 + TypeScript rebuild of https://aradiapp.com/ that runs entirely from localhost.
Every asset the site uses (videos, posters, brand icon, background, intro audio, fonts) lives under
`public/data/`, and all page copy / layout data lives in `public/data/content/*.json`.

## Run

```bash
npm install
npm run dev      # http://localhost:3000
# or
npm run build && npm start
```

## Routes

| Route      | What it is                                                                 |
| ---------- | -------------------------------------------------------------------------- |
| `/`        | Cinematic home: preloader, journey film, door button, hallway, events room |
| `/concept` | Pitch film with timed overlays, bridge interlude, concept film             |
| `/privacy` | Privacy policy                                                             |
| `/app`     | Placeholder. The live `/app` is a separate Flutter platform with a backend |
| `*`        | 404                                                                        |

## Debug modes (same as the original site)

- `/?mobileFloorAlign` — align the mobile floor cards in the hallway scene
- `/concept?pitchAlign&t=11.55` — align pitch-film overlays at a given time

## Data layout

```
public/data/
  brand/aradi-icon.png
  Aradi_background.png
  videos/*.mp4, videos/poster-*.jpg
  assets/intro-horizon.mp3
  fonts/fonts.css + fonts/files/*.woff2   (Cormorant Garamond, Inter)
  content/*.json                          (site, hallway, events, pitch, concept, privacy, not-found)
  source/                                 (original index.html, compiled CSS and JS bundle for reference)
```

## Events room

The "Our Events" frame in the hallway plays `hallway-to-door.mp4` then `portal-open.mp4` and opens the events room
(`public/data/levelup/eventroomdesktop.png` on desktop, `eventroommobile.png` on portrait phones).
Events, their details, links and media live in `public/data/content/events.json`; covers and clips go in `public/data/events/`.
