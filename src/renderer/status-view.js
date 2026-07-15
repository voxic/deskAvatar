(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.DeskAvatarStatusView = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  function normalizeStatusText(text, fallback = "Waiting for status…") {
    if (typeof text !== "string") {
      return fallback;
    }

    const trimmed = text.trim();
    return trimmed || fallback;
  }

  return {
    normalizeStatusText,
  };
});
