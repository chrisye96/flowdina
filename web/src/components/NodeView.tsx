"use client";

import { useRef, type PointerEvent as ReactPointerEvent } from "react";
import type { Block, Node, Theme } from "@/lib/board";
import type { Path } from "@/lib/path";
import { tokenColor } from "@/lib/theme";
import BlockView from "./BlockView";
import AddBlockMenu from "./AddBlockMenu";
import Editable from "./Editable";
import EditableIcon from "./EditableIcon";
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
  onSet,
  onAddBlock,
  onDeleteBlock,
  onDelete,
  selected = false,
}: {
  node: Node;
  theme: Theme;
  path: Path;
  onEdit?: (p: Path, v: string) => void;
  onSet?: (p: Path, v: unknown) => void;
  onAddBlock?: (blocksPath: Path, type: Block["type"]) => void;
  onDeleteBlock?: (blocksPath: Path, index: number) => void;
  onDelete?: (id: string) => void;
  selected?: boolean;
}) {
  const sel = selected ? " " + s.nodeSelected : "";
  const cardRef = useRef<HTMLDivElement>(null);

  // Drag the corner handle to set the card's width + a min-height (content can grow past it).
  const startResize = (e: ReactPointerEvent) => {
    if (!onSet) return;
    e.preventDefault();
    e.stopPropagation();
    const card = cardRef.current;
    if (!card) return;
    const sx = e.clientX, sy = e.clientY;
    const r = card.getBoundingClientRect();
    const sw = r.width, sh = r.height;
    const calc = (ev: PointerEvent) => ({ w: Math.round(Math.max(140, sw + (ev.clientX - sx))), h: Math.round(Math.max(48, sh + (ev.clientY - sy))) });
    const move = (ev: PointerEvent) => {
      const { w, h } = calc(ev);
      card.style.width = w + "px";
      card.style.minHeight = h + "px";
    };
    const up = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      const { w, h } = calc(ev);
      onSet([...path, "width"], w);
      onSet([...path, "minHeight"], h);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

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
      <div data-node-id={node.id} className={s.pill + sel} style={{ background: tokenColor(node.pillColor ?? "blue", theme) }}>
        {delBtn}
        {onSet && ti >= 0 ? (
          <EditableIcon name={icon?.name} size={18} onChange={(n) => onSet([...path, "blocks", ti, "icon"], n ? { name: n } : undefined)} />
        ) : icon ? (
          <Ico name={icon.name} size={18} />
        ) : null}
        <span>{onEdit && ti >= 0 ? <Editable value={text} onChange={(v) => onEdit([...path, "blocks", ti, "text"], v)} /> : text}</span>
      </div>
    );
  }

  return (
    <div
      ref={cardRef}
      data-node-id={node.id}
      className={`${s.card} ${node.accent ? ACCENT[node.accent] ?? "" : ""}${sel}`}
      style={{ width: node.width || undefined, minHeight: node.minHeight || undefined }}
    >
      {delBtn}
      {node.tag && <span className={s.tag}>{onEdit ? <Editable value={node.tag} onChange={(v) => onEdit([...path, "tag"], v)} /> : node.tag}</span>}
      {node.header && (
        <div className={s.cardHeader} style={{ background: tokenColor(node.header.color, theme) }}>
          {onEdit ? <Editable value={node.header.text} onChange={(v) => onEdit([...path, "header", "text"], v)} /> : node.header.text}
        </div>
      )}
      {node.blocks.map((b, i) => (
        <div key={i} className={s.blockRow}>
          {onDeleteBlock && (
            <button
              className={s.blockDel}
              title="删除此项"
              onMouseDown={(e) => e.preventDefault()}
              onClick={(ev) => {
                ev.stopPropagation();
                onDeleteBlock([...path, "blocks"], i);
              }}
            >
              ×
            </button>
          )}
          <BlockView block={b} theme={theme} path={[...path, "blocks", i]} onEdit={onEdit} onSet={onSet} />
        </div>
      ))}
      {onAddBlock && <AddBlockMenu onAdd={(type) => onAddBlock([...path, "blocks"], type)} />}
      {selected && onSet && <span className={s.resizeHandle} data-export-hide title="拖动调整大小" onPointerDown={startResize} />}
    </div>
  );
}
