"use client";

import { useEffect, useState, type RefObject } from "react";
import type { Edge, Theme } from "@/lib/board";
import { computeEdge, arrowPoints, type Rect } from "@/lib/edges";
import { tokenColor } from "@/lib/theme";

function rectIn(el: Element, b: DOMRect): Rect {
  const r = el.getBoundingClientRect();
  const x = r.left - b.left, y = r.top - b.top;
  return { left: x, top: y, right: x + r.width, bottom: y + r.height, cx: x + r.width / 2, cy: y + r.height / 2 };
}

type Drawn = {
  id: string;
  d: string;
  color: string;
  dash?: boolean;
  arrow: "end" | "both" | "none";
  p1: { x: number; y: number };
  p2: { x: number; y: number };
  headFrom: { x: number; y: number };
  tailFrom: { x: number; y: number };
  label?: string;
  mid: { x: number; y: number };
};

export default function EdgeLayer({
  edges,
  boardRef,
  theme,
}: {
  edges: Edge[];
  boardRef: RefObject<HTMLDivElement | null>;
  theme: Theme;
}) {
  const [drawn, setDrawn] = useState<Drawn[]>([]);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;
    const recompute = () => {
      const b = board.getBoundingClientRect();
      setSize({ w: board.scrollWidth, h: board.scrollHeight });
      const out: Drawn[] = [];
      for (const e of edges) {
        const a = board.querySelector(`[data-node-id="${CSS.escape(e.from)}"]`);
        const c = board.querySelector(`[data-node-id="${CSS.escape(e.to)}"]`);
        if (!a || !c) continue;
        const g = computeEdge(rectIn(a, b), rectIn(c, b), e.line ?? "elbow");
        out.push({
          id: e.id,
          color: e.color ? tokenColor(e.color, theme) : "#64748b",
          dash: e.dash,
          arrow: e.arrow ?? "end",
          label: e.label,
          ...g,
        });
      }
      setDrawn(out);
    };
    recompute();
    const ro = new ResizeObserver(recompute);
    ro.observe(board);
    window.addEventListener("resize", recompute);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", recompute);
    };
  }, [edges, boardRef, theme]);

  if (edges.length === 0) return null;

  return (
    <svg
      width={size.w}
      height={size.h}
      style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none", overflow: "visible", zIndex: 0 }}
      aria-hidden="true"
    >
      {drawn.map((p) => {
        const lw = p.label ? p.label.length * 7 + 12 : 0;
        return (
          <g key={p.id}>
            <path d={p.d} fill="none" stroke={p.color} strokeWidth={2} strokeDasharray={p.dash ? "6 5" : undefined} />
            {p.arrow !== "none" && <polygon points={arrowPoints(p.p2, p.headFrom)} fill={p.color} />}
            {p.arrow === "both" && <polygon points={arrowPoints(p.p1, p.tailFrom)} fill={p.color} />}
            {p.label && (
              <>
                <rect x={p.mid.x - lw / 2} y={p.mid.y - 8} width={lw} height={16} rx={4} fill="var(--page-bg)" />
                <text x={p.mid.x} y={p.mid.y} textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600} fill="#334155">
                  {p.label}
                </text>
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
}
