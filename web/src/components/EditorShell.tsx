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

export default function EditorShell() {
  const [boards, setBoards] = useState<{ board: Board; flow: Board }>({ board: sampleBoard, flow: flowBoard });
  const [mode, setMode] = useState<Mode>("board");
  const [status, setStatus] = useState("");
  const [connect, setConnect] = useState(false);
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);
  const [dark, setDark] = useState(false);
  const [showInspector, setShowInspector] = useState(true);
  const [showAi, setShowAi] = useState(false);
  const captureRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const ready = useRef(false);

  const board = boards[mode];
  const setBoard = (updater: Board | ((b: Board) => Board)) =>
    setBoards((prev) => ({ ...prev, [mode]: typeof updater === "function" ? (updater as (b: Board) => Board)(prev[mode]) : updater }));

  const flash = (msg: string) => {
    setStatus(msg);
    setTimeout(() => setStatus(""), 1800);
  };

  const onEdit = (path: Path, value: string) => setBoard((b) => updateByPath(b, path, value));

  // Connector editing: add (connect two blocks), delete the selected edge.
  const addEdge = (from: string, to: string) => {
    setBoard((b) => {
      if (from === to || b.edges.some((e) => e.from === from && e.to === to)) return b;
      return { ...b, edges: [...b.edges, { id: crypto.randomUUID().slice(0, 8), from, to, line: "elbow", arrow: "end" }] };
    });
    flash("已连接 ✓");
  };
  const deleteEdge = (id: string) => {
    setBoard((b) => ({ ...b, edges: b.edges.filter((e) => e.id !== id) }));
    setSelectedEdge(null);
  };
  const updateEdge = (id: string, patch: Partial<Edge>) =>
    setBoard((b) => ({ ...b, edges: b.edges.map((e) => (e.id === id ? { ...e, ...patch } : e)) }));

  // Structural editing: remove a node (and any edges touching it), or append a fresh card.
  const deleteNode = (id: string) =>
    setBoard((b) => ({
      ...b,
      sections: b.sections
        .map((sec) => (sec.type === "columns" ? { ...sec, columns: sec.columns.map((c) => ({ ...c, nodes: c.nodes.filter((n) => n.id !== id) })) } : sec))
        .filter((sec) => sec.type !== "node" || sec.node.id !== id),
      edges: b.edges.filter((e) => e.from !== id && e.to !== id),
    }));
  const addNode = () => {
    const node: Node = { id: crypto.randomUUID().slice(0, 8), blocks: [{ type: "titleRow", icon: { name: "square" }, text: "新步骤" }] };
    setBoard((b) => ({ ...b, sections: [...b.sections, { type: "node", node }] }));
    flash("已添加卡片 ✓");
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

  // Selection belongs to one board; dropping it on a mode switch avoids a dangling id.
  useEffect(() => setSelectedEdge(null), [mode]);

  // Esc exits connect/selection; Delete removes the selected edge (unless typing in a field).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedEdge(null);
        setConnect(false);
        return;
      }
      if ((e.key === "Delete" || e.key === "Backspace") && selectedEdge) {
        const ae = document.activeElement as HTMLElement | null;
        if (ae && (ae.isContentEditable || ae.tagName === "INPUT" || ae.tagName === "TEXTAREA")) return;
        e.preventDefault();
        deleteEdge(selectedEdge);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // selectedEdge captures the active board's setter freshly (selection resets on mode change).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEdge]);

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
    setSelectedEdge(null); // keep the selection chrome out of the export
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

        <button className={s.btn} onClick={() => setShowAi(true)} title="用 AI 生成流程图">
          <Ico name="sparkles" size={15} color="#534ab7" />
          AI 生成
        </button>

        <button
          className={connect ? s.toggleOn : s.btn}
          onClick={() => {
            setConnect((v) => !v);
            setSelectedEdge(null);
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
              selectedEdge={selectedEdge}
              onSelectEdge={setSelectedEdge}
              onDeleteEdge={deleteEdge}
              onUpdateEdge={updateEdge}
              onDeleteNode={deleteNode}
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
            setSelectedEdge(null);
            flash("AI 生成完成 ✓");
          }}
        />
      )}
    </div>
  );
}
