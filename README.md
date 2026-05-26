# Stillpoint

A minimal, beautiful meditation timer. Open source, offline-first, no build step.

## Design

A small inner circle sits inside a larger ring. The ring depletes like a pie as time passes. Time is displayed in the centre. Tap the inner circle to start, tap again to pause.

- **Day:** warm parchment with deep ink and a muted clay accent.
- **Night:** midnight indigo with a soft champagne accent.
- Theme defaults to system preference; toggle persists once set.
- No flash on load (inline pre-paint script resolves theme before first render).

## Stack

- Vanilla HTML, CSS, and ES modules. No framework. No build step.
- SVG `stroke-dasharray` for the countdown arc (silky and resolution-independent).
- `requestAnimationFrame` with wall-clock targeting (no drift if the tab is throttled).
- Web Audio API for the completion bell (528 Hz + perfect fifth, slow decay). No audio files.
- Service worker for offline use.
- PWA manifest for install-to-home-screen.

## Files

```
index.html       — markup + inline anti-flash theme script
styles.css       — palette tokens, layout, motion
app.js           — timer logic, theme, audio
sw.js            — offline cache
manifest.webmanifest
icon.svg
LICENSE          — MIT
```

## Running locally

Just serve the folder over HTTP (service workers need a real origin):

```bash
python3 -m http.server 8080
# or
npx serve .
```

Open http://localhost:8080.

## Shortcuts

- **Space** or tap the inner circle: start / pause
- **Reset** button appears once a session is in progress
- Custom duration: type minutes into the rightmost chip (1–180)

## Accessibility

- Live region announces the time
- Keyboard-operable inner button (Enter / Space)
- Respects `prefers-reduced-motion`
- Theme toggle has an accessible label

## License

MIT.
