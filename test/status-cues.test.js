const { describe, it, mock } = require("node:test");
const assert = require("node:assert/strict");
const {
  parseCueLine,
  parseStatusCues,
  formatCueDisplay,
  shouldPlaySequence,
  createCuePlayer,
  DEFAULT_ANIMATIONS,
} = require("../src/status-cues");

describe("status cues", () => {
  it("parses a plain line as idle with no duration", () => {
    assert.deepEqual(parseCueLine("Shipping the MVP"), {
      animation: "idle",
      text: "Shipping the MVP",
      ms: null,
      display: "Shipping the MVP",
    });
  });

  it("parses an animation tag and trailing @duration in seconds", () => {
    assert.deepEqual(parseCueLine("[thinking] Reading the diff @2s"), {
      animation: "thinking",
      text: "Reading the diff",
      ms: 2000,
      display: "[thinking] Reading the diff",
    });
  });

  it("parses fractional seconds and millisecond durations", () => {
    assert.equal(parseCueLine("[talking] Hi @2.5s").ms, 2500);
    assert.equal(parseCueLine("[alert] Boom @2000ms").ms, 2000);
  });

  it("leaves invalid @suffix in the message and treats duration as hold", () => {
    assert.deepEqual(parseCueLine("[thinking] Still here @soon"), {
      animation: "thinking",
      text: "Still here @soon",
      ms: null,
      display: "[thinking] Still here @soon",
    });
  });

  it("falls back to idle for unknown animation tags", () => {
    assert.deepEqual(
      parseCueLine("[nope] Still works @1s", {
        allowedAnimations: DEFAULT_ANIMATIONS,
      }),
      {
        animation: "idle",
        text: "Still works",
        ms: 1000,
        display: "Still works",
      }
    );
  });

  it("parses new mood animation tags including gone-fishing", () => {
    assert.deepEqual(parseCueLine("[sleeping] Zzz @3s"), {
      animation: "sleeping",
      text: "Zzz",
      ms: 3000,
      display: "[sleeping] Zzz",
    });
    assert.deepEqual(parseCueLine("[gone-fishing] BRB"), {
      animation: "gone-fishing",
      text: "BRB",
      ms: null,
      display: "[gone-fishing] BRB",
    });
    assert.equal(parseCueLine("[loading] Busy…").animation, "loading");
    assert.equal(parseCueLine("[frustrated] Ugh").animation, "frustrated");
    assert.equal(parseCueLine("[happy] Nice").animation, "happy");
    assert.equal(parseCueLine("[sad] Oops").animation, "sad");
    assert.equal(parseCueLine("[angry] Nope").animation, "angry");
    assert.equal(parseCueLine("[dead] Crash").animation, "dead");
    assert.equal(parseCueLine("[waiting] …").animation, "waiting");
  });

  it("splits a multi-line file into cues and ignores blank lines", () => {
    const cues = parseStatusCues(
      [
        "[thinking] Reading the diff @2s",
        "",
        "  [talking] Race in the watcher @3.5s  ",
        "[idle] Standing by",
      ].join("\n")
    );

    assert.equal(cues.length, 3);
    assert.equal(cues[0].ms, 2000);
    assert.equal(cues[1].ms, 3500);
    assert.equal(cues[2].ms, null);
    assert.equal(cues[2].display, "Standing by");
  });

  it("falls back to a single waiting cue for blank or non-string input", () => {
    assert.deepEqual(parseStatusCues("   \n"), [
      {
        animation: "idle",
        text: "Waiting for status…",
        ms: null,
        display: "Waiting for status…",
      },
    ]);
    assert.equal(parseStatusCues(null).length, 1);
  });

  it("detects when a sequence should play", () => {
    assert.equal(shouldPlaySequence(parseStatusCues("Just idle")), false);
    assert.equal(shouldPlaySequence(parseStatusCues("[thinking] A @1s")), true);
    assert.equal(
      shouldPlaySequence(
        parseStatusCues("[thinking] A @1s\n[idle] B")
      ),
      true
    );
  });

  it("formats non-idle cues with a leading tag", () => {
    assert.equal(
      formatCueDisplay({ animation: "celebrate", text: "Done" }),
      "[celebrate] Done"
    );
    assert.equal(formatCueDisplay({ animation: "idle", text: "Hold" }), "Hold");
  });
});

