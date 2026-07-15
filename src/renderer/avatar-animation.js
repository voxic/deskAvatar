(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.DeskAvatarAvatarAnimation = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const DEFAULT_ANIMATIONS = ["idle", "thinking", "celebrate", "talking", "alert"];
  const DEFAULT_ANIMATION = "idle";

  function normalizeAnimationName(name) {
    if (typeof name !== "string") {
      return null;
    }

    const trimmed = name.trim().toLowerCase();
    return trimmed || null;
  }

  function createAnimationSet(animations) {
    const names = Array.isArray(animations) ? animations : DEFAULT_ANIMATIONS;
    const normalized = [];

    for (const name of names) {
      const value = normalizeAnimationName(name);
      if (value && !normalized.includes(value)) {
        normalized.push(value);
      }
    }

    if (!normalized.includes(DEFAULT_ANIMATION)) {
      normalized.unshift(DEFAULT_ANIMATION);
    }

    return normalized;
  }

  function resolveMotionQuery(matchMedia) {
    if (typeof matchMedia === "function") {
      return matchMedia;
    }

    if (typeof globalThis !== "undefined" && typeof globalThis.matchMedia === "function") {
      return globalThis.matchMedia.bind(globalThis);
    }

    return null;
  }

  function createAvatarAnimation(avatarEl, options = {}) {
    if (!avatarEl || typeof avatarEl !== "object") {
      throw new TypeError("avatarEl is required");
    }

    if (!avatarEl.dataset || typeof avatarEl.dataset !== "object") {
      avatarEl.dataset = {};
    }

    const animations = createAnimationSet(options.animations);
    const matchMedia = resolveMotionQuery(options.matchMedia);
    let motionQuery = null;

    if (matchMedia) {
      try {
        motionQuery = matchMedia("(prefers-reduced-motion: reduce)");
      } catch {
        motionQuery = null;
      }
    }

    function listAnimations() {
      return animations.slice();
    }

    function isMotionEnabled() {
      return !(motionQuery && motionQuery.matches);
    }

    function getAnimation() {
      const current = normalizeAnimationName(avatarEl.dataset.animation);
      if (current && animations.includes(current)) {
        return current;
      }
      return DEFAULT_ANIMATION;
    }

    function setAnimation(name) {
      const candidate = normalizeAnimationName(name);
      const next =
        candidate && animations.includes(candidate) ? candidate : DEFAULT_ANIMATION;
      avatarEl.dataset.animation = next;
      return next;
    }

    setAnimation(avatarEl.dataset.animation || DEFAULT_ANIMATION);

    return {
      getAnimation,
      setAnimation,
      listAnimations,
      isMotionEnabled,
    };
  }

  return {
    DEFAULT_ANIMATION,
    DEFAULT_ANIMATIONS,
    createAvatarAnimation,
  };
});
