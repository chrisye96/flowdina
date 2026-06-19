import type { Board } from "./board";

const LS_KEY = "flowdina-state-v1";

export type Mode = "board" | "flow";
export type EditorState = { board: Board; flow: Board; mode: Mode };

function b64urlFromBytes(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function bytesFromB64url(str: string): Uint8Array {
  const bin = atob(str.replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
async function gzip(str: string): Promise<string> {
  const cs = new CompressionStream("gzip");
  const w = cs.writable.getWriter();
  w.write(new TextEncoder().encode(str) as BufferSource);
  w.close();
  const buf = await new Response(cs.readable).arrayBuffer();
  return b64urlFromBytes(new Uint8Array(buf));
}
async function gunzip(b64: string): Promise<string> {
  const ds = new DecompressionStream("gzip");
  const w = ds.writable.getWriter();
  w.write(bytesFromB64url(b64) as BufferSource);
  w.close();
  return new Response(ds.readable).text();
}

// Structural validation. Rendering is React (text as children, not innerHTML), so a
// shared/imported board cannot inject markup; a shape check is all that is needed.
export function isBoard(x: unknown): x is Board {
  const b = x as Board;
  return !!b && (b.mode === "board" || b.mode === "flow") && Array.isArray(b.sections) && !!b.theme && Array.isArray(b.edges);
}

// Share a single board as a gzipped URL hash (no backend).
export async function encodeBoard(board: Board): Promise<string> {
  return gzip(JSON.stringify(board));
}
export async function decodeBoard(enc: string): Promise<Board | null> {
  try {
    const o = JSON.parse(await gunzip(enc));
    return isBoard(o) ? o : null;
  } catch {
    return null;
  }
}

// Persist the whole editor (both boards + active mode) so a reload restores everything.
export function saveState(st: EditorState) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(st));
  } catch {
    // storage disabled or quota — ignore
  }
}
export function loadState(): EditorState | null {
  try {
    const o = JSON.parse(localStorage.getItem(LS_KEY) || "null");
    if (o && isBoard(o.board) && isBoard(o.flow) && (o.mode === "board" || o.mode === "flow")) return o as EditorState;
  } catch {
    // ignore
  }
  return null;
}
