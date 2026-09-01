import { Point, isNode, type Node } from "@patternfly/react-topology";

const HULL_SAMPLES = 12;
const DEFAULT_GROUP_PADDING = 17;
const EDGE_INSET = 8;

type Tuple = [number, number];

function cross(o: Tuple, a: Tuple, b: Tuple) {
  return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
}

/** Monotone-chain convex hull, CCW, last point ≠ first. */
function convexHull(points: Tuple[]): Tuple[] {
  const unique = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (unique.length <= 1) return unique;

  const lower: Tuple[] = [];
  for (const point of unique) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], point) <= 0) {
      lower.pop();
    }
    lower.push(point);
  }

  const upper: Tuple[] = [];
  for (let i = unique.length - 1; i >= 0; i--) {
    const point = unique[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], point) <= 0) {
      upper.pop();
    }
    upper.push(point);
  }

  lower.pop();
  upper.pop();
  return lower.concat(upper);
}

function groupPadding(group: Node): number {
  const padding = group.getStyle<{ padding?: number | number[] }>().padding ?? DEFAULT_GROUP_PADDING;
  return Array.isArray(padding) ? Math.max(...padding) : padding;
}

/**
 * Convex hull matching PatternFly's rounded group outline: samples on each
 * child's padded circle, so the polygon tracks whatever arrangement the nodes form.
 */
export function paddedHullPolygon(group: Node): Point[] {
  const padding = groupPadding(group);
  const samples: Tuple[] = [];

  group
    .getNodes()
    .filter((child) => child.isVisible())
    .forEach((child) => {
      const bounds = child.getBounds();
      const cx = bounds.x + bounds.width / 2;
      const cy = bounds.y + bounds.height / 2;
      const radius = Math.max(bounds.width, bounds.height) / 2 + padding;
      for (let i = 0; i < HULL_SAMPLES; i++) {
        const angle = (i / HULL_SAMPLES) * Math.PI * 2;
        samples.push([cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius]);
      }
    });

  return convexHull(samples).map(([x, y]) => new Point(x, y));
}

function pointInConvexPolygon(polygon: Point[], point: Point, inset: number): boolean {
  if (polygon.length < 3) return false;
  const n = polygon.length;
  for (let i = 0; i < n; i++) {
    const a = polygon[i];
    const b = polygon[(i + 1) % n];
    const crossZ = (b.x - a.x) * (point.y - a.y) - (b.y - a.y) * (point.x - a.x);
    const edgeLen = Math.hypot(b.x - a.x, b.y - a.y);
    if (edgeLen < 1) continue;
    if (crossZ < inset * edgeLen) return false;
  }
  return true;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

const CHANNEL_T = [0.5, 0.38, 0.62, 0.26, 0.74, 0.18, 0.82];

/**
 * Orthogonal elbows that stay inside a group's convex hull.
 * Falls back to a straight segment (always inside a convex hull) if no channel fits.
 */
export function elbowBendpointsInsideHull(start: Point, end: Point, hull: Point[]): Point[] {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  if (Math.abs(dx) < 6 || Math.abs(dy) < 6 || hull.length < 3) {
    return [];
  }

  const vertical = (x: number): Point[] | null => {
    const p1 = new Point(x, start.y);
    const p2 = new Point(x, end.y);
    return pointInConvexPolygon(hull, p1, EDGE_INSET) && pointInConvexPolygon(hull, p2, EDGE_INSET)
      ? [p1, p2]
      : null;
  };
  const horizontal = (y: number): Point[] | null => {
    const p1 = new Point(start.x, y);
    const p2 = new Point(end.x, y);
    return pointInConvexPolygon(hull, p1, EDGE_INSET) && pointInConvexPolygon(hull, p2, EDGE_INSET)
      ? [p1, p2]
      : null;
  };

  for (const t of CHANNEL_T) {
    const found = vertical(lerp(start.x, end.x, t));
    if (found) return found;
  }
  for (const t of CHANNEL_T) {
    const found = horizontal(lerp(start.y, end.y, t));
    if (found) return found;
  }
  return [];
}

export function sharedParentGroup(source: Node, target: Node): Node | undefined {
  if (!source.hasParent() || !target.hasParent()) {
    return undefined;
  }
  const sourceParent = source.getParent();
  const targetParent = target.getParent();
  if (
    isNode(sourceParent) &&
    sourceParent.isGroup() &&
    sourceParent === targetParent
  ) {
    return sourceParent;
  }
  return undefined;
}
