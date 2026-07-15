const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const {
  DEFAULT_STATUS,
  ensureStatusFile,
  readStatusText,
  resolveStatusPaths,
  watchStatusFile,
} = require("../src/status");

describe("status store", () => {
  let tempDir;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "deskavatar-"));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("creates the status directory and default file when missing", () => {
    const statusFile = ensureStatusFile(tempDir);

    assert.equal(statusFile, resolveStatusPaths(tempDir).statusFile);
    assert.equal(fs.existsSync(statusFile), true);
    assert.equal(fs.readFileSync(statusFile, "utf8").trim(), DEFAULT_STATUS);
  });

  it("does not overwrite an existing status file", () => {
    const statusFile = resolveStatusPaths(tempDir).statusFile;
    fs.mkdirSync(tempDir, { recursive: true });
    fs.writeFileSync(statusFile, "Keep me\n", "utf8");

    ensureStatusFile(tempDir);

    assert.equal(fs.readFileSync(statusFile, "utf8").trim(), "Keep me");
  });

  it("reads trimmed status text from disk", () => {
    ensureStatusFile(tempDir);
    fs.writeFileSync(resolveStatusPaths(tempDir).statusFile, "  Focus mode  \n", "utf8");

    assert.equal(readStatusText(tempDir), "Focus mode");
  });

  it("falls back to the default when the file is missing or blank", () => {
    assert.equal(readStatusText(tempDir), DEFAULT_STATUS);

    ensureStatusFile(tempDir);
    fs.writeFileSync(resolveStatusPaths(tempDir).statusFile, "   \n", "utf8");

    assert.equal(readStatusText(tempDir), DEFAULT_STATUS);
  });

  it("notifies watchers when the status file changes", async () => {
    ensureStatusFile(tempDir);

    const updates = [];
    const watcher = watchStatusFile(
      tempDir,
      (text) => {
        updates.push(text);
      },
      { debounceMs: 10 }
    );

    try {
      fs.writeFileSync(
        resolveStatusPaths(tempDir).statusFile,
        "Live update\n",
        "utf8"
      );

      await new Promise((resolve, reject) => {
        const started = Date.now();
        const poll = () => {
          if (updates.includes("Live update")) {
            resolve();
            return;
          }
          if (Date.now() - started > 2000) {
            reject(new Error(`Timed out waiting for watcher. got=${JSON.stringify(updates)}`));
            return;
          }
          setTimeout(poll, 20);
        };
        poll();
      });
    } finally {
      watcher.close();
    }
  });
});
