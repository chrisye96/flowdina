"use client";

import { useEffect, useRef, type KeyboardEvent as ReactKeyboardEvent } from "react";

// An editable bulleted list. Each <li> is uncontrolled (DOM synced only on external
// change, so typing never jumps the caret). Enter splits off a new bullet, Backspace
// on an empty bullet removes it — the list grows/shrinks as you type.
export default function ListEditor({
  items,
  onChange,
  className,
}: {
  items: string[];
  onChange: (items: string[]) => void;
  className?: string;
}) {
  const refs = useRef<(HTMLLIElement | null)[]>([]);
  const focusIdx = useRef<number | null>(null);

  useEffect(() => {
    items.forEach((it, i) => {
      const el = refs.current[i];
      if (el && el.textContent !== it) el.textContent = it;
    });
    if (focusIdx.current != null) {
      const el = refs.current[focusIdx.current];
      if (el) {
        el.focus();
        const r = document.createRange();
        r.selectNodeContents(el);
        r.collapse(false); // caret at end
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(r);
      }
      focusIdx.current = null;
    }
  }, [items]);

  const commit = (next: string[], focus?: number) => {
    focusIdx.current = focus ?? null;
    onChange(next);
  };

  const onKeyDown = (e: ReactKeyboardEvent<HTMLLIElement>, i: number) => {
    const el = e.currentTarget;
    if (e.key === "Enter") {
      e.preventDefault();
      const next = [...items];
      next[i] = el.textContent ?? items[i]; // keep the current line's edits
      next.splice(i + 1, 0, "");
      commit(next, i + 1);
    } else if (e.key === "Backspace" && (el.textContent ?? "") === "" && items.length > 1) {
      e.preventDefault();
      const next = items.filter((_, k) => k !== i);
      commit(next, Math.max(0, i - 1));
    }
  };

  const onBlur = (e: { currentTarget: HTMLLIElement }, i: number) => {
    const t = e.currentTarget.textContent ?? "";
    if (t !== items[i]) {
      const next = [...items];
      next[i] = t;
      onChange(next);
    }
  };

  return (
    <ul className={className}>
      {items.map((_, i) => (
        <li
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          contentEditable
          suppressContentEditableWarning
          spellCheck={false}
          onKeyDown={(e) => onKeyDown(e, i)}
          onBlur={(e) => onBlur(e, i)}
        />
      ))}
    </ul>
  );
}
