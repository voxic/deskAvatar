const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("deskAvatar", {
  getStatus: () => ipcRenderer.invoke("get-status"),
  getStatusPath: () => ipcRenderer.invoke("get-status-path"),
  onStatusUpdated: (callback) => {
    const listener = (_event, text) => callback(text);
    ipcRenderer.on("status-updated", listener);
    return () => ipcRenderer.removeListener("status-updated", listener);
  },
});
