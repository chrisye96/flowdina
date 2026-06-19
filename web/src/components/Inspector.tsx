"use client";

import type { Board } from "@/lib/board";
import { DEFAULT_THEME } from "@/lib/theme";
import s from "./inspector.module.css";

// Theme fields exposed for editing, grouped by semantic role. Each path addresses
// a colour value inside Theme.
const FIELDS: { group: string; label: string; path: string }[] = [
  { group: "品牌", label: "强调色", path: "accent" },
  { group: "品牌", label: "顶栏渐变起", path: "banner.from" },
  { group: "品牌", label: "顶栏渐变止", path: "banner.to" },
  { group: "表面", label: "页面背景", path: "surface.page" },
  { group: "表面", label: "卡片背景", path: "surface.card" },
  { group: "表面", label: "卡片边框", path: "surface.cardBorder" },
  { group: "文字", label: "标题", path: "text.title" },
  { group: "文字", label: "正文", path: "text.body" },
  { group: "按钮", label: "主按钮", path: "button.primary" },
  { group: "按钮", label: "危险按钮", path: "button.danger" },
  { group: "状态色", label: "绿", path: "icon.green" },
  { group: "状态色", label: "蓝", path: "icon.blue" },
  { group: "状态色", label: "紫", path: "icon.indigo" },
  { group: "状态色", label: "橙", path: "icon.amber" },
  { group: "状态色", label: "红", path: "icon.red" },
];

function getByPath(obj: unknown, path: string): string {
  return path.split(".").reduce<unknown>((o, k) => (o as Record<string, unknown>)?.[k], obj) as string;
}

function setByPath<T>(obj: T, path: string, value: string): T {
  const keys = path.split(".");
  const clone = { ...(obj as Record<string, unknown>) };
  let cur = clone;
  for (let i = 0; i < keys.length - 1; i++) {
    cur[keys[i]] = { ...(cur[keys[i]] as Record<string, unknown>) };
    cur = cur[keys[i]] as Record<string, unknown>;
  }
  cur[keys[keys.length - 1]] = value;
  return clone as T;
}

export default function Inspector({ board, setBoard }: { board: Board; setBoard: (b: Board) => void }) {
  const update = (path: string, value: string) => setBoard({ ...board, theme: setByPath(board.theme, path, value) });
  const groups = [...new Set(FIELDS.map((f) => f.group))];

  return (
    <aside className={s.inspector}>
      <div className={s.head}>
        <span className={s.title}>主题</span>
        <button className={s.reset} onClick={() => setBoard({ ...board, theme: DEFAULT_THEME })}>
          恢复默认
        </button>
      </div>
      <p className={s.tip}>改色即时生效。选中元素后这里会显示该元素的属性。</p>
      {groups.map((g) => (
        <div key={g} className={s.group}>
          <div className={s.groupName}>{g}</div>
          {FIELDS.filter((f) => f.group === g).map((f) => (
            <label key={f.path} className={s.row}>
              <span>{f.label}</span>
              <input
                type="color"
                value={getByPath(board.theme, f.path)}
                onChange={(e) => update(f.path, e.target.value)}
                aria-label={f.label}
              />
            </label>
          ))}
        </div>
      ))}
    </aside>
  );
}
