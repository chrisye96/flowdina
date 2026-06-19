"use client";

import { useEffect, useRef, useState } from "react";
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
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const t = setTimeout(() => document.addEventListener("mousedown", close), 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener("mousedown", close);
    };
  }, [open]);

  return (
    <div ref={ref} className={s.addBlockWrap} data-export-hide>
      <button
        className={s.addBlock}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        title="向此卡片添加内容"
      >
        <Ico name="plus" size={13} /> 添加内容
      </button>
      {open && (
        <div className={s.addMenu} onClick={(e) => e.stopPropagation()}>
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
        </div>
      )}
    </div>
  );
}
