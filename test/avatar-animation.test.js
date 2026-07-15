const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  createAvatarAnimation,
  DEFAULT_ANIMATION,
  DEFAULT_ANIMATIONS,
} = require("../src/renderer/avatar-animation");

function createMockAvatar(initialAnimation) {
  return {
    dataset: initialAnimation ? { animation: initialAnimation } : {},
  };
}

describe("avatar animation", () => {
  it("defaults to idle and lists built-in animations", () => {
    const el = createMockAvatar();
    const avatar = createAvatarAnimation(el);
    assert.equal(avatar.getAnimation(), "idle");
    assert.equal(el.dataset.animation, "idle");
    assert.equal(DEFAULT_ANIMATION, "idle");
    assert.deepEqual(avatar.listAnimations(), ["idle", "thinking"]);
    assert.deepEqual(DEFAULT_ANIMATIONS, ["idle", "thinking"]);
  });

  it("sets dataset.animation for known states", () => {
    const el = createMockAvatar();
    const avatar = createAvatarAnimation(el);

    assert.equal(avatar.setAnimation("thinking"), "thinking");
    assert.equal(el.dataset.animation, "thinking");
    assert.equal(avatar.getAnimation(), "thinking");

    assert.equal(avatar.setAnimation("idle"), "idle");
    assert.equal(el.dataset.animation, "idle");
  });

  it("falls back to idle for unknown animation names", () => {
    const el = createMockAvatar("thinking");
    const avatar = createAvatarAnimation(el);

    assert.equal(avatar.getAnimation(), "thinking");
    assert.equal(avatar.setAnimation("dance"), "idle");
    assert.equal(el.dataset.animation, "idle");
  });

  it("accepts extra registered animations via options", () => {
    const el = createMockAvatar();
    const avatar = createAvatarAnimation(el, {
      animations: ["idle", "thinking", "celebrate"],
    });

    assert.deepEqual(avatar.listAnimations(), ["idle", "thinking", "celebrate"]);
    assert.equal(avatar.setAnimation("celebrate"), "celebrate");
    assert.equal(el.dataset.animation, "celebrate");
  });

  it("reports motion disabled when prefers-reduced-motion matches", () => {
    const avatar = createAvatarAnimation(createMockAvatar(), {
      matchMedia: () => ({ matches: true }),
    });
    assert.equal(avatar.isMotionEnabled(), false);
  });

  it("reports motion enabled when reduced-motion does not match", () => {
    const avatar = createAvatarAnimation(createMockAvatar(), {
      matchMedia: () => ({ matches: false }),
    });
    assert.equal(avatar.isMotionEnabled(), true);
  });
});
