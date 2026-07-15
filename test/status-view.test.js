const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  normalizeStatusText,
  parseStatus,
  DEFAULT_ANIMATION,
} = require("../src/renderer/status-view");

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

  it("defaults to idle when no animation tag is present", () => {
    assert.deepEqual(parseStatus("Shipping the MVP"), {
      message: "Shipping the MVP",
      animation: "idle",
    });
    assert.equal(DEFAULT_ANIMATION, "idle");
  });

  it("parses a leading animation tag and returns the remaining message", () => {
    assert.deepEqual(
      parseStatus("[thinking] Deep in a refactor", {
        allowedAnimations: ["idle", "thinking"],
      }),
      {
        message: "Deep in a refactor",
        animation: "thinking",
      }
    );
  });

  it("treats animation tags as case-insensitive", () => {
    assert.deepEqual(
      parseStatus("[Thinking] Almost done", {
        allowedAnimations: ["idle", "thinking"],
      }),
      {
        message: "Almost done",
        animation: "thinking",
      }
    );
  });

  it("falls back to idle for unknown animation names", () => {
    assert.deepEqual(
      parseStatus("[nope] Still works", {
        allowedAnimations: ["idle", "thinking"],
      }),
      {
        message: "Still works",
        animation: "idle",
      }
    );
  });

  it("allows an empty message when only an animation tag is present", () => {
    assert.deepEqual(
      parseStatus("[thinking]", {
        allowedAnimations: ["idle", "thinking"],
      }),
      {
        message: "",
        animation: "thinking",
      }
    );
  });

  it("allows an empty message for a recognized idle tag", () => {
    assert.deepEqual(
      parseStatus("[idle]", {
        allowedAnimations: ["idle", "thinking"],
      }),
      {
        message: "",
        animation: "idle",
      }
    );
  });

  it("falls back for blank or non-string status values", () => {
    assert.deepEqual(parseStatus("   "), {
      message: "Waiting for status…",
      animation: "idle",
    });
    assert.deepEqual(parseStatus(null), {
      message: "Waiting for status…",
      animation: "idle",
    });
  });
});
