import { toPng } from "html-to-image";
import type { Board } from "./board";

function download(href: string, name: string) {
  const a = document.createElement("a");
  a.href = href;
  a.download = name;
  a.click();
}

// Capture a board element to a PNG. html-to-image renders inline SVG (icons,
// connectors) and fonts more reliably than html2canvas.
export async function exportPng(node: HTMLElement, name = "flowdina") {
  const bg = getComputedStyle(node).backgroundColor || "#eef1f5";
  const url = await toPng(node, { pixelRatio: 2, backgroundColor: bg, cacheBust: true });
  download(url, `${name}.png`);
}

// Export / import the board model as JSON (the re-editable format).
export function exportJson(board: Board, name = "flowdina") {
  const blob = new Blob([JSON.stringify(board, null, 2)], { type: "application/json" });
  const href = URL.createObjectURL(blob);
  download(href, `${name}.json`);
  URL.revokeObjectURL(href);
}

export function parseBoard(text: string): Board | null {
  try {
    const b = JSON.parse(text);
    if (b && (b.mode === "board" || b.mode === "flow") && Array.isArray(b.sections) && b.theme) {
      return b as Board;
    }
  } catch {
    // not valid json / not a board
  }
  return null;
}
