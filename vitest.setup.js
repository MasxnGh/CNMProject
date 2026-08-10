import "@testing-library/jest-dom/vitest";

// jsdom doesn't implement matchMedia at all.
if (!window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}

// jsdom doesn't implement a 2D canvas context — the app's ambient/particle
// canvases would otherwise log "not implemented" errors on every render.
const noop = () => {};
const fakeCtx = {
  setTransform: noop,
  clearRect: noop,
  fillRect: noop,
  strokeRect: noop,
  beginPath: noop,
  closePath: noop,
  moveTo: noop,
  lineTo: noop,
  quadraticCurveTo: noop,
  bezierCurveTo: noop,
  arc: noop,
  fill: noop,
  stroke: noop,
  save: noop,
  restore: noop,
  translate: noop,
  rotate: noop,
  scale: noop,
  fillStyle: "#000",
  strokeStyle: "#000",
  lineWidth: 1,
  lineCap: "butt",
  globalAlpha: 1,
};
HTMLCanvasElement.prototype.getContext = () => fakeCtx;

if (!window.navigator.vibrate) {
  window.navigator.vibrate = () => true;
}

if (!window.HTMLElement.prototype.scrollIntoView) {
  window.HTMLElement.prototype.scrollIntoView = () => {};
}
