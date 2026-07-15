const {
  app,
  BrowserWindow,
  Tray,
  Menu,
  nativeImage,
  ipcMain,
} = require("electron");
const fs = require("fs");
const path = require("path");
const os = require("os");

const WINDOW_WIDTH = 160;
const WINDOW_HEIGHT = 210;
const STATUS_DIR = path.join(os.homedir(), ".deskavatar");
const STATUS_FILE = path.join(STATUS_DIR, "status.txt");
const DEFAULT_STATUS = "Hello from DeskAvatar";

let mainWindow = null;
let tray = null;
let statusWatcher = null;
let isQuitting = false;

function ensureStatusFile() {
  if (!fs.existsSync(STATUS_DIR)) {
    fs.mkdirSync(STATUS_DIR, { recursive: true });
  }

  if (!fs.existsSync(STATUS_FILE)) {
    fs.writeFileSync(STATUS_FILE, `${DEFAULT_STATUS}\n`, "utf8");
  }
}

function readStatusText() {
  try {
    const text = fs.readFileSync(STATUS_FILE, "utf8").trim();
    return text || DEFAULT_STATUS;
  } catch {
    return DEFAULT_STATUS;
  }
}

function pushStatusToRenderer() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("status-updated", readStatusText());
  }
}

function watchStatusFile() {
  if (statusWatcher) {
    statusWatcher.close();
    statusWatcher = null;
  }

  // Watch the directory so atomic editor saves (rename/replace) are still detected.
  try {
    statusWatcher = fs.watch(STATUS_DIR, { persistent: true }, (_eventType, filename) => {
      if (filename && filename !== path.basename(STATUS_FILE)) {
        return;
      }

      clearTimeout(watchStatusFile._timer);
      watchStatusFile._timer = setTimeout(() => {
        ensureStatusFile();
        pushStatusToRenderer();
      }, 50);
    });
  } catch (error) {
    console.error("Failed to watch status file:", error);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    x: undefined,
    y: undefined,
    show: false,
    frame: false,
    transparent: true,
    resizable: false,
    movable: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    fullscreenable: false,
    maximizable: false,
    minimizable: false,
    acceptFirstMouse: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // Keep above full-screen apps / Mission Control spaces on macOS.
  mainWindow.setAlwaysOnTop(true, "screen-saver");
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  mainWindow.loadFile(path.join(__dirname, "renderer", "index.html"));

  mainWindow.once("ready-to-show", () => {
    positionWindowBottomRight();
    mainWindow.showInactive();
    pushStatusToRenderer();
  });

  mainWindow.on("close", (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

function positionWindowBottomRight() {
  const { screen } = require("electron");
  const display = screen.getPrimaryDisplay();
  const { width, height } = display.workArea;
  const x = display.workArea.x + width - WINDOW_WIDTH - 24;
  const y = display.workArea.y + height - WINDOW_HEIGHT - 24;
  mainWindow.setPosition(x, y);
}

function createTray() {
  const iconPath = path.join(__dirname, "..", "assets", "tray-icon.png");
  let icon = nativeImage.createFromPath(iconPath);

  if (icon.isEmpty()) {
    // 16x16 template-friendly fallback if the PNG is missing.
    icon = nativeImage.createEmpty();
  }

  if (process.platform === "darwin") {
    icon.setTemplateImage(true);
  }

  tray = new Tray(icon.isEmpty() ? createFallbackTrayIcon() : icon);
  tray.setToolTip("DeskAvatar");
  updateTrayMenu();

  tray.on("click", () => {
    toggleWindow();
  });
}

function createFallbackTrayIcon() {
  // Minimal 16x16 PNG (black circle) encoded as base64 for menu-bar visibility.
  const pngBase64 =
    "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAQAAAC1HAwCAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAAmJLR0QAAKqNIzIAAAAJcEhZcwAADsQAAA7EAZUrDhsAAAAHdElNRQfmBxkTJxVnVwKqAAAAPUlEQVQoz2NgGAWjYBQMZ8BAPxowMzAwMDAwMTAwMjD8Z2D4z8DAwMjAwMjAwPCfkYGBgYGBgYGBgYGBgQEADVkCBq9mHpcAAAAASUVORK5CYII=";
  return nativeImage.createFromBuffer(Buffer.from(pngBase64, "base64"));
}

function updateTrayMenu() {
  const visible = mainWindow && mainWindow.isVisible();
  const menu = Menu.buildFromTemplate([
    {
      label: visible ? "Hide Avatar" : "Show Avatar",
      click: () => toggleWindow(),
    },
    { type: "separator" },
    {
      label: "Open Status File",
      click: () => {
        const { shell } = require("electron");
        ensureStatusFile();
        shell.openPath(STATUS_FILE);
      },
    },
    {
      label: "Reveal Status Folder",
      click: () => {
        const { shell } = require("electron");
        ensureStatusFile();
        shell.showItemInFolder(STATUS_FILE);
      },
    },
    { type: "separator" },
    {
      label: "Quit DeskAvatar",
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(menu);
}

function toggleWindow() {
  if (!mainWindow) {
    return;
  }

  if (mainWindow.isVisible()) {
    mainWindow.hide();
  } else {
    mainWindow.showInactive();
    pushStatusToRenderer();
  }

  updateTrayMenu();
}

app.whenReady().then(() => {
  ensureStatusFile();
  createWindow();
  createTray();
  watchStatusFile();

  // macOS: keep running when the window is closed (tray continues).
  app.dock?.hide();

  ipcMain.handle("get-status", () => readStatusText());
  ipcMain.handle("get-status-path", () => STATUS_FILE);
});

app.on("before-quit", () => {
  isQuitting = true;
  if (statusWatcher) {
    statusWatcher.close();
    statusWatcher = null;
  }
});

app.on("window-all-closed", () => {
  // Stay alive for the menu-bar tray (do not quit when the overlay is hidden).
});
