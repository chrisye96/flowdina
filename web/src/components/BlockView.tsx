"use client";

import type { ReactNode } from "react";
import type { Block, Theme } from "@/lib/board";
import type { Path } from "@/lib/path";
import { tokenColor } from "@/lib/theme";
import Editable from "./Editable";
import Ico from "./Ico";
import s from "./board.module.css";

type Props = { block: Block; theme: Theme; path: Path; onEdit?: (p: Path, v: string) => void };

export default function BlockView({ block, theme, path, onEdit }: Props) {
  // editable text, or plain text when not in an editor
  const E = (text: string, ...keys: (string | number)[]): ReactNode =>
    onEdit ? <Editable value={text} onChange={(v) => onEdit([...path, ...keys], v)} /> : <>{text}</>;

  switch (block.type) {
    case "titleRow":
      return (
        <div className={s.titleRow}>
          {block.icon && (
            <div className={s.icon} style={{ background: tokenColor(block.iconBg ?? "blue", theme) }}>
              <Ico name={block.icon.name} />
            </div>
          )}
          <div className={s.cardTitle}>{E(block.text, "text")}</div>
        </div>
      );

    case "text":
      return (
        <p className={`${s.text} ${block.tone === "muted" ? s.textMuted : ""} ${block.align === "center" ? s.textCenter : ""}`}>
          {block.accentPrefix && <span className={s.accentPrefix}>{block.accentPrefix} </span>}
          {E(block.text, "text")}
        </p>
      );

    case "list":
      return (
        <ul className={s.list}>
          {block.items.map((it, i) => (
            <li key={i}>{E(it, "items", i)}</li>
          ))}
        </ul>
      );

    case "field":
      return (
        <div className={s.field}>
          <span className={s.fLabel}>{E(block.label, "label")}</span>
          <span className={`${s.fValue} ${block.strong === false ? s.fValueNormal : ""}`}>
            {block.sub && <span className={s.fLabel}>{block.sub} </span>}
            {E(block.value, "value")}
          </span>
        </div>
      );

    case "button": {
      const cls = block.style === "primary" ? s.btnPrimary : block.style === "danger" ? s.btnDanger : s.btnOutline;
      return (
        <div className={`${s.btn} ${cls} ${block.trailingIcon ? s.btnSpace : ""}`}>
          {block.icon && <Ico name={block.icon.name} size={14} />}
          <span>{E(block.text, "text")}</span>
          {block.trailingIcon && <Ico name={block.trailingIcon.name} size={16} />}
        </div>
      );
    }

    case "callout": {
      const warn = block.kind === "warn";
      return (
        <div className={warn ? s.warn : s.note}>
          <div className={`${s.calloutHead} ${warn ? s.warnHead : ""}`}>
            {block.icon && <Ico name={block.icon.name} size={14} />}
            {block.title && <span>{E(block.title, "title")}</span>}
          </div>
          {block.blocks.map((b, i) => (
            <BlockView key={i} block={b} theme={theme} path={[...path, "blocks", i]} onEdit={onEdit} />
          ))}
        </div>
      );
    }

    case "chip":
      return (
        <div className={s.chip}>
          {block.icon && <Ico name={block.icon.name} size={13} />}
          <span>{E(block.text, "text")}</span>
        </div>
      );

    case "band":
      return <div className={s.band}>{E(block.text, "text")}</div>;
  }
}
