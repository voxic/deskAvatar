const statusEl = document.getElementById("status-text");

function setStatus(text) {
  const normalized = DeskAvatarStatusView.normalizeStatusText(text);
  statusEl.textContent = normalized;
  statusEl.title = typeof text === "string" ? text : normalized;
}

async function init() {
  const initial = await window.deskAvatar.getStatus();
  setStatus(initial);
  window.deskAvatar.onStatusUpdated(setStatus);
}

init();
