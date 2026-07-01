import { DEFAULT_THEME } from "./theme";
import { isBoard } from "./share";
import type { Board } from "./board";

// The model generates structure only (mode / banner / sections / edges). The theme
// is always supplied server-side, so a generated diagram is guaranteed renderable.
export const SYSTEM_PROMPT = `You generate process / flow diagrams as JSON for an editor called flowdina.

Output ONLY a JSON object (no markdown fences, no prose) of this shape:
{
  "mode": "flow",
  "banner": { "title": "<short diagram title>" },
  "sections": [ ...Section ],
  "edges": [ ...Edge ]
}

Section is one of:
- { "type": "node", "node": Node }                       // one full-width step
- { "type": "columns", "columns": [ Column, Column ] }   // a branch / parallel paths (2-3 columns)
- { "type": "caption", "text": "<short note between steps>" }

Column = { "header"?: { "title": "<label>", "color": ColorToken }, "nodes": [ Node, ... ] }

Node = {
  "id": "<unique short id, e.g. n1>",
  "variant"?: "card" | "pill",          // pill = rounded start/end marker; default is card
  "accent"?: "plain" | "danger" | "decision" | "state-blue" | "state-green",
  "header"?: { "text": "<header>", "color": ColorToken },
  "blocks": [ Block, ... ]
}

Block is one of:
- { "type": "titleRow", "icon"?: { "name": "<lucide-kebab-name>" }, "text": "<title>" }
- { "type": "text", "text": "<one sentence>" }
- { "type": "list", "items": ["<item>", ...] }

Edge = { "id": "<unique>", "from": "<node id>", "to": "<node id>", "line"?: "elbow", "arrow"?: "end", "label"?: "<short>", "dash"?: true }

ColorToken is one of: "gray" "green" "blue" "indigo" "amber" "red" "purple".
lucide icon names are kebab-case, e.g. "user-plus", "mail", "check", "circle-check", "clock", "x".

Rules:
- Use "mode": "flow" for processes.
- Make the first and last node "variant": "pill" when there is a clear start / end.
- For a decision, give the deciding node accent "decision" and put the branches in a "columns" section; label the edges into each branch (e.g. "yes" / "no").
- EVERY edge.from and edge.to MUST reference an existing node id (including nodes inside columns).
- Keep it focused: 4-10 nodes. Never output a "theme" field.

Example:
{"mode":"flow","banner":{"title":"User Signup"},"sections":[{"type":"node","node":{"id":"start","variant":"pill","blocks":[{"type":"titleRow","icon":{"name":"user-plus"},"text":"Start signup"}]}},{"type":"node","node":{"id":"email","blocks":[{"type":"titleRow","icon":{"name":"mail"},"text":"Enter email"}]}},{"type":"node","node":{"id":"verify","accent":"decision","blocks":[{"type":"titleRow","icon":{"name":"shield-check"},"text":"Verify email?"}]}},{"type":"node","node":{"id":"done","variant":"pill","accent":"state-green","blocks":[{"type":"titleRow","icon":{"name":"check"},"text":"Account created"}]}}],"edges":[{"id":"e1","from":"start","to":"email","arrow":"end"},{"id":"e2","from":"email","to":"verify","arrow":"end"},{"id":"e3","from":"verify","to":"done","arrow":"end","label":"valid"}]}`;

// Pull the JSON object out of the model output, force our theme, and validate the
// shape with the same guard used for shared / imported boards.
export function coerceBoard(text: string): Board | null {
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    const obj = JSON.parse(m[0]) as Record<string, unknown>;
    const board = { edges: [], ...obj, theme: DEFAULT_THEME } as unknown as Board;
    return isBoard(board) ? board : null;
  } catch {
    return null;
  }
}
