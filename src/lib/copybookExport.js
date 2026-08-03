const COLS = 6;
const CELL_SIZE = 120;
const CELL_PADDING = 6;
const INNER_PADDING = 16;
const STROKE_WIDTH = 12;

const BG_COLOR = "#0E1428"; // var(--night)
const CELL_COLOR = "#1A2340"; // var(--night2)
const STROKE_COLOR = "#F4EAD6"; // var(--paper)

function drawRoundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
  }
  ctx.closePath();
}

// Rasterizes every saved copybook entry's stroke paths onto one canvas and
// triggers a PNG download. Sized by devicePixelRatio so the export isn't
// blurry on high-DPI (mobile) screens even though the on-screen canvas
// element itself is drawn at CSS logical pixels.
export function downloadCopybookPng(entries, filename = "copybook.png") {
  if (entries.length === 0) return;

  const dpr = window.devicePixelRatio || 1;
  const cols = COLS;
  const rows = Math.ceil(entries.length / cols);
  const width = cols * CELL_SIZE;
  const height = rows * CELL_SIZE;

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);

  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, width, height);

  entries.forEach((entry, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    const x = col * CELL_SIZE;
    const y = row * CELL_SIZE;
    const cellInner = CELL_SIZE - 2 * CELL_PADDING;

    ctx.fillStyle = CELL_COLOR;
    drawRoundedRect(ctx, x + CELL_PADDING, y + CELL_PADDING, cellInner, cellInner, 12);
    ctx.fill();

    const drawableSize = cellInner - 2 * INNER_PADDING;
    const scale = drawableSize / (entry.size || 360);

    ctx.save();
    ctx.translate(x + CELL_PADDING + INNER_PADDING, y + CELL_PADDING + INNER_PADDING);
    ctx.scale(scale, scale);
    ctx.strokeStyle = STROKE_COLOR;
    ctx.lineWidth = STROKE_WIDTH;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    (entry.strokePaths || []).forEach((d) => {
      ctx.stroke(new Path2D(d));
    });
    ctx.restore();
  });

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }, "image/png");
}
