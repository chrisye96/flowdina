"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import type { Board, Edge, Node } from "@/lib/board";
import { sampleBoard, flowBoard } from "@/lib/fixtures";
import { exportPng, exportJson, parseBoard } from "@/lib/exporters";
import { encodeBoard, decodeBoard, saveState, loadState, type Mode } from "@/lib/share";
import { updateByPath, type Path } from "@/lib/path";
import BoardView from "./BoardView";
import Inspector from "./Inspector";
import AiPrompt from "./AiPrompt";
import Ico from "./Ico";
import s from "./shell.module.css";

type Sel = { kind: "node" | "edge"; id: string } | null;
type Clip = { kind: "node"; node: Node } | { kind: "edge"; edge: Edge } | null;

// Locate a node by id anywhere in the sections (top-level or inside a columns branch).
function findNode(b: Board, id: string): Node | null {
  for (const sec of b.sections) {
    if (sec.type === "node" && sec.node.id === id) return sec.node;
    if (sec.type === "columns") for (const c of sec.columns) for (const n of c.nodes) if (n.id === id) return n;
  }
  return null;
}
const newId = () => crypto.randomUUID().slice(0, 8);

export default function EditorShell() {
  const [boards, setBoards] = useState<{ board: Board; flow: Board }>({ board: sampleBoard, flow: flowBoard });
  const [mode, setMode] = useState<Mode>("board");
  const [status, setStatus] = useState("");
  const [connect, setConnect] = useState(false);
  const [selected, setSelected] = useState<Sel>(null);
  const [dark, setDark] = useState(false);
  const [showInspector, setShowInspector] = useState(true);
  const [showAi, setShowAi] = useState(false);
  const [hasClip, setHasClip] = useState(false);
  const [, setHistTick] = useState(0); // forces the toolbar's enabled-state to refresh
  const captureRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const ready = useRef(false);

  // Undo/redo history for the active board (cleared on a mode switch).
  const past = useRef<Board[]>([]);
  const future = useRef<Board[]>([]);
  const coalesce = useRef<string | null>(null);
  const clip = useRef<Clip>(null);

  // Refs mirror state so the one global key handler stays stable yet never reads stale values.
  const boardsRef = useRef(boards); boardsRef.current = boards;
  const modeRef = useRef(mode); modeRef.current = mode;
  const selRef = useRef<Sel>(selected); selRef.current = selected;

  const board = boards[mode];
  const selectedEdge = selected?.kind === "edge" ? selected.id : null;
  const selectedNode = selected?.kind === "node" ? selected.id : null;

  // The single history-aware mutator. A coalesceKey folds a burst of same-key edits
  // (typing in one field, dragging one colour) into one undo step; no key = its own step.
  const mutate = (producer: (b: Board) => Board, coalesceKey?: string) => {
    const m = modeRef.current;
    setBoards((prev) => {
      const cur = prev[m];
      const next = producer(cur);
      if (next === cur) return prev;
      if (!(coalesceKey && coalesce.current === coalesceKey)) {
        past.current.push(cur);
        if (past.current.length > 100) past.current.shift();
        future.current = [];
      }
      coalesce.current = coalesceKey ?? null;
      return { ...prev, [m]: next };
    });
    setHistTick((t) => t + 1);
  };
  const setBoard = (updater: Board | ((b: Board) => Board), coalesceKey?: string) =>
    mutate((b) => (typeof updater === "function" ? (updater as (b: Board) => Board)(b) : updater), coalesceKey);

  const flash = (msg: string) => {
    setStatus(msg);
    setTimeout(() => setStatus(""), 1800);
  };

  const onEdit = (path: Path, value: string) => setBoard((b) => updateByPath(b, path, value), "edit:" + path.join("."));

  // ---- connectors ----
  const addEdge = (from: string, to: string) => {
    setBoard((b) => {
      if (from === to || b.edges.some((e) => e.from === from && e.to === to)) return b;
      return { ...b, edges: [...b.edges, { id: newId(), from, to, line: "elbow", arrow: "end" }] };
    });
    flash("已连接 ✓");
  };
  const deleteEdge = (id: string) => {
    setBoard((b) => ({ ...b, edges: b.edges.filter((e) => e.id !== id) }));
    setSelected(null);
  };
  const updateEdge = (id: string, patch: Partial<Edge>) =>
    setBoard((b) => ({ ...b, edges: b.edges.map((e) => (e.id === id ? { ...e, ...patch } : e)) }));

  // ---- nodes ----
  const deleteNode = (id: string) => {
    setBoard((b) => ({
      ...b,
      sections: b.sections
        .map((sec) => (sec.type === "columns" ? { ...sec, columns: sec.columns.map((c) => ({ ...c, nodes: c.nodes.filter((n) => n.id !== id) })) } : sec))
        .filter((sec) => sec.type !== "node" || sec.node.id !== id),
      edges: b.edges.filter((e) => e.from !== id && e.to !== id),
    }));
    setSelected(null);
  };
  const appendNode = (node: Node, msg: string) => {
    setBoard((b) => ({ ...b, sections: [...b.sections, { type: "node", node }] }));
    setSelected({ kind: "node", id: node.id });
    flash(msg);
  };
  const addNode = () => appendNode({ id: newId(), blocks: [{ type: "titleRow", icon: { name: "square" }, text: "新步骤" }] }, "已添加卡片 ✓");
  const moveCaption = (index: number, dx: number, dy: number) =>
    setBoard((b) => ({ ...b, sections: b.sections.map((sec, i) => (i === index && sec.type === "caption" ? { ...sec, dx, dy } : sec)) }));

  // ---- history ----
  const undo = () => {
    if (!past.current.length) return;
    const m = modeRef.current;
    setBoards((prev) => {
      future.current.push(prev[m]);
      return { ...prev, [m]: past.current.pop()! };
    });
    coalesce.current = null;
    setSelected(null);
    setHistTick((t) => t + 1);
  };
  const redo = () => {
    if (!future.current.length) return;
    const m = modeRef.current;
    setBoards((prev) => {
      past.current.push(prev[m]);
      return { ...prev, [m]: future.current.pop()! };
    });
    coalesce.current = null;
    setSelected(null);
    setHistTick((t) => t + 1);
  };

  // ---- delete / clipboard ----
  const setClip = (c: Clip) => {
    clip.current = c;
    setHasClip(!!c);
  };
  const deleteSel = () => {
    const sel = selRef.current;
    if (!sel) return;
    if (sel.kind === "node") deleteNode(sel.id);
    else deleteEdge(sel.id);
  };
  const copySel = () => {
    const sel = selRef.current;
    if (!sel) return;
    const b = boardsRef.current[modeRef.current];
    if (sel.kind === "node") {
      const n = findNode(b, sel.id);
      if (n) { setClip({ kind: "node", node: structuredClone(n) }); flash("已复制 ✓"); }
    } else {
      const e = b.edges.find((x) => x.id === sel.id);
      if (e) { setClip({ kind: "edge", edge: structuredClone(e) }); flash("已复制 ✓"); }
    }
  };
  const pasteClip = () => {
    const c = clip.current;
    if (!c) return;
    if (c.kind === "node") {
      appendNode({ ...structuredClone(c.node), id: newId() }, "已粘贴 ✓");
    } else {
      const b = boardsRef.current[modeRef.current];
      if (findNode(b, c.edge.from) && findNode(b, c.edge.to)) {
        const id = newId();
        setBoard((bd) => ({ ...bd, edges: [...bd.edges, { ...structuredClone(c.edge), id }] }));
        setSelected({ kind: "edge", id });
        flash("已粘贴 ✓");
      } else flash("连线的端点已不存在");
    }
  };
  const cutSel = () => {
    copySel();
    deleteSel();
  };
  const duplicateSel = () => {
    const sel = selRef.current;
    if (!sel) return;
    const b = boardsRef.current[modeRef.current];
    if (sel.kind === "node") {
      const n = findNode(b, sel.id);
      if (n) appendNode({ ...structuredClone(n), id: newId() }, "已创建副本 ✓");
    } else {
      const e = b.edges.find((x) => x.id === sel.id);
      if (e) {
        const id = newId();
        setBoard((bd) => ({ ...bd, edges: [...bd.edges, { ...structuredClone(e), id }] }));
        setSelected({ kind: "edge", id });
        flash("已创建副本 ✓");
      }
    }
  };

  // Chrome theme is a UI preference, kept apart from the diagram data (its own key).
  useEffect(() => {
    if (localStorage.getItem("flowdina-chrome") === "dark") setDark(true);
    // Start with the inspector collapsed on phones — light editing first, panel on demand.
    if (window.matchMedia("(max-width: 767px)").matches) setShowInspector(false);
  }, []);
  const toggleDark = () =>
    setDark((v) => {
      const next = !v;
      try {
        localStorage.setItem("flowdina-chrome", next ? "dark" : "light");
      } catch {
        // storage disabled — ignore
      }
      return next;
    });

  // Selection + history belong to one board; reset them on a mode switch.
  useEffect(() => {
    setSelected(null);
    past.current = [];
    future.current = [];
    coalesce.current = null;
  }, [mode]);

  // One stable global key handler. All dynamic values are read through refs, so the
  // listener is bound once. Text fields keep their own copy/paste/undo behaviour.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const ae = document.activeElement as HTMLElement | null;
      const editing = !!ae && (ae.isContentEditable || ae.tagName === "INPUT" || ae.tagName === "TEXTAREA");
      const mod = e.ctrlKey || e.metaKey;
      const k = e.key.toLowerCase();

      if (e.key === "Escape") {
        setSelected(null);
        setConnect(false);
        return;
      }
      if (mod && k === "z") {
        if (editing) return; // let the field do its own text undo
        e.preventDefault();
        if (e.shiftKey) redo(); else undo();
        return;
      }
      if (mod && k === "y") {
        if (editing) return;
        e.preventDefault();
        redo();
        return;
      }
      if (editing) return; // remaining shortcuts are board-level only

      if (e.key === "Delete" || e.key === "Backspace") {
        if (selRef.current) { e.preventDefault(); deleteSel(); }
        return;
      }
      if (mod && k === "c") { if (selRef.current) { e.preventDefault(); copySel(); } return; }
      if (mod && k === "x") { if (selRef.current) { e.preventDefault(); cutSel(); } return; }
      if (mod && k === "v") { if (clip.current) { e.preventDefault(); pasteClip(); } return; }
      if (mod && k === "d") { if (selRef.current) { e.preventDefault(); duplicateSel(); } return; }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // stable handler: every dynamic value above is read via a ref
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Restore: a shared hash wins, else localStorage, else the default fixtures.
  useEffect(() => {
    (async () => {
      const m = location.hash.match(/^#s=(.+)$/);
      if (m) {
        const b = await decodeBoard(m[1]);
        if (b) {
          setBoards((prev) => ({ ...prev, [b.mode]: b }));
          setMode(b.mode);
          history.replaceState(null, "", location.pathname);
          ready.current = true;
          flash("已载入分享 ✓");
          return;
        }
      }
      const st = loadState();
      if (st) {
        setBoards({ board: st.board, flow: st.flow });
        setMode(st.mode);
      }
      ready.current = true;
    })();
    // run once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Autosave (debounced) once restore has run, so it never overwrites saved work.
  useEffect(() => {
    if (!ready.current) return;
    const t = setTimeout(() => saveState({ board: boards.board, flow: boards.flow, mode }), 500);
    return () => clearTimeout(t);
  }, [boards, mode]);

  const png = async () => {
    if (!captureRef.current) return;
    setSelected(null); // keep the selection chrome out of the export
    flash("导出中…");
    try {
      // Let the deselect re-render paint before the capture reads the DOM.
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      await exportPng(captureRef.current);
      flash("已导出 PNG ✓");
    } catch {
      flash("导出失败");
    }
  };

  const share = async () => {
    flash("生成链接…");
    try {
      const enc = await encodeBoard(board);
      await navigator.clipboard.writeText(location.origin + location.pathname + "#s=" + enc);
      flash(enc.length > 30000 ? "链接已复制（较长，建议改用 JSON）" : "分享链接已复制 ✓");
    } catch {
      flash("生成链接失败");
    }
  };

  const onImport = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      const b = parseBoard(await f.text());
      if (b) {
        setBoards((prev) => ({ ...prev, [b.mode]: b }));
        setMode(b.mode);
        flash("已导入 ✓");
      } else flash("不是有效的 board JSON");
    }
    e.target.value = "";
  };

  const canUndo = past.current.length > 0;
  const canRedo = future.current.length > 0;

  return (
    <div className={s.app} data-chrome={dark ? "dark" : undefined}>
      <header className={s.topbar}>
        <div className={s.brand}>
          <span className={s.logo}>
            <Ico name="workflow" size={13} color="#ffffff" />
          </span>
          flowdina
        </div>
        <span className={s.sep}>/</span>
        <span className={s.docTitle}>{board.banner?.title ?? (mode === "flow" ? "Approval flow" : "Untitled")}</span>

        <div className={s.seg}>
          <button className={mode === "board" ? s.on : undefined} onClick={() => setMode("board")}>
            Board
          </button>
          <button className={mode === "flow" ? s.on : undefined} onClick={() => setMode("flow")}>
            Flow
          </button>
        </div>

        <div className={s.editTools}>
          <button className={s.iconBtn} onClick={undo} disabled={!canUndo} title="撤销 (Ctrl+Z)" aria-label="撤销">
            <Ico name="undo-2" size={15} />
          </button>
          <button className={s.iconBtn} onClick={redo} disabled={!canRedo} title="重做 (Ctrl+Shift+Z)" aria-label="重做">
            <Ico name="redo-2" size={15} />
          </button>
          <span className={s.vsep} />
          <button className={s.iconBtn} onClick={copySel} disabled={!selected} title="复制 (Ctrl+C)" aria-label="复制">
            <Ico name="copy" size={15} />
          </button>
          <button className={s.iconBtn} onClick={cutSel} disabled={!selected} title="剪切 (Ctrl+X)" aria-label="剪切">
            <Ico name="scissors" size={15} />
          </button>
          <button className={s.iconBtn} onClick={pasteClip} disabled={!hasClip} title="粘贴 (Ctrl+V)" aria-label="粘贴">
            <Ico name="clipboard-paste" size={15} />
          </button>
          <button className={s.iconBtn} onClick={duplicateSel} disabled={!selected} title="创建副本 (Ctrl+D)" aria-label="创建副本">
            <Ico name="copy-plus" size={15} />
          </button>
          <button className={s.iconBtn} onClick={deleteSel} disabled={!selected} title="删除 (Delete)" aria-label="删除">
            <Ico name="trash-2" size={15} />
          </button>
        </div>

        <button className={s.btn} onClick={() => setShowAi(true)} title="用 AI 生成流程图">
          <Ico name="sparkles" size={15} color="#534ab7" />
          AI 生成
        </button>

        <button
          className={connect ? s.toggleOn : s.btn}
          onClick={() => {
            setConnect((v) => !v);
            setSelected(null);
          }}
          title="连接模式：依次点两个方块即可连线"
        >
          <Ico name="waypoints" size={15} color={connect ? "#534ab7" : undefined} />
          {connect ? "连接中…" : "连接"}
        </button>
        <button className={s.btn} onClick={addNode} title="在末尾添加一张卡片">
          <Ico name="square-plus" size={15} />
          卡片
        </button>

        <div className={s.spacer} />
        {status && <span className={s.status}>{status}</span>}
        <button className={s.btn} onClick={toggleDark} title={dark ? "切换到亮色外壳" : "切换到暗色外壳"} aria-label="切换外壳主题">
          <Ico name={dark ? "sun" : "moon"} size={15} />
        </button>
        <button
          className={showInspector ? s.toggleOn : s.btn}
          onClick={() => setShowInspector((v) => !v)}
          title="属性面板"
          aria-label="切换属性面板"
        >
          <Ico name="panel-right" size={15} color={showInspector ? "#534ab7" : undefined} />
        </button>
        <button className={s.btn} onClick={() => fileRef.current?.click()}>
          <Ico name="upload" size={15} />
          导入
        </button>
        <button className={s.btn} onClick={share}>
          <Ico name="link" size={15} />
          分享
        </button>
        <button className={s.btn} onClick={() => exportJson(board)}>
          <Ico name="braces" size={15} />
          JSON
        </button>
        <button className={s.primary} onClick={png}>
          <Ico name="image" size={15} color="#eeedfe" />
          导出 PNG
        </button>
        <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={onImport} />
      </header>

      <div className={s.body}>
        <div className={s.canvas}>
          <div ref={captureRef}>
            <BoardView
              board={board}
              onEdit={onEdit}
              connect={connect}
              onConnect={addEdge}
              selected={selected}
              onSelect={setSelected}
              onDeleteEdge={deleteEdge}
              onUpdateEdge={updateEdge}
              onDeleteNode={deleteNode}
              onMoveCaption={moveCaption}
            />
          </div>
        </div>
        {showInspector && <Inspector board={board} setBoard={setBoard} />}
      </div>

      {showAi && (
        <AiPrompt
          onClose={() => setShowAi(false)}
          onBoard={(b) => {
            setBoards((prev) => ({ ...prev, [b.mode]: b }));
            setMode(b.mode);
            setSelected(null);
            flash("AI 生成完成 ✓");
          }}
        />
      )}
    </div>
  );
}
