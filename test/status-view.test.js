const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { normalizeStatusText } = require("../src/renderer/status-view");

describe("status view", () => {
  it("keeps non-empty status text", () => {
    assert.equal(normalizeStatusText("Ship it"), "Ship it");
  });

  it("trims whitespace and falls back for blank or non-string values", () => {
    assert.equal(normalizeStatusText("  hello  "), "hello");
    assert.equal(normalizeStatusText("   "), "Waiting for status…");
    assert.equal(normalizeStatusText(null), "Waiting for status…");
    assert.equal(normalizeStatusText(undefined, "Custom"), "Custom");
  });
});
