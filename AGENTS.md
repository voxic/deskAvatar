# AGENTS.md

## Cursor Cloud specific instructions

DeskAvatar is a single Electron desktop app (no backend/services). Standard commands live in
`package.json`: `npm start` (runs `electron .`) and `npm test` (Node's built-in test runner). There is
no lint script and no build step.

Non-obvious notes for this Linux cloud environment:

- **It's a macOS app that still runs on Linux.** macOS-only calls (`app.dock.hide()`,
  `setTemplateImage`) are guarded, so `npm start` works on Linux for development/verification.
- **The GUI needs an X display.** Run against the VM desktop display so screen capture/computer-use can
  see the overlay: `DISPLAY=:1 npm start`. If no desktop is present, start a virtual one instead:
  `Xvfb :99 -screen 0 1280x800x24 &` then `DISPLAY=:99 npm start`. The overlay is a small,
  borderless, always-on-top window in the **bottom-right** corner.
- **Harmless startup noise.** On headless Linux the logs print `dbus/bus.cc ... Failed to connect to the
  bus` and `viz_main_impl.cc ... Exiting GPU process due to errors during initialization`. These are
  expected and do not stop the app from rendering.
- **Core mechanic / how to test it live.** The overlay text is driven by `~/.deskavatar/status.txt`,
  which the app auto-creates on first launch (default `Hello from DeskAvatar`). Change the overlay live
  by writing to it, e.g. `echo "Shipping the MVP" > ~/.deskavatar/status.txt`; a debounced `fs.watch`
  updates the overlay via IPC within ~50ms (no restart needed).
- **Tray/menu-bar** controls are macOS-oriented; a Linux system tray may be absent, but the app keeps
  running and the overlay window still works.
