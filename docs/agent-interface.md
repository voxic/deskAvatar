# DeskAvatar — how to drive the overlay

DeskAvatar is running as a desktop overlay. You control it by writing one file. There is no API, socket, or SDK.

**File path:** `~/.deskavatar/status.txt`  
(Expanded: `$HOME/.deskavatar/status.txt`)

**Prerequisite:** DeskAvatar must be running (`npm start`). If it is not running, writes still succeed but nothing is shown until launch (it will pick up the file then).

## Rule 1 — overwrite the whole file

Always replace the file contents. Do not append.

```bash
# single beat
printf '%s\n' '[thinking] Inspecting the failing test' > ~/.deskavatar/status.txt

# multi-beat sequence (one write)
printf '%s\n' \
  '[thinking] Inspecting the failing test @2s' \
  '[talking] Assertion expects 200, got 500 @3s' \
  '[idle] Waiting for your next step' \
  > ~/.deskavatar/status.txt
```

Prefer a single write of the full body (as above). If your tool only supports multi-step IO, write to a temp file in the same directory and `mv` it onto `status.txt` so the watcher sees one update.

## Rule 2 — line format

```text
[animation] message @duration
```

- `[animation]` — optional. One of: `idle`, `thinking`, `celebrate`, `talking`, `alert`, `sleeping`, `loading`, `waiting`, `frustrated`, `happy`, `sad`, `angry`, `dead`, `gone-fishing`. Unknown tags → `idle`. Omit the tag for idle.
- `message` — optional short status text (UI shows ~2 lines; keep it under ~80 characters). Omit it to show **animation only** (no text in the overlay).
- `@duration` — optional. Hold time before the next line. Examples: `@2s`, `@2.5s`, `@2000ms`. Put it at the **end** of the line. It is not shown on screen.

## Rule 3 — when to use one line vs many

| Situation | What to write |
| --- | --- |
| One clear state (working, blocked, done) | **One line**, no `@duration` — it holds until you write again |
| Short narrative arc without more LLM calls | **2–5 lines** with `@duration` on early lines; **last line undated** so it holds |
| Correct or interrupt yourself | **Overwrite** the file with the new line(s); playback restarts from the new content |

## Rule 4 — ease your own load

- Prefer **one multi-line write** for an upcoming stretch of work over updating the file every few seconds.
- Do **not** loop “sleep → regenerate next status” unless the underlying task state actually changed.
- After a multi-beat sequence, stop writing until you have a new decision, tool result, or user message.
- Good last lines: `[idle] …`, `[talking] …`, or plain text — undated so the avatar holds.

## Rule 5 — what not to do

- Do not append to `status.txt`.
- Do not invent new files (`sequence.json`, etc.); only `status.txt` is read.
- Do not put duration in the middle of the message; only a trailing `@2s` / `@2000ms`.
- Do not rely on the file contents changing during playback — DeskAvatar does not rewrite the file as it plays. `cat ~/.deskavatar/status.txt` shows the script you wrote, not the playhead.

## Quick examples

**Start of a task**

```text
[thinking] Reading the repo layout @2s
[talking] Focusing on status file watching @2s
[idle] Working…
```

**Blocked**

```text
[alert] Need the API token in .env
```

**Success**

```text
[celebrate] Tests passed @2s
[idle] Ready for the next task
```

**Plain idle (no tag)**

```text
Standing by
```

**Animation only (no message text)**

```text
[thinking]
[loading] @3s
[celebrate] @2s
[idle] Ready
```

Write a tag with no message (and an optional `@duration`) when you want the avatar to animate without overlay copy.

## Animation cheat sheet

| Tag | Use when |
| --- | --- |
| `idle` / (none) | Waiting, holding pattern |
| `thinking` | Reading, searching, reasoning |
| `talking` | Explaining, narrating progress |
| `celebrate` | Done, success |
| `alert` | Error, blocked, needs attention |
| `sleeping` | Idle overnight, paused, nothing to do |
| `loading` | Long compile, install, or download in progress |
| `waiting` | Awaiting user input or an external review |
| `frustrated` | Repeated failure, flaky tests, mild annoyance |
| `happy` | Mild win — green build, small success |
| `sad` | Soft setback — conflict, rejection, cleanup |
| `angry` | Strong failure or broken invariant |
| `dead` | Crash, OOM, process died |
| `gone-fishing` | Stepping away, AFK, deliberately offline |
