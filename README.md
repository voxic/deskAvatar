# DeskAvatar

A tiny always-on-top Mac overlay: a borderless window with an animated avatar and a single line of status text driven by a local file. Show/hide it from the menu bar.

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

Uses Node's built-in test runner (no extra test framework). Coverage focuses on status-file IO, window placement helpers, tray hide/show labels, status parsing, and avatar animation state.

On first launch the app:

1. Creates `~/.deskavatar/status.txt` (if missing)
2. Shows a borderless overlay in the bottom-right of your screen
3. Hides the Dock icon and adds a **DeskAvatar** control in the menu bar

## Update the status text

Edit the status file — the overlay updates automatically:

```bash
echo "Shipping the MVP" > ~/.deskavatar/status.txt
echo "[thinking] Deep in a refactor" > ~/.deskavatar/status.txt
echo "[celebrate] Shipped!" > ~/.deskavatar/status.txt
echo "[talking] Standup" > ~/.deskavatar/status.txt
echo "[alert] Build failed" > ~/.deskavatar/status.txt
```

Or use the menu bar item **Open Status File**.

Plain text (no tag) plays the **idle** animation. An optional leading tag selects another built-in state; the rest of the line is the status message shown in the overlay.

## Avatar

The overlay face is a dark LED-style panel with cyan bar eyes and a short bar mouth (no cheeks or skin tones). Soft glow on the LEDs; motion is snappy CSS keyframes driven by status tags.

## Avatar animations

Built-in states:

| Tag | Animation |
| --- | --- |
| _(none)_ or `[idle]` | Float + panel pulse + double-blink |
| `[thinking]` | Head tilt + eye bars glance aside |
| `[celebrate]` | Bounce/wobble + stretched mouth + eye glow |
| `[talking]` | Bob + fast mouth open/close + eye flicker |
| `[alert]` | Strong shake + cyan eye flash |

Unknown tags fall back to **idle**. The tag is not shown in the overlay text.

### Adding an animation

1. Register the name in `src/renderer/avatar-animation.js` (`DEFAULT_ANIMATIONS`).
2. Add CSS under `[data-animation="your-name"]` in `src/renderer/styles.css`.
3. Use `[your-name] Your message` in `~/.deskavatar/status.txt`.

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
src/main.js                      Electron main process (window, tray, file watch)
src/preload.js                   Secure bridge to the renderer
src/renderer/index.html          Overlay markup (SVG avatar parts)
src/renderer/styles.css          Overlay styles + per-state animations
src/renderer/status-view.js      Status text normalization + [animation] tag parsing
src/renderer/avatar-animation.js Animation state controller
src/renderer/renderer.js         Wires status updates to text + animation
assets/tray-icon.png             Menu bar icon
```

## Notes

- The window is always on top (including over full-screen apps) and can be dragged.
- Status text is truncated to two lines in the UI; the full string is available as a tooltip on hover.
- Avatar motion is CSS-driven via a small state controller; `status.txt` chooses the playing state with an optional `[animation]` tag.
