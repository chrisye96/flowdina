"use client";

import { useRef, type ReactNode } from "react";
import type { Board } from "@/lib/board";
import type { Path } from "@/lib/path";
import { themeVars, tokenColor } from "@/lib/theme";
import NodeView from "./NodeView";
import EdgeLayer from "./EdgeLayer";
import Editable from "./Editable";
import Ico from "./Ico";
import s from "./board.module.css";

export default function BoardView({ board, onEdit }: { board: Board; onEdit?: (p: Path, v: string) => void }) {
  const { theme } = board;
  const flow = board.mode === "flow";
  const boardRef = useRef<HTMLDivElement>(null);

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
                  <NodeView key={n.id} node={n} theme={theme} path={[...cp, "nodes", nIdx]} onEdit={onEdit} />
                ))}
              </div>
            );
          })}
        </div>
      );
    }
    if (sec.type === "node") return <NodeView key={i} node={sec.node} theme={theme} path={["sections", i, "node"]} onEdit={onEdit} />;
    return (
      <div key={i} className={s.caption}>
        {E(sec.text, "sections", i, "text")}
      </div>
    );
  });

  return (
    <div ref={boardRef} className={`${s.board} ${flow ? s.flowMode : ""}`} style={themeVars(theme)}>
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

      <EdgeLayer edges={board.edges} boardRef={boardRef} theme={theme} />
    </div>
  );
}
