const fs = require("fs");
const path = require("path");
const os = require("os");

const DEFAULT_STATUS = "Hello from DeskAvatar";
const DEFAULT_STATUS_DIR = path.join(os.homedir(), ".deskavatar");
const STATUS_FILENAME = "status.txt";

function resolveStatusPaths(statusDir = DEFAULT_STATUS_DIR) {
  return {
    statusDir,
    statusFile: path.join(statusDir, STATUS_FILENAME),
  };
}

function ensureStatusFile(statusDir = DEFAULT_STATUS_DIR, defaultStatus = DEFAULT_STATUS) {
  const { statusFile } = resolveStatusPaths(statusDir);

  if (!fs.existsSync(statusDir)) {
    fs.mkdirSync(statusDir, { recursive: true });
  }

  if (!fs.existsSync(statusFile)) {
    fs.writeFileSync(statusFile, `${defaultStatus}\n`, "utf8");
  }

  return statusFile;
}

function readStatusText(statusDir = DEFAULT_STATUS_DIR, defaultStatus = DEFAULT_STATUS) {
  const { statusFile } = resolveStatusPaths(statusDir);

  try {
    const text = fs.readFileSync(statusFile, "utf8").trim();
    return text || defaultStatus;
  } catch {
    return defaultStatus;
  }
}

function watchStatusFile(statusDir, onChange, { debounceMs = 50 } = {}) {
  const { statusFile } = resolveStatusPaths(statusDir);
  const statusBasename = path.basename(statusFile);
  let timer = null;

  const watcher = fs.watch(statusDir, { persistent: true }, (_eventType, filename) => {
    if (filename && filename !== statusBasename) {
      return;
    }

    clearTimeout(timer);
    timer = setTimeout(() => {
      ensureStatusFile(statusDir);
      onChange(readStatusText(statusDir));
    }, debounceMs);
  });

  return {
    close() {
      clearTimeout(timer);
      watcher.close();
    },
  };
}

module.exports = {
  DEFAULT_STATUS,
  DEFAULT_STATUS_DIR,
  STATUS_FILENAME,
  resolveStatusPaths,
  ensureStatusFile,
  readStatusText,
  watchStatusFile,
};
