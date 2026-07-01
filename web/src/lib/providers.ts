import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { LanguageModel } from "ai";

// Up to three generic, numbered providers read from env. No provider name is
// hardcoded, so any OpenAI-compatible API (Gemini, DeepSeek, OpenAI, Together…)
// drops in by setting AI_PROVIDER_{1,2,3}_{NAME,BASE_URL,KEY,MODEL}.
export type ProviderInfo = { id: string; name: string };
type Cfg = { id: string; name: string; gateway?: boolean; baseURL: string; apiKey: string; model: string };

function configs(): Cfg[] {
  const out: Cfg[] = [];
  for (let i = 1; i <= 3; i++) {
    const p = `AI_PROVIDER_${i}_`;
    const baseURL = process.env[p + "BASE_URL"];
    const apiKey = process.env[p + "KEY"];
    const model = process.env[p + "MODEL"];
    if (baseURL && apiKey && model) {
      out.push({ id: "p" + i, name: process.env[p + "NAME"] || `Provider ${i}`, baseURL, apiKey, model });
    }
  }
  // The Vercel AI Gateway stays available as one more option (single key, string model id).
  if (process.env.AI_GATEWAY_API_KEY) {
    out.push({ id: "gateway", name: "AI Gateway", gateway: true, baseURL: "", apiKey: "", model: process.env.AI_MODEL || "anthropic/claude-sonnet-4.6" });
  }
  return out;
}

// Public list (ids + names only — never keys) for the client picker.
export function listProviders(): ProviderInfo[] {
  return configs().map((c) => ({ id: c.id, name: c.name }));
}

// Resolve a provider id to an AI SDK model. A string is returned for the gateway
// (routed by model id); an OpenAI-compatible model otherwise. null = none configured.
export function getModel(id?: string): LanguageModel | null {
  const cfgs = configs();
  const c = (id && cfgs.find((x) => x.id === id)) || cfgs[0];
  if (!c) return null;
  if (c.gateway) return c.model;
  return createOpenAICompatible({ name: c.name, baseURL: c.baseURL, apiKey: c.apiKey })(c.model);
}
