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
    assert.deepEqual(avatar.listAnimations(), [
      "idle",
      "thinking",
      "celebrate",
      "talking",
      "alert",
      "sleeping",
      "loading",
      "waiting",
      "frustrated",
      "happy",
      "sad",
      "angry",
      "dead",
      "gone-fishing",
    ]);
    assert.deepEqual(DEFAULT_ANIMATIONS, [
      "idle",
      "thinking",
      "celebrate",
      "talking",
      "alert",
      "sleeping",
      "loading",
      "waiting",
      "frustrated",
      "happy",
      "sad",
      "angry",
      "dead",
      "gone-fishing",
    ]);
  });

  it("sets dataset.animation for known states", () => {
    const el = createMockAvatar();
    const avatar = createAvatarAnimation(el);

    assert.equal(avatar.setAnimation("thinking"), "thinking");
    assert.equal(el.dataset.animation, "thinking");
    assert.equal(avatar.getAnimation(), "thinking");

    assert.equal(avatar.setAnimation("celebrate"), "celebrate");
    assert.equal(el.dataset.animation, "celebrate");

    assert.equal(avatar.setAnimation("talking"), "talking");
    assert.equal(el.dataset.animation, "talking");

    assert.equal(avatar.setAnimation("alert"), "alert");
    assert.equal(el.dataset.animation, "alert");

    assert.equal(avatar.setAnimation("sleeping"), "sleeping");
    assert.equal(el.dataset.animation, "sleeping");

    assert.equal(avatar.setAnimation("loading"), "loading");
    assert.equal(el.dataset.animation, "loading");

    assert.equal(avatar.setAnimation("waiting"), "waiting");
    assert.equal(el.dataset.animation, "waiting");

    assert.equal(avatar.setAnimation("frustrated"), "frustrated");
    assert.equal(el.dataset.animation, "frustrated");

    assert.equal(avatar.setAnimation("happy"), "happy");
    assert.equal(el.dataset.animation, "happy");

    assert.equal(avatar.setAnimation("sad"), "sad");
    assert.equal(el.dataset.animation, "sad");

    assert.equal(avatar.setAnimation("angry"), "angry");
    assert.equal(el.dataset.animation, "angry");

    assert.equal(avatar.setAnimation("dead"), "dead");
    assert.equal(el.dataset.animation, "dead");

    assert.equal(avatar.setAnimation("gone-fishing"), "gone-fishing");
    assert.equal(el.dataset.animation, "gone-fishing");

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
      animations: ["idle", "thinking", "wave"],
    });

    assert.deepEqual(avatar.listAnimations(), ["idle", "thinking", "wave"]);
    assert.equal(avatar.setAnimation("wave"), "wave");
    assert.equal(el.dataset.animation, "wave");
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
