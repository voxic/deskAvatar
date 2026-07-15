const statusEl = document.getElementById("status-text");

function setStatus(text) {
  statusEl.textContent = text || "Waiting for status…";
  statusEl.title = text || "";
}

async function init() {
  const initial = await window.deskAvatar.getStatus();
  setStatus(initial);
  window.deskAvatar.onStatusUpdated(setStatus);
}

init();
