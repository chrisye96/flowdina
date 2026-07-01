"use client";

import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { createPortal } from "react-dom";
import Ico from "./Ico";
import s from "./icon-picker.module.css";

// A curated set of common lucide icons for the picker (all kebab-case, verified valid).
const COMMON = [
  "check", "x", "circle-check", "circle-x", "alert-triangle", "info", "clock", "calendar-days",
  "user", "users", "mail", "bell", "send", "phone", "flag", "star", "heart", "thumbs-up",
  "shield-check", "lock", "database", "server", "settings", "zap", "refresh-cw", "file-text",
  "file-check", "credit-card", "map-pin", "rocket", "trending-up", "play",
];

// Click an icon to change/remove it; or, when the slot is empty (no name), a faint
// "+" ghost lets you add one.
export default function EditableIcon({
  name,
  size,
  color,
  onChange,
}: {
  name?: string;
  size?: number;
  color?: string;
  onChange: (name: string | undefined) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (!(e.target as HTMLElement).closest("[data-icon-pop]")) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    // defer so the opening click doesn't immediately close the popover
    const t = setTimeout(() => {
      document.addEventListener("mousedown", close);
      document.addEventListener("keydown", esc);
    }, 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const toggle = (e: ReactMouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const r = ref.current!.getBoundingClientRect();
    setPos({ top: r.bottom + 6, left: Math.max(8, Math.min(r.left, window.innerWidth - 244)) });
    setOpen((o) => !o);
  };

  return (
    <span ref={ref} className={name ? s.trigger : s.add} onClick={toggle} title={name ? "点击更换或删除图标" : "点击添加图标"} data-icon-pop>
      {name ? <Ico name={name} size={size} color={color} /> : <Ico name="plus" size={size ?? 14} />}
      {open &&
        pos &&
        createPortal(
          <div className={s.pop} data-icon-pop style={{ top: pos.top, left: pos.left }}>
            <div className={s.grid}>
              {COMMON.map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`${s.cell} ${n === name ? s.on : ""}`}
                  title={n}
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(n);
                    setOpen(false);
                  }}
                >
                  <Ico name={n} size={16} />
                </button>
              ))}
            </div>
            {name && (
              <button
                type="button"
                className={s.remove}
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(undefined);
                  setOpen(false);
                }}
              >
                删除图标
              </button>
            )}
          </div>,
          document.body,
        )}
    </span>
  );
}
