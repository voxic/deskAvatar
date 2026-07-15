function bottomRightPosition(workArea, windowSize, margin = 24) {
  return {
    x: workArea.x + workArea.width - windowSize.width - margin,
    y: workArea.y + workArea.height - windowSize.height - margin,
  };
}

function trayToggleLabel(isVisible) {
  return isVisible ? "Hide Avatar" : "Show Avatar";
}

function shouldHideInsteadOfClose(isQuitting) {
  return !isQuitting;
}

module.exports = {
  bottomRightPosition,
  trayToggleLabel,
  shouldHideInsteadOfClose,
};
