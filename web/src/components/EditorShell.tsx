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
    flash("导出中…");
    try {
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
            <BoardView board={board} onEdit={onEdit} />
          </div>
        </div>
        <Inspector board={board} setBoard={setBoard} />
      </div>
    </div>
  );
}
