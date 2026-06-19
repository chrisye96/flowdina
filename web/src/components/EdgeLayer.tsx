"use client";

import { useEffect, useState, type RefObject } from "react";
import type { Edge, Theme } from "@/lib/board";
import { computeEdge, arrowPoints, type EdgeLine, type Rect } from "@/lib/edges";
import { tokenColor } from "@/lib/theme";
import s from "./board.module.css";

function rectIn(el: Element, b: DOMRect): Rect {
  const r = el.getBoundingClientRect();
  const x = r.left - b.left, y = r.top - b.top;
  return { left: x, top: y, right: x + r.width, bottom: y + r.height, cx: x + r.width / 2, cy: y + r.height / 2 };
}

const LINES: { v: EdgeLine; t: string }[] = [{ v: "straight", t: "直" }, { v: "elbow", t: "折" }, { v: "curve", t: "曲" }];
const ARROWS: { v: NonNullable<Edge["arrow"]>; t: string }[] = [{ v: "end", t: "→" }, { v: "both", t: "↔" }, { v: "none", t: "—" }];

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
  selected,
  onSelect,
  onDelete,
  onUpdate,
}: {
  edges: Edge[];
  boardRef: RefObject<HTMLDivElement | null>;
  theme: Theme;
  // Editing handlers are optional: when absent the layer is a static render
  // (export, read-only) and never captures pointer events.
  selected?: string | null;
  onSelect?: (id: string | null) => void;
  onDelete?: (id: string) => void;
  onUpdate?: (id: string, patch: Partial<Edge>) => void;
}) {
  const [drawn, setDrawn] = useState<Drawn[]>([]);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const interactive = !!onSelect;

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
        const sel = interactive && selected === p.id;
        const stroke = sel ? theme.accent : p.color;
        const lw = p.label ? p.label.length * 7 + 12 : 0;
        const e = sel ? edges.find((x) => x.id === p.id) : undefined;
        return (
          <g key={p.id}>
            {/* Fat transparent hit-area: catches clicks on (and near) the wire while gaps stay click-through to the cards. */}
            {interactive && (
              <path
                d={p.d}
                fill="none"
                stroke="transparent"
                strokeWidth={14}
                style={{ pointerEvents: "stroke", cursor: "pointer" }}
                onClick={(ev) => {
                  ev.stopPropagation();
                  onSelect?.(p.id);
                }}
              />
            )}
            <path d={p.d} fill="none" stroke={stroke} strokeWidth={sel ? 3 : 2} strokeDasharray={p.dash ? "6 5" : undefined} />
            {p.arrow !== "none" && <polygon points={arrowPoints(p.p2, p.headFrom)} fill={stroke} />}
            {p.arrow === "both" && <polygon points={arrowPoints(p.p1, p.tailFrom)} fill={stroke} />}
            {p.label && !sel && (
              <>
                <rect x={p.mid.x - lw / 2} y={p.mid.y - 8} width={lw} height={16} rx={4} fill="var(--page-bg)" />
                <text x={p.mid.x} y={p.mid.y} textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600} fill="#334155">
                  {p.label}
                </text>
              </>
            )}
            {sel && e && (
              <foreignObject x={p.mid.x - 160} y={p.mid.y - 48} width={320} height={42} style={{ overflow: "visible", pointerEvents: "none" }}>
                <div className={s.edgeBar} style={{ pointerEvents: "auto" }} onClick={(ev) => ev.stopPropagation()}>
                  {LINES.map((l) => (
                    <button key={l.v} className={`${s.edgeBtn} ${(e.line ?? "elbow") === l.v ? s.edgeOn : ""}`} onClick={() => onUpdate?.(p.id, { line: l.v })} title="线型">
                      {l.t}
                    </button>
                  ))}
                  <span className={s.edgeSep} />
                  {ARROWS.map((a) => (
                    <button key={a.v} className={`${s.edgeBtn} ${(e.arrow ?? "end") === a.v ? s.edgeOn : ""}`} onClick={() => onUpdate?.(p.id, { arrow: a.v })} title="箭头">
                      {a.t}
                    </button>
                  ))}
                  <span className={s.edgeSep} />
                  <button className={`${s.edgeBtn} ${e.dash ? s.edgeOn : ""}`} onClick={() => onUpdate?.(p.id, { dash: !e.dash })} title="虚线">
                    虚
                  </button>
                  <input
                    className={s.edgeInput}
                    value={e.label ?? ""}
                    placeholder="标签"
                    onChange={(ev) => onUpdate?.(p.id, { label: ev.target.value || undefined })}
                  />
                  <span className={s.edgeSep} />
                  <button className={s.edgeDel} onClick={() => onDelete?.(p.id)} title="删除连线">
                    删除
                  </button>
                </div>
              </foreignObject>
            )}
          </g>
        );
      })}
    </svg>
  );
}
