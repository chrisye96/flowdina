// Pure connector geometry, ported from the vanilla editor. Operates on rectangles
// (measured from the DOM by EdgeLayer), never on the DOM itself.

export type Pt = { x: number; y: number };
export type Rect = { left: number; top: number; right: number; bottom: number; cx: number; cy: number };
export type EdgeLine = "straight" | "elbow" | "curve";
type Side = "top" | "bottom" | "left" | "right";

function port(r: Rect, side: Side): Pt {
  if (side === "top") return { x: r.cx, y: r.top };
  if (side === "bottom") return { x: r.cx, y: r.bottom };
  if (side === "left") return { x: r.left, y: r.cy };
  return { x: r.right, y: r.cy };
}

// Choose attach sides by how the blocks are separated (not centre distance), so
// arrows enter/exit cleanly even when blocks differ in height.
function sides(a: Rect, c: Rect): { sf: Side; st: Side; orient: "v" | "h" } {
  if (c.top >= a.bottom - 1) return { sf: "bottom", st: "top", orient: "v" };
  if (c.bottom <= a.top + 1) return { sf: "top", st: "bottom", orient: "v" };
  if (c.left >= a.right - 1) return { sf: "right", st: "left", orient: "h" };
  if (c.right <= a.left + 1) return { sf: "left", st: "right", orient: "h" };
  const dx = c.cx - a.cx, dy = c.cy - a.cy, v = Math.abs(dy) >= Math.abs(dx);
  return v
    ? { sf: dy >= 0 ? "bottom" : "top", st: dy >= 0 ? "top" : "bottom", orient: "v" }
    : { sf: dx >= 0 ? "right" : "left", st: dx >= 0 ? "left" : "right", orient: "h" };
}

function geom(line: EdgeLine, p1: Pt, p2: Pt, orient: "v" | "h"): { d: string; headFrom: Pt; tailFrom: Pt; mid: Pt } {
  if (line === "elbow") {
    if (orient === "v") {
      const my = (p1.y + p2.y) / 2;
      return {
        d: `M ${p1.x} ${p1.y} L ${p1.x} ${my} L ${p2.x} ${my} L ${p2.x} ${p2.y}`,
        headFrom: { x: p2.x, y: my },
        tailFrom: { x: p1.x, y: my },
        mid: { x: (p1.x + p2.x) / 2, y: my },
      };
    }
    const mx = (p1.x + p2.x) / 2;
    return {
      d: `M ${p1.x} ${p1.y} L ${mx} ${p1.y} L ${mx} ${p2.y} L ${p2.x} ${p2.y}`,
      headFrom: { x: mx, y: p2.y },
      tailFrom: { x: mx, y: p1.y },
      mid: { x: mx, y: (p1.y + p2.y) / 2 },
    };
  }
  if (line === "curve") {
    const v = orient === "v", k = 0.5;
    const c1 = v ? { x: p1.x, y: p1.y + (p2.y - p1.y) * k } : { x: p1.x + (p2.x - p1.x) * k, y: p1.y };
    const c2 = v ? { x: p2.x, y: p2.y - (p2.y - p1.y) * k } : { x: p2.x - (p2.x - p1.x) * k, y: p2.y };
    return {
      d: `M ${p1.x} ${p1.y} C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${p2.x} ${p2.y}`,
      headFrom: c2,
      tailFrom: c1,
      mid: { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 },
    };
  }
  return { d: `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`, headFrom: p1, tailFrom: p2, mid: { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 } };
}

export function computeEdge(from: Rect, to: Rect, line: EdgeLine = "elbow") {
  const { sf, st, orient } = sides(from, to);
  const p1 = port(from, sf), p2 = port(to, st);
  return { ...geom(line, p1, p2, orient), p1, p2 };
}

// Arrowhead polygon points, drawn as geometry (markers render unreliably in html2canvas).
export function arrowPoints(tip: Pt, from: Pt, len = 11, wid = 6): string {
  const a = Math.atan2(tip.y - from.y, tip.x - from.x);
  const bx = tip.x - len * Math.cos(a), by = tip.y - len * Math.sin(a);
  return `${tip.x} ${tip.y} ${bx - wid * Math.sin(a)} ${by + wid * Math.cos(a)} ${bx + wid * Math.sin(a)} ${by - wid * Math.cos(a)}`;
}
