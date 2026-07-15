# DeskAvatar

A tiny always-on-top Mac overlay: a borderless window with a static avatar and a single line of status text driven by a local file. Show/hide it from the menu bar.

## Requirements

- macOS
- [Node.js](https://nodejs.org/) 18+

## Install & run

```bash
npm install
npm start
```

## Tests

```bash
npm test
```

Uses Node's built-in test runner (no extra test framework). Coverage focuses on status-file IO, window placement helpers, tray hide/show labels, and status text normalization.

On first launch the app:

1. Creates `~/.deskavatar/status.txt` (if missing)
2. Shows a borderless overlay in the bottom-right of your screen
3. Hides the Dock icon and adds a **DeskAvatar** control in the menu bar

## Update the status text

Edit the status file — the overlay updates automatically:

```bash
echo "Shipping the MVP" > ~/.deskavatar/status.txt
```

Or use the menu bar item **Open Status File**.

## Menu bar controls

| Action | What it does |
| --- | --- |
| **Show Avatar / Hide Avatar** | Toggles the overlay window |
| Click the tray icon | Same show/hide toggle |
| **Open Status File** | Opens `~/.deskavatar/status.txt` |
| **Reveal Status Folder** | Shows the folder in Finder |
| **Quit DeskAvatar** | Fully exits the app |

Closing the window does **not** quit the app — it only hides the overlay. Use **Quit DeskAvatar** from the menu bar to exit.

## Project layout

```
src/main.js           Electron main process (window, tray, file watch)
src/preload.js        Secure bridge to the renderer
src/renderer/         Overlay UI
assets/tray-icon.png  Menu bar icon
```

## Notes

- The window is always on top (including over full-screen apps) and can be dragged.
- Status text is truncated to two lines in the UI; the full string is available as a tooltip on hover.
- This MVP uses a static SVG avatar. Later versions can animate or swap avatars based on richer file contents.
