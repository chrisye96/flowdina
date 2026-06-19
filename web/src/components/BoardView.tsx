"use client";

import { type ComponentProps } from "react";
import { DynamicIcon } from "lucide-react/dynamic";
import type { Board } from "@/lib/board";
import { themeVars, tokenColor } from "@/lib/theme";
import NodeView from "./NodeView";
import s from "./board.module.css";

type DynName = ComponentProps<typeof DynamicIcon>["name"];

export default function BoardView({ board }: { board: Board }) {
  const { theme } = board;
  return (
    <div className={s.board} style={themeVars(theme)}>
      {board.banner && (
        <div className={s.banner}>
          <div className={s.bannerLeft}>
            <DynamicIcon name={"table-2" as DynName} size={23} />
            <div className={s.bannerTitle}>{board.banner.title}</div>
          </div>
          {board.banner.badge && (
            <div className={s.badge}>
              {board.banner.badge.icon && <DynamicIcon name={board.banner.badge.icon.name as DynName} size={16} />}
              <span>{board.banner.badge.text}</span>
            </div>
          )}
        </div>
      )}

      {board.sections.map((sec, i) => {
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
      })}
    </div>
  );
}
