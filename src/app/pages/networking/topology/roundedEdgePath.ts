/**
 * Rounded orthogonal polyline for PatternFly Topology edges.
 * Densifies sharp elbows into short arc segments so DefaultEdge's L-path reads smooth.
 */
import { Point } from "@patternfly/react-topology";

const CORNER_RADIUS = 14;
const ARC_SEGMENTS = 6;

function dist(a: Point, b: Point) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function almostColinear(a: Point, b: Point, c: Point) {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const bcx = c.x - b.x;
  const bcy = c.y - b.y;
  const cross = Math.abs(abx * bcy - aby * bcx);
  return cross < 0.5;
}

/** Points along a circular arc from `from` toward `to` around corner `corner`. */
function arcAroundCorner(prev: Point, corner: Point, next: Point, radius: number): Point[] {
  const dPrev = dist(prev, corner);
  const dNext = dist(corner, next);
  if (dPrev < 1 || dNext < 1 || almostColinear(prev, corner, next)) {
    return [corner];
  }

  const r = Math.min(radius, dPrev / 2, dNext / 2);
  if (r < 2) return [corner];

  const inX = (prev.x - corner.x) / dPrev;
  const inY = (prev.y - corner.y) / dPrev;
  const outX = (next.x - corner.x) / dNext;
  const outY = (next.y - corner.y) / dNext;

  const start = new Point(corner.x + inX * r, corner.y + inY * r);
  const end = new Point(corner.x + outX * r, corner.y + outY * r);

  // For orthogonal elbows, interpolate with a quarter-circle in the plane of the bend.
  const points: Point[] = [];
  for (let i = 1; i < ARC_SEGMENTS; i++) {
    const t = i / ARC_SEGMENTS;
    // Ease through the corner using quadratic Bezier (start → corner → end).
    const ox = (1 - t) * (1 - t) * start.x + 2 * (1 - t) * t * corner.x + t * t * end.x;
    const oy = (1 - t) * (1 - t) * start.y + 2 * (1 - t) * t * corner.y + t * t * end.y;
    points.push(new Point(ox, oy));
  }
  points.push(end);
  return points;
}

/**
 * Convert start + hard elbow bendpoints + end into densified intermediate bendpoints
 * (exclude start/end — DefaultEdge appends those).
 */
export function roundedElbowBendpoints(start: Point, elbows: Point[], end: Point, radius = CORNER_RADIUS): Point[] {
  if (elbows.length === 0) return [];
  const chain = [start, ...elbows, end];
  const out: Point[] = [];

  for (let i = 1; i < chain.length - 1; i++) {
    const prev = chain[i - 1];
    const curr = chain[i];
    const next = chain[i + 1];
    const arc = arcAroundCorner(prev, curr, next, radius);
    // Skip the first arc point when it duplicates the previous segment end.
    if (out.length > 0) {
      const last = out[out.length - 1];
      const first = arc[0];
      if (Math.hypot(first.x - last.x, first.y - last.y) < 0.5) {
        out.push(...arc.slice(1));
        continue;
      }
    }
    out.push(...arc);
  }

  return out;
}
