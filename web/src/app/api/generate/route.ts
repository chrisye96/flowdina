import { generateText } from "ai";
import { SYSTEM_PROMPT, coerceBoard } from "@/lib/aiPrompt";

// A plain string model id is routed through the Vercel AI Gateway, which reads
// AI_GATEWAY_API_KEY (or, on Vercel, the OIDC token) — no provider SDK lock-in.
const MODEL = process.env.AI_MODEL || "anthropic/claude-sonnet-4.6";

export async function POST(req: Request) {
  let prompt = "";
  try {
    prompt = ((await req.json())?.prompt ?? "").toString();
  } catch {
    // malformed body — treated as empty below
  }
  if (!prompt.trim()) return Response.json({ error: "请先描述你的流程" }, { status: 400 });

  // Locally the gateway needs a key; on Vercel the OIDC token covers it.
  if (!process.env.AI_GATEWAY_API_KEY && !process.env.VERCEL) {
    return Response.json({ error: "AI 未配置：在 web/.env.local 设置 AI_GATEWAY_API_KEY 后重试" }, { status: 503 });
  }

  try {
    const { text } = await generateText({ model: MODEL, system: SYSTEM_PROMPT, prompt, temperature: 0.3 });
    const board = coerceBoard(text);
    if (!board) return Response.json({ error: "AI 返回的内容无法解析，请重试或换个描述" }, { status: 502 });
    return Response.json({ board });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "生成失败" }, { status: 500 });
  }
}
