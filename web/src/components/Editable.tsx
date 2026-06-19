"use client";

import { useEffect, useRef } from "react";

// Uncontrolled contenteditable: the DOM text is only written from `value` when it
// actually differs, so typing never causes a re-render that would jump the caret.
// On blur, the edited text is committed via onChange.
export default function Editable({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (el && el.textContent !== value) el.textContent = value;
  }, [value]);

  return (
    <span
      ref={ref}
      className={className}
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      onBlur={(e) => {
        const t = e.currentTarget.textContent ?? "";
        if (t !== value) onChange(t);
      }}
    />
  );
}
