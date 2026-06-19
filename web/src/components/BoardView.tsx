"use client";

import { useRef } from "react";
import type { Board } from "@/lib/board";
import { themeVars, tokenColor } from "@/lib/theme";
import NodeView from "./NodeView";
import EdgeLayer from "./EdgeLayer";
import Ico from "./Ico";
import s from "./board.module.css";

export default function BoardView({ board }: { board: Board }) {
  const { theme } = board;
  const flow = board.mode === "flow";
  const boardRef = useRef<HTMLDivElement>(null);

  const sections = board.sections.map((sec, i) => {
    if (sec.type === "columns") {
      return (
        <div key={i} className={s.columns}>
          {sec.columns.map((col, c) => (
            <div key={col.id ?? c} className={s.col}>
              {col.header && (
                <div className={s.colHead} style={{ background: tokenColor(col.header.color, theme) }}>
                  <div className={s.colHeadTop}>
                    {col.header.num && <span className={s.num}>{col.header.num}</span>}
                    <span className={s.colTitle}>{col.header.title}</span>
                  </div>
                  {col.header.sub && <div className={s.colSub}>{col.header.sub}</div>}
                </div>
              )}
              {col.nodes.map((n) => (
                <NodeView key={n.id} node={n} theme={theme} />
              ))}
            </div>
          ))}
        </div>
      );
    }
    if (sec.type === "node") return <NodeView key={i} node={sec.node} theme={theme} />;
    return (
      <div key={i} className={s.caption}>
        {sec.text}
      </div>
    );
  });

  return (
    <div ref={boardRef} className={`${s.board} ${flow ? s.flowMode : ""}`} style={themeVars(theme)}>
      {board.banner && (
        <div className={s.banner}>
          <div className={s.bannerLeft}>
            <Ico name="table-2" size={23} color="var(--banner-text)" />
            <div className={s.bannerTitle}>{board.banner.title}</div>
          </div>
          {board.banner.badge && (
            <div className={s.badge}>
              {board.banner.badge.icon && <Ico name={board.banner.badge.icon.name} size={16} />}
              <span>{board.banner.badge.text}</span>
            </div>
          )}
        </div>
      )}

      {flow ? <div className={s.flowCol}>{sections}</div> : sections}

      <EdgeLayer edges={board.edges} boardRef={boardRef} theme={theme} />
    </div>
  );
}
