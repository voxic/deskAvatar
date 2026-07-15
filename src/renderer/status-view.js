(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.DeskAvatarStatusView = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const DEFAULT_ANIMATION = "idle";
  const ANIMATION_TAG = /^\[([a-z0-9_-]+)\]\s*/i;

  function normalizeStatusText(text, fallback = "Waiting for status…") {
    if (typeof text !== "string") {
      return fallback;
    }

    const trimmed = text.trim();
    return trimmed || fallback;
  }

  function normalizeAllowedAnimations(allowedAnimations) {
    if (!Array.isArray(allowedAnimations) || allowedAnimations.length === 0) {
      return new Set([DEFAULT_ANIMATION]);
    }

    return new Set(
      allowedAnimations
        .filter((name) => typeof name === "string")
        .map((name) => name.trim().toLowerCase())
        .filter(Boolean)
    );
  }

  function parseStatus(text, options = {}) {
    const allowed = normalizeAllowedAnimations(options.allowedAnimations);
    const fallbackMessage =
      typeof options.fallback === "string" ? options.fallback : "Waiting for status…";

    if (typeof text !== "string") {
      return {
        message: fallbackMessage,
        animation: DEFAULT_ANIMATION,
      };
    }

    let remaining = text.trim();
    let animation = DEFAULT_ANIMATION;

    const match = remaining.match(ANIMATION_TAG);
    if (match) {
      const candidate = match[1].toLowerCase();
      if (allowed.has(candidate)) {
        animation = candidate;
      }
      remaining = remaining.slice(match[0].length).trim();
    }

    return {
      message: normalizeStatusText(remaining, fallbackMessage),
      animation,
    };
  }

  return {
    DEFAULT_ANIMATION,
    normalizeStatusText,
    parseStatus,
  };
});
