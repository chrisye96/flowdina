"use client";

import { useRef, useState, type ChangeEvent } from "react";
import type { Board } from "@/lib/board";
import { sampleBoard, flowBoard } from "@/lib/fixtures";
import { exportPng, exportJson, parseBoard } from "@/lib/exporters";
import BoardView from "./BoardView";
import Ico from "./Ico";
import s from "./shell.module.css";

export default function EditorShell() {
  const [board, setBoard] = useState<Board>(sampleBoard);
  const [status, setStatus] = useState("");
  const captureRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const flash = (msg: string) => {
    setStatus(msg);
    setTimeout(() => setStatus(""), 1800);
  };

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

  const onImport = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      const b = parseBoard(await f.text());
      if (b) {
        setBoard(b);
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
        <span className={s.docTitle}>{board.banner?.title ?? "Approval flow"}</span>

        <div className={s.seg}>
          <button className={board.mode === "board" ? s.on : undefined} onClick={() => setBoard(sampleBoard)}>
            Board
          </button>
          <button className={board.mode === "flow" ? s.on : undefined} onClick={() => setBoard(flowBoard)}>
            Flow
          </button>
        </div>

        <div className={s.spacer} />
        {status && <span className={s.status}>{status}</span>}
        <button className={s.btn} onClick={() => fileRef.current?.click()}>
          <Ico name="upload" size={15} />
          导入
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

      <div className={s.canvas}>
        <div ref={captureRef}>
          <BoardView board={board} />
        </div>
      </div>
    </div>
  );
}
