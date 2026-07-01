"use client";

import type { Board, ColorToken, Node } from "@/lib/board";
import { DEFAULT_THEME, tokenColor } from "@/lib/theme";
import { getByPath, type Path } from "@/lib/path";
import s from "./inspector.module.css";

type Sel = { kind: "node" | "edge" | "caption"; id: string } | null;

const TOKENS: Exclude<ColorToken, object>[] = ["gray", "green", "blue", "indigo", "amber", "red", "purple"];
const VARIANTS: { v: NonNullable<Node["variant"]>; l: string }[] = [
  { v: "card", l: "卡片" },
  { v: "pill", l: "胶囊" },
];
const ACCENTS: { v: NonNullable<Node["accent"]>; l: string }[] = [
  { v: "plain", l: "无" },
  { v: "danger", l: "危险" },
  { v: "decision", l: "判定" },
  { v: "state-blue", l: "蓝框" },
  { v: "state-green", l: "绿框" },
];

// Theme color fields (shown when nothing is selected).
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

function getStr(obj: unknown, path: string): string {
  return path.split(".").reduce<unknown>((o, k) => (o as Record<string, unknown>)?.[k], obj) as string;
}
function setStr<T>(obj: T, path: string, value: string): T {
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

// Locate a node's path by id (top-level or inside a columns branch).
function findNodePath(b: Board, id: string): Path | null {
  for (let i = 0; i < b.sections.length; i++) {
    const sec = b.sections[i];
    if (sec.type === "node" && sec.node.id === id) return ["sections", i, "node"];
    if (sec.type === "columns")
      for (let c = 0; c < sec.columns.length; c++)
        for (let n = 0; n < sec.columns[c].nodes.length; n++) if (sec.columns[c].nodes[n].id === id) return ["sections", i, "columns", c, "nodes", n];
  }
  return null;
}

export default function Inspector({
  board,
  setBoard,
  selected,
  onSet,
}: {
  board: Board;
  setBoard: (b: Board, coalesceKey?: string) => void;
  selected?: Sel;
  onSet?: (p: Path, v: unknown) => void;
}) {
  const nodePath = selected?.kind === "node" ? findNodePath(board, selected.id) : null;
  const node = nodePath ? (getByPath(board, nodePath) as Node) : null;

  // --- Selected card: its own properties ---
  if (node && nodePath && onSet) {
    const seg = <T extends string>(opts: { v: T; l: string }[], cur: T | undefined, fallback: T, key: string) => (
      <div className={s.seg2}>
        {opts.map((o) => (
          <button key={o.v} className={(cur ?? fallback) === o.v ? s.segOn : undefined} onClick={() => onSet([...nodePath, key], o.v)}>
            {o.l}
          </button>
        ))}
      </div>
    );
    const colorRow = (label: string, value: ColorToken | undefined, keyPath: (string | number)[]) => (
      <div className={s.group}>
        <div className={s.groupName}>{label}</div>
        <div className={s.swatches}>
          {TOKENS.map((t) => (
            <button
              key={t}
              className={`${s.swatch} ${value === t ? s.swOn : ""}`}
              style={{ background: tokenColor(t, board.theme) }}
              title={t}
              onClick={() => onSet([...nodePath, ...keyPath], t)}
            />
          ))}
          <label className={s.customSw} title="自定义颜色">
            <input
              type="color"
              value={value && typeof value === "object" ? value.hex : "#888888"}
              onChange={(e) => onSet([...nodePath, ...keyPath], { hex: e.target.value })}
            />
          </label>
        </div>
      </div>
    );

    return (
      <aside className={s.inspector}>
        <div className={s.head}>
          <span className={s.title}>卡片属性</span>
        </div>
        <p className={s.tip}>编辑选中卡片的外观；点击空白处取消选择以回到主题。</p>

        <div className={s.group}>
          <div className={s.groupName}>类型</div>
          {seg(VARIANTS, node.variant, "card", "variant")}
        </div>

        {(node.variant ?? "card") === "pill" ? (
          colorRow("胶囊颜色", node.pillColor, ["pillColor"])
        ) : (
          <>
            <div className={s.group}>
              <div className={s.groupName}>边框 / 强调</div>
              {seg(ACCENTS, node.accent, "plain", "accent")}
            </div>
            {node.header && colorRow("头部颜色", node.header.color, ["header", "color"])}
          </>
        )}

        <div className={s.group}>
          <div className={s.groupName}>角标</div>
          {node.tag !== undefined ? (
            <div className={s.tagRow}>
              <input className={s.tagInput} value={node.tag} onChange={(e) => onSet([...nodePath, "tag"], e.target.value)} placeholder="角标文字" />
              <button className={s.reset} onClick={() => onSet([...nodePath, "tag"], undefined)}>
                删除
              </button>
            </div>
          ) : (
            <button className={s.addProp} onClick={() => onSet([...nodePath, "tag"], "角标")}>
              + 添加角标
            </button>
          )}
        </div>
      </aside>
    );
  }

  // --- Nothing selected: global theme ---
  const update = (path: string, value: string) => setBoard({ ...board, theme: setStr(board.theme, path, value) }, "theme:" + path);
  const groups = [...new Set(FIELDS.map((f) => f.group))];
  return (
    <aside className={s.inspector}>
      <div className={s.head}>
        <span className={s.title}>主题</span>
        <button className={s.reset} onClick={() => setBoard({ ...board, theme: DEFAULT_THEME })}>
          恢复默认
        </button>
      </div>
      <p className={s.tip}>改色即时生效。选中卡片后这里会显示该卡片的属性。</p>
      {groups.map((g) => (
        <div key={g} className={s.group}>
          <div className={s.groupName}>{g}</div>
          {FIELDS.filter((f) => f.group === g).map((f) => (
            <label key={f.path} className={s.row}>
              <span>{f.label}</span>
              <input type="color" value={getStr(board.theme, f.path)} onChange={(e) => update(f.path, e.target.value)} aria-label={f.label} />
            </label>
          ))}
        </div>
      ))}
    </aside>
  );
}
