const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  bottomRightPosition,
  trayToggleLabel,
  shouldHideInsteadOfClose,
} = require("../src/window-layout");

describe("window layout helpers", () => {
  it("positions the window in the bottom-right of the work area", () => {
    assert.deepEqual(
      bottomRightPosition(
        { x: 100, y: 50, width: 1440, height: 900 },
        { width: 160, height: 210 },
        24
      ),
      { x: 1356, y: 716 }
    );
  });

  it("labels the tray toggle based on visibility", () => {
    assert.equal(trayToggleLabel(true), "Hide Avatar");
    assert.equal(trayToggleLabel(false), "Show Avatar");
  });

  it("hides on close while running, and allows quit when quitting", () => {
    assert.equal(shouldHideInsteadOfClose(false), true);
    assert.equal(shouldHideInsteadOfClose(true), false);
  });
});
