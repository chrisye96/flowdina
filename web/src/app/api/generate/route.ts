import { generateText } from "ai";
import { SYSTEM_PROMPT, coerceBoard } from "@/lib/aiPrompt";
import { getModel } from "@/lib/providers";

export async function POST(req: Request) {
  let prompt = "";
  let provider: string | undefined;
  try {
    const body = await req.json();
    prompt = (body?.prompt ?? "").toString();
    provider = typeof body?.provider === "string" ? body.provider : undefined;
  } catch {
    // malformed body — treated as empty below
  }
  if (!prompt.trim()) return Response.json({ error: "请先描述你的流程" }, { status: 400 });

  const model = getModel(provider);
  if (!model) {
    return Response.json(
      { error: "AI 未配置：在 web/.env.local 设置 AI_PROVIDER_1_BASE_URL / _KEY / _MODEL 后重试" },
      { status: 503 },
    );
  }

  try {
    const { text } = await generateText({ model, system: SYSTEM_PROMPT, prompt, temperature: 0.3 });
    const board = coerceBoard(text);
    if (!board) return Response.json({ error: "AI 返回的内容无法解析，请重试或换个描述" }, { status: 502 });
    return Response.json({ board });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "生成失败" }, { status: 500 });
  }
}
