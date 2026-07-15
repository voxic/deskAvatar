const overlayEl = document.getElementById("drag-region");
const statusEl = document.getElementById("status-text");
const avatarEl = document.querySelector(".avatar");
const avatar = DeskAvatarAvatarAnimation.createAvatarAnimation(avatarEl);

function setStatus(text) {
  const { message, animation } = DeskAvatarStatusView.parseStatus(text, {
    allowedAnimations: avatar.listAnimations(),
  });
  statusEl.textContent = message;
  statusEl.title = message;
  overlayEl.classList.toggle("overlay--textless", message === "");
  avatar.setAnimation(animation);
}

async function init() {
  const initial = await window.deskAvatar.getStatus();
  setStatus(initial);
  window.deskAvatar.onStatusUpdated(setStatus);
}

init();
