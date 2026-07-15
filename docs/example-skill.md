---
name: deskavatar
description: Drive the DeskAvatar Mac overlay by writing ~/.deskavatar/status.txt. Use when updating a desk avatar status, showing progress visually on the overlay, or reacting to task phases with animations.
---

# DeskAvatar

Tiny always-on-top Mac overlay (LED face + one status line). Controlled by overwriting a single local file. No API, socket, or SDK.

**Prerequisite:** DeskAvatar must be running on the user's Mac (`npm start` in this repo). Writes succeed either way; the overlay only shows them when the app is up.

## Status file

**Path:** `~/.deskavatar/status.txt`  
(Expanded: `$HOME/.deskavatar/status.txt`)

Write from a tool that can reach the user's machine filesystem. If that machine is offline / unreachable, skip the update — do not invent a remote status file elsewhere.

## Rules

1. **Overwrite the whole file.** Never append.
2. Prefer one write of the full body (`printf '%s\n' ... > file`). For multi-step IO, write a temp file in the same dir and `mv` onto `status.txt`.
3. Prefer **one multi-line sequence** for an upcoming stretch of work over updating every few seconds.
4. After a multi-beat sequence, stop writing until state actually changes (new decision, tool result, user message).
5. Do not invent other files (`sequence.json`, etc.). Only `status.txt` is read.
6. DeskAvatar does **not** rewrite the file during playback — `cat` shows the script, not the playhead.
7. **Idle = face only.** When standing by / done holding, leave the message empty — no "Standing by", "Ready", "Working…", etc. Prefer a blank file, a lone `[idle]`, or end a sequence with `[idle]` and nothing after the tag. Text is for active beats only.

## Line format

```text
[animation] message @duration
```

- `[animation]` — optional. Unknown tags → idle. Omit for idle.
- `message` — optional, short (~80 chars). UI shows ~2 lines. Omit the message for **animation only** (text row hidden).
- `@duration` — optional, **end of line only**: `@3s`, `@3.5s`, `@4s`, `@3000ms`. Not shown on screen.
- A line **without** `@duration` holds until the next write (use on the last beat).
- A new write cancels playback and starts from the new contents.

### Duration defaults (suggested: 3–4s beats)

Readable without dragging. Default hold times:

| Beat type | Default |
| --- | --- |
| `thinking` / `loading` / `waiting` | `@3.5s`–`@4s` |
| `talking` / narrating | `@3.5s`–`@4s` |
| `happy` / `sad` / `frustrated` | `@3s`–`@3.5s` |
| `celebrate` / `alert` / `angry` | `@3s`–`@3.5s` |
| `dead` / `gone-fishing` / `sleeping` | `@3.5s` (then hold on last undated line) |

Stay in the **3–4s** band for readable beats. Avoid `@2s` or shorter unless it's a deliberate flash between two longer ones. Avoid `@5s+` unless something genuinely needs to linger.

## When to write

| Situation | What to write |
| --- | --- |
| One clear state | One line, no `@duration` |
| Short narrative arc | 2–5 lines; `@duration` on early lines; last line undated |
| Correct / interrupt | Overwrite with the new line(s) |

Good moments: start of a real task, blocked needing the user, success, overnight idle. Skip for trivial tool chatter.

## Animation cheat sheet

| Tag | Use when |
| --- | --- |
| `idle` / (none) | Waiting, holding — **no status text** (face only) |
| `thinking` | Reading, searching, reasoning |
| `talking` | Explaining, narrating |
| `celebrate` | Done, success |
| `alert` | Error, blocked, needs attention |
| `sleeping` | Overnight / paused |
| `loading` | Long compile, install, download |
| `waiting` | Awaiting user / external review |
| `frustrated` | Repeated failure, flaky tests |
| `happy` | Mild win |
| `sad` | Soft setback |
| `angry` | Strong failure |
| `dead` | Crash, OOM, process died |
| `gone-fishing` | AFK / deliberately offline |

## Quick examples

**Start of a task**
```bash
printf '%s\n' \
  '[thinking] Reading the repo layout @3.5s' \
  '[talking] Focusing on the failing test @4s' \
  '[idle]' \
  > ~/.deskavatar/status.txt
```

**Blocked**
```bash
printf '%s\n' '[alert] Need the API token in .env' > ~/.deskavatar/status.txt
```

**Success**
```bash
printf '%s\n' \
  '[celebrate] Tests passed @3.5s' \
  '[idle]' \
  > ~/.deskavatar/status.txt
```

**Return to idle (face only)**
```bash
printf '%s\n' '[idle]' > ~/.deskavatar/status.txt
# or: : > ~/.deskavatar/status.txt
```

## Full protocol

See [agent-interface.md](./agent-interface.md) for the live copy-paste interaction rules.
