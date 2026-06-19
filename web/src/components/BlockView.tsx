"use client";

import type { Block, Theme } from "@/lib/board";
import { tokenColor } from "@/lib/theme";
import Ico from "./Ico";
import s from "./board.module.css";

export default function BlockView({ block, theme }: { block: Block; theme: Theme }) {
  switch (block.type) {
    case "titleRow":
      return (
        <div className={s.titleRow}>
          {block.icon && (
            <div className={s.icon} style={{ background: tokenColor(block.iconBg ?? "blue", theme) }}>
              <Ico name={block.icon.name} />
            </div>
          )}
          <div className={s.cardTitle}>{block.text}</div>
        </div>
      );

    case "text":
      return (
        <p className={`${s.text} ${block.tone === "muted" ? s.textMuted : ""} ${block.align === "center" ? s.textCenter : ""}`}>
          {block.accentPrefix && <span className={s.accentPrefix}>{block.accentPrefix} </span>}
          {block.text}
        </p>
      );

    case "list":
      return (
        <ul className={s.list}>
          {block.items.map((it, i) => (
            <li key={i}>{it}</li>
          ))}
        </ul>
      );

    case "field":
      return (
        <div className={s.field}>
          <span className={s.fLabel}>{block.label}</span>
          <span className={`${s.fValue} ${block.strong === false ? s.fValueNormal : ""}`}>
            {block.sub && <span className={s.fLabel}>{block.sub} </span>}
            {block.value}
          </span>
        </div>
      );

    case "button": {
      const cls = block.style === "primary" ? s.btnPrimary : block.style === "danger" ? s.btnDanger : s.btnOutline;
      return (
        <div className={`${s.btn} ${cls} ${block.trailingIcon ? s.btnSpace : ""}`}>
          {block.icon && <Ico name={block.icon.name} size={14} />}
          <span>{block.text}</span>
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
            {block.title && <span>{block.title}</span>}
          </div>
          {block.blocks.map((b, i) => (
            <BlockView key={i} block={b} theme={theme} />
          ))}
        </div>
      );
    }

    case "chip":
      return (
        <div className={s.chip}>
          {block.icon && <Ico name={block.icon.name} size={13} />}
          <span>{block.text}</span>
        </div>
      );

    case "band":
      return <div className={s.band}>{block.text}</div>;
  }
}
