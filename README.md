# Irregular Pearl

Irregular Pearl is AI-first, crowdsourced digital hub that serves as the go-to space for all things classical music. By collecting and organizing the people’s classical music knowledge under one virtual roof, the platform will empower a new generation of classical musicians and enthusiasts to learn, collaborate, and contribute — ultimately elevating and preserving this timeless art form for the modern age.


## Features

- Draggable center player window on page load
- Classical playlist (muted by default on first load)
- Playback controls: mute, previous, play/stop, next
- Minimize to bottom-right dock with a playing indicator
- Right-side slide-out playlist panel with:
  - Played tracks
  - Current track
  - Up next tracks

## Tech Stack

- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS (global CSS custom styling)

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build

```bash
npm run build
npm run start
```

## Project Structure

- `app/page.tsx`: Player UI and interaction logic
- `app/globals.css`: Background, player, and animation styles

## Notes

- Audio autoplay policies vary by browser. If playback is blocked, click a control (for example Play or Unmute) to start audio.
