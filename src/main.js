const {
  app,
  BrowserWindow,
  Tray,
  Menu,
  nativeImage,
  ipcMain,
} = require("electron");
const path = require("path");
const {
  DEFAULT_STATUS_DIR,
  ensureStatusFile,
  readStatusText,
  watchStatusFile,
  resolveStatusPaths,
} = require("./status");
const {
  bottomRightPosition,
  trayToggleLabel,
  shouldHideInsteadOfClose,
} = require("./window-layout");

const WINDOW_WIDTH = 160;
const WINDOW_HEIGHT = 210;
const { statusFile: STATUS_FILE } = resolveStatusPaths(DEFAULT_STATUS_DIR);

let mainWindow = null;
let tray = null;
let statusWatcher = null;
let isQuitting = false;

function pushStatusToRenderer() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("status-updated", readStatusText());
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
    if (shouldHideInsteadOfClose(isQuitting)) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

function positionWindowBottomRight() {
  const { screen } = require("electron");
  const display = screen.getPrimaryDisplay();
  const { x, y } = bottomRightPosition(display.workArea, {
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
  });
  mainWindow.setPosition(x, y);
}

function createTray() {
  const iconPath = path.join(__dirname, "..", "assets", "tray-icon.png");
  let icon = nativeImage.createFromPath(iconPath);

  if (icon.isEmpty()) {
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
  const pngBase64 =
    "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAQAAAC1HAwCAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAAmJLR0QAAKqNIzIAAAAJcEhZcwAADsQAAA7EAZUrDhsAAAAHdElNRQfmBxkTJxVnVwKqAAAAPUlEQVQoz2NgGAWjYBQMZ8BAPxowMzAwMDAwMTAwMjD8Z2D4z8DAwMjAwMjAwPCfkYGBgYGBgYGBgYGBgQEADVkCBq9mHpcAAAAASUVORK5CYII=";
  return nativeImage.createFromBuffer(Buffer.from(pngBase64, "base64"));
}

function updateTrayMenu() {
  const visible = Boolean(mainWindow && mainWindow.isVisible());
  const menu = Menu.buildFromTemplate([
    {
      label: trayToggleLabel(visible),
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
  statusWatcher = watchStatusFile(DEFAULT_STATUS_DIR, () => {
    pushStatusToRenderer();
  });

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
