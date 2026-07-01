"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Block } from "@/lib/board";
import Ico from "./Ico";
import s from "./board.module.css";

const TYPES: { t: Block["type"]; label: string; icon: string }[] = [
  { t: "text", label: "文字", icon: "type" },
  { t: "list", label: "列表", icon: "list" },
  { t: "field", label: "状态行", icon: "align-left" },
  { t: "button", label: "按钮", icon: "square" },
  { t: "callout", label: "通知框", icon: "mail" },
  { t: "chip", label: "标记", icon: "tag" },
  { t: "band", label: "底栏", icon: "minus" },
];

export default function AddBlockMenu({ onAdd }: { onAdd: (type: Block["type"]) => void }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (!(e.target as HTMLElement).closest("[data-add-pop]")) setOpen(false);
    };
    const t = setTimeout(() => document.addEventListener("mousedown", close), 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener("mousedown", close);
    };
  }, [open]);

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const r = btnRef.current!.getBoundingClientRect();
    setPos({ top: r.bottom + 4, left: r.left, width: Math.max(140, r.width) });
    setOpen((o) => !o);
  };

  return (
    <div className={s.addBlockWrap} data-export-hide data-add-pop>
      <button ref={btnRef} className={s.addBlock} onClick={toggle} title="向此卡片添加内容">
        <Ico name="plus" size={13} /> 添加内容
      </button>
      {/* Portaled so the card's overflow:hidden (flow mode) can't clip it. */}
      {open &&
        pos &&
        createPortal(
          <div className={s.addMenu} data-add-pop style={{ position: "fixed", top: pos.top, left: pos.left, width: pos.width }} onClick={(e) => e.stopPropagation()}>
            {TYPES.map((x) => (
              <button
                key={x.t}
                onClick={() => {
                  onAdd(x.t);
                  setOpen(false);
                }}
              >
                <Ico name={x.icon} size={14} /> {x.label}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}
