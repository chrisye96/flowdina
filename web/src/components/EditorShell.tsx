"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import type { Board } from "@/lib/board";
import { sampleBoard, flowBoard } from "@/lib/fixtures";
import { exportPng, exportJson, parseBoard } from "@/lib/exporters";
import { encodeBoard, decodeBoard, saveState, loadState, type Mode } from "@/lib/share";
import { updateByPath, type Path } from "@/lib/path";
import BoardView from "./BoardView";
import Inspector from "./Inspector";
import Ico from "./Ico";
import s from "./shell.module.css";

export default function EditorShell() {
  const [boards, setBoards] = useState<{ board: Board; flow: Board }>({ board: sampleBoard, flow: flowBoard });
  const [mode, setMode] = useState<Mode>("board");
  const [status, setStatus] = useState("");
  const [connect, setConnect] = useState(false);
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);
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
    <div className={s.app}>
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

        <div className={s.spacer} />
        {status && <span className={s.status}>{status}</span>}
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
            />
          </div>
        </div>
        <Inspector board={board} setBoard={setBoard} />
      </div>
    </div>
  );
}
