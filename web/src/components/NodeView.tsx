"use client";

import type { Node, Theme } from "@/lib/board";
import type { Path } from "@/lib/path";
import { tokenColor } from "@/lib/theme";
import BlockView from "./BlockView";
import Editable from "./Editable";
import Ico from "./Ico";
import s from "./board.module.css";

const ACCENT: Record<string, string> = {
  danger: s.cardDanger,
  decision: s.cardDecision,
  "state-blue": s.cardStateBlue,
  "state-green": s.cardStateGreen,
};

export default function NodeView({
  node,
  theme,
  path,
  onEdit,
  onDelete,
}: {
  node: Node;
  theme: Theme;
  path: Path;
  onEdit?: (p: Path, v: string) => void;
  onDelete?: (id: string) => void;
}) {
  const delBtn = onDelete && (
    <button
      className={s.nodeDel}
      title="删除卡片"
      onClick={(ev) => {
        ev.stopPropagation();
        onDelete(node.id);
      }}
    >
      ×
    </button>
  );

  if (node.variant === "pill") {
    const ti = node.blocks.findIndex((b) => b.type === "titleRow");
    const title = ti >= 0 ? node.blocks[ti] : undefined;
    const text = title?.type === "titleRow" ? title.text : "";
    const icon = title?.type === "titleRow" ? title.icon : undefined;
    return (
      <div data-node-id={node.id} className={s.pill} style={{ background: tokenColor(node.pillColor ?? "blue", theme) }}>
        {delBtn}
        {icon && <Ico name={icon.name} size={18} />}
        <span>{onEdit && ti >= 0 ? <Editable value={text} onChange={(v) => onEdit([...path, "blocks", ti, "text"], v)} /> : text}</span>
      </div>
    );
  }

  return (
    <div data-node-id={node.id} className={`${s.card} ${node.accent ? ACCENT[node.accent] ?? "" : ""}`}>
      {delBtn}
      {node.tag && <span className={s.tag}>{onEdit ? <Editable value={node.tag} onChange={(v) => onEdit([...path, "tag"], v)} /> : node.tag}</span>}
      {node.header && (
        <div className={s.cardHeader} style={{ background: tokenColor(node.header.color, theme) }}>
          {onEdit ? <Editable value={node.header.text} onChange={(v) => onEdit([...path, "header", "text"], v)} /> : node.header.text}
        </div>
      )}
      {node.blocks.map((b, i) => (
        <BlockView key={i} block={b} theme={theme} path={[...path, "blocks", i]} onEdit={onEdit} />
      ))}
    </div>
  );
}