describe("cue player", () => {
  it("pushes a single undated cue once and holds", () => {
    const beats = [];
    const player = createCuePlayer();
    player.play(parseStatusCues("[thinking] Deep in a refactor"), (cue) => {
      beats.push(cue.display);
    });
    assert.deepEqual(beats, ["[thinking] Deep in a refactor"]);
  });

  it("advances timed cues and holds an undated final beat", () => {
    const timers = new Map();
    let nextId = 1;
    const setTimeoutFn = mock.fn((fn, ms) => {
      const id = nextId++;
      timers.set(id, { fn, ms });
      return id;
    });
    const clearTimeoutFn = mock.fn((id) => {
      timers.delete(id);
    });

    function fireNext() {
      assert.equal(timers.size, 1);
      const [id, entry] = [...timers.entries()][0];
      timers.delete(id);
      entry.fn();
      return entry;
    }

    const beats = [];
    const player = createCuePlayer({
      setTimeout: setTimeoutFn,
      clearTimeout: clearTimeoutFn,
    });

    player.play(
      parseStatusCues(
        "[thinking] One @2s\n[talking] Two @1s\n[idle] Hold"
      ),
      (cue) => {
        beats.push(cue.display);
      }
    );

    assert.deepEqual(beats, ["[thinking] One"]);
    assert.equal(fireNext().ms, 2000);

    assert.deepEqual(beats, ["[thinking] One", "[talking] Two"]);
    assert.equal(fireNext().ms, 1000);

    assert.deepEqual(beats, [
      "[thinking] One",
      "[talking] Two",
      "Hold",
    ]);
    assert.equal(timers.size, 0);
  });

  it("holds on an undated middle cue and does not advance further", () => {
    const setTimeoutFn = mock.fn();
    const beats = [];
    const player = createCuePlayer({ setTimeout: setTimeoutFn });

    player.play(
      parseStatusCues("[thinking] First\n[talking] Never shown"),
      (cue) => {
        beats.push(cue.display);
      }
    );

    assert.deepEqual(beats, ["[thinking] First"]);
    assert.equal(setTimeoutFn.mock.callCount(), 0);
  });

  it("replace-on-write cancels the previous playlist", () => {
    const timers = new Map();
    let nextId = 1;
    const setTimeoutFn = mock.fn((fn, ms) => {
      const id = nextId++;
      timers.set(id, { fn, ms });
      return id;
    });
    const clearTimeoutFn = mock.fn((id) => {
      timers.delete(id);
    });

    const beats = [];
    const player = createCuePlayer({
      setTimeout: setTimeoutFn,
      clearTimeout: clearTimeoutFn,
    });

    player.play(
      parseStatusCues("[thinking] Old @5s\n[idle] Old hold"),
      (cue) => {
        beats.push(cue.display);
      }
    );

    assert.deepEqual(beats, ["[thinking] Old"]);
    assert.equal(timers.size, 1);
    const stale = [...timers.values()][0];

    player.play(parseStatusCues("[alert] Interrupted"), (cue) => {
      beats.push(cue.display);
    });

    assert.equal(clearTimeoutFn.mock.callCount(), 1);
    assert.deepEqual(beats, ["[thinking] Old", "[alert] Interrupted"]);

    // Stale timer must not advance the old playlist.
    stale.fn();
    assert.deepEqual(beats, ["[thinking] Old", "[alert] Interrupted"]);
  });

  it("holds the last timed cue without scheduling past the end", () => {
    const setTimeoutFn = mock.fn();
    const beats = [];
    const player = createCuePlayer({ setTimeout: setTimeoutFn });

    player.play(parseStatusCues("[celebrate] Done @2s"), (cue) => {
      beats.push(cue.display);
    });

    assert.deepEqual(beats, ["[celebrate] Done"]);
    assert.equal(setTimeoutFn.mock.callCount(), 0);
  });
});
