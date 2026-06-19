"use client";

import type { Node, Theme } from "@/lib/board";
import { tokenColor } from "@/lib/theme";
import BlockView from "./BlockView";
import s from "./board.module.css";

export default function NodeView({ node, theme }: { node: Node; theme: Theme }) {
  const danger = node.accent === "danger";
  return (
    <div className={`${s.card} ${danger ? s.cardDanger : ""}`}>
      {node.tag && <span className={s.tag}>{node.tag}</span>}
      {node.header && (
        <div className={s.cardHeader} style={{ background: tokenColor(node.header.color, theme) }}>
          {node.header.text}
        </div>
      )}
      {node.blocks.map((b, i) => (
        <BlockView key={i} block={b} theme={theme} />
      ))}
    </div>
  );
}
