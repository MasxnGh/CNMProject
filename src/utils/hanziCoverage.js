const finitePoint = (point) => Number.isFinite(point?.x) && Number.isFinite(point?.y);

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const scoreStrokeSet = (strokes, canvasSize) => {
  const width = Number(canvasSize?.width);
  const height = Number(canvasSize?.height);
  if (!(width > 0) || !(height > 0)) {
    return { strokeCount: 0, pointCount: 0, boundsCoverage: 0, quadrantCoverage: 0, passed: false };
  }

  const normalizedStrokes = (Array.isArray(strokes) ? strokes : [])
    .map((stroke) => (Array.isArray(stroke) ? stroke : []).filter((point) => (
      finitePoint(point)
      && point.x >= 0
      && point.x <= width
      && point.y >= 0
      && point.y <= height
    )))
    .filter((stroke) => stroke.length > 0);
  const points = normalizedStrokes.flat();

  if (points.length === 0) {
    return { strokeCount: 0, pointCount: 0, boundsCoverage: 0, quadrantCoverage: 0, passed: false };
  }

  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const boundsWidth = Math.max(...xs) - Math.min(...xs);
  const boundsHeight = Math.max(...ys) - Math.min(...ys);
  const boundsCoverage = clamp((boundsWidth * boundsHeight) / (width * height), 0, 1);
  const quadrants = new Set(points.map((point) => `${point.x < width / 2 ? 0 : 1}:${point.y < height / 2 ? 0 : 1}`));
  const quadrantCoverage = quadrants.size / 4;
  const strokeCount = normalizedStrokes.length;
  const pointCount = points.length;

  return {
    strokeCount,
    pointCount,
    boundsCoverage,
    quadrantCoverage,
    passed: strokeCount >= 1 && pointCount >= 8 && boundsCoverage >= 0.12 && quadrantCoverage >= 0.5,
  };
};
