"use client";

import type { Node, Theme } from "@/lib/board";
import { tokenColor } from "@/lib/theme";
import BlockView from "./BlockView";
import Ico from "./Ico";
import s from "./board.module.css";

const ACCENT: Record<string, string> = {
  danger: s.cardDanger,
  decision: s.cardDecision,
  "state-blue": s.cardStateBlue,
  "state-green": s.cardStateGreen,
};

export default function NodeView({ node, theme }: { node: Node; theme: Theme }) {
  if (node.variant === "pill") {
    const title = node.blocks.find((b) => b.type === "titleRow");
    const text = title?.type === "titleRow" ? title.text : "";
    const icon = title?.type === "titleRow" ? title.icon : undefined;
    return (
      <div data-node-id={node.id} className={s.pill} style={{ background: tokenColor(node.pillColor ?? "blue", theme) }}>
        {icon && <Ico name={icon.name} size={18} />}
        <span>{text}</span>
      </div>
    );
  }

  return (
    <div data-node-id={node.id} className={`${s.card} ${node.accent ? ACCENT[node.accent] ?? "" : ""}`}>
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
