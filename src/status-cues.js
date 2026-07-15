const { parseStatus, DEFAULT_ANIMATION } = require("./renderer/status-view");

const DURATION_SUFFIX = /\s+@(\d+(?:\.\d+)?)(ms|s)\s*$/i;
const DEFAULT_ANIMATIONS = ["idle", "thinking", "celebrate", "talking", "alert"];

function parseDurationMs(value, unit) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) {
    return null;
  }

  const normalizedUnit = String(unit).toLowerCase();
  if (normalizedUnit === "s") {
    return Math.round(amount * 1000);
  }
  if (normalizedUnit === "ms") {
    return Math.round(amount);
  }

  return null;
}

function parseCueLine(line, options = {}) {
  const allowedAnimations = options.allowedAnimations || DEFAULT_ANIMATIONS;
  let remaining = typeof line === "string" ? line.trim() : "";
  let ms = null;

  const durationMatch = remaining.match(DURATION_SUFFIX);
  if (durationMatch) {
    const parsed = parseDurationMs(durationMatch[1], durationMatch[2]);
    if (parsed !== null) {
      ms = parsed;
      remaining = remaining.slice(0, durationMatch.index).trimEnd();
    }
  }

  const { message, animation } = parseStatus(remaining, {
    allowedAnimations,
    fallback: options.fallback,
  });

  return {
    animation,
    text: message,
    ms,
    display: formatCueDisplay({ animation, text: message }),
  };
}

function formatCueDisplay(cue) {
  const animation =
    typeof cue.animation === "string" && cue.animation.trim()
      ? cue.animation.trim().toLowerCase()
      : DEFAULT_ANIMATION;
  const text = typeof cue.text === "string" ? cue.text : "";

  if (animation === DEFAULT_ANIMATION) {
    return text;
  }

  return `[${animation}] ${text}`.trim();
}

function parseStatusCues(text, options = {}) {
  const fallbackMessage =
    typeof options.fallback === "string" ? options.fallback : "Waiting for status…";
  const allowedAnimations = options.allowedAnimations || DEFAULT_ANIMATIONS;

  if (typeof text !== "string") {
    return [
      parseCueLine(`[${DEFAULT_ANIMATION}] ${fallbackMessage}`, {
        allowedAnimations,
        fallback: fallbackMessage,
      }),
    ];
  }

  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return [
      parseCueLine(fallbackMessage, {
        allowedAnimations,
        fallback: fallbackMessage,
      }),
    ];
  }

  return lines.map((line) =>
    parseCueLine(line, {
      allowedAnimations,
      fallback: fallbackMessage,
    })
  );
}

function shouldPlaySequence(cues) {
  if (!Array.isArray(cues) || cues.length === 0) {
    return false;
  }

  if (cues.length > 1) {
    return true;
  }

  return cues[0].ms != null;
}

function createCuePlayer(options = {}) {
  const schedule = typeof options.setTimeout === "function" ? options.setTimeout : setTimeout;
  const cancelSchedule =
    typeof options.clearTimeout === "function" ? options.clearTimeout : clearTimeout;

  let timer = null;
  let generation = 0;

  function cancel() {
    generation += 1;
    if (timer != null) {
      cancelSchedule(timer);
      timer = null;
    }
  }

  function play(cues, onBeat) {
    if (typeof onBeat !== "function") {
      throw new TypeError("onBeat is required");
    }

    cancel();
    const list = Array.isArray(cues) ? cues : [];
    if (list.length === 0) {
      return cancel;
    }

    const gen = generation;
    let index = 0;

    function step() {
      if (gen !== generation) {
        return;
      }

      if (index >= list.length) {
        return;
      }

      const cue = list[index];
      onBeat(cue);

      const isLast = index >= list.length - 1;
      if (isLast || cue.ms == null) {
        // Hold this beat until a new play() / cancel().
        return;
      }

      index += 1;
      timer = schedule(step, cue.ms);
    }

    step();
    return cancel;
  }

  return {
    play,
    cancel,
  };
}

module.exports = {
  DEFAULT_ANIMATIONS,
  DURATION_SUFFIX,
  parseDurationMs,
  parseCueLine,
  parseStatusCues,
  formatCueDisplay,
  shouldPlaySequence,
  createCuePlayer,
};
