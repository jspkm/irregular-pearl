# Irregular Pearl

Irregular Pearl is a collaborative platform for classical music knowledge—built by musicians, for musicians. 
By bringing together works, composers, ideas, and traditions into a unified digital space, the platform enables artists and enthusiasts to study more deeply, discover connections, collaborate across borders, and contribute their insights to a growing body of shared knowledge. In doing so, Irregular Pearl helps equip the next generation of musicians while carrying the classical tradition forward in a modern, connected world.
Irregular Pearl operates as a registered 501(c)(3) nonprofit organization dedicated to this mission.


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
