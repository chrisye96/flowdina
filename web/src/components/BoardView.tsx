"use client";

import { useEffect, useRef, type MouseEvent, type ReactNode } from "react";
import type { Board, Edge } from "@/lib/board";
import type { Path } from "@/lib/path";
import { themeVars, tokenColor } from "@/lib/theme";
import NodeView from "./NodeView";
import EdgeLayer from "./EdgeLayer";
import Editable from "./Editable";
import Ico from "./Ico";
import s from "./board.module.css";

type Sel = { kind: "node" | "edge"; id: string } | null;

export default function BoardView({
  board,
  onEdit,
  connect = false,
  onConnect,
  selected = null,
  onSelect,
  onDeleteEdge,
  onUpdateEdge,
  onDeleteNode,
}: {
  board: Board;
  onEdit?: (p: Path, v: string) => void;
  // Connector editing (editor only). When omitted the board is read-only.
  connect?: boolean;
  onConnect?: (from: string, to: string) => void;
  selected?: Sel;
  onSelect?: (s: Sel) => void;
  onDeleteEdge?: (id: string) => void;
  onUpdateEdge?: (id: string, patch: Partial<Edge>) => void;
  onDeleteNode?: (id: string) => void;
}) {
  const { theme } = board;
  const flow = board.mode === "flow";
  const boardRef = useRef<HTMLDivElement>(null);
  const selectedEdge = selected?.kind === "edge" ? selected.id : null;
  const selectedNode = selected?.kind === "node" ? selected.id : null;
  // The pending source lives in a ref, not state: between the two clicks nothing
  // re-renders, so toggling the highlight class directly survives until the edge lands.
  const pendingRef = useRef<string | null>(null);

  const clearPending = () => {
    if (pendingRef.current) {
      boardRef.current?.querySelector(`[data-node-id="${CSS.escape(pendingRef.current)}"]`)?.classList.remove(s.connectSource);
      pendingRef.current = null;
    }
  };
  // Leaving connect mode abandons any half-drawn edge.
  useEffect(() => {
    if (!connect) clearPending();
  }, [connect]);

  const onBoardClick = (ev: MouseEvent<HTMLDivElement>) => {
    if (connect && onConnect) {
      const el = (ev.target as HTMLElement).closest("[data-node-id]");
      const id = el?.getAttribute("data-node-id") ?? null;
      if (!id) return clearPending(); // clicked empty space → cancel
      if (!pendingRef.current) {
        pendingRef.current = id;
        el!.classList.add(s.connectSource);
      } else if (pendingRef.current !== id) {
        const from = pendingRef.current;
        clearPending();
        onConnect(from, id);
      } else {
        clearPending(); // clicked the source again → cancel
      }
      return;
    }
    // Outside connect mode: click a block to select it, click empty canvas to clear.
    // (Edge clicks stopPropagation in EdgeLayer, so they never reach here.)
    const el = (ev.target as HTMLElement).closest("[data-node-id]");
    const id = el?.getAttribute("data-node-id") ?? null;
    onSelect?.(id ? { kind: "node", id } : null);
  };

  const E = (text: string, ...keys: (string | number)[]): ReactNode =>
    onEdit ? <Editable value={text} onChange={(v) => onEdit(keys, v)} /> : <>{text}</>;

  const sections = board.sections.map((sec, i) => {
    if (sec.type === "columns") {
      return (
        <div key={i} className={s.columns}>
          {sec.columns.map((col, c) => {
            const cp: Path = ["sections", i, "columns", c];
            return (
              <div key={col.id ?? c} className={s.col}>
                {col.header && (
                  <div className={s.colHead} style={{ background: tokenColor(col.header.color, theme) }}>
                    <div className={s.colHeadTop}>
                      {col.header.num && <span className={s.num}>{E(col.header.num, ...cp, "header", "num")}</span>}
                      <span className={s.colTitle}>{E(col.header.title, ...cp, "header", "title")}</span>
                    </div>
                    {col.header.sub && <div className={s.colSub}>{E(col.header.sub, ...cp, "header", "sub")}</div>}
                  </div>
                )}
                {col.nodes.map((n, nIdx) => (
                  <NodeView key={n.id} node={n} theme={theme} path={[...cp, "nodes", nIdx]} onEdit={onEdit} onDelete={onDeleteNode} selected={selectedNode === n.id} />
                ))}
              </div>
            );
          })}
        </div>
      );
    }
    if (sec.type === "node") return <NodeView key={i} node={sec.node} theme={theme} path={["sections", i, "node"]} onEdit={onEdit} onDelete={onDeleteNode} selected={selectedNode === sec.node.id} />;
    return (
      <div key={i} className={s.caption}>
        {E(sec.text, "sections", i, "text")}
      </div>
    );
  });

  return (
    <div
      ref={boardRef}
      className={`${s.board} ${flow ? s.flowMode : ""} ${connect ? s.connect : ""}`}
      style={themeVars(theme)}
      onClick={onBoardClick}
    >
      {board.banner && (
        <div className={s.banner}>
          <div className={s.bannerLeft}>
            <Ico name="table-2" size={23} color="var(--banner-text)" />
            <div className={s.bannerTitle}>{E(board.banner.title, "banner", "title")}</div>
          </div>
          {board.banner.badge && (
            <div className={s.badge}>
              {board.banner.badge.icon && <Ico name={board.banner.badge.icon.name} size={16} />}
              <span>{E(board.banner.badge.text, "banner", "badge", "text")}</span>
            </div>
          )}
        </div>
      )}

      {flow ? <div className={s.flowCol}>{sections}</div> : sections}

      <EdgeLayer
        edges={board.edges}
        boardRef={boardRef}
        theme={theme}
        selected={selectedEdge}
        onSelect={(id) => onSelect?.(id ? { kind: "edge", id } : null)}
        onDelete={onDeleteEdge}
        onUpdate={onUpdateEdge}
      />
    </div>
  );
}
